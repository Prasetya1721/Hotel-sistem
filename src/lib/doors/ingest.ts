import { prisma } from "@/lib/db";
import { evaluateRules, shouldOpenIncident } from "@/lib/security/rules";
import type { NormalizedDoorEvent } from "@/lib/doors/types";

export interface IngestResult {
  stored: number;
  skipped: number;
  incidentsOpened: string[];
}

/**
 * Simpan event pintu (append-only) lalu jalankan rule engine.
 * Idempoten lewat providerEventId — event duplikat dari forwarder diabaikan.
 */
export async function ingestDoorEvents(events: NormalizedDoorEvent[]): Promise<IngestResult> {
  const result: IngestResult = { stored: 0, skipped: 0, incidentsOpened: [] };

  for (const event of events) {
    const device = await prisma.device.findUnique({
      where: { vendorDeviceId: event.vendorDeviceId },
    });
    if (!device || !device.roomId) {
      result.skipped += 1;
      continue;
    }

    const existing = await prisma.doorEvent.findUnique({
      where: { providerEventId: event.providerEventId },
      select: { id: true },
    });
    if (existing) {
      result.skipped += 1;
      continue;
    }

    const credential = event.credentialRef
      ? await prisma.credentialAssignment.findFirst({
          where: { providerRef: event.credentialRef },
          select: { id: true, status: true, validUntil: true },
        })
      : null;

    const room = await prisma.room.findUnique({
      where: { id: device.roomId },
      select: { occupancyStatus: true },
    });

    // Unique constraint providerEventId adalah penjaga terakhir: dua forwarder
    // yang mengirim event sama bersamaan bisa lolos findUnique di atas.
    const stored = await prisma.doorEvent
      .create({
        data: {
          providerEventId: event.providerEventId,
          provider: event.provider,
          propertyId: device.propertyId,
          roomId: device.roomId,
          deviceId: device.id,
          credentialId: credential?.id ?? null,
          eventType: event.eventType,
          rawEventType: event.rawEventType,
          occurredAt: event.occurredAt,
          receivedAt: event.receivedAt,
          source: event.source,
          syncStatus: event.syncStatus,
          deviceTimeQuality: event.deviceTimeQuality ?? "trusted",
          doorState: event.doorState ?? null,
          lockState: event.lockState ?? null,
          actorLabel: event.actorLabel ?? null,
          metadata: event.metadata ? JSON.stringify(event.metadata) : null,
        },
      })
      .catch((error: unknown) => {
        if ((error as { code?: string })?.code === "P2002") return null;
        throw error;
      });
    if (!stored) {
      result.skipped += 1;
      continue;
    }
    result.stored += 1;

    await prisma.device.update({
      where: { id: device.id },
      data: {
        lastSeenAt: event.receivedAt,
        healthStatus: event.eventType === "DEVICE_OFFLINE" ? "OFFLINE" : "ONLINE",
      },
    });

    const hits = evaluateRules(event, {
      hasActiveCredential:
        !!credential &&
        credential.status === "ISSUED" &&
        (!credential.validUntil || credential.validUntil >= event.occurredAt),
      roomOccupied: room?.occupancyStatus === "OCCUPIED",
    });

    for (const hit of hits) {
      if (!shouldOpenIncident(hit.severity)) continue;

      const duplicate = await prisma.incident.findFirst({
        where: {
          roomId: device.roomId,
          ruleLabel: hit.ruleLabel,
          status: { in: ["NEW", "ACKNOWLEDGED", "INVESTIGATING", "REOPENED"] },
        },
        select: { id: true },
      });
      if (duplicate) {
        await prisma.incidentEvent.upsert({
          where: {
            incidentId_doorEventId: { incidentId: duplicate.id, doorEventId: stored.id },
          },
          update: {},
          create: { incidentId: duplicate.id, doorEventId: stored.id },
        });
        continue;
      }

      const incident = await prisma.incident.create({
        data: {
          propertyId: device.propertyId,
          roomId: device.roomId,
          severity: hit.severity,
          status: "NEW",
          ruleLabel: hit.ruleLabel,
          openedAt: event.occurredAt,
          isSimulated: event.source === "SIMULATED",
          events: { create: { doorEventId: stored.id } },
          history: {
            create: {
              fromStatus: null,
              toStatus: "NEW",
              actor: "Aturan otomatis",
              note: `Dibuka dari event ${event.eventType}.`,
            },
          },
        },
      });
      result.incidentsOpened.push(incident.id);

      await prisma.notification.create({
        data: {
          propertyId: device.propertyId,
          incidentId: incident.id,
          title: `Insiden ${hit.severity} — kamar`,
          body: `${hit.ruleLabel}. Periksa detail insiden sebelum mengambil tindakan.`,
        },
      });
    }
  }

  return result;
}
