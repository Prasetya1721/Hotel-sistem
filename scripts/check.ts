/**
 * Pemeriksaan cepat logika inti: aturan insiden dan transisi status.
 * Jalankan: npx tsx scripts/check.ts
 */
import assert from "node:assert/strict";
import { evaluateRules, shouldOpenIncident } from "@/lib/security/rules";
import { canTransition } from "@/lib/incidents";
import { doorEventBatchSchema, normalizeDoorEvents } from "@/lib/doors/normalize";
import type { NormalizedDoorEvent } from "@/lib/doors/types";

function event(partial: Partial<NormalizedDoorEvent>): NormalizedDoorEvent {
  const now = new Date();
  return {
    providerEventId: "t-1",
    provider: "test",
    vendorDeviceId: "DEV-1",
    eventType: "DOOR_OPENED",
    rawEventType: "DOOR_OPENED",
    occurredAt: now,
    receivedAt: now,
    source: "SIMULATED",
    syncStatus: "LIVE",
    ...partial,
  };
}

// Pintu terbuka pada kamar terisi tanpa kredensial aktif -> HIGH.
assert.equal(
  evaluateRules(event({ eventType: "DOOR_OPENED" }), {
    hasActiveCredential: false,
    roomOccupied: true,
  })[0]?.severity,
  "HIGH",
);

// Pintu terbuka dengan kredensial sah -> tidak ada insiden.
assert.equal(
  evaluateRules(event({ eventType: "DOOR_OPENED" }), {
    hasActiveCredential: true,
    roomOccupied: true,
  }).length,
  0,
);

// ACCESS_GRANTED tidak boleh dianggap pintu terbuka.
assert.equal(
  evaluateRules(event({ eventType: "ACCESS_GRANTED" }), {
    hasActiveCredential: true,
    roomOccupied: true,
  }).length,
  0,
);

// Akses ditolak hanya LOW -> tidak membuka insiden.
const denied = evaluateRules(event({ eventType: "ACCESS_DENIED" }), {
  hasActiveCredential: false,
  roomOccupied: true,
});
assert.equal(denied[0]?.severity, "LOW");
assert.equal(shouldOpenIncident("LOW"), false);
assert.equal(shouldOpenIncident("HIGH"), true);

// Transisi status insiden.
assert.equal(canTransition("NEW", "ACKNOWLEDGED"), true);
assert.equal(canTransition("NEW", "RESOLVED"), false);
assert.equal(canTransition("ACKNOWLEDGED", "INVESTIGATING"), true);
assert.equal(canTransition("RESOLVED", "CLOSED"), true);
assert.equal(canTransition("CLOSED", "REOPENED"), true);
assert.equal(canTransition("CLOSED", "NEW"), false);

// --- Normalisasi webhook ---------------------------------------------------
const batch = doorEventBatchSchema.parse({
  provider: "acme",
  events: [
    { providerEventId: "e-1", vendorDeviceId: "DEV-1", eventType: "DOOR_OPENED", occurredAt: "2026-01-01T00:00:00Z" },
  ],
});

// Jam perangkat jauh di belakang server -> DELAYED, bukan dibuang.
const late = normalizeDoorEvents(batch, {
  source: "HARDWARE",
  receivedAt: new Date("2026-01-01T00:10:00Z"),
})[0];
assert.equal(late.syncStatus, "DELAYED");
assert.equal(late.deviceTimeQuality, "trusted");
assert.equal(late.source, "HARDWARE");

// Jam perangkat di depan server -> clock skew, ditandai suspect.
const skewed = normalizeDoorEvents(batch, {
  source: "HARDWARE",
  receivedAt: new Date("2025-12-31T23:50:00Z"),
})[0];
assert.equal(skewed.deviceTimeQuality, "suspect");
assert.equal(skewed.syncStatus, "UNKNOWN");

// Dalam toleransi -> LIVE.
const onTime = normalizeDoorEvents(batch, {
  source: "HARDWARE",
  receivedAt: new Date("2026-01-01T00:00:30Z"),
})[0];
assert.equal(onTime.syncStatus, "LIVE");

// Event type tak dikenal ditolak skema, bukan diteruskan diam-diam.
assert.equal(
  doorEventBatchSchema.safeParse({
    provider: "acme",
    events: [
      { providerEventId: "e-2", vendorDeviceId: "DEV-1", eventType: "DOOR_EXPLODED", occurredAt: "2026-01-01T00:00:00Z" },
    ],
  }).success,
  false,
);

console.log("check: OK");