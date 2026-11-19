"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportNavTabsProps {
  canViewGuests?: boolean;
  canViewFinance?: boolean;
}

export default function ReportNavTabs({
  canViewGuests = true,
  canViewFinance = true,
}: ReportNavTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      href: "/reports/finance",
      label: "Laporan Keuangan",
      description: "Omzet, Penerimaan Kas, Piutang & Folio",
      icon: Wallet,
      visible: canViewFinance,
      active: pathname === "/reports/finance",
    },
    {
      href: "/reports/guests",
      label: "Laporan Tamu",
      description: "Profil, Tren Kunjungan & Tamu In-House",
      icon: Users,
      visible: canViewGuests,
      active: pathname === "/reports/guests",
    },
    {
      href: "/reports",
      label: "Laporan Operasional",
      description: "Ringkasan Event Pintu & Insiden Keamanan",
      icon: FileText,
      visible: true,
      active: pathname === "/reports",
    },
  ];

  return (
    <div className="mb-6 border-b border-border/80">
      <div className="flex flex-wrap gap-2 sm:gap-4">
        {tabs
          .filter((t) => t.visible)
          .map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "group flex items-center gap-2.5 border-b-2 px-3.5 py-3 text-sm font-semibold transition-all duration-150",
                  tab.active
                    ? "border-teal-700 text-teal-800 font-bold"
                    : "border-transparent text-text-muted hover:border-border hover:text-theta-navy"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                    tab.active
                      ? "bg-teal-50 text-teal-800"
                      : "bg-surface-muted text-text-muted group-hover:text-theta-navy"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="leading-tight">{tab.label}</div>
                  <div className="hidden text-[11px] font-normal text-text-muted sm:block">
                    {tab.description}
                  </div>
                </div>
              </Link>
            );
          })}
      </div>
    </div>
  );
}
