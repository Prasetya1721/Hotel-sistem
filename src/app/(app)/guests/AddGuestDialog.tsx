"use client";

import * as React from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createGuestAction } from "@/app/(app)/guests/actions";

export default function AddGuestDialog() {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    phone: "",
    email: "",
    preferred: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Nama tamu wajib diisi.");
      return;
    }

    setPending(true);
    const res = await createGuestAction(formData);
    setPending(false);

    if (res.ok) {
      toast.success(res.message);
      setFormData({ name: "", phone: "", email: "", preferred: "" });
      setOpen(false);
    } else {
      toast.error(res.message);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <UserPlus className="h-4 w-4" />
        Tambah Tamu
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Tambah Tamu Baru"
        description="Masukkan identitas dasar tamu. Nomor dokumen lengkap tidak disimpan demi privasi."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="guest-name">Nama Lengkap *</Label>
            <Input
              id="guest-name"
              placeholder="Contoh: Budi Gunawan"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="guest-phone">Nomor Telepon</Label>
            <Input
              id="guest-phone"
              type="tel"
              placeholder="08123456789"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="guest-email">Alamat Email</Label>
            <Input
              id="guest-email"
              type="email"
              placeholder="budi@contoh.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="guest-preferred">Preferensi Kamar / Catatan</Label>
            <Input
              id="guest-preferred"
              placeholder="Contoh: Lantai atas, non-smoking, extra bantal"
              value={formData.preferred}
              onChange={(e) => setFormData({ ...formData, preferred: e.target.value })}
            />
          </div>

          <div className="mt-6 flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {pending ? "Menyimpan…" : "Simpan Tamu"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
