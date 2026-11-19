import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";

export const metadata = { title: "Kalender Ketersediaan" };

const DAYS = 14;
const WEEKDAY = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default async function AvailabilityPage() {
  const user = await requireUser();
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start.getTime() + DAYS * 24 * 60 * 60 * 1000);

  const [rooms, reservations] = await Promise.all([
    prisma.room.findMany({
      where: { propertyId: user.propertyId, isActive: true },
      orderBy: [{ floor: "asc" }, { number: "asc" }],
      select: { id: true, number: true },
    }),
    prisma.reservation.findMany({
      where: {
        propertyId: user.propertyId,
        status: { in: ["CONFIRMED", "CHECKED_IN", "PENDING", "HOLD"] },
        checkInAt: { lt: end },
        checkOutAt: { gt: start },
      },
      select: { roomId: true, checkInAt: true, checkOutAt: true, bookingCode: true, status: true },
    }),
  ]);

  const days = Array.from({ length: DAYS }, (_, i) => new Date(start.getTime() + i * 24 * 60 * 60 * 1000));

  function cellState(roomId: string, day: Date) {
    const dayEnd = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    const hit = reservations.find(
      (r) => r.roomId === roomId && r.checkInAt < dayEnd && r.checkOutAt > day,
    );
    return hit?.status ?? null;
  }

  return (
    <>
      <PageHeader
        title="Kalender Ketersediaan"
        description={`Peta hunian ${DAYS} hari ke depan per kamar.`}
      />
      <Card>
        <CardContent className="overflow-x-auto p-4">
          <table className="w-full border-separate border-spacing-y-1 text-[13px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-surface px-2 py-1.5 text-left text-[12px] font-semibold uppercase tracking-wide text-text-muted">
                  Kamar
                </th>
                {days.map((day) => {
                  const weekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <th
                      key={day.toISOString()}
                      className={cn(
                        "px-1 py-1.5 text-center text-[12px] font-medium",
                        weekend ? "text-text-muted/70" : "text-text-muted",
                      )}
                    >
                      <span className="block text-[10px] uppercase">{WEEKDAY[day.getDay()]}</span>
                      <span className="block font-semibold tabular-nums text-text">
                        {day.getDate()}
                      </span>
                      <span className="block text-[10px]">{MONTH_SHORT[day.getMonth()]}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td className="sticky left-0 z-10 bg-surface px-2 py-1 font-semibold tabular-nums text-theta-navy">
                    {room.number}
                  </td>
                  {days.map((day) => {
                    const state = cellState(room.id, day);
                    return (
                      <td key={day.toISOString()} className="px-0.5 py-1">
                        <div
                          className={cn(
                            "h-7 rounded-[5px] ring-1 ring-inset",
                            state === "CHECKED_IN" && "bg-teal-700 ring-teal-800/30",
                            (state === "CONFIRMED" || state === "PENDING" || state === "HOLD") &&
                              "bg-info/25 ring-info/30",
                            !state && "bg-surface-muted ring-border",
                          )}
                          title={
                            state === "CHECKED_IN"
                              ? "Terisi"
                              : state
                                ? "Dipesan"
                                : "Kosong"
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex flex-wrap gap-4 text-[13px] text-text-muted">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-[3px] bg-teal-700" /> Terisi
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-[3px] bg-info/25 ring-1 ring-inset ring-info/30" /> Dipesan
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-[3px] bg-surface-muted ring-1 ring-inset ring-border" /> Kosong
            </span>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

