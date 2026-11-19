import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";

/**
 * Catat aksi aplikasi ke audit log. Jangan menulis password/token ke `summary`.
 */
export async function writeAudit(
  actor: User | { id: string; name: string; propertyId?: string } | null,
  action: string,
  entityType: string,
  entityId?: string | null,
  summary?: string,
  ip?: string,
) {
  try {
    await prisma.applicationAuditLog.create({
      data: {
        propertyId: actor?.propertyId ?? null,
        actorId: actor?.id ?? null,
        actorName: actor?.name ?? "sistem",
        action,
        entityType,
        entityId: entityId ?? null,
        summary: summary ? summary.slice(0, 500) : null,
        ip: ip ?? null,
      },
    });
  } catch {
    // Audit tidak boleh menggagalkan operasi utama.
  }
}
