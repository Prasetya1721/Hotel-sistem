// Sumber tunggal label & tone status per domain, sesuai desain.md §9.

export type Tone = "neutral" | "info" | "teal" | "success" | "warning" | "danger" | "purple";

export interface StatusInfo {
  label: string;
  tone: Tone;
}

export const occupancyConfig: Record<string, StatusInfo> = {
  VACANT: { label: "Kosong", tone: "neutral" },
  RESERVED: { label: "Dipesan", tone: "info" },
  OCCUPIED: { label: "Terisi", tone: "teal" },
};

export const housekeepingConfig: Record<string, StatusInfo> = {
  DIRTY: { label: "Kotor", tone: "warning" },
  CLEANING: { label: "Sedang dibersihkan", tone: "info" },
  INSPECTED: { label: "Siap diperiksa", tone: "purple" },
  CLEAN: { label: "Bersih", tone: "success" },
};

export const serviceConfig: Record<string, StatusInfo> = {
  AVAILABLE: { label: "Tersedia", tone: "success" },
  OUT_OF_ORDER: { label: "Dalam perbaikan", tone: "warning" },
  OUT_OF_SERVICE: { label: "Tidak dijual", tone: "danger" },
};

export const deviceHealthConfig: Record<string, StatusInfo> = {
  ONLINE: { label: "Tersambung", tone: "success" },
  OFFLINE: { label: "Terputus", tone: "danger" },
  LOW_BATTERY: { label: "Baterai lemah", tone: "warning" },
  TAMPERED: { label: "Sensor terganggu", tone: "danger" },
  UNKNOWN: { label: "Tidak diketahui", tone: "neutral" },
};

export const doorStateConfig: Record<string, StatusInfo> = {
  OPEN: { label: "Pintu terbuka", tone: "warning" },
  CLOSED: { label: "Pintu tertutup", tone: "success" },
  UNKNOWN: { label: "Status pintu tidak tersedia", tone: "neutral" },
};

export const lockStateConfig: Record<string, StatusInfo> = {
  LOCKED: { label: "Terkunci", tone: "success" },
  UNLOCKED: { label: "Tidak terkunci", tone: "warning" },
  UNKNOWN: { label: "Tidak diketahui", tone: "neutral" },
};

export const eventTypeConfig: Record<string, { label: string; tone: Tone }> = {
  ACCESS_GRANTED: { label: "Akses diterima", tone: "info" },
  ACCESS_DENIED: { label: "Akses ditolak", tone: "warning" },
  LOCK_UNLOCKED: { label: "Kunci dibuka", tone: "info" },
  LOCK_LOCKED: { label: "Kunci terkunci", tone: "teal" },
  DOOR_OPENED: { label: "Pintu terbuka", tone: "warning" },
  DOOR_CLOSED: { label: "Pintu tertutup", tone: "success" },
  DOOR_HELD_OPEN: { label: "Pintu dibiarkan terbuka", tone: "warning" },
  DOOR_FORCED_OPEN: { label: "Terbuka tanpa akses sah", tone: "danger" },
  MASTER_KEY_USED: { label: "Master key digunakan", tone: "danger" },
  CREDENTIAL_ISSUED: { label: "Kredensial diterbitkan", tone: "info" },
  CREDENTIAL_REVOKED: { label: "Kredensial dicabut", tone: "neutral" },
  DEVICE_ONLINE: { label: "Perangkat tersambung", tone: "success" },
  DEVICE_OFFLINE: { label: "Perangkat terputus", tone: "danger" },
  LOW_BATTERY: { label: "Baterai lemah", tone: "warning" },
  SENSOR_TAMPER: { label: "Sensor terganggu", tone: "danger" },
  EVENT_SYNCED: { label: "Sinkronisasi tertunda", tone: "neutral" },
};

export const incidentSeverityConfig: Record<string, StatusInfo> = {
  LOW: { label: "Rendah", tone: "info" },
  MEDIUM: { label: "Sedang", tone: "warning" },
  HIGH: { label: "Tinggi", tone: "danger" },
  CRITICAL: { label: "Kritis", tone: "danger" },
};

