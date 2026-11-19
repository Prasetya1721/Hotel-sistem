import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
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
import { deviceHealthConfig } from "@/lib/design";
import { formatRelativeTime } from "@/lib/formatters";

export const metadata = { title: "Perangkat" };

export default async function DevicesPage() {
  const user = await requireUser();
  const devices = await prisma.device.findMany({
    where: { propertyId: user.propertyId },
    orderBy: { vendorDeviceId: "asc" },
    include: { room: { select: { number: true } } },
  });

  return (
    <>
      <PageHeader
        title="Perangkat Pintu"
        description="Perangkat terdaftar dan status kesehatannya. Buka jarak jauh nonaktif secara default."
      />

      <div className="mb-6 rounded-[12px] border border-border bg-surface px-4 py-3 text-[13px] text-text-muted">
        Simulator perangkat:{" "}
        <strong className={isSimulatorEnabled() ? "text-warning" : "text-success"}>
          {isSimulatorEnabled() ? "aktif (development)" : "nonaktif"}
        </strong>
        . Buka pintu jarak jauh memerlukan persetujuan MFA dan tidak tersedia di build production.
      </div>

      <Card>
        <CardContent className="p-0">
          {devices.length === 0 ? (
            <EmptyState
              title="Belum ada perangkat"
              description="Daftarkan perangkat pintu untuk mulai menerima event."
              className="border-0"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Perangkat</TableHead>
                  <TableHead>Kamar</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Baterai</TableHead>
                  <TableHead>Terakhir terlihat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => {
                  const health = deviceHealthConfig[device.healthStatus] ?? {
                    label: device.healthStatus,
                    tone: "neutral" as const,
                  };
                  return (
                    <TableRow key={device.id}>
                      <TableCell>
                        <p className="font-semibold text-theta-navy">{device.vendorDeviceId}</p>
                        <p className="text-[13px] text-text-muted">
                          {device.vendor} {device.model} · {device.kind}
                        </p>
                      </TableCell>
                      <TableCell className="tabular-nums text-text-muted">
                        {device.room?.number ?? "-"}
                      </TableCell>
                      <TableCell className="text-text-muted">{device.gatewayId ?? "-"}</TableCell>
                      <TableCell>
                        <StatusBadge label={health.label} tone={health.tone} />
                      </TableCell>
                      <TableCell className="tabular-nums text-text-muted">
                        {device.batteryPct != null ? `${device.batteryPct}%` : "-"}
                      </TableCell>
                      <TableCell className="text-text-muted">
                        {device.lastSeenAt ? formatRelativeTime(device.lastSeenAt) : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

