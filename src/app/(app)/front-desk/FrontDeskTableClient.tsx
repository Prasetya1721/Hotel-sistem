"use client";

import * as React from "react";
import { Search, LogIn, LogOut, Clock } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { reservationStatusConfig } from "@/lib/design";
import { formatCurrencyIDR, formatShortDate } from "@/lib/formatters";
import ReservationRowActions from "@/app/(app)/front-desk/ReservationRowActions";

export interface ReservationItem {
  id: string;
  bookingCode: string;
  source: string;
  status: string;
  checkInAt: string;
  checkOutAt: string;
  rateApplied: number;
  notes?: string | null;
  guest: {
    id: string;
    name: string;
    phone?: string | null;
    preferred?: string | null;
  };
  room?: {
    id: string;
    number: string;
    floor: number;
  } | null;
  folio?: {
    id: string;
    total: number;
    paid: number;
    status: string;
  } | null;
}

export default function FrontDeskTableClient({
  reservations,
}: {
  reservations: ReservationItem[];
}) {
  const [tab, setTab] = React.useState<"semua" | "tiba" | "in_house" | "pulang" | "selesai">("semua");
  const [search, setSearch] = React.useState("");

  const today = new Date();
  const todayDateStr = today.toISOString().split("T")[0];

  // Hitung jumlah masing-masing kategori
  const arrivalsCount = reservations.filter((r) => {
    const isToday = r.checkInAt.startsWith(todayDateStr);
    return isToday && ["CONFIRMED", "PENDING", "HOLD"].includes(r.status);
  }).length;

  const inHouseCount = reservations.filter((r) => r.status === "CHECKED_IN").length;

  const departuresCount = reservations.filter((r) => {
    const isToday = r.checkOutAt.startsWith(todayDateStr);
    return isToday && r.status === "CHECKED_IN";
  }).length;

  // Filter berdasarkan Tab dan Search Keyword
  const filtered = reservations.filter((item) => {
    // 1. Filter Tab
    if (tab === "tiba") {
      const isToday = item.checkInAt.startsWith(todayDateStr);
      if (!(isToday && ["CONFIRMED", "PENDING", "HOLD"].includes(item.status))) return false;
    } else if (tab === "in_house") {
      if (item.status !== "CHECKED_IN") return false;
    } else if (tab === "pulang") {
      const isToday = item.checkOutAt.startsWith(todayDateStr);
      if (!(isToday && item.status === "CHECKED_IN")) return false;
    } else if (tab === "selesai") {
      if (!["CHECKED_OUT", "CANCELLED"].includes(item.status)) return false;
    }

    // 2. Filter Search
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const matchName = item.guest.name.toLowerCase().includes(q);
    const matchCode = item.bookingCode.toLowerCase().includes(q);
    const matchRoom = item.room?.number?.toLowerCase().includes(q);
    const matchPhone = item.guest.phone?.toLowerCase().includes(q);

    return matchName || matchCode || matchRoom || matchPhone;
  });

  return (
    <div className="space-y-4">
      {/* Baris Filter Tab & Kolom Pencarian */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tab Filter */}
        <div className="flex flex-wrap items-center gap-1 rounded-[12px] border border-border bg-surface p-1 text-xs">
          <button
            type="button"
            onClick={() => setTab("semua")}
            className={`rounded-[8px] px-3 py-1.5 font-medium transition-all ${
              tab === "semua"
                ? "bg-theta-navy text-white shadow-sm"
                : "text-text-muted hover:text-text"
            }`}
          >
            Semua ({reservations.length})
          </button>

          <button
            type="button"
            onClick={() => setTab("tiba")}
            className={`flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 font-medium transition-all ${
              tab === "tiba"
                ? "bg-theta-navy text-white shadow-sm"
                : "text-text-muted hover:text-text"
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-warning" />
            Tiba Hari Ini
            {arrivalsCount > 0 && (
              <span className="rounded-full bg-warning/20 px-1.5 text-[10px] font-bold text-warning-strong">
                {arrivalsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab("in_house")}
            className={`flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 font-medium transition-all ${
              tab === "in_house"
                ? "bg-teal-700 text-white shadow-sm"
                : "text-text-muted hover:text-text"
            }`}
          >
            <LogIn className="h-3.5 w-3.5 text-teal-400" />
            Menginap (In-House)
            {inHouseCount > 0 && (
              <span className="rounded-full bg-teal-500/20 px-1.5 text-[10px] font-bold text-teal-700">
                {inHouseCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab("pulang")}
            className={`flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 font-medium transition-all ${
              tab === "pulang"
                ? "bg-danger text-white shadow-sm"
                : "text-text-muted hover:text-text"
            }`}
          >
            <LogOut className="h-3.5 w-3.5 text-danger" />
            Pulang Hari Ini
            {departuresCount > 0 && (
              <span className="rounded-full bg-danger/20 px-1.5 text-[10px] font-bold text-danger">
                {departuresCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab("selesai")}
            className={`rounded-[8px] px-3 py-1.5 font-medium transition-all ${
              tab === "selesai"
                ? "bg-theta-navy text-white shadow-sm"
                : "text-text-muted hover:text-text"
            }`}
          >
            Riwayat Selesai
          </button>
        </div>

        {/* Input Search Real-Time */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Cari nama, kamar, kode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Tabel Reservasi & Operasional */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              title={search ? "Tidak ditemukan hasil pencarian" : "Belum ada reservasi pada kategori ini"}
              description={search ? `Tidak ada data yang cocok dengan "${search}".` : "Gunakan tombol '+ Reservasi / Walk-In' untuk membuat pemesanan."}
              className="border-0 py-10"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode &amp; Sumber</TableHead>
                  <TableHead>Tamu</TableHead>
                  <TableHead>Kamar</TableHead>
                  <TableHead>Periode Menginap</TableHead>
                  <TableHead>Tarif / Malam</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi Cepat Resepsionis</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((res) => {
                  const st = reservationStatusConfig[res.status] ?? {
                    label: res.status,
                    tone: "neutral" as const,
                  };

                  const checkIn = new Date(res.checkInAt);
                  const checkOut = new Date(res.checkOutAt);
                  const diffNights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

                  return (
                    <TableRow key={res.id}>
                      {/* Kode Booking */}
                      <TableCell>
                        <p className="font-mono text-xs font-semibold text-theta-navy">{res.bookingCode}</p>
                        <span className="inline-block mt-0.5 rounded-[5px] bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
                          {res.source}
                        </span>
                      </TableCell>

                      {/* Info Tamu */}
                      <TableCell>
                        <p className="font-semibold text-theta-navy">{res.guest.name}</p>
                        <p className="text-xs text-text-muted">{res.guest.phone ?? "-"}</p>
                        {res.guest.preferred && (
                          <p className="mt-0.5 truncate text-[11px] text-teal-800 font-medium max-w-xs">
                            ★ {res.guest.preferred}
                          </p>
                        )}
                      </TableCell>

                      {/* Nomor Kamar */}
                      <TableCell>
                        {res.room ? (
                          <span className="font-mono text-sm font-bold text-theta-navy">
                            Kamar {res.room.number}
                          </span>
                        ) : (
                          <span className="text-xs italic text-text-muted">Belum ditentukan</span>
                        )}
                      </TableCell>

                      {/* Tanggal Menginap */}
                      <TableCell>
                        <div className="text-xs">
                          <p className="font-medium text-text">
                            {formatShortDate(checkIn)} &rarr; {formatShortDate(checkOut)}
                          </p>
                          <p className="text-text-muted text-[11px]">{diffNights} malam</p>
                        </div>
                      </TableCell>

                      {/* Tarif */}
                      <TableCell className="tabular-nums text-xs font-medium">
                        {formatCurrencyIDR(res.rateApplied)}
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell>
                        <StatusBadge label={st.label} tone={st.tone} />
                      </TableCell>

                      {/* Aksi Resepsionis */}
                      <TableCell className="text-right">
                        <ReservationRowActions
                          reservation={{
                            id: res.id,
                            bookingCode: res.bookingCode,
                            status: res.status,
                            guestName: res.guest.name,
                            roomNumber: res.room?.number ?? null,
                            rateApplied: res.rateApplied,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
