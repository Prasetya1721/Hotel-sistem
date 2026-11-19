import Link from "next/link";
import { FileText } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import AddGuestDialog from "@/app/(app)/guests/AddGuestDialog";
import { Button } from "@/components/ui/button";
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
        action={
          <div className="flex items-center gap-2">
            <Link href="/reports/guests">
              <Button variant="outline" className="gap-2 font-semibold">
                <FileText className="h-4 w-4" />
                Laporan Tamu
              </Button>
            </Link>
            <AddGuestDialog />
          </div>
        }
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
