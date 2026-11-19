"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { PERMISSIONS } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

export async function updateRoomStatusAction(
  roomId: string,
  updates: { housekeepingStatus?: string; serviceStatus?: string },
) {
  const user = await requireUser();

  const allowedRoles = [
    ...PERMISSIONS.housekeepingWrite,
    ...PERMISSIONS.maintenanceWrite,
    ...PERMISSIONS.reservationWrite,
  ];
  if (!allowedRoles.includes(user.role as never)) {
    return { ok: false, message: "Peran Anda tidak berwenang mengubah status kamar." };
  }

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) {
    return { ok: false, message: "Kamar tidak ditemukan." };
  }

  try {
    const updated = await prisma.room.update({
      where: { id: roomId },
      data: {
        ...(updates.housekeepingStatus ? { housekeepingStatus: updates.housekeepingStatus } : {}),
        ...(updates.serviceStatus ? { serviceStatus: updates.serviceStatus } : {}),
      },
    });

    await writeAudit(
      user,
      "ROOM_STATUS_UPDATED",
      "Room",
      roomId,
      `Status Kamar ${room.number} diperbarui: HK=${updated.housekeepingStatus}, SVC=${updated.serviceStatus}`,
    );

    revalidatePath("/rooms");
    revalidatePath("/dashboard");
    revalidatePath("/availability");
    revalidatePath("/housekeeping");
    revalidatePath("/front-desk");

    return { ok: true, message: `Status Kamar ${room.number} berhasil diperbarui.` };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal memperbarui kamar.",
    };
  }
}
