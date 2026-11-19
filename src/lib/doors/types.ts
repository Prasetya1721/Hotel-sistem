export type DoorEventType =
  | "ACCESS_GRANTED"
  | "ACCESS_DENIED"
  | "LOCK_UNLOCKED"
  | "LOCK_LOCKED"
  | "DOOR_OPENED"
  | "DOOR_CLOSED"
  | "DOOR_HELD_OPEN"
  | "DOOR_FORCED_OPEN"
  | "MASTER_KEY_USED"
  | "CREDENTIAL_ISSUED"
  | "CREDENTIAL_REVOKED"
  | "DEVICE_ONLINE"
  | "DEVICE_OFFLINE"
  | "LOW_BATTERY"
  | "SENSOR_TAMPER"
  | "EVENT_SYNCED";

export type DoorEventSource = "HARDWARE" | "SIMULATED" | "SYSTEM";
export type SyncStatus = "LIVE" | "DELAYED" | "OFFLINE" | "UNKNOWN";
export type DoorState = "OPEN" | "CLOSED" | "UNKNOWN";
export type LockState = "LOCKED" | "UNLOCKED" | "UNKNOWN";

export interface NormalizedDoorEvent {
  providerEventId: string;
  provider: string;
  vendorDeviceId: string;
  eventType: DoorEventType;
  rawEventType: string;
  occurredAt: Date;
  receivedAt: Date;
  source: DoorEventSource;
  syncStatus: SyncStatus;
  deviceTimeQuality?: string;
  doorState?: DoorState | null;
  lockState?: LockState | null;
  credentialRef?: string | null;
  actorLabel?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface SmartLockProvider {
  readonly name: string;
  readonly source: DoorEventSource;
  fetchEvents(deviceIds: string[]): Promise<NormalizedDoorEvent[]>;
  requestUnlock(deviceId: string, reason: string): Promise<{ accepted: boolean; message: string }>;
}
