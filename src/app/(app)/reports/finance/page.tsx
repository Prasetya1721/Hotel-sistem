import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import ReportNavTabs from "@/components/shared/ReportNavTabs";
import FinanceReportClient, { type SerializedFolioReport } from "@/app/(app)/reports/finance/FinanceReportClient";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/roles";

export const metadata = { title: "Laporan Keuangan" };

export default async function FinanceReportsPage() {
  const user = await requireUser();

  if (!PERMISSIONS.reportsView.includes(user.role as never)) {
    return (
      <>
        <PageHeader title="Laporan Keuangan" description="Omzet, penerimaan pembayaran, dan buku besar folio." />
        <EmptyState
          title="Akses terbatas"
          description="Hanya Pemilik, General Manager, Keuangan, dan Auditor yang dapat melihat laporan keuangan."
        />
      </>
    );
  }

  const [property, folios] = await Promise.all([
    prisma.property.findUnique({
      where: { id: user.propertyId },
      select: { name: true },
    }),
    prisma.folio.findMany({
      where: { reservation: { propertyId: user.propertyId } },
      orderBy: { createdAt: "desc" },
      include: {
        reservation: {
          include: {
            guest: { select: { name: true, phone: true } },
            room: {
              select: {
                number: true,
                roomType: { select: { name: true } },
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            method: true,
            amount: true,
            reference: true,
            processedAt: true,
          },
          orderBy: { processedAt: "desc" },
        },
      },
      take: 200,
    }),
  ]);

  const serializedFolios: SerializedFolioReport[] = folios.map((f) => ({
    id: f.id,
    reservationId: f.reservationId,
    bookingCode: f.reservation.bookingCode,
    guestName: f.reservation.guest.name,
    guestPhone: f.reservation.guest.phone,
    roomNumber: f.reservation.room?.number ?? null,
    roomTypeName: f.reservation.room?.roomType?.name ?? null,
    total: f.total,
    paid: f.paid,
    status: f.status,
    createdAt: f.createdAt.toISOString(),
    payments: f.payments.map((p) => ({
      id: p.id,
      method: p.method,
      amount: p.amount,
      reference: p.reference,
      processedAt: p.processedAt.toISOString(),
    })),
  }));

  return (
    <>
      <PageHeader
        title="Laporan Keuangan &amp; Kas"
        description="Analisis omzet tagihan, realisasi kas per metode bayar, dan pemantauan piutang hotel."
      />

      <ReportNavTabs canViewFinance={true} canViewGuests={true} />

      <FinanceReportClient
        folios={serializedFolios}
        propertyName={property?.name ?? "HotelOps Guard"}
      />
    </>
  );
}
