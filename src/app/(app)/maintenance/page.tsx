import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { CreateTicketDialog, TicketRowActions } from "@/app/(app)/maintenance/MaintenanceActions";
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
import { priorityConfig, ticketStatusConfig } from "@/lib/design";
import { formatRelativeTime } from "@/lib/formatters";

export const metadata = { title: "Maintenance" };

export default async function MaintenancePage() {
  const user = await requireUser();
  const [tickets, openCount, inProgressCount, doneCount, rooms] = await Promise.all([
    prisma.maintenanceTicket.findMany({
      where: { propertyId: user.propertyId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        room: { select: { number: true } },
        assignee: { select: { name: true } },
      },
      take: 50,
    }),
    prisma.maintenanceTicket.count({ where: { propertyId: user.propertyId, status: "OPEN" } }),
    prisma.maintenanceTicket.count({
      where: { propertyId: user.propertyId, status: { in: ["ASSIGNED", "IN_PROGRESS", "PENDING_PART"] } },
    }),
    prisma.maintenanceTicket.count({
      where: { propertyId: user.propertyId, status: { in: ["DONE", "CLOSED"] } },
    }),
    prisma.room.findMany({
      where: { propertyId: user.propertyId, isActive: true },
      select: { id: true, number: true },
      orderBy: [{ floor: "asc" }, { number: "asc" }],
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Maintenance"
        description="Tiket perbaikan kamar dan fasilitas. Kamar dalam perbaikan tidak dijual."
        action={<CreateTicketDialog rooms={rooms} />}
      />

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Tiket terbuka" value={String(openCount)} tone={openCount > 0 ? "warning" : "default"} />
        <StatCard label="Sedang dikerjakan" value={String(inProgressCount)} />
        <StatCard label="Selesai" value={String(doneCount)} />
      </section>

      <Card>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <EmptyState title="Tidak ada tiket" description="Belum ada laporan kerusakan." className="border-0" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Kamar</TableHead>
                  <TableHead>Prioritas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Teknisi</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => {
                  const st = ticketStatusConfig[ticket.status] ?? {
                    label: ticket.status,
                    tone: "neutral" as const,
                  };
                  return (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <p className="font-semibold text-theta-navy">{ticket.title}</p>
                        <p className="line-clamp-1 text-[13px] text-text-muted">{ticket.description}</p>
                      </TableCell>
                      <TableCell className="tabular-nums text-text-muted">
                        {ticket.room?.number ?? "Area umum"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={priorityConfig[ticket.priority]?.label ?? ticket.priority}
                          tone={priorityConfig[ticket.priority]?.tone ?? "neutral"}
                        />
                      </TableCell>
                      <TableCell>
                        <StatusBadge label={st.label} tone={st.tone} />
                      </TableCell>
                      <TableCell className="text-text-muted">{ticket.assignee?.name ?? "-"}</TableCell>
                      <TableCell className="text-text-muted">{formatRelativeTime(ticket.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <TicketRowActions ticketId={ticket.id} currentStatus={ticket.status} />
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
