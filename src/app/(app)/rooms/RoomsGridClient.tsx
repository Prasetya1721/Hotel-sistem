"use client";

import * as React from "react";
import { Filter, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import RoomQuickActions from "@/app/(app)/rooms/RoomQuickActions";
import { housekeepingConfig, occupancyConfig, serviceConfig } from "@/lib/design";
import { formatCurrencyIDR } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const occupancyTone: Record<string, string> = {
  VACANT: "border-l-theta-neutral",
  RESERVED: "border-l-info",
  OCCUPIED: "border-l-teal-700",
};

export interface SerializedRoom {
  id: string;
  number: string;
  floor: number;
  occupancyStatus: string;
  housekeepingStatus: string;
  serviceStatus: string;
  roomType: {
    id: string;
    name: string;
    code: string;
    baseRate: number;
  };
  guestName?: string | null;
}

export default function RoomsGridClient({
  rooms,
  roomTypes,
}: {
  rooms: SerializedRoom[];
  roomTypes: { id: string; name: string; baseRate: number }[];
}) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [hideOccupied, setHideOccupied] = React.useState<boolean>(false);
  const [search, setSearch] = React.useState<string>("");

  // Filter kamar berdasarkan Kategori, Status Terisi, dan Pencarian
  const filteredRooms = React.useMemo(() => {
    return rooms.filter((r) => {
      // 1. Filter Kategori / Kelas
      if (selectedCategory !== "ALL" && r.roomType.name !== selectedCategory) {
        return false;
      }

      // 2. Sembunyikan kamar terisi
      if (hideOccupied && r.occupancyStatus === "OCCUPIED") {
        return false;
      }

      // 3. Pencarian nomor kamar atau tipe
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNo = r.number.toLowerCase().includes(q);
        const matchType = r.roomType.name.toLowerCase().includes(q);
        const matchGuest = r.guestName?.toLowerCase().includes(q);
        if (!matchNo && !matchType && !matchGuest) return false;
      }

      return true;
    });
  }, [rooms, selectedCategory, hideOccupied, search]);

  // Kelompokkan kamar per lantai
  const byFloor = React.useMemo(() => {
    const map = new Map<number, SerializedRoom[]>();
    for (const room of filteredRooms) {
      map.set(room.floor, [...(map.get(room.floor) ?? []), room]);
    }
    return map;
  }, [filteredRooms]);

  const vacantCount = rooms.filter((r) => r.occupancyStatus !== "OCCUPIED").length;

  return (
    <div className="space-y-6">
      {/* Bar Filter & Kategori Kelas Kamar */}
      <div className="flex flex-col gap-3 rounded-[14px] border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Dropdown Kategori Kelas */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-teal-700" />
            <span className="text-xs font-semibold text-theta-navy">Kategori Kelas:</span>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 w-48 text-xs font-medium"
            >
              <option value="ALL">Semua Kelas ({rooms.length} Kamar)</option>
              {roomTypes.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name} (Rp {t.baseRate.toLocaleString("id-ID")})
                </option>
              ))}
            </Select>
          </div>

          {/* Toggle Sembunyikan Kamar Terisi */}
          <label className="flex items-center gap-2 rounded-[8px] bg-surface-muted px-3 py-1.5 text-xs font-medium cursor-pointer text-theta-navy hover:bg-surface-muted/80">
            <input
              type="checkbox"
              checked={hideOccupied}
              onChange={(e) => setHideOccupied(e.target.checked)}
              className="h-4 w-4 rounded border-border text-teal-700 focus:ring-teal-600"
            />
            <span>Sembunyikan kamar terisi ({vacantCount} kosong)</span>
          </label>
        </div>

        {/* Pencarian Cepat */}
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-text-muted" />
          <Input
            placeholder="Cari kamar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Grid Kamar per Lantai */}
      {filteredRooms.length === 0 ? (
        <EmptyState
          title="Tidak ada kamar yang cocok"
          description="Ubah filter kategori atau hilangkan centang 'Sembunyikan kamar terisi' untuk melihat seluruh kamar."
          className="py-12"
        />
      ) : (
        <div className="space-y-8">
          {[...byFloor.entries()]
            .sort(([a], [b]) => a - b)
            .map(([floor, floorRooms]) => (
              <section key={floor}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-text-muted">
                    Lantai {floor} · {floorRooms.length} kamar ditampilkan
                  </h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {floorRooms.map((room) => {
                    const occ = occupancyConfig[room.occupancyStatus] ?? {
                      label: room.occupancyStatus,
                      tone: "neutral" as const,
                    };
                    const hk = housekeepingConfig[room.housekeepingStatus] ?? {
                      label: room.housekeepingStatus,
                      tone: "neutral" as const,
                    };
                    const svc = serviceConfig[room.serviceStatus] ?? {
                      label: room.serviceStatus,
                      tone: "neutral" as const,
                    };

                    return (
                      <Card
                        key={room.id}
                        className={cn("border-l-4", occupancyTone[room.occupancyStatus] ?? "border-l-theta-neutral")}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-2xl font-bold leading-none tabular-nums text-theta-navy">
                                {room.number}
                              </p>
                              <p className="mt-1 truncate text-[13px] font-medium text-teal-800">
                                {room.roomType.name}
                              </p>
                              <p className="text-xs text-text-muted">
                                Lantai {room.floor}
                              </p>
                            </div>
                            <p className="shrink-0 text-right text-[13px] font-semibold tabular-nums text-text-muted">
                              {formatCurrencyIDR(room.roomType.baseRate)}
                              <span className="block text-[11px] font-normal">per malam</span>
                            </p>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-1.5">
                            <StatusBadge label={occ.label} tone={occ.tone} />
                            <StatusBadge label={hk.label} tone={hk.tone} />
                            {room.serviceStatus !== "AVAILABLE" && (
                              <StatusBadge label={svc.label} tone={svc.tone} />
                            )}
                          </div>

                          <p className="mt-2.5 truncate text-[13px] text-text">
                            {room.guestName ? (
                              <>
                                Tamu: <span className="font-semibold text-theta-navy">{room.guestName}</span>
                              </>
                            ) : (
                              <span className="text-text-muted">Kamar Kosong</span>
                            )}
                          </p>

                          <RoomQuickActions
                            roomId={room.id}
                            housekeepingStatus={room.housekeepingStatus}
                            serviceStatus={room.serviceStatus}
                          />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
