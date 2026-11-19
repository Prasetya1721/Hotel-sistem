import { z } from "zod";
import type {
  DoorEventSource,
  DoorEventType,
  NormalizedDoorEvent,
  SyncStatus,
} from "@/lib/doors/types";

const EVENT_TYPES = [
  "ACCESS_GRANTED",
  "ACCESS_DENIED",
  "LOCK_UNLOCKED",
  "LOCK_LOCKED",
  "DOOR_OPENED",
  "DOOR_CLOSED",
  "DOOR_HELD_OPEN",
  "DOOR_FORCED_OPEN",
  "MASTER_KEY_USED",
  "CREDENTIAL_ISSUED",
  "CREDENTIAL_REVOKED",
  "DEVICE_ONLINE",
  "DEVICE_OFFLINE",
  "LOW_BATTERY",
  "SENSOR_TAMPER",
  "EVENT_SYNCED",
] as const satisfies readonly DoorEventType[];

/** Batas toleransi jam perangkat sebelum event ditandai terlambat. */
const DELAY_TOLERANCE_MS = 60_000;

export const doorEventInputSchema = z.object({
  providerEventId: z.string().trim().min(1).max(191),
  vendorDeviceId: z.string().trim().min(1).max(191),
  eventType: z.enum(EVENT_TYPES),
  occurredAt: z.coerce.date(),
  credentialRef: z.string().trim().max(191).nullish(),
  doorState: z.enum(["OPEN", "CLOSED", "UNKNOWN"]).nullish(),
  lockState: z.enum(["LOCKED", "UNLOCKED", "UNKNOWN"]).nullish(),
  actorLabel: z.string().trim().max(120).nullish(),
  rawEventType: z.string().trim().max(120).nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
});

export const doorEventBatchSchema = z.object({
  provider: z.string().trim().min(1).max(60).default("webhook"),
  events: z.array(doorEventInputSchema).min(1).max(200),
});

export type DoorEventBatch = z.infer<typeof doorEventBatchSchema>;

/**
 * Ubah payload forwarder menjadi event ternormalisasi.
 * Jam perangkat tidak dipercaya: keterlambatan dan skew dicatat, bukan dibuang.
 */
export function normalizeDoorEvents(
  batch: DoorEventBatch,
  options: { source: DoorEventSource; receivedAt?: Date },
): NormalizedDoorEvent[] {
  const receivedAt = options.receivedAt ?? new Date();

  return batch.events.map((input) => {
    const lagMs = receivedAt.getTime() - input.occurredAt.getTime();
    const syncStatus: SyncStatus =
      lagMs > DELAY_TOLERANCE_MS ? "DELAYED" : lagMs < -DELAY_TOLERANCE_MS ? "UNKNOWN" : "LIVE";

    return {
      providerEventId: input.providerEventId,
      provider: batch.provider,
      vendorDeviceId: input.vendorDeviceId,
      eventType: input.eventType,
      rawEventType: input.rawEventType ?? input.eventType,
      occurredAt: input.occurredAt,
      receivedAt,
      source: options.source,
      syncStatus,
      deviceTimeQuality: lagMs < -DELAY_TOLERANCE_MS ? "suspect" : "trusted",
      doorState: input.doorState ?? null,
      lockState: input.lockState ?? null,
      credentialRef: input.credentialRef ?? null,
      actorLabel: input.actorLabel ?? null,
      metadata: input.metadata ?? null,
    };
  });
}