import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { CreateTaskDialog, TaskRowActions } from "@/app/(app)/housekeeping/HousekeepingActions";
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
import { housekeepingConfig, priorityConfig, taskStatusConfig, taskTypeConfig } from "@/lib/design";
import { formatRelativeTime } from "@/lib/formatters";

export const metadata = { title: "Housekeeping" };

export default async function HousekeepingPage() {
  const user = await requireUser();
  const [tasks, dirtyRooms, inProgress, doneToday, rooms] = await Promise.all([
    prisma.housekeepingTask.findMany({
      where: { propertyId: user.propertyId },
      orderBy: [{ status: "asc" }, { targetAt: "asc" }],
      include: {
        room: { select: { number: true, floor: true, housekeepingStatus: true } },
        assigned: { select: { name: true } },
      },
      take: 50,
    }),
    prisma.room.count({
      where: { propertyId: user.propertyId, housekeepingStatus: { in: ["DIRTY", "CLEANING"] } },
    }),
    prisma.housekeepingTask.count({
      where: { propertyId: user.propertyId, status: "IN_PROGRESS" },
    }),
    prisma.housekeepingTask.count({
      where: {
        propertyId: user.propertyId,
        status: { in: ["DONE", "INSPECTED"] },
        completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.room.findMany({
      where: { propertyId: user.propertyId, isActive: true },
      select: { id: true, number: true, housekeepingStatus: true },
      orderBy: [{ floor: "asc" }, { number: "asc" }],
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Housekeeping"
        description="Daftar tugas pembersihan per kamar beserta prioritas dan penanggung jawab."
        action={<CreateTaskDialog rooms={rooms} />}
      />

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Kamar kotor / dibersihkan" value={String(dirtyRooms)} />
        <StatCard label="Sedang dikerjakan" value={String(inProgress)} />
        <StatCard label="Selesai hari ini" value={String(doneToday)} />
      </section>

      <Card>
        <CardContent className="p-0">
          {tasks.length === 0 ? (
            <EmptyState
              title="Tidak ada tugas aktif"
              description="Semua kamar dalam kondisi bersih."
              className="border-0"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kamar</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Prioritas</TableHead>
                  <TableHead>Status tugas</TableHead>
                  <TableHead>Status kamar</TableHead>
                  <TableHead>Petugas</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                  const st = taskStatusConfig[task.status] ?? {
                    label: task.status,
                    tone: "neutral" as const,
                  };
                  const hk = housekeepingConfig[task.room.housekeepingStatus] ?? {
                    label: task.room.housekeepingStatus,
                    tone: "neutral" as const,
                  };
                  return (
                    <TableRow key={task.id}>
                      <TableCell className="font-semibold tabular-nums">{task.room.number}</TableCell>
                      <TableCell className="text-text-muted">
                        {taskTypeConfig[task.type] ?? task.type}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={priorityConfig[task.priority]?.label ?? task.priority}
                          tone={priorityConfig[task.priority]?.tone ?? "neutral"}
                        />
                      </TableCell>
                      <TableCell>
                        <StatusBadge label={st.label} tone={st.tone} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge label={hk.label} tone={hk.tone} />
                      </TableCell>
                      <TableCell className="text-text-muted">{task.assigned?.name ?? "Belum ditugaskan"}</TableCell>
                      <TableCell className="text-text-muted">
                        {task.targetAt ? formatRelativeTime(task.targetAt) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <TaskRowActions taskId={task.id} currentStatus={task.status} />
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
