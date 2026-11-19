import AppShell from "@/components/layout/AppShell";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const [property, unreadCount] = await Promise.all([
    prisma.property.findUnique({
      where: { id: user.propertyId },
      select: { name: true, timezone: true },
    }),
    prisma.notification.count({
      where: {
        propertyId: user.propertyId,
        isRead: false,
        OR: [{ recipientId: null }, { recipientId: user.id }],
      },
    }),
  ]);

  return (
    <AppShell
      userName={user.name}
      userRole={user.role}
      propertyName={property?.name ?? "Hotel"}
      unreadCount={unreadCount}
    >
      {children}
    </AppShell>
  );
}