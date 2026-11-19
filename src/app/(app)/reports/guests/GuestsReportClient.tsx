"use client";

import * as React from "react";
import {
  Printer,
  Search,
  Users,
  UserCheck,
  Award,
  CalendarCheck,
  Phone,
  Mail,
  BedDouble,
  HeartHandshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { formatCurrencyIDR, formatShortDate } from "@/lib/formatters";

export interface SerializedGuestReport {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  preferred?: string | null;
  createdAt: string;
  stayCount: number;
  totalNights: number;
  totalSpent: number;
  currentStatus: "IN_HOUSE" | "UPCOMING" | "CHECKED_OUT" | "NONE";
  currentRoomNumber?: string | null;
  currentRoomType?: string | null;
  lastStayDate?: string | null;
}

interface GuestsReportClientProps {
  guests: SerializedGuestReport[];
  propertyName: string;
}

export default function GuestsReportClient({
  guests,
  propertyName,
}: GuestsReportClientProps) {
  const [filterMode, setFilterMode] = React.useState<"ALL" | "IN_HOUSE" | "REPEAT" | "NEW">("ALL");
  const [search, setSearch] = React.useState<string>("");

  const filteredGuests = React.useMemo(() => {
    return guests.filter((g) => {
      // Filter Kategori
      if (filterMode === "IN_HOUSE" && g.currentStatus !== "IN_HOUSE") return false;
      if (filterMode === "REPEAT" && g.stayCount < 2) return false;
      if (filterMode === "NEW" && g.stayCount > 1) return false;

      // Filter Pencarian
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = g.name.toLowerCase().includes(q);
        const matchPhone = g.phone?.toLowerCase().includes(q);
        const matchEmail = g.email?.toLowerCase().includes(q);
        const matchPref = g.preferred?.toLowerCase().includes(q);
        const matchRoom = g.currentRoomNumber?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail && !matchPref && !matchRoom) return false;
      }

      return true;
    });
  }, [guests, filterMode, search]);

  // Statistik Ringkasan Tamu
  const summary = React.useMemo(() => {
    const totalGuests = guests.length;
    const inHouse = guests.filter((g) => g.currentStatus === "IN_HOUSE").length;
    const repeatGuests = guests.filter((g) => g.stayCount >= 2).length;
    const totalNights = guests.reduce((sum, g) => sum + g.totalNights, 0);
    const totalSpend = guests.reduce((sum, g) => sum + g.totalSpent, 0);

    return {
      totalGuests,
      inHouse,
      repeatGuests,
      totalNights,
      totalSpend,
    };
  }, [guests]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Aksi & Filter (Hidden saat Print) */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between print:hidden">
        {/* Tab Pilihan Segmentasi Tamu */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-surface-muted p-1 text-xs font-semibold">
          {[
            { id: "ALL", label: `Semua Tamu (${guests.length})` },
            { id: "IN_HOUSE", label: `Menginap / In-House (${summary.inHouse})` },
            { id: "REPEAT", label: `Tamu Setia / VIP (${summary.repeatGuests})` },
            { id: "NEW", label: "Tamu Baru (1x)" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterMode(tab.id as never)}
              className={`rounded-md px-3 py-1.5 transition-all ${
                filterMode === tab.id
                  ? "bg-white text-theta-navy shadow-sm font-bold"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Kolom Pencarian */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Cari nama, no HP, kamar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8.5 pl-8 text-xs"
            />
          </div>

          {/* Tombol Cetak / PDF */}
          <Button onClick={handlePrint} variant="outline" className="h-8.5 gap-2 text-xs font-semibold">
            <Printer className="h-4 w-4" />
            Cetak / PDF
          </Button>
        </div>
      </div>

      {/* Tampilan Header Khusus Cetak (Hanya tampil saat Print) */}
      <div className="hidden border-b-2 border-theta-navy pb-4 print:block">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-theta-navy">{propertyName}</h1>
            <p className="text-sm font-semibold text-teal-800">LAPORAN DATA &amp; AKTIVITAS TAMU HOTEL</p>
            <p className="text-xs text-text-muted">
              Kategori: {filterMode === "ALL" ? "Seluruh Database Tamu" : filterMode === "IN_HOUSE" ? "Tamu Sedang Menginap (In-House)" : filterMode === "REPEAT" ? "Tamu Setia / VIP (Kunjungan Berulang)" : "Tamu Baru"} | Dicetak pada: {new Date().toLocaleString("id-ID")}
            </p>
          </div>
          <div className="text-right text-xs">
            <p className="font-semibold text-theta-navy">Dokumen Front Office</p>
            <p className="text-text-muted">Total Tamu: {filteredGuests.length}</p>
          </div>
        </div>
      </div>

      {/* KPI Cards Ringkasan Tamu */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-l-4 border-l-teal-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Tamu Terdaftar</span>
              <Users className="h-4 w-4 text-teal-700" />
            </div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-theta-navy">
              {summary.totalGuests}
            </div>
            <p className="mt-1 text-[11px] text-text-muted">Database profil tamu tersimpan</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Sedang Menginap (In-House)</span>
              <UserCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-emerald-700">
              {summary.inHouse} Tamu
            </div>
            <p className="mt-1 text-[11px] text-emerald-800 font-medium">Aktif di kamar saat ini</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Tamu Langganan (VIP)</span>
              <Award className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-amber-700">
              {summary.repeatGuests} Tamu
            </div>
            <p className="mt-1 text-[11px] text-amber-800 font-medium">Menginap $\ge$ 2 kali kunjungan</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Malam Terjual</span>
              <CalendarCheck className="h-4 w-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-theta-navy">
              {summary.totalNights} Malam
            </div>
            <p className="mt-1 text-[11px] text-text-muted">Akumulasi room nights seluruh tamu</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Rincian Data Tamu */}
      <Card>
        <CardContent className="p-0">
          {filteredGuests.length === 0 ? (
            <EmptyState
              title="Tidak ada data tamu"
              description="Tidak ditemukan tamu yang cocok dengan filter atau kata kunci pencarian Anda."
              className="border-0 py-8"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Tamu</TableHead>
                  <TableHead>Kontak (HP / Email)</TableHead>
                  <TableHead>Status Saat Ini</TableHead>
                  <TableHead className="text-center">Kunjungan</TableHead>
                  <TableHead className="text-center">Total Malam</TableHead>
                  <TableHead className="text-right">Total Belanja</TableHead>
                  <TableHead>Preferensi</TableHead>
                  <TableHead>Kunjungan Terakhir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuests.map((g) => {
                  const isRepeat = g.stayCount >= 2;
                  return (
                    <TableRow key={g.id} className="text-xs">
                      {/* Nama Tamu + Badge VIP */}
                      <TableCell className="font-semibold text-theta-navy">
                        <div className="flex items-center gap-1.5">
                          <span>{g.name}</span>
                          {isRepeat && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              <Award className="h-3 w-3 text-amber-600" />
                              VIP
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Kontak */}
                      <TableCell className="text-text-muted">
                        <div className="space-y-0.5">
                          {g.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-teal-700" />
                              <span className="font-medium text-text">{g.phone}</span>
                            </div>
                          )}
                          {g.email && (
                            <div className="flex items-center gap-1 text-[11px]">
                              <Mail className="h-3 w-3 text-text-muted" />
                              <span>{g.email}</span>
                            </div>
                          )}
                          {!g.phone && !g.email && <span>-</span>}
                        </div>
                      </TableCell>

                      {/* Status Terkini */}
                      <TableCell>
                        {g.currentStatus === "IN_HOUSE" ? (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                            <BedDouble className="h-3 w-3 text-emerald-600" />
                            Kamar {g.currentRoomNumber ?? "-"} ({g.currentRoomType ?? "In-House"})
                          </div>
                        ) : g.currentStatus === "UPCOMING" ? (
                          <StatusBadge label="Booking Mendatang" tone="info" />
                        ) : (
                          <StatusBadge label="Selesai Menginap" tone="neutral" />
                        )}
                      </TableCell>

                      {/* Kunjungan & Malam */}
                      <TableCell className="text-center font-bold tabular-nums text-theta-navy">
                        {g.stayCount}x
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-text-muted">
                        {g.totalNights} malam
                      </TableCell>

                      {/* Total Belanja */}
                      <TableCell className="text-right font-bold tabular-nums text-teal-800">
                        {formatCurrencyIDR(g.totalSpent)}
                      </TableCell>

                      {/* Preferensi */}
                      <TableCell className="text-text-muted max-w-xs truncate">
                        {g.preferred || "-"}
                      </TableCell>

                      {/* Kunjungan Terakhir */}
                      <TableCell className="text-text-muted whitespace-nowrap">
                        {g.lastStayDate ? formatShortDate(g.lastStayDate) : formatShortDate(g.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Footer Cetak (Tanda Tangan Pengesahan) */}
      <div className="hidden pt-12 print:block">
        <div className="grid grid-cols-2 text-center text-xs">
          <div>
            <p className="text-text-muted">Diverifikasi Oleh:</p>
            <div className="h-16" />
            <p className="font-bold underline text-theta-navy">Front Office Supervisor / Duty Manager</p>
            <p className="text-text-muted">Tanggal: {new Date().toLocaleDateString("id-ID")}</p>
          </div>
          <div>
            <p className="text-text-muted">Mengetahui:</p>
            <div className="h-16" />
            <p className="font-bold underline text-theta-navy">General Manager / Pemilik</p>
            <p className="text-text-muted">HotelOps Guard Management</p>
          </div>
        </div>
      </div>
    </div>
  );
}
