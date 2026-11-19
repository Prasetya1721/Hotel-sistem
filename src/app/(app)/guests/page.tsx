import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import AddGuestDialog from "@/app/(app)/guests/AddGuestDialog";
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
import { formatShortDate } from "@/lib/formatters";

export const metadata = { title: "Tamu" };

export default async function GuestsPage() {
  const user = await requireUser();
  const guests = await prisma.guest.findMany({
    where: { propertyId: user.propertyId },
    orderBy: { name: "asc" },
    include: { _count: { select: { reservations: true } } },
    take: 100,
  });

  return (
    <>
      <PageHeader
        title="Tamu"
        description="Data tamu tersimpan tanpa nomor identitas lengkap; hanya versi tersamar."
        action={<AddGuestDialog />}
      />
      <Card>
        <CardContent className="p-0">
          {guests.length === 0 ? (
            <EmptyState title="Belum ada tamu" description="Data tamu dibuat saat reservasi pertama." className="border-0" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Preferensi</TableHead>
                  <TableHead>Reservasi</TableHead>
                  <TableHead>Terdaftar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guests.map((guest) => (
                  <TableRow key={guest.id}>
                    <TableCell className="font-semibold text-theta-navy">{guest.name}</TableCell>
                    <TableCell className="text-text-muted">{guest.phone ?? "-"}</TableCell>
                    <TableCell className="text-text-muted">{guest.email ?? "-"}</TableCell>
                    <TableCell className="text-text-muted">{guest.preferred ?? "-"}</TableCell>
                    <TableCell className="tabular-nums">{guest._count.reservations}</TableCell>
                    <TableCell className="text-text-muted">{formatShortDate(guest.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
