import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/roles";
import {
  eventTypeConfig,
  incidentSeverityConfig,
  incidentStatusConfig,
  sourceConfig,
} from "@/lib/design";
import { formatLocalDateTime } from "@/lib/formatters";
import IncidentActions from "@/app/(app)/security/incidents/[id]/IncidentActions";


export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const incident = await prisma.incident.findFirst({
    where: { id, propertyId: user.propertyId },
    include: {
      room: { select: { number: true, floor: true } },
      assigned: { select: { name: true } },
      history: { orderBy: { createdAt: "asc" } },
      events: {
        include: {
          doorEvent: {
            include: { device: { select: { vendorDeviceId: true, model: true } } },
          },
        },
      },
    },
  });

  if (!incident) notFound();

  const sev = incidentSeverityConfig[incident.severity] ?? {
    label: incident.severity,
    tone: "neutral" as const,
  };
  const st = incidentStatusConfig[incident.status] ?? {
    label: incident.status,
    tone: "neutral" as const,
  };
  const canManage = PERMISSIONS.incidentManage.includes(user.role as never);

  const events = incident.events
    .map((link) => link.doorEvent)
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

  return (
    <>
      <Link
        href="/security/incidents"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-text-muted hover:text-theta-navy"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke daftar insiden
      </Link>

      <PageHeader
        title={`Insiden Kamar ${incident.room.number}`}
        description={incident.ruleLabel ?? "Tanpa label aturan"}
        action={
          <div className="flex flex-wrap gap-2">
            <StatusBadge label={sev.label} tone={sev.tone} />
            <StatusBadge label={st.label} tone={st.tone} />
            {incident.isSimulated && <StatusBadge label="Data simulasi" tone="purple" />}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Rangkaian event pemicu</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-sm text-text-muted">Tidak ada event tertaut.</p>
              ) : (
                <ol className="relative space-y-4 border-l border-border pl-5">
                  {events.map((event) => {
                    const cfg = eventTypeConfig[event.eventType] ?? {
                      label: event.eventType,
                      tone: "neutral" as const,
                    };
                    const src = sourceConfig[event.source] ?? {
                      label: event.source,
                      tone: "neutral" as const,
                    };
                    return (
                      <li key={event.id} className="relative">
                        <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-teal-700 ring-4 ring-surface" />
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge label={cfg.label} tone={cfg.tone} />
                          <StatusBadge label={src.label} tone={src.tone} />
                          <span className="text-[13px] text-text-muted">
                            {formatLocalDateTime(event.occurredAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-[13px] text-text-muted">
                          Perangkat {event.device.vendorDeviceId} ({event.device.model})
                          {event.doorState && ` · Pintu: ${event.doorState}`}
                          {event.lockState && ` · Kunci: ${event.lockState}`}
                          {event.actorLabel && ` · Aktor: ${event.actorLabel}`}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat penanganan</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {incident.history.map((entry) => (
                  <li key={entry.id} className="rounded-[10px] border border-border p-3">
                    <div className="flex flex-wrap items-center gap-2 text-[13px]">
                      <span className="font-semibold text-theta-navy">{entry.actor}</span>
                      <span className="text-text-muted">
                        {entry.fromStatus
                          ? `${incidentStatusConfig[entry.fromStatus]?.label ?? entry.fromStatus} → ${
                              incidentStatusConfig[entry.toStatus]?.label ?? entry.toStatus
                            }`
                          : `Dibuka sebagai ${incidentStatusConfig[entry.toStatus]?.label ?? entry.toStatus}`}
                      </span>
                      <span className="ml-auto text-text-muted">{formatLocalDateTime(entry.createdAt)}</span>
                    </div>
                    {entry.note && <p className="mt-1 text-[13px] text-text">{entry.note}</p>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tindakan</CardTitle>
            </CardHeader>
            <CardContent>
              <IncidentActions
                incidentId={incident.id}
                currentStatus={incident.status}
                canManage={canManage}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-[13px]">
              <Row label="Kamar" value={`${incident.room.number} · Lantai ${incident.room.floor}`} />
              <Row label="Dibuka" value={formatLocalDateTime(incident.openedAt)} />
              <Row
                label="Diakui"
                value={incident.acknowledgedAt ? formatLocalDateTime(incident.acknowledgedAt) : "Belum"}
              />
              <Row label="Ditangani" value={incident.assigned?.name ?? "Belum ditugaskan"} />
              <Row
                label="Ditutup"
                value={incident.closedAt ? formatLocalDateTime(incident.closedAt) : "Belum"}
              />
              {incident.conclusion && <Row label="Kesimpulan" value={incident.conclusion} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-text-muted">{label}</span>
      <span className="text-right font-medium text-text">{value}</span>
    </div>
  );
}

