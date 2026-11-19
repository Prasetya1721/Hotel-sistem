import { prisma } from "@/lib/db";

export async function notify(
  propertyId: string,
  recipientId: string | null,
  incidentId: string | null,
  title: string,
  body: string,
) {
  try {
    await prisma.notification.create({
      data: { propertyId, recipientId, incidentId, title, body },
    });
  } catch {
    // Notifikasi best-effort.
  }
}
