import type { User } from "@prisma/client";

export type Role =
  | "OWNER"
  | "GENERAL_MANAGER"
  | "RECEPTIONIST"
  | "HOUSEKEEPING"
  | "ENGINEERING"
  | "SECURITY"
  | "FINANCE"
  | "AUDITOR"
  | "DEVICE_ADMIN";

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Pemilik",
  GENERAL_MANAGER: "General Manager",
  RECEPTIONIST: "Resepsionis",
  HOUSEKEEPING: "Housekeeping",
  ENGINEERING: "Teknisi",
  SECURITY: "Keamanan",
  FINANCE: "Keuangan",
  AUDITOR: "Auditor",
  DEVICE_ADMIN: "Admin Perangkat",
};

// Navigasi sidebar dikelompokkan. Menu roles: array Role yang boleh melihat item.
export const NAV_GROUPS = [
  {
    title: "Utama",
    items: [{ href: "/dashboard", label: "Ringkasan", icon: "LayoutDashboard", roles: null }],
  },
  {
    title: "Operasional",
    items: [
      {
        href: "/front-desk",
        label: "Reservasi",
        icon: "CalendarRange",
        roles: ["OWNER", "GENERAL_MANAGER", "RECEPTIONIST", "FINANCE", "AUDITOR"],
      },
      {
        href: "/availability",
        label: "Kalender",
        icon: "CalendarDays",
        roles: ["OWNER", "GENERAL_MANAGER", "RECEPTIONIST"],
      },
      {
        href: "/rooms",
        label: "Kamar",
        icon: "BedDouble",
        roles: ["OWNER", "GENERAL_MANAGER", "RECEPTIONIST", "HOUSEKEEPING", "ENGINEERING"],
      },
      {
        href: "/guests",
        label: "Tamu",
        icon: "Users",
        roles: ["OWNER", "GENERAL_MANAGER", "RECEPTIONIST"],
      },
      {
        href: "/housekeeping",
        label: "Housekeeping",
        icon: "Sparkles",
        roles: ["OWNER", "GENERAL_MANAGER", "HOUSEKEEPING", "RECEPTIONIST"],
      },
      {
        href: "/maintenance",
        label: "Maintenance",
        icon: "Wrench",
        roles: ["OWNER", "GENERAL_MANAGER", "ENGINEERING", "HOUSEKEEPING"],
      },
      {
        href: "/finance",
        label: "Keuangan",
        icon: "Wallet",
        roles: ["OWNER", "GENERAL_MANAGER", "FINANCE", "AUDITOR"],
      },
    ],
  },
  {
    title: "Keamanan",
    items: [
      { href: "/security/doors", label: "Monitoring Pintu", icon: "DoorOpen", roles: null },
      { href: "/security/incidents", label: "Insiden", icon: "ShieldAlert", roles: null },
      {
        href: "/audit",
        label: "Audit",
        icon: "ClipboardList",
        roles: ["OWNER", "GENERAL_MANAGER", "AUDITOR"],
      },
    ],
  },
  {
    title: "Administrasi",
    items: [
      { href: "/users", label: "Pengguna", icon: "UserCog", roles: ["OWNER", "GENERAL_MANAGER", "DEVICE_ADMIN"] },
      {
        href: "/settings/devices",
        label: "Perangkat",
        icon: "Cpu",
        roles: ["OWNER", "GENERAL_MANAGER", "DEVICE_ADMIN", "SECURITY"],
      },
      {
        href: "/reports",
        label: "Laporan",
        icon: "FileText",
        roles: ["OWNER", "GENERAL_MANAGER", "FINANCE", "AUDITOR"],
      },
    ],
  },
] as const;

export function canAccessMenu(role: string, roles: readonly string[] | null | undefined): boolean {
  if (!roles) return true;
  return roles.includes(role);
}

export function requireRole(user: User | null | undefined, roles: Role[]): boolean {
  if (!user) return false;
  return roles.includes(user.role as Role);
}

// Pembatasan per modul: hak atas tindakan inti.
export const PERMISSIONS = {
  admin: ["OWNER", "GENERAL_MANAGER", "DEVICE_ADMIN"],
  reservationWrite: ["OWNER", "GENERAL_MANAGER", "RECEPTIONIST"],
  guestWrite: ["OWNER", "GENERAL_MANAGER", "RECEPTIONIST"],
  financeWrite: ["OWNER", "GENERAL_MANAGER", "FINANCE"],
  housekeepingWrite: ["OWNER", "GENERAL_MANAGER", "HOUSEKEEPING"],
  maintenanceWrite: ["OWNER", "GENERAL_MANAGER", "ENGINEERING"],
  securityManage: ["OWNER", "GENERAL_MANAGER", "SECURITY"],
  incidentManage: ["OWNER", "GENERAL_MANAGER", "SECURITY"],
  auditView: ["OWNER", "GENERAL_MANAGER", "AUDITOR"],
  deviceManage: ["OWNER", "GENERAL_MANAGER", "DEVICE_ADMIN"],
  reportsView: ["OWNER", "GENERAL_MANAGER", "FINANCE", "AUDITOR"],
} as const;
