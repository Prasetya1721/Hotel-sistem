"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { PERMISSIONS } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

const recordPaymentSchema = z.object({
  folioId: z.string().min(1, "Folio wajib dipilih"),
  amount: z.number().int().positive("Nominal pembayaran harus lebih besar dari 0"),
  method: z.string().default("CASH"),
  reference: z.string().optional(),
});

export async function recordPaymentAction(formData: {
  folioId: string;
  amount: number;
  method?: string;
  reference?: string;
}) {
  const user = await requireUser();

  if (!PERMISSIONS.financeWrite.includes(user.role as never)) {
    return { ok: false, message: "Peran Anda tidak berwenang mencatat pembayaran." };
  }

  const parsed = recordPaymentSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Data pembayaran tidak valid." };
  }

  const folio = await prisma.folio.findUnique({
    where: { id: parsed.data.folioId },
    include: {
      reservation: { include: { guest: true, room: true } },
    },
  });

  if (!folio) {
    return { ok: false, message: "Data folio tagihan tidak ditemukan." };
  }

  const now = new Date();
  const newPaid = folio.paid + parsed.data.amount;
  const newStatus = newPaid >= folio.total ? "SETTLED" : "OPEN";

  try {
    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          folioId: folio.id,
          amount: parsed.data.amount,
          method: parsed.data.method ?? "CASH",
          reference: parsed.data.reference || null,
          status: "RECORDED",
          processedAt: now,
        },
      });

      await tx.folio.update({
        where: { id: folio.id },
        data: {
          paid: newPaid,
          status: newStatus,
        },
      });
    });

    await writeAudit(
      user,
      "PAYMENT_RECORDED",
      "Folio",
      folio.id,
      `Pembayaran Rp ${parsed.data.amount.toLocaleString("id-ID")} dicatat untuk tamu ${folio.reservation.guest.name} (Kamar ${folio.reservation.room?.number ?? "-"})`,
    );

    revalidatePath("/finance");
    revalidatePath("/front-desk");
    revalidatePath("/reports");
    revalidatePath("/dashboard");

    return {
      ok: true,
      message: `Pembayaran Rp ${parsed.data.amount.toLocaleString("id-ID")} berhasil dicatat.${newStatus === "SETTLED" ? " Tagihan telah lunas." : ""}`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal mencatat pembayaran.",
    };
  }
}
