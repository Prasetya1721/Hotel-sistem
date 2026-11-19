"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function AppShell({
  children,
  userName,
  userRole,
  propertyName,
  unreadCount,
}: {
  children: React.ReactNode;
  userName: string;
  userRole: string;
  propertyName: string;
  unreadCount: number;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = React.useState(pathname);

  // Tutup drawer saat navigasi berubah — tanpa effect setState.
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
  }

  return (
    <div className="min-h-screen bg-page">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] lg:block">
        <Sidebar userName={userName} userRole={userRole} />
      </aside>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-theta-navy/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-[280px] shadow-2xl">
            <Sidebar
              userName={userName}
              userRole={userRole}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface px-4 sm:px-6">
          <button
            type="button"
            className="rounded-[10px] p-2 text-theta-navy hover:bg-surface-muted lg:hidden"
            aria-label="Buka menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Topbar propertyName={propertyName} unreadCount={unreadCount} />
        </header>
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
