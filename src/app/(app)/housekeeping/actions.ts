"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { PERMISSIONS } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

const createTaskSchema = z.object({
  roomId: z.string().min(1, "Pilih kamar"),
  type: z.string().default("CLEANING"),
  priority: z.string().default("NORMAL"),
  note: z.string().optional(),
});

export async function createHousekeepingTaskAction(formData: {
  roomId: string;
  type?: string;
  priority?: string;
  note?: string;
}) {
  const user = await requireUser();

  if (!PERMISSIONS.housekeepingWrite.includes(user.role as never)) {
    return { ok: false, message: "Peran Anda tidak berwenang membuat tugas housekeeping." };
  }

  const parsed = createTaskSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  try {
    const task = await prisma.housekeepingTask.create({
      data: {
        propertyId: user.propertyId,
        roomId: parsed.data.roomId,
        type: parsed.data.type ?? "CLEANING",
        priority: parsed.data.priority ?? "NORMAL",
        status: "PENDING",
        targetAt: new Date(Date.now() + 60 * 60 * 1000),
        note: parsed.data.note || null,
      },
      include: { room: true },
    });

    await writeAudit(
      user,
      "HOUSEKEEPING_TASK_CREATED",
      "HousekeepingTask",
      task.id,
      `Tugas pembersihan kamar ${task.room.number} dibuat dengan prioritas ${task.priority}`,
    );

    revalidatePath("/housekeeping");
    revalidatePath("/rooms");
    revalidatePath("/dashboard");

    return { ok: true, message: `Tugas pembersihan kamar ${task.room.number} berhasil dibuat.` };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal membuat tugas housekeeping.",
    };
  }
}

export async function updateTaskStatusAction(taskId: string, newStatus: string) {
  const user = await requireUser();

  if (!PERMISSIONS.housekeepingWrite.includes(user.role as never)) {
    return { ok: false, message: "Peran Anda tidak berwenang memperbarui status tugas." };
  }

  const task = await prisma.housekeepingTask.findUnique({
    where: { id: taskId },
    include: { room: true },
  });

  if (!task) {
    return { ok: false, message: "Tugas tidak ditemukan." };
  }

  const now = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.housekeepingTask.update({
        where: { id: taskId },
        data: {
          status: newStatus,
          startedAt: newStatus === "IN_PROGRESS" ? now : task.startedAt,
          completedAt: newStatus === "DONE" || newStatus === "INSPECTED" ? now : task.completedAt,
        },
      });

      // Update status kebersihan kamar terkait
      if (newStatus === "IN_PROGRESS") {
        await tx.room.update({
          where: { id: task.roomId },
          data: { housekeepingStatus: "CLEANING" },
        });
      } else if (newStatus === "DONE" || newStatus === "INSPECTED") {
        await tx.room.update({
          where: { id: task.roomId },
          data: { housekeepingStatus: "CLEAN" },
        });
      }
    });

    await writeAudit(
      user,
      "HOUSEKEEPING_STATUS_CHANGED",
      "HousekeepingTask",
      taskId,
      `Tugas kamar ${task.room.number} diubah statusnya menjadi ${newStatus}`,
    );

    revalidatePath("/housekeeping");
    revalidatePath("/rooms");
    revalidatePath("/dashboard");

    return {
      ok: true,
      message: `Status tugas kamar ${task.room.number} diubah menjadi ${newStatus}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal memperbarui status tugas.",
    };
  }
}
