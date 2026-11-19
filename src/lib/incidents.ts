import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";
import { INCIDENT_TRANSITIONS, canTransition } from "@/lib/incident-transitions";

export { INCIDENT_TRANSITIONS, canTransition };

export class IncidentTransitionError extends Error {}

export async function transitionIncident(
  actor: User,
  incidentId: string,
  toStatus: string,
  note?: string,
) {
  const incident = await prisma.incident.findUnique({ where: { id: incidentId } });
  if (!incident) throw new IncidentTransitionError("Insiden tidak ditemukan.");

  if (!canTransition(incident.status, toStatus)) {
    throw new IncidentTransitionError(
      `Perubahan status dari ${incident.status} ke ${toStatus} tidak diizinkan.`,
    );
  }

  if ((toStatus === "RESOLVED" || toStatus === "FALSE_POSITIVE") && !note?.trim()) {
    throw new IncidentTransitionError("Catatan wajib diisi saat menutup atau membatalkan insiden.");
  }

  const closing = toStatus === "RESOLVED" || toStatus === "FALSE_POSITIVE" || toStatus === "CLOSED";

  return prisma.$transaction(async (tx) => {
    const updated = await tx.incident.update({
      where: { id: incidentId },
      data: {
        status: toStatus,
        acknowledgedAt:
          toStatus === "ACKNOWLEDGED" ? new Date() : incident.acknowledgedAt,
        assignedToId: toStatus === "ACKNOWLEDGED" ? actor.id : incident.assignedToId,
        conclusion: note?.trim() ? note.trim() : incident.conclusion,
        closedAt: closing ? new Date() : null,
        closureReason: closing ? note?.trim() ?? null : null,
      },
    });

    await tx.incidentHistory.create({
      data: {
        incidentId,
        fromStatus: incident.status,
        toStatus,
        actor: actor.name,
        note: note?.trim() || null,
      },
    });

    return updated;
  });
}
