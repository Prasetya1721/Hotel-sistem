import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import ConnectionState from "@/components/shared/ConnectionState";
import SimulateButton from "@/app/(app)/security/doors/SimulateButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { isSimulatorEnabled } from "@/lib/doors";
import {
  deviceHealthConfig,
  doorStateConfig,
  eventTypeConfig,
  lockStateConfig,
  sourceConfig,
  syncStatusConfig,
} from "@/lib/design";
import { formatLocalDateTime, formatRelativeTime } from "@/lib/formatters";

export const metadata = { title: "Monitoring Pintu" };

export default async function DoorMonitoringPage() {
  const user = await requireUser();
  const [devices, events, onlineCount, totalDevices] = await Promise.all([
    prisma.device.findMany({
      where: { propertyId: user.propertyId },
      orderBy: { vendorDeviceId: "asc" },
      include: { room: { select: { number: true } } },
    }),
    prisma.doorEvent.findMany({
      where: { propertyId: user.propertyId },
      orderBy: { occurredAt: "desc" },
      take: 60,
      include: {
        room: { select: { number: true } },
        device: { select: { vendorDeviceId: true, model: true } },
      },
    }),
    prisma.device.count({ where: { propertyId: user.propertyId, healthStatus: "ONLINE" } }),
    prisma.device.count({ where: { propertyId: user.propertyId } }),
  ]);

  const live = totalDevices > 0 && onlineCount === totalDevices;

  return (
    <>
      <PageHeader
        title="Monitoring Pintu"
        description="Event akses dan status perangkat pintu. Status pintu tidak pernah disimpulkan dari perintah buka."
        action={<ConnectionState live={live} label={`${onlineCount}/${totalDevices} perangkat tersambung`} />}
      />

      {isSimulatorEnabled() && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-purple-200 bg-purple-50 px-4 py-3 text-[13px] text-purple-800">
          <p className="min-w-0 flex-1">
            Mode simulasi aktif. Event bertanda <strong>Simulasi</strong> bukan data hardware asli dan tidak boleh
            dipakai untuk klaim kepatuhan.
          </p>
          <SimulateButton />
        </div>
      )}

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Perangkat terdaftar" value={String(totalDevices)} />
        <StatCard
          label="Tersambung"
          value={String(onlineCount)}
          tone={live ? "default" : "warning"}
        />
        <StatCard label="Event terbaru" value={String(events.length)} hint="maks. 60 terakhir" />
        <StatCard
          label="Perangkat bermasalah"
          value={String(totalDevices - onlineCount)}
          tone={totalDevices - onlineCount > 0 ? "danger" : "default"}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Log event pintu</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {events.length === 0 ? (
              <EmptyState
                title="Belum ada event"
                description="Event akan tampil setelah perangkat pintu mengirim data."
                className="border-0"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Kamar</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Pintu</TableHead>
                    <TableHead>Kunci</TableHead>
                    <TableHead>Sumber</TableHead>
                    <TableHead>Sync</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => {
                    const ev = eventTypeConfig[event.eventType] ?? {
                      label: event.eventType,
                      tone: "neutral" as const,
                    };
                    const src = sourceConfig[event.source] ?? { label: event.source, tone: "neutral" as const };
                    const sync = syncStatusConfig[event.syncStatus] ?? {
                      label: event.syncStatus,
                      tone: "neutral" as const,
                    };
                    const door = event.doorState ? doorStateConfig[event.doorState] : null;
                    const lock = event.lockState ? lockStateConfig[event.lockState] : null;
                    return (
                      <TableRow key={event.id}>
                        <TableCell className="whitespace-nowrap text-[13px] text-text-muted">
                          <span title={formatLocalDateTime(event.occurredAt)}>
                            {formatRelativeTime(event.occurredAt)}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold tabular-nums">{event.room.number}</TableCell>
                        <TableCell>
                          <StatusBadge label={ev.label} tone={ev.tone} />
                        </TableCell>
                        <TableCell>
                          {door ? <StatusBadge label={door.label} tone={door.tone} /> : <span className="text-text-muted">—</span>}
                        </TableCell>
                        <TableCell>
                          {lock ? <StatusBadge label={lock.label} tone={lock.tone} /> : <span className="text-text-muted">—</span>}
                        </TableCell>
                        <TableCell>
                          <StatusBadge label={src.label} tone={src.tone} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge label={sync.label} tone={sync.tone} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Perangkat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {devices.length === 0 ? (
              <EmptyState title="Belum ada perangkat" description="Daftarkan perangkat pintu di menu Perangkat." className="border-0 py-8" />
            ) : (
              devices.map((device) => {
                const health = deviceHealthConfig[device.healthStatus] ?? {
                  label: device.healthStatus,
                  tone: "neutral" as const,
                };
                return (
                  <div key={device.id} className="rounded-[10px] border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-theta-navy">
                        {device.room?.number ?? "Tanpa kamar"}
                      </p>
                      <StatusBadge label={health.label} tone={health.tone} />
                    </div>
                    <p className="mt-1 text-[13px] text-text-muted">
                      {device.vendor} {device.model}
                    </p>
                    <p className="text-xs text-text-muted">
                      ID: {device.vendorDeviceId}
                      {device.batteryPct != null && ` · Baterai ${device.batteryPct}%`}
                    </p>
                    <p className="text-xs text-text-muted">
                      Terakhir terlihat: {device.lastSeenAt ? formatRelativeTime(device.lastSeenAt) : "-"}
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

