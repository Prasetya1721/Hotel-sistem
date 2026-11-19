"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/session";
import { PERMISSIONS } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

const createUserSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter"),
  email: z.string().trim().email("Alamat email tidak valid"),
  role: z.string().min(1, "Pilih peran"),
  employeeCode: z.string().trim().optional(),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
});

export async function createUserAction(formData: {
  name: string;
  email: string;
  role: string;
  employeeCode?: string;
  password: string;
}) {
  const user = await requireUser();

  if (!PERMISSIONS.admin.includes(user.role as never)) {
    return { ok: false, message: "Peran Anda tidak berwenang menambahkan pengguna." };
  }

  const parsed = createUserSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    return { ok: false, message: "Email sudah digunakan oleh akun lain." };
  }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const newUser = await prisma.user.create({
      data: {
        propertyId: user.propertyId,
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        employeeCode: parsed.data.employeeCode || null,
        passwordHash,
        isActive: true,
      },
    });

    await writeAudit(
      user,
      "USER_CREATED",
      "User",
      newUser.id,
      `Akun staf baru dibuat: ${newUser.name} (${newUser.email}) - Peran: ${newUser.role}`,
    );

    revalidatePath("/users");

    return { ok: true, message: `Pengguna "${newUser.name}" berhasil didaftarkan.` };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal mendaftarkan pengguna.",
    };
  }
}
