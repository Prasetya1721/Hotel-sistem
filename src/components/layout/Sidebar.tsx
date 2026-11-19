"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  CalendarDays,
  BedDouble,
  Users,
  Sparkles,
  Wrench,
  Wallet,
  DoorOpen,
  ShieldAlert,
  ClipboardList,
  UserCog,
  Cpu,
  FileText,
  X,
} from "lucide-react";
import { canAccessMenu, NAV_GROUPS, ROLE_LABELS } from "@/lib/roles";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  CalendarRange,
  CalendarDays,
  BedDouble,
  Users,
  Sparkles,
  Wrench,
  Wallet,
  DoorOpen,
  ShieldAlert,
  ClipboardList,
  UserCog,
  Cpu,
  FileText,
};

export default function Sidebar({
  userName,
  userRole,
  onClose,
}: {
  userName: string;
  userRole: string;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-theta-navy text-white">
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-teal-600 text-white">
            <span className="text-base font-bold">H</span>
          </span>
          <span className="text-[15px] font-bold tracking-tight">HotelOps Guard</span>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-white/10"
            aria-label="Tutup menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navigasi utama">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => canAccessMenu(userRole, item.roles));
          if (items.length === 0) return null;
          return (
          <div key={group.title} className="mb-6">
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
              {group.title}
            </p>
            <ul>
              {items.map((item) => {
                const Icon = ICONS[item.icon] ?? LayoutDashboard;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-10 items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                        active && "bg-teal-600/25 font-semibold text-white shadow-[inset_2px_0_0_0_var(--brand-teal)]",
                      )}
                    >
                      <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-white" : "text-white/60")} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{userName}</p>
            <p className="truncate text-xs text-white/60">
              {ROLE_LABELS[userRole as keyof typeof ROLE_LABELS] ?? userRole}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
