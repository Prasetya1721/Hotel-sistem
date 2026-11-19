import type {
  DoorEventType,
  NormalizedDoorEvent,
  SmartLockProvider,
} from "@/lib/doors/types";

const SEQUENCE: Array<{ type: DoorEventType; door: "OPEN" | "CLOSED"; lock: "LOCKED" | "UNLOCKED" }> = [
  { type: "ACCESS_GRANTED", door: "CLOSED", lock: "UNLOCKED" },
  { type: "DOOR_OPENED", door: "OPEN", lock: "UNLOCKED" },
  { type: "DOOR_CLOSED", door: "CLOSED", lock: "LOCKED" },
];

/**
 * Provider simulasi — HANYA untuk development. Setiap event ditandai
 * source=SIMULATED supaya tidak pernah tercampur dengan data hardware asli.
 * ponytail: siklus 3 langkah; ganti dengan adapter vendor saat integrasi nyata.
 */
export class SimulatedSmartLockProvider implements SmartLockProvider {
  readonly name = "simulated";
  readonly source = "SIMULATED" as const;
  private cursor = 0;

  async fetchEvents(deviceIds: string[]): Promise<NormalizedDoorEvent[]> {
    if (deviceIds.length === 0) return [];
    const step = SEQUENCE[this.cursor % SEQUENCE.length];
    this.cursor += 1;
    const now = new Date();
    const deviceId = deviceIds[this.cursor % deviceIds.length];
    return [
      {
        providerEventId: `sim-${deviceId}-${now.getTime()}-${this.cursor}`,
        provider: this.name,
        vendorDeviceId: deviceId,
        eventType: step.type,
        rawEventType: step.type,
        occurredAt: now,
        receivedAt: now,
        source: this.source,
        syncStatus: "LIVE",
        doorState: step.door,
        lockState: step.lock,
        actorLabel: "Simulasi",
        metadata: { simulated: true },
      },
    ];
  }

  async requestUnlock(deviceId: string, reason: string) {
    return {
      accepted: false,
      message: `Buka jarak jauh nonaktif pada provider simulasi (${deviceId}). Alasan: ${reason}`,
    };
  }
}
