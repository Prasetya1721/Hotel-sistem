// Format tunggal untuk seluruh aplikasi.

export function formatCurrencyIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatIDR(value: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export function formatLocalDateTime(
  date: Date | string | null | undefined,
  timeZone = "Asia/Jakarta",
): string {
  if (!date) return "-";
  const d = new Date(date);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const monthNum = new Intl.DateTimeFormat("en-GB", { timeZone, month: "numeric" }).format(d);
  const month = MONTHS[Number(monthNum) - 1] ?? get("month");
  const tz = timeZone.split("/").pop() ?? "WIB";
  return `${Number(get("day"))} ${month} ${get("year")}, ${get("hour")}.${get("minute")} ${tz}`;
}

export function formatShortDate(
  date: Date | string | null | undefined,
  timeZone = "Asia/Jakarta",
): string {
  if (!date) return "-";
  const d = new Date(date);
  return new Intl.DateTimeFormat("id-ID", {
    timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatTime(
  date: Date | string | null | undefined,
  timeZone = "Asia/Jakarta",
): string {
  if (!date) return "-";
  const d = new Date(date);
  return new Intl.DateTimeFormat("id-ID", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "baru saja";
  if (min < 60) return `${min} mnt lalu`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return `${d} hari lalu`;
}
