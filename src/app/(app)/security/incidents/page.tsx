import Link from "next/link";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
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
import { incidentSeverityConfig, incidentStatusConfig } from "@/lib/design";
import { formatLocalDateTime } from "@/lib/formatters";

export const metadata = { title: "Insiden" };

export default async function IncidentsPage() {
  const user = await requireUser();
  const [incidents, openCount, highCount, resolvedCount] = await Promise.all([
    prisma.incident.findMany({
      where: { propertyId: user.propertyId },
      orderBy: [{ status: "asc" }, { openedAt: "desc" }],
      include: {
        room: { select: { number: true } },
        assigned: { select: { name: true } },
      },
      take: 60,
    }),
    prisma.incident.count({
      where: { propertyId: user.propertyId, status: { in: ["NEW", "ACKNOWLEDGED", "INVESTIGATING", "REOPENED"] } },
    }),
    prisma.incident.count({
      where: {
        propertyId: user.propertyId,
        severity: { in: ["HIGH", "CRITICAL"] },
        status: { in: ["NEW", "ACKNOWLEDGED", "INVESTIGATING", "REOPENED"] },
      },
    }),
    prisma.incident.count({
      where: { propertyId: user.propertyId, status: { in: ["RESOLVED", "CLOSED", "FALSE_POSITIVE"] } },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Insiden Keamanan"
        description="Setiap insiden menyimpan jejak event pemicu dan riwayat perubahan status."
      />

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Terbuka" value={String(openCount)} tone={openCount > 0 ? "warning" : "default"} />
        <StatCard label="Prioritas tinggi" value={String(highCount)} tone={highCount > 0 ? "danger" : "default"} />
        <StatCard label="Sudah ditutup" value={String(resolvedCount)} />
      </section>

      <Card>
        <CardContent className="p-0">
          {incidents.length === 0 ? (
            <EmptyState
              title="Tidak ada insiden"
              description="Belum ada sinyal keamanan yang perlu ditinjau."
              className="border-0"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dibuka</TableHead>
                  <TableHead>Kamar</TableHead>
                  <TableHead>Pemicu</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ditangani</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident) => {
                  const sev = incidentSeverityConfig[incident.severity] ?? {
                    label: incident.severity,
                    tone: "neutral" as const,
                  };
                  const st = incidentStatusConfig[incident.status] ?? {
                    label: incident.status,
                    tone: "neutral" as const,
                  };
                  return (
                    <TableRow key={incident.id}>
                      <TableCell className="whitespace-nowrap text-[13px] text-text-muted">
                        {formatLocalDateTime(incident.openedAt)}
                      </TableCell>
                      <TableCell className="font-semibold tabular-nums">{incident.room.number}</TableCell>
                      <TableCell className="text-text-muted">{incident.ruleLabel ?? "-"}</TableCell>
                      <TableCell>
                        <StatusBadge label={sev.label} tone={sev.tone} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge label={st.label} tone={st.tone} />
                      </TableCell>
                      <TableCell className="text-text-muted">{incident.assigned?.name ?? "-"}</TableCell>
                      <TableCell>
                        <Link
                          href={`/security/incidents/${incident.id}`}
                          className="text-[13px] font-semibold text-teal-700 hover:underline"
                        >
                          Detail
                        </Link>
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

