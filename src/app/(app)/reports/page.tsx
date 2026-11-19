import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/roles";
import { formatCurrencyIDR } from "@/lib/formatters";
import { eventTypeConfig, incidentSeverityConfig } from "@/lib/design";
import StatusBadge from "@/components/StatusBadge";

export const metadata = { title: "Laporan" };

export default async function ReportsPage() {
  const user = await requireUser();

  if (!PERMISSIONS.reportsView.includes(user.role as never)) {
    return (
      <>
        <PageHeader title="Laporan" description="Ringkasan operasional dan keamanan." />
        <EmptyState
          title="Akses terbatas"
          description="Hanya Pemilik, General Manager, Keuangan, dan Auditor yang dapat melihat laporan."
        />
      </>
    );
  }

  const since = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
  const [eventGroups, incidentGroups, folioTotals, reservations] = await Promise.all([
    prisma.doorEvent.groupBy({
      by: ["eventType"],
      where: { propertyId: user.propertyId, occurredAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.incident.groupBy({
      by: ["severity"],
      where: { propertyId: user.propertyId, openedAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.folio.aggregate({
      where: { reservation: { propertyId: user.propertyId } },
      _sum: { total: true, paid: true },
    }),
    prisma.reservation.count({
      where: { propertyId: user.propertyId, createdAt: { gte: since } },
    }),
  ]);

  const totalEvents = eventGroups.reduce((sum, g) => sum + g._count._all, 0);
  const billed = folioTotals._sum.total ?? 0;
  const paid = folioTotals._sum.paid ?? 0;

  return (
    <>
      <PageHeader
        title="Laporan"
        description="Agregat 30 hari terakhir. Angka dihitung langsung dari data operasional."
      />

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Reservasi baru" value={String(reservations)} hint="30 hari terakhir" />
        <StatCard label="Event pintu" value={String(totalEvents)} hint="30 hari terakhir" />
        <StatCard label="Total tagihan" value={formatCurrencyIDR(billed)} />
        <StatCard
          label="Piutang"
          value={formatCurrencyIDR(Math.max(billed - paid, 0))}
          tone={billed - paid > 0 ? "warning" : "default"}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Event pintu per jenis</CardTitle>
          </CardHeader>
          <CardContent>
            {eventGroups.length === 0 ? (
              <p className="text-sm text-text-muted">Belum ada event pada periode ini.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {eventGroups
                  .sort((a, b) => b._count._all - a._count._all)
                  .map((group) => (
                    <li key={group.eventType} className="flex justify-between border-b border-border pb-2 last:border-0">
                      <span className="text-text">
                        {eventTypeConfig[group.eventType]?.label ?? group.eventType}
                      </span>
                      <span className="font-semibold tabular-nums text-theta-navy">{group._count._all}</span>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Insiden per severity</CardTitle>
          </CardHeader>
          <CardContent>
            {incidentGroups.length === 0 ? (
              <p className="text-sm text-text-muted">Tidak ada insiden pada periode ini.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {incidentGroups.map((group) => {
                  const sev = incidentSeverityConfig[group.severity] ?? {
                    label: group.severity,
                    tone: "neutral" as const,
                  };
                  return (
                    <li
                      key={group.severity}
                      className="flex items-center justify-between border-b border-border pb-2 last:border-0"
                    >
                      <StatusBadge label={sev.label} tone={sev.tone} />
                      <span className="font-semibold tabular-nums text-theta-navy">
                        {group._count._all}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

