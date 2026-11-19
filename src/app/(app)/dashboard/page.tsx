import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/session";
import { getDashboardData } from "@/lib/queries/dashboard";
import {
  eventTypeConfig,
  incidentSeverityConfig,
  incidentStatusConfig,
  sourceConfig,
} from "@/lib/design";
import { formatRelativeTime } from "@/lib/formatters";

export const metadata = { title: "Ringkasan" };

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.propertyId);

  return (
    <>
      <PageHeader
        title={`Selamat datang, ${user.name.split(" ")[0]}`}
        description="Ringkasan operasional hari ini dan sinyal keamanan terbaru."
      />

      <section aria-label="Ringkasan hunian" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tingkat hunian"
          value={`${data.occupancy.rate}%`}
          hint={`${data.occupancy.occupied} dari ${data.occupancy.totalRooms} kamar terisi`}
        />
        <StatCard
          label="Tamu tiba hari ini"
          value={String(data.frontDesk.arrivals)}
          hint={`${data.frontDesk.departures} tamu dijadwalkan check-out`}
        />
        <StatCard
          label="Kamar perlu dibersihkan"
          value={String(data.housekeeping.dirty)}
          hint={`${data.housekeeping.pendingTasks} tugas housekeeping aktif`}
          tone={data.housekeeping.dirty > 5 ? "warning" : "default"}
        />
        <StatCard
          label="Insiden terbuka"
          value={String(data.security.openIncidents)}
          hint={`${data.security.highIncidents} berprioritas tinggi`}
          tone={data.security.highIncidents > 0 ? "danger" : "default"}
        />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Aktivitas pintu terbaru</CardTitle>
            <Link
              href="/security/doors"
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-teal-700 hover:underline"
            >
              Lihat semua <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentEvents.length === 0 ? (
              <EmptyState
                title="Belum ada aktivitas pintu"
                description="Event akan muncul setelah perangkat pintu terhubung."
              />
            ) : (
              <ul className="divide-y divide-border">
                {data.recentEvents.map((event) => {
                  const cfg = eventTypeConfig[event.eventType] ?? {
                    label: event.eventType,
                    tone: "neutral" as const,
                  };
                  const src = sourceConfig[event.source] ?? { label: event.source, tone: "neutral" as const };
                  return (
                    <li key={event.id} className="flex flex-wrap items-center gap-3 py-3">
                      <span className="w-16 shrink-0 text-sm font-semibold tabular-nums text-theta-navy">
                        {event.room.number}
                      </span>
                      <StatusBadge label={cfg.label} tone={cfg.tone} />
                      <StatusBadge label={src.label} tone={src.tone} />
                      <span className="ml-auto text-[13px] text-text-muted">
                        {formatRelativeTime(event.occurredAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Insiden aktif</CardTitle>
            <ShieldAlert className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            {data.recentIncidents.length === 0 ? (
              <EmptyState
                title="Tidak ada insiden terbuka"
                description="Semua sinyal keamanan sudah ditangani."
                className="py-10"
              />
            ) : (
              <ul className="space-y-3">
                {data.recentIncidents.map((incident) => {
                  const sev = incidentSeverityConfig[incident.severity] ?? {
                    label: incident.severity,
                    tone: "neutral" as const,
                  };
                  const st = incidentStatusConfig[incident.status] ?? {
                    label: incident.status,
                    tone: "neutral" as const,
                  };
                  return (
                    <li key={incident.id}>
                      <Link
                        href={`/security/incidents/${incident.id}`}
                        className="block rounded-[10px] border border-border p-3 transition-colors hover:bg-surface-muted"
                      >
                        <div className="flex items-center gap-2">
                          <StatusBadge label={sev.label} tone={sev.tone} />
                          <StatusBadge label={st.label} tone={st.tone} />
                        </div>
                        <p className="mt-2 text-sm font-semibold text-theta-navy">
                          Kamar {incident.room.number}
                        </p>
                        <p className="text-[13px] text-text-muted">{incident.ruleLabel}</p>
                        <p className="mt-1 text-xs text-text-muted">
                          {formatRelativeTime(incident.openedAt)}
                        </p>
                      </Link>
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

