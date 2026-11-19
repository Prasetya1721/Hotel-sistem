import Link from "next/link";
import { Bell, Building2 } from "lucide-react";
import { SignOutButton } from "@/components/layout/SignOutButton";

export default function Topbar({
  propertyName,
  unreadCount,
}: {
  propertyName: string;
  unreadCount: number;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2 text-[13px] text-text-muted">
        <Building2 className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate font-medium text-text">{propertyName}</span>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/security/incidents"
          className="relative rounded-[10px] p-2 text-theta-navy hover:bg-surface-muted"
          aria-label={
            unreadCount > 0 ? `Notifikasi, ${unreadCount} belum dibaca` : "Notifikasi"
          }
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
        <SignOutButton />
      </div>
    </div>
  );
}
