"use client";

import * as React from "react";
import {
  Printer,
  Search,
  Filter,
  CreditCard,
  Banknote,
  QrCode,
  Building,
  TrendingUp,
  Receipt,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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

export interface SerializedFolioReport {
  id: string;
  reservationId: string;
  bookingCode: string;
  guestName: string;
  guestPhone?: string | null;
  roomNumber?: string | null;
  roomTypeName?: string | null;
  total: number;
  paid: number;
  status: string;
  createdAt: string;
  payments: {
    id: string;
    method: string;
    amount: number;
    reference?: string | null;
    processedAt: string;
  }[];
}

interface FinanceReportClientProps {
  folios: SerializedFolioReport[];
  propertyName: string;
}

export default function FinanceReportClient({
  folios,
  propertyName,
}: FinanceReportClientProps) {
  const [period, setPeriod] = React.useState<"ALL" | "TODAY" | "7DAYS" | "MONTH">("ALL");
  const [methodFilter, setMethodFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [search, setSearch] = React.useState<string>("");

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  // Filter Folios
  const filteredFolios = React.useMemo(() => {
    return folios.filter((f) => {
      const createdAt = new Date(f.createdAt).getTime();

      // Filter Periode
      if (period === "TODAY" && createdAt < startOfToday) return false;
      if (period === "7DAYS" && createdAt < sevenDaysAgo) return false;
      if (period === "MONTH" && createdAt < startOfMonth) return false;

      // Filter Status
      if (statusFilter === "SETTLED" && f.status !== "SETTLED") return false;
      if (statusFilter === "OPEN" && f.status !== "OPEN") return false;

      // Filter Metode Pembayaran
      if (methodFilter !== "ALL") {
        const hasMethod = f.payments.some((p) => p.method === methodFilter);
        if (!hasMethod) return false;
      }

      // Filter Pencarian
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = f.guestName.toLowerCase().includes(q);
        const matchCode = f.bookingCode.toLowerCase().includes(q);
        const matchRoom = f.roomNumber?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchRoom) return false;
      }

      return true;
    });
  }, [folios, period, statusFilter, methodFilter, search, startOfToday, sevenDaysAgo, startOfMonth]);

  // Agregasi Keuangan
  const summary = React.useMemo(() => {
    let billed = 0;
    let paid = 0;
    let outstanding = 0;

    const byMethod: Record<string, number> = {
      CASH: 0,
      TRANSFER: 0,
      QRIS: 0,
      CARD: 0,
      OTHER: 0,
    };

    const byRoomClass: Record<string, { count: number; total: number }> = {};

    for (const f of filteredFolios) {
      billed += f.total;
      paid += f.paid;
      outstanding += Math.max(f.total - f.paid, 0);

      // Agregasi Metode Pembayaran
      for (const p of f.payments) {
        if (byMethod[p.method] !== undefined) {
          byMethod[p.method] += p.amount;
        } else {
          byMethod.OTHER += p.amount;
        }
      }

      // Agregasi Kelas Kamar
      const rClass = f.roomTypeName || "Lainnya";
      if (!byRoomClass[rClass]) {
        byRoomClass[rClass] = { count: 0, total: 0 };
      }
      byRoomClass[rClass].count += 1;
      byRoomClass[rClass].total += f.total;
    }

    const avgFolio = filteredFolios.length > 0 ? Math.round(billed / filteredFolios.length) : 0;

    return {
      billed,
      paid,
      outstanding,
      avgFolio,
      byMethod,
      byRoomClass,
      count: filteredFolios.length,
    };
  }, [filteredFolios]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Aksi Cetak & Filter Interaktif (Tidak tampil saat print) */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          {/* Periode */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-teal-700" />
            <span className="text-xs font-semibold text-theta-navy">Periode:</span>
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value as never)}
              className="h-8.5 w-36 text-xs font-medium"
            >
              <option value="ALL">Semua Waktu</option>
              <option value="TODAY">Hari Ini</option>
              <option value="7DAYS">7 Hari Terakhir</option>
              <option value="MONTH">Bulan Ini</option>
            </Select>
          </div>

          {/* Status Pembayaran */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-theta-navy">Status:</span>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8.5 w-36 text-xs font-medium"
            >
              <option value="ALL">Semua Status</option>
              <option value="SETTLED">Lunas (Settled)</option>
              <option value="OPEN">Belum Lunas (Open)</option>
            </Select>
          </div>

          {/* Metode */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-theta-navy">Metode:</span>
            <Select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="h-8.5 w-36 text-xs font-medium"
            >
              <option value="ALL">Semua Metode</option>
              <option value="CASH">Tunai (Cash)</option>
              <option value="TRANSFER">Transfer Bank</option>
              <option value="QRIS">QRIS</option>
              <option value="CARD">Kartu (Debit/Kredit)</option>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Pencarian */}
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Cari tamu / kamar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8.5 pl-8 text-xs"
            />
          </div>

          {/* Tombol Cetak / Export PDF */}
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
            <p className="text-sm font-semibold text-teal-800">LAPORAN KEUANGAN &amp; PENERIMAAN KAS</p>
            <p className="text-xs text-text-muted">
              Periode: {period === "ALL" ? "Seluruh Waktu" : period === "TODAY" ? "Hari Ini" : period === "7DAYS" ? "7 Hari Terakhir" : "Bulan Ini"} | Dicetak pada: {new Date().toLocaleString("id-ID")}
            </p>
          </div>
          <div className="text-right text-xs">
            <p className="font-semibold text-theta-navy">Dokumen Resmi Keuangan</p>
            <p className="text-text-muted">Status: Terverifikasi Sistem</p>
          </div>
        </div>
      </div>

      {/* KPI Cards Ringkasan Finansial */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-l-4 border-l-teal-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Total Omzet Tagihan</span>
              <Receipt className="h-4 w-4 text-teal-700" />
            </div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-theta-navy">
              {formatCurrencyIDR(summary.billed)}
            </div>
            <p className="mt-1 text-[11px] text-text-muted">{summary.count} transaksi folio tercatat</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Penerimaan Kas Masuk</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-emerald-700">
              {formatCurrencyIDR(summary.paid)}
            </div>
            <p className="mt-1 text-[11px] text-emerald-800 font-medium">
              {summary.billed > 0 ? `${Math.round((summary.paid / summary.billed) * 100)}% terealisasi` : "0%"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Piutang Belum Lunas</span>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-amber-700">
              {formatCurrencyIDR(summary.outstanding)}
            </div>
            <p className="mt-1 text-[11px] text-amber-800 font-medium">
              {summary.outstanding > 0 ? "Perlu ditagihkan ke tamu" : "Semua tagihan lunas"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Rata-rata Transaksi</span>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-theta-navy">
              {formatCurrencyIDR(summary.avgFolio)}
            </div>
            <p className="mt-1 text-[11px] text-text-muted">Nilai rata-rata per folio tamu</p>
          </CardContent>
        </Card>
      </div>

      {/* Rincian Metode Penerimaan Kas & Kinerja Kamar */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Breakdown Metode Pembayaran */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-theta-navy">
              <Banknote className="h-4 w-4 text-teal-700" />
              Penerimaan Kas Berdasarkan Metode Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Tunai (Cash)", key: "CASH", icon: Banknote, color: "bg-emerald-500" },
              { label: "Transfer Bank", key: "TRANSFER", icon: Building, color: "bg-blue-500" },
              { label: "QRIS", key: "QRIS", icon: QrCode, color: "bg-teal-500" },
              { label: "Kartu (Debit / Kredit)", key: "CARD", icon: CreditCard, color: "bg-purple-500" },
            ].map((m) => {
              const amount = summary.byMethod[m.key] || 0;
              const pct = summary.paid > 0 ? Math.round((amount / summary.paid) * 100) : 0;
              const Icon = m.icon;
              return (
                <div key={m.key} className="space-y-1 rounded-lg border border-border/60 bg-surface-muted/30 p-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-semibold text-theta-navy">
                      <Icon className="h-3.5 w-3.5 text-text-muted" />
                      {m.label}
                    </span>
                    <div className="text-right">
                      <span className="font-bold tabular-nums text-theta-navy">{formatCurrencyIDR(amount)}</span>
                      <span className="ml-1 text-[11px] font-medium text-text-muted">({pct}%)</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/40">
                    <div className={`h-full ${m.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Breakdown Kontribusi per Kelas Kamar */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-theta-navy">
              <Building className="h-4 w-4 text-teal-700" />
              Kontribusi Omzet Berdasarkan Kelas Kamar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(summary.byRoomClass).length === 0 ? (
              <p className="text-sm text-text-muted">Belum ada transaksi kamar pada periode ini.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(summary.byRoomClass).map(([rClass, data]) => {
                  const pct = summary.billed > 0 ? Math.round((data.total / summary.billed) * 100) : 0;
                  return (
                    <div key={rClass} className="space-y-1 rounded-lg border border-border/60 bg-surface-muted/30 p-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-theta-navy">
                          {rClass} <span className="text-[11px] font-normal text-text-muted">({data.count} transaksi)</span>
                        </span>
                        <div className="text-right">
                          <span className="font-bold tabular-nums text-theta-navy">{formatCurrencyIDR(data.total)}</span>
                          <span className="ml-1 text-[11px] font-medium text-text-muted">({pct}%)</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/40">
                        <div className="h-full bg-teal-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabel Buku Besar Folio & Transaksi Keuangan */}
      <Card>
        <CardHeader className="border-b border-border/80 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-theta-navy">
              Rincian Buku Besar Folio &amp; Pembayaran ({filteredFolios.length} Catatan)
            </CardTitle>
            <span className="text-xs text-text-muted">
              Urut dari transaksi terbaru
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredFolios.length === 0 ? (
            <EmptyState
              title="Tidak ada transaksi yang cocok"
              description="Coba ubah filter periode, status, atau kata kunci pencarian Anda."
              className="border-0 py-8"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tgl Transaksi</TableHead>
                  <TableHead>No. Booking</TableHead>
                  <TableHead>Tamu</TableHead>
                  <TableHead>Kamar / Kelas</TableHead>
                  <TableHead className="text-right">Total Tagihan</TableHead>
                  <TableHead className="text-right">Terbayar</TableHead>
                  <TableHead className="text-right">Sisa Piutang</TableHead>
                  <TableHead>Metode Bayar</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFolios.map((f) => {
                  const sisa = Math.max(f.total - f.paid, 0);
                  const methods = Array.from(new Set(f.payments.map((p) => p.method))).join(", ") || "Belum Bayar";
                  return (
                    <TableRow key={f.id} className="text-xs">
                      <TableCell className="text-text-muted whitespace-nowrap">
                        {formatShortDate(f.createdAt)}
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-theta-navy">
                        {f.bookingCode}
                      </TableCell>
                      <TableCell className="font-semibold text-text">
                        {f.guestName}
                      </TableCell>
                      <TableCell className="text-text-muted">
                        Kamar {f.roomNumber ?? "-"} {f.roomTypeName ? `(${f.roomTypeName})` : ""}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrencyIDR(f.total)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-700 tabular-nums">
                        {formatCurrencyIDR(f.paid)}
                      </TableCell>
                      <TableCell className={`text-right font-bold tabular-nums ${sisa > 0 ? "text-amber-700" : "text-text-muted"}`}>
                        {formatCurrencyIDR(sisa)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-block rounded bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-theta-navy">
                          {methods}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={f.status === "SETTLED" ? "Lunas" : f.status === "OPEN" ? "Belum Lunas" : f.status}
                          tone={f.status === "SETTLED" ? "success" : "warning"}
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

      {/* Footer Cetak (Tanda Tangan Pengesahan untuk Dokumen Fisik) */}
      <div className="hidden pt-12 print:block">
        <div className="grid grid-cols-2 text-center text-xs">
          <div>
            <p className="text-text-muted">Dibuat Oleh:</p>
            <div className="h-16" />
            <p className="font-bold underline text-theta-navy">Bagian Keuangan / Kasir</p>
            <p className="text-text-muted">Tanggal: {new Date().toLocaleDateString("id-ID")}</p>
          </div>
          <div>
            <p className="text-text-muted">Mengetahui &amp; Menyetujui:</p>
            <div className="h-16" />
            <p className="font-bold underline text-theta-navy">General Manager / Pemilik</p>
            <p className="text-text-muted">HotelOps Guard Management</p>
          </div>
        </div>
      </div>
    </div>
  );
}
