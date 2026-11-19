"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { PERMISSIONS } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

const createTicketSchema = z.object({
  title: z.string().trim().min(3, "Judul kerusakan minimal 3 karakter"),
  description: z.string().trim().min(5, "Deskripsi minimal 5 karakter"),
  roomId: z.string().optional().or(z.literal("")),
  priority: z.string().default("MEDIUM"),
  markOutOfOrder: z.boolean().default(false),
});

export async function createTicketAction(formData: {
  title: string;
  description: string;
  roomId?: string;
  priority?: string;
  markOutOfOrder?: boolean;
}) {
  const user = await requireUser();

  if (!PERMISSIONS.maintenanceWrite.includes(user.role as never)) {
    return { ok: false, message: "Peran Anda tidak berwenang membuat tiket perbaikan." };
  }

  const parsed = createTicketSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  try {
    const ticket = await prisma.$transaction(async (tx) => {
      const t = await tx.maintenanceTicket.create({
        data: {
          propertyId: user.propertyId,
          roomId: parsed.data.roomId || null,
          title: parsed.data.title,
          description: parsed.data.description,
          priority: parsed.data.priority ?? "MEDIUM",
          status: "OPEN",
          dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        include: { room: true },
      });

      if (parsed.data.roomId && (parsed.data.markOutOfOrder || parsed.data.priority === "CRITICAL")) {
        await tx.room.update({
          where: { id: parsed.data.roomId },
          data: { serviceStatus: "OUT_OF_ORDER" },
        });
      }

      return t;
    });

    await writeAudit(
      user,
      "MAINTENANCE_TICKET_CREATED",
      "MaintenanceTicket",
      ticket.id,
      `Tiket "${ticket.title}" dibuat untuk ${ticket.room?.number ? "Kamar " + ticket.room.number : "Fasilitas umum"}`,
    );

    revalidatePath("/maintenance");
    revalidatePath("/rooms");
    revalidatePath("/dashboard");

    return { ok: true, message: `Tiket "${ticket.title}" berhasil dilaporkan.` };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal membuat tiket perbaikan.",
    };
  }
}

export async function updateTicketStatusAction(ticketId: string, newStatus: string) {
  const user = await requireUser();

  if (!PERMISSIONS.maintenanceWrite.includes(user.role as never)) {
    return { ok: false, message: "Peran Anda tidak berwenang mengubah status tiket." };
  }

  const ticket = await prisma.maintenanceTicket.findUnique({
    where: { id: ticketId },
    include: { room: true },
  });

  if (!ticket) {
    return { ok: false, message: "Tiket tidak ditemukan." };
  }

  const now = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.maintenanceTicket.update({
        where: { id: ticketId },
        data: {
          status: newStatus,
          assigneeId: newStatus === "IN_PROGRESS" && !ticket.assigneeId ? user.id : ticket.assigneeId,
          startedAt: newStatus === "IN_PROGRESS" ? now : ticket.startedAt,
          completedAt: newStatus === "DONE" || newStatus === "CLOSED" ? now : ticket.completedAt,
        },
      });

      // Jika tiket selesai dan kamar Out of Order, kembalikan ke AVAILABLE
      if ((newStatus === "DONE" || newStatus === "CLOSED") && ticket.roomId) {
        // Cek apakah masih ada tiket terbuka lain untuk kamar ini
        const otherOpen = await tx.maintenanceTicket.count({
          where: {
            roomId: ticket.roomId,
            id: { not: ticketId },
            status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] },
          },
        });

        if (otherOpen === 0) {
          await tx.room.update({
            where: { id: ticket.roomId },
            data: { serviceStatus: "AVAILABLE" },
          });
        }
      }
    });

    await writeAudit(
      user,
      "MAINTENANCE_STATUS_CHANGED",
      "MaintenanceTicket",
      ticketId,
      `Status tiket "${ticket.title}" diubah menjadi ${newStatus}`,
    );

    revalidatePath("/maintenance");
    revalidatePath("/rooms");
    revalidatePath("/dashboard");

    return { ok: true, message: `Status tiket diperbarui menjadi ${newStatus}.` };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal memperbarui tiket.",
    };
  }
}
