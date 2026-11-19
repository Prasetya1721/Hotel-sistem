import { prisma } from "@/lib/db";

export async function getDashboardData(propertyId: string) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const [
    totalRooms,
    occupied,
    dirty,
    outOfOrder,
    arrivals,
    departures,
    openIncidents,
    highIncidents,
    pendingTasks,
    openTickets,
    recentEvents,
    recentIncidents,
  ] = await Promise.all([
    prisma.room.count({ where: { propertyId, isActive: true } }),
    prisma.room.count({ where: { propertyId, occupancyStatus: "OCCUPIED" } }),
    prisma.room.count({ where: { propertyId, housekeepingStatus: { in: ["DIRTY", "CLEANING"] } } }),
    prisma.room.count({ where: { propertyId, serviceStatus: "OUT_OF_ORDER" } }),
    prisma.reservation.count({
      where: {
        propertyId,
        status: { in: ["CONFIRMED", "PENDING", "HOLD"] },
        checkInAt: { gte: startOfDay, lt: endOfDay },
      },
    }),
    prisma.reservation.count({
      where: {
        propertyId,
        status: "CHECKED_IN",
        checkOutAt: { gte: startOfDay, lt: endOfDay },
      },
    }),
    prisma.incident.count({
      where: { propertyId, status: { in: ["NEW", "ACKNOWLEDGED", "INVESTIGATING", "REOPENED"] } },
    }),
    prisma.incident.count({
      where: {
        propertyId,
        severity: { in: ["HIGH", "CRITICAL"] },
        status: { in: ["NEW", "ACKNOWLEDGED", "INVESTIGATING", "REOPENED"] },
      },
    }),
    prisma.housekeepingTask.count({
      where: { propertyId, status: { in: ["PENDING", "IN_PROGRESS"] } },
    }),
    prisma.maintenanceTicket.count({
      where: { propertyId, status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS", "PENDING_PART"] } },
    }),
    prisma.doorEvent.findMany({
      where: { propertyId },
      orderBy: { occurredAt: "desc" },
      take: 8,
      include: { room: { select: { number: true } } },
    }),
    prisma.incident.findMany({
      where: { propertyId, status: { in: ["NEW", "ACKNOWLEDGED", "INVESTIGATING", "REOPENED"] } },
      orderBy: [{ severity: "desc" }, { openedAt: "desc" }],
      take: 5,
      include: { room: { select: { number: true } } },
    }),
  ]);

  return {
    occupancy: {
      totalRooms,
      occupied,
      available: totalRooms - occupied,
      rate: totalRooms ? Math.round((occupied / totalRooms) * 100) : 0,
    },
    housekeeping: { dirty, pendingTasks },
    maintenance: { outOfOrder, openTickets },
    frontDesk: { arrivals, departures },
    security: { openIncidents, highIncidents },
    recentEvents,
    recentIncidents,
  };
}
