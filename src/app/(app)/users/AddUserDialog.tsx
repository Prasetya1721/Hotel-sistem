"use client";

import * as React from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createUserAction } from "@/app/(app)/users/actions";
import { ROLE_LABELS, type Role } from "@/lib/roles";

export default function AddUserDialog() {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("RECEPTIONIST");
  const [employeeCode, setEmployeeCode] = React.useState("");
  const [password, setPassword] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Nama, email, dan kata sandi wajib diisi.");
      return;
    }

    setPending(true);
    const res = await createUserAction({
      name,
      email,
      role,
      employeeCode,
      password,
    });
    setPending(false);

    if (res.ok) {
      toast.success(res.message);
      setOpen(false);
      setName("");
      setEmail("");
      setEmployeeCode("");
      setPassword("");
    } else {
      toast.error(res.message);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <UserPlus className="h-4 w-4" />
        Tambah Pengguna
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Tambah Akun Staf / Pengguna"
        description="Daftarkan akun pegawai baru dengan peran dan kata sandi awal."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="usr-name">Nama Lengkap *</Label>
            <Input
              id="usr-name"
              placeholder="Contoh: Rian Pratama"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="usr-email">Alamat Email *</Label>
              <Input
                id="usr-email"
                type="email"
                placeholder="rian@hotelops.test"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="usr-code">Kode Pegawai</Label>
              <Input
                id="usr-code"
                placeholder="Contoh: FO-008"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="usr-role">Peran (Role) *</Label>
            <Select id="usr-role" value={role} onChange={(e) => setRole(e.target.value)}>
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]} ({r})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="usr-pass">Kata Sandi Awal *</Label>
            <Input
              id="usr-pass"
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="mt-6 flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {pending ? "Menyimpan…" : "Daftarkan Akun"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
