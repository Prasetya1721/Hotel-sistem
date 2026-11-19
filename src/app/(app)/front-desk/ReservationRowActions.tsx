"use client";

import * as React from "react";
import { LogIn, LogOut, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { checkInAction, checkOutAction, cancelReservationAction } from "@/app/(app)/front-desk/actions";

interface ReservationSummary {
  id: string;
  bookingCode: string;
  status: string;
  guestName: string;
  roomNumber: string | null;
  rateApplied: number;
}

export default function ReservationRowActions({
  reservation,
}: {
  reservation: ReservationSummary;
}) {
  const [checkInOpen, setCheckInOpen] = React.useState(false);
  const [checkOutOpen, setCheckOutOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  // Opsi pelunasan saat checkout
  const [settlePayment, setSettlePayment] = React.useState(true);
  const [paymentMethod, setPaymentMethod] = React.useState("CASH");

  async function handleCheckIn() {
    setPending(true);
    const res = await checkInAction(reservation.id);
    setPending(false);

    if (res.ok) {
      toast.success(res.message);
      setCheckInOpen(false);
    } else {
      toast.error(res.message);
    }
  }

  async function handleCheckOut() {
    setPending(true);
    const res = await checkOutAction(reservation.id, {
      settlePayment,
      paymentMethod,
    });
    setPending(false);

    if (res.ok) {
      toast.success(res.message);
      setCheckOutOpen(false);
    } else {
      toast.error(res.message);
    }
  }

  async function handleCancel() {
    setPending(true);
    const res = await cancelReservationAction(reservation.id, "Dibatalkan melalui Front Desk");
    setPending(false);

    if (res.ok) {
      toast.success(res.message);
      setCancelOpen(false);
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Tombol Check-In */}
      {(reservation.status === "CONFIRMED" || reservation.status === "PENDING" || reservation.status === "HOLD") && (
        <Button
          size="sm"
          variant="default"
          onClick={() => setCheckInOpen(true)}
          className="h-7 gap-1 px-2.5 text-xs font-semibold"
        >
          <LogIn className="h-3.5 w-3.5" />
          Check-in
        </Button>
      )}

      {/* Tombol Check-Out */}
      {reservation.status === "CHECKED_IN" && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setCheckOutOpen(true)}
          className="h-7 gap-1 px-2.5 text-xs font-semibold text-danger hover:bg-danger-soft hover:text-danger"
        >
          <LogOut className="h-3.5 w-3.5" />
          Check-out
        </Button>
      )}

      {/* Tombol Batalkan */}
      {(reservation.status === "CONFIRMED" || reservation.status === "PENDING" || reservation.status === "HOLD") && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setCancelOpen(true)}
          className="h-7 px-2 text-xs text-text-muted hover:text-danger"
          title="Batalkan Reservasi"
        >
          <XCircle className="h-3.5 w-3.5" />
        </Button>
      )}

      {/* Dialog Check-In */}
      <Dialog
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        title="Konfirmasi Check-In Tamu"
        description={`Proses kedatangan tamu untuk reservasi ${reservation.bookingCode}.`}
      >
        <div className="space-y-3 py-1 text-sm">
          <div className="rounded-[10px] bg-surface-muted p-3">
            <p className="text-xs text-text-muted">Nama Tamu</p>
            <p className="font-semibold text-theta-navy">{reservation.guestName}</p>
            <p className="mt-2 text-xs text-text-muted">Kamar yang Ditempati</p>
            <p className="font-semibold text-theta-navy">Kamar {reservation.roomNumber ?? "Belum ditentukan"}</p>
          </div>
          <p className="text-xs text-text-muted">
            Check-in akan otomatis mengubah status kamar menjadi <strong>OCCUPIED</strong>, menerbitkan kredensial smart lock digital, dan mencatat tagihan kamar ke folio.
          </p>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="secondary" onClick={() => setCheckInOpen(false)} disabled={pending}>
              Batal
            </Button>
            <Button onClick={handleCheckIn} disabled={pending}>
              {pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {pending ? "Memproses…" : "Selesaikan Check-In"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Dialog Check-Out */}
      <Dialog
        open={checkOutOpen}
        onClose={() => setCheckOutOpen(false)}
        title="Konfirmasi Check-Out Tamu"
        description={`Proses keberangkatan tamu ${reservation.guestName} (${reservation.bookingCode}).`}
      >
        <div className="space-y-3 py-1 text-sm">
          <div className="rounded-[10px] bg-surface-muted p-3">
            <p className="text-xs text-text-muted">Kamar</p>
            <p className="font-semibold text-theta-navy">Kamar {reservation.roomNumber ?? "-"}</p>
            <p className="mt-2 text-xs text-text-muted">Tamu</p>
            <p className="font-semibold text-theta-navy">{reservation.guestName}</p>
          </div>

          <div className="space-y-2 rounded-[10px] border border-border p-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <input
                type="checkbox"
                checked={settlePayment}
                onChange={(e) => setSettlePayment(e.target.checked)}
                className="h-4 w-4 rounded border-border text-teal-700 focus:ring-teal-600"
              />
              Lunasi seluruh sisa tagihan saat check-out
            </label>

            {settlePayment && (
              <div className="mt-2 space-y-1">
                <Label htmlFor="pay-method" className="text-xs">Metode Pembayaran</Label>
                <Select
                  id="pay-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="CASH">Tunai (Cash)</option>
                  <option value="TRANSFER">Transfer Bank</option>
                  <option value="QRIS">QRIS</option>
                  <option value="CREDIT_CARD">Kartu Debit / Kredit</option>
                </Select>
              </div>
            )}
          </div>

          <p className="text-xs text-text-muted">
            Saat check-out, kredensial smart lock kamar akan langsung dicabut, status kamar menjadi <strong>Kotor (DIRTY)</strong>, dan tugas pembersihan Housekeeping otomatis dijadwalkan.
          </p>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="secondary" onClick={() => setCheckOutOpen(false)} disabled={pending}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleCheckOut} disabled={pending}>
              {pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {pending ? "Memproses…" : "Selesaikan Check-Out"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Dialog Batalkan */}
      <Dialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Batalkan Reservasi"
        description={`Apakah Anda yakin ingin membatalkan pemesanan ${reservation.bookingCode}?`}
      >
        <div className="space-y-3 py-1 text-sm">
          <p className="text-text-muted">
            Reservasi tamu <strong>{reservation.guestName}</strong> akan ditandai sebagai dibatalkan dan kamar akan dibebaskan kembali.
          </p>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="secondary" onClick={() => setCancelOpen(false)} disabled={pending}>
              Kembali
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={pending}>
              {pending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {pending ? "Membatalkan…" : "Ya, Batalkan"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
