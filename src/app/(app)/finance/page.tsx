import Link from "next/link";
import { FileText } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import PaymentDialog from "@/app/(app)/finance/PaymentDialog";
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
import { formatCurrencyIDR, formatShortDate } from "@/lib/formatters";

export const metadata = { title: "Keuangan" };

export default async function FinancePage() {
  const user = await requireUser();
  const folios = await prisma.folio.findMany({
    where: { reservation: { propertyId: user.propertyId } },
    orderBy: { createdAt: "desc" },
    include: {
      reservation: {
        include: {
          guest: { select: { name: true } },
          room: { select: { number: true } },
        },
      },
    },
    take: 50,
  });

  const totals = folios.reduce(
    (acc, folio) => {
      acc.billed += folio.total;
      acc.paid += folio.paid;
      acc.outstanding += Math.max(folio.total - folio.paid, 0);
      return acc;
    },
    { billed: 0, paid: 0, outstanding: 0 },
  );

  return (
    <>
      <PageHeader
        title="Keuangan"
        description="Ringkasan tagihan folio, rincian pembayaran, dan penerimaan transaksi hotel."
        action={
          <Link href="/reports/finance">
            <Button variant="outline" className="gap-2 font-semibold">
              <FileText className="h-4 w-4" />
              Laporan Keuangan Lengkap
            </Button>
          </Link>
        }
      />

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total tagihan" value={formatCurrencyIDR(totals.billed)} />
        <StatCard label="Sudah dibayar" value={formatCurrencyIDR(totals.paid)} />
        <StatCard
          label="Belum dibayar"
          value={formatCurrencyIDR(totals.outstanding)}
          tone={totals.outstanding > 0 ? "warning" : "default"}
        />
      </section>

      <Card>
        <CardContent className="p-0">
          {folios.length === 0 ? (
            <EmptyState title="Belum ada folio" description="Folio dibuat saat tamu check-in." className="border-0" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tamu</TableHead>
                  <TableHead>Kamar</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Dibayar</TableHead>
                  <TableHead>Sisa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {folios.map((folio) => {
                  const remaining = Math.max(folio.total - folio.paid, 0);
                  return (
                    <TableRow key={folio.id}>
                      <TableCell className="font-semibold text-theta-navy">
                        {folio.reservation.guest.name}
                      </TableCell>
                      <TableCell className="tabular-nums text-text-muted">
                        {folio.reservation.room?.number ?? "-"}
                      </TableCell>
                      <TableCell className="tabular-nums">{formatCurrencyIDR(folio.total)}</TableCell>
                      <TableCell className="tabular-nums">{formatCurrencyIDR(folio.paid)}</TableCell>
                      <TableCell className="tabular-nums font-medium text-theta-navy">
                        {formatCurrencyIDR(remaining)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={folio.status === "OPEN" ? "Terbuka" : folio.status === "SETTLED" ? "Lunas" : folio.status}
                          tone={folio.status === "SETTLED" ? "success" : remaining > 0 ? "warning" : "neutral"}
                        />
                      </TableCell>
                      <TableCell className="text-text-muted">{formatShortDate(folio.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {remaining > 0 ? (
                          <PaymentDialog
                            folio={{
                              id: folio.id,
                              guestName: folio.reservation.guest.name,
                              roomNumber: folio.reservation.room?.number ?? null,
                              total: folio.total,
                              paid: folio.paid,
                              outstanding: remaining,
                            }}
                          />
                        ) : (
                          <span className="text-xs text-success font-medium">Lunas</span>
                        )}
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
