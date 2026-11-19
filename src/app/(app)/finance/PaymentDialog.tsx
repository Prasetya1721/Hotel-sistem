"use client";

import * as React from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { recordPaymentAction } from "@/app/(app)/finance/actions";

interface FolioSummary {
  id: string;
  guestName: string;
  roomNumber: string | null;
  total: number;
  paid: number;
  outstanding: number;
}

export default function PaymentDialog({ folio }: { folio: FolioSummary }) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const [amount, setAmount] = React.useState(folio.outstanding);
  const [method, setMethod] = React.useState("CASH");
  const [reference, setReference] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (amount <= 0) {
      toast.error("Nominal pembayaran harus lebih besar dari 0.");
      return;
    }

    setPending(true);
    const res = await recordPaymentAction({
      folioId: folio.id,
      amount: Number(amount),
      method,
      reference,
    });
    setPending(false);

    if (res.ok) {
      toast.success(res.message);
      setOpen(false);
      setReference("");
    } else {
      toast.error(res.message);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          setAmount(folio.outstanding);
          setOpen(true);
        }}
        className="h-7 gap-1 px-2.5 text-xs text-teal-800 hover:text-teal-900"
      >
        <CreditCard className="h-3.5 w-3.5" />
        Bayar
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Catat Pembayaran Tagihan"
        description={`Pembayaran untuk tamu ${folio.guestName} (${folio.roomNumber ? "Kamar " + folio.roomNumber : "Tanpa Kamar"}).`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-[10px] bg-surface-muted p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-text-muted">Total Tagihan:</span>
              <span className="font-semibold text-theta-navy">Rp {folio.total.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Sudah Dibayar:</span>
              <span className="font-semibold text-success">Rp {folio.paid.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1">
              <span className="font-medium text-text">Sisa Tagihan:</span>
              <span className="font-bold text-danger">Rp {folio.outstanding.toLocaleString("id-ID")}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pay-amount">Nominal Pembayaran (Rp) *</Label>
            <Input
              id="pay-amount"
              type="number"
              min={1}
              max={folio.outstanding * 2}
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pay-method">Metode Pembayaran</Label>
            <Select id="pay-method" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="CASH">Tunai (Cash)</option>
              <option value="TRANSFER">Transfer Bank</option>
              <option value="QRIS">QRIS</option>
              <option value="CREDIT_CARD">Kartu Debit / Kredit</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pay-ref">Nomor Referensi / Catatan</Label>
            <Input
              id="pay-ref"
              placeholder="Contoh: No. struk EDC / Bukti transfer BCA"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="mt-6 flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {pending ? "Menyimpan…" : "Simpan Pembayaran"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