export const incidentStatusConfig: Record<string, StatusInfo> = {
  NEW: { label: "Perlu ditinjau", tone: "danger" },
  ACKNOWLEDGED: { label: "Sedang diperiksa", tone: "warning" },
  INVESTIGATING: { label: "Sedang diperiksa", tone: "info" },
  RESOLVED: { label: "Selesai", tone: "success" },
  FALSE_POSITIVE: { label: "Tidak terbukti", tone: "neutral" },
  CLOSED: { label: "Ditutup", tone: "neutral" },
  REOPENED: { label: "Dibuka kembali", tone: "danger" },
};

export const reservationStatusConfig: Record<string, StatusInfo> = {
  PENDING: { label: "Menunggu", tone: "warning" },
  HOLD: { label: "Ditahan", tone: "neutral" },
  CONFIRMED: { label: "Terkonfirmasi", tone: "info" },
  CHECKED_IN: { label: "Check-in", tone: "teal" },
  CHECKED_OUT: { label: "Check-out", tone: "neutral" },
  NO_SHOW: { label: "Tidak datang", tone: "warning" },
  CANCELLED: { label: "Dibatalkan", tone: "danger" },
};

export const syncStatusConfig: Record<string, StatusInfo> = {
  LIVE: { label: "Live", tone: "success" },
  DELAYED: { label: "Terlambat", tone: "warning" },
  OFFLINE: { label: "Offline", tone: "danger" },
  UNKNOWN: { label: "Tidak diketahui", tone: "neutral" },
};

export const sourceConfig: Record<string, StatusInfo> = {
  HARDWARE: { label: "Hardware", tone: "teal" },
  SIMULATED: { label: "Simulasi", tone: "purple" },
  SYSTEM: { label: "Sistem", tone: "neutral" },
};

export const taskStatusConfig: Record<string, StatusInfo> = {
  PENDING: { label: "Belum mulai", tone: "neutral" },
  IN_PROGRESS: { label: "Dikerjakan", tone: "info" },
  DONE: { label: "Selesai", tone: "success" },
  INSPECTED: { label: "Terinspeksi", tone: "teal" },
};

export const taskTypeConfig: Record<string, string> = {
  CLEANING: "Pembersihan",
  DEEP_CLEAN: "Pembersihan menyeluruh",
  TURNDOWN: "Turndown",
  INSPECTION: "Inspeksi",
  LINEN_CHANGE: "Ganti linen",
  MAINTENANCE_SUPPORT: "Bantu perbaikan",
};

export const priorityConfig: Record<string, StatusInfo> = {
  LOW: { label: "Rendah", tone: "neutral" },
  NORMAL: { label: "Normal", tone: "info" },
  HIGH: { label: "Tinggi", tone: "warning" },
  URGENT: { label: "Mendesak", tone: "danger" },
};

export const ticketStatusConfig: Record<string, StatusInfo> = {
  OPEN: { label: "Terbuka", tone: "warning" },
  ASSIGNED: { label: "Ditugaskan", tone: "info" },
  IN_PROGRESS: { label: "Dikerjakan", tone: "info" },
  PENDING_PART: { label: "Menunggu part", tone: "warning" },
  DONE: { label: "Selesai", tone: "success" },
  CLOSED: { label: "Ditutup", tone: "neutral" },
};

export function statusLabel(
  domain: keyof typeof statusDomainMap,
  key: string | null | undefined,
): StatusInfo {
  if (!key) return { label: "Tidak diketahui", tone: "neutral" };
  const map = statusDomainMap[domain];
  return map[key] ?? { label: key, tone: "neutral" };
}

export const statusDomainMap = {
  occupancy: occupancyConfig,
  housekeeping: housekeepingConfig,
  service: serviceConfig,
  device: deviceHealthConfig,
  door: doorStateConfig,
  lock: lockStateConfig,
  event: eventTypeConfig,
  incidentSeverity: incidentSeverityConfig,
  incident: incidentStatusConfig,
  reservation: reservationStatusConfig,
  sync: syncStatusConfig,
  source: sourceConfig,
  task: taskStatusConfig,
  ticket: ticketStatusConfig,
} as const;