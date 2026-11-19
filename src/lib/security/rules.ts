import type { NormalizedDoorEvent } from "@/lib/doors/types";

export interface RuleHit {
  ruleLabel: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

/**
 * Aturan deteksi insiden. Hanya memakai fakta dari event — tidak menebak
 * status pintu dari ACCESS_GRANTED (lihat PRD §5.3).
 */
export function evaluateRules(
  event: NormalizedDoorEvent,
  context: { hasActiveCredential: boolean; roomOccupied: boolean },
): RuleHit[] {
  const hits: RuleHit[] = [];

  if (event.eventType === "DOOR_FORCED_OPEN") {
    hits.push({ ruleLabel: "Pintu terbuka tanpa akses sah", severity: "HIGH" });
  }

  if (event.eventType === "DOOR_OPENED" && !context.hasActiveCredential && context.roomOccupied) {
    hits.push({ ruleLabel: "Pintu terbuka pada kamar terisi tanpa kredensial aktif", severity: "HIGH" });
  }

  if (event.eventType === "MASTER_KEY_USED") {
    hits.push({ ruleLabel: "Master key digunakan", severity: "CRITICAL" });
  }

  if (event.eventType === "SENSOR_TAMPER") {
    hits.push({ ruleLabel: "Sensor pintu terganggu", severity: "HIGH" });
  }

  if (event.eventType === "DOOR_HELD_OPEN") {
    hits.push({ ruleLabel: "Pintu dibiarkan terbuka terlalu lama", severity: "MEDIUM" });
  }

  if (event.eventType === "ACCESS_DENIED") {
    hits.push({ ruleLabel: "Percobaan akses ditolak", severity: "LOW" });
  }

  if (event.eventType === "DEVICE_OFFLINE") {
    hits.push({ ruleLabel: "Perangkat pintu terputus", severity: "MEDIUM" });
  }

  return hits;
}

/** Ambang batas agar insiden LOW tidak membanjiri daftar. */
export function shouldOpenIncident(severity: RuleHit["severity"]): boolean {
  return severity === "MEDIUM" || severity === "HIGH" || severity === "CRITICAL";
}
