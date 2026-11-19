import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import ReportNavTabs from "@/components/shared/ReportNavTabs";
import GuestsReportClient, { type SerializedGuestReport } from "@/app/(app)/reports/guests/GuestsReportClient";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/roles";

export const metadata = { title: "Laporan Tamu" };

export default async function GuestsReportsPage() {
  const user = await requireUser();

  // Pemilik, GM, Resepsionis, Keuangan, dan Auditor dapat melihat laporan tamu
  const allowedRoles = ["OWNER", "GENERAL_MANAGER", "RECEPTIONIST", "FINANCE", "AUDITOR"];
  if (!allowedRoles.includes(user.role)) {
    return (
      <>
        <PageHeader title="Laporan Tamu" description="Analisis riwayat kunjungan dan demografi tamu." />
        <EmptyState
          title="Akses terbatas"
          description="Anda tidak memiliki izin untuk melihat laporan tamu."
        />
      </>
    );
  }

  const [property, rawGuests] = await Promise.all([
    prisma.property.findUnique({
      where: { id: user.propertyId },
      select: { name: true },
    }),
    prisma.guest.findMany({
      where: { propertyId: user.propertyId },
      orderBy: { name: "asc" },
      include: {
        reservations: {
          select: {
            id: true,
            status: true,
            checkInAt: true,
            checkOutAt: true,
            room: {
              select: {
                number: true,
                roomType: { select: { name: true } },
              },
            },
            folio: {
              select: {
                total: true,
                paid: true,
                status: true,
              },
            },
          },
          orderBy: { checkInAt: "desc" },
        },
      },
      take: 200,
    }),
  ]);

  const now = new Date();

  const serializedGuests: SerializedGuestReport[] = rawGuests.map((g) => {
    let totalNights = 0;
    let totalSpent = 0;
    let stayCount = 0;
    let currentStatus: "IN_HOUSE" | "UPCOMING" | "CHECKED_OUT" | "NONE" = "NONE";
    let currentRoomNumber: string | null = null;
    let currentRoomType: string | null = null;
    let lastStayDate: string | null = null;

    for (const res of g.reservations) {
      // Hitung malam
      const inDate = new Date(res.checkInAt);
      const outDate = new Date(res.checkOutAt);
      const nights = Math.max(1, Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)));
      totalNights += nights;

      // Hitung belanja folio
      for (const fol of res.folio) {
        totalSpent += fol.total;
      }

      if (["CHECKED_IN", "CHECKED_OUT", "CONFIRMED"].includes(res.status)) {
        stayCount += 1;
      }

      if (res.status === "CHECKED_IN" && currentStatus !== "IN_HOUSE") {
        currentStatus = "IN_HOUSE";
        currentRoomNumber = res.room?.number ?? null;
        currentRoomType = res.room?.roomType?.name ?? null;
      } else if (res.status === "CONFIRMED" && inDate >= now && currentStatus === "NONE") {
        currentStatus = "UPCOMING";
      } else if (res.status === "CHECKED_OUT" && currentStatus === "NONE") {
        currentStatus = "CHECKED_OUT";
      }

      if (!lastStayDate) {
        lastStayDate = res.checkInAt.toISOString();
      }
    }

    return {
      id: g.id,
      name: g.name,
      phone: g.phone,
      email: g.email,
      preferred: g.preferred,
      createdAt: g.createdAt.toISOString(),
      stayCount: Math.max(stayCount, g.reservations.length),
      totalNights,
      totalSpent,
      currentStatus,
      currentRoomNumber,
      currentRoomType,
      lastStayDate,
    };
  });

  return (
    <>
      <PageHeader
        title="Laporan Data &amp; Aktivitas Tamu"
        description="Analisis riwayat menginap tamu, identifikasi tamu setia (VIP), dan pemantauan tamu in-house."
      />

      <ReportNavTabs canViewFinance={true} canViewGuests={true} />

      <GuestsReportClient
        guests={serializedGuests}
        propertyName={property?.name ?? "HotelOps Guard"}
      />
    </>
  );
}
