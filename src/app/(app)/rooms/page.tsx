import PageHeader from "@/components/shared/PageHeader";
import RoomsGridClient, { type SerializedRoom } from "@/app/(app)/rooms/RoomsGridClient";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";

export const metadata = { title: "Kamar & Kategori" };

export default async function RoomsPage() {
  const user = await requireUser();
  const [rawRooms, roomTypes] = await Promise.all([
    prisma.room.findMany({
      where: { propertyId: user.propertyId, isActive: true },
      orderBy: [{ floor: "asc" }, { number: "asc" }],
      include: {
        roomType: true,
        reservations: {
          where: { status: "CHECKED_IN" },
          take: 1,
          include: { guest: { select: { name: true } } },
        },
      },
    }),
    prisma.roomType.findMany({
      where: { propertyId: user.propertyId },
      select: { id: true, name: true, baseRate: true },
      orderBy: { baseRate: "asc" },
    }),
  ]);

  const rooms: SerializedRoom[] = rawRooms.map((r) => ({
    id: r.id,
    number: r.number,
    floor: r.floor,
    occupancyStatus: r.occupancyStatus,
    housekeepingStatus: r.housekeepingStatus,
    serviceStatus: r.serviceStatus,
    roomType: r.roomType,
    guestName: r.reservations[0]?.guest.name ?? null,
  }));

  return (
    <>
      <PageHeader
        title="Kamar &amp; Tipe Kamar"
        description="Filter status kamar berdasarkan kategori kelas, ketersediaan hunian, dan kesiapan jual."
      />

      <RoomsGridClient rooms={rooms} roomTypes={roomTypes} />
    </>
  );
}
