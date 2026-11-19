import PageHeader from "@/components/shared/PageHeader";
import StatCard from "@/components/shared/StatCard";
import CreateReservationDialog from "@/app/(app)/front-desk/CreateReservationDialog";
import FrontDeskTableClient, { type ReservationItem } from "@/app/(app)/front-desk/FrontDeskTableClient";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export const metadata = { title: "Front Desk & Reservasi" };

export default async function FrontDeskPage() {
  const user = await requireUser();
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const [rawReservations, inHouse, arrivals, departures, guests, rooms] = await Promise.all([
    prisma.reservation.findMany({
      where: { propertyId: user.propertyId },
      orderBy: { checkInAt: "desc" },
      include: {
        guest: { select: { id: true, name: true, phone: true, preferred: true } },
        room: { select: { id: true, number: true, floor: true } },
        folio: { select: { id: true, total: true, paid: true, status: true }, take: 1 },
      },
      take: 100,
    }),
    prisma.reservation.count({ where: { propertyId: user.propertyId, status: "CHECKED_IN" } }),
    prisma.reservation.count({
      where: {
        propertyId: user.propertyId,
        status: { in: ["CONFIRMED", "PENDING", "HOLD"] },
        checkInAt: { gte: startOfDay, lt: endOfDay },
      },
    }),
    prisma.reservation.count({
      where: {
        propertyId: user.propertyId,
        status: "CHECKED_IN",
        checkOutAt: { gte: startOfDay, lt: endOfDay },
      },
    }),
    prisma.guest.findMany({
      where: { propertyId: user.propertyId },
      select: { id: true, name: true, phone: true },
      orderBy: { name: "asc" },
    }),
    prisma.room.findMany({
      where: { propertyId: user.propertyId, isActive: true },
      select: {
        id: true,
        number: true,
        floor: true,
        occupancyStatus: true,
        housekeepingStatus: true,
        serviceStatus: true,
        roomType: { select: { name: true, baseRate: true } },
      },
      orderBy: [{ floor: "asc" }, { number: "asc" }],
    }),
  ]);

  // Serialize date to string for Client Component
  const reservations: ReservationItem[] = rawReservations.map((r) => ({
    id: r.id,
    bookingCode: r.bookingCode,
    source: r.source,
    status: r.status,
    checkInAt: r.checkInAt.toISOString(),
    checkOutAt: r.checkOutAt.toISOString(),
    rateApplied: r.rateApplied,
    notes: r.notes,
    guest: r.guest,
    room: r.room,
    folio: r.folio[0] ?? null,
  }));

  return (
    <>
      <PageHeader
        title="Front Desk"
        description="Pusat kerja harian resepsionis: pendaftaran tamu walk-in instan, jadwal tiba/pulang, dan check-in/out tanpa berpindah menu."
        action={<CreateReservationDialog guests={guests} rooms={rooms} />}
      />

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Tamu Menginap (In-House)"
          value={String(inHouse)}
          hint="Kamar aktif berstatus OCCUPIED"
        />
        <StatCard
          label="Kedatangan Hari Ini"
          value={String(arrivals)}
          hint="Menunggu proses check-in"
          tone={arrivals > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Keberangkatan Hari Ini"
          value={String(departures)}
          hint="Jadwal penyelesaian check-out"
          tone={departures > 0 ? "danger" : "default"}
        />
      </section>

      <FrontDeskTableClient reservations={reservations} />
    </>
  );
}
