import { cn } from "@/lib/utils";

export default function ConnectionState({ live, label = "Terhubung" }: { live: boolean; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
        live ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", live ? "bg-success" : "bg-danger")} aria-hidden />
      {live ? label : "Terputus — data mungkin tertunda"}
    </span>
  );
}
