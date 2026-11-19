"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { PERMISSIONS } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

const createGuestSchema = z.object({
  name: z.string().trim().min(2, "Nama tamu minimal 2 karakter"),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email("Format email tidak valid").optional().or(z.literal("")),
  preferred: z.string().trim().optional().or(z.literal("")),
});

export async function createGuestAction(formData: {
  name: string;
  phone?: string;
  email?: string;
  preferred?: string;
}) {
  const user = await requireUser();

  if (!PERMISSIONS.guestWrite.includes(user.role as never)) {
    return { ok: false, message: "Peran Anda tidak berwenang menambahkan tamu." };
  }

  const parsed = createGuestSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  try {
    const guest = await prisma.guest.create({
      data: {
        propertyId: user.propertyId,
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        preferred: parsed.data.preferred || null,
      },
    });

    await writeAudit(
      user,
      "GUEST_CREATED",
      "Guest",
      guest.id,
      `Tamu baru dibuat: ${guest.name}`,
    );

    revalidatePath("/guests");
    revalidatePath("/front-desk");

    return { ok: true, message: `Tamu "${guest.name}" berhasil ditambahkan.`, guest };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal menambahkan data tamu.",
    };
  }
}
