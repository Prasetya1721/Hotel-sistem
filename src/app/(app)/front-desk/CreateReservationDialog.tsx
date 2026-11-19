"use client";

import * as React from "react";
import { CalendarPlus, LogIn, Loader2, UserPlus, Users, BedDouble, Filter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createReservationAction } from "@/app/(app)/front-desk/actions";

interface GuestOption {
  id: string;
  name: string;
  phone?: string | null;
}

interface RoomOption {
  id: string;
  number: string;
  floor: number;
  occupancyStatus: string;
  housekeepingStatus: string;
  serviceStatus: string;
  roomType: { name: string; baseRate: number };
}

export default function CreateReservationDialog({
  guests,
  rooms,
}: {
  guests: GuestOption[];
  rooms: RoomOption[];
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  // Mode Tamu: "new" (Walk-in Tamu Baru langsung di sini) atau "existing" (Tamu terdaftar)
  const [guestMode, setGuestMode] = React.useState<"new" | "existing">("new");
  const [newGuestName, setNewGuestName] = React.useState("");
  const [newGuestPhone, setNewGuestPhone] = React.useState("");
  const [newGuestEmail, setNewGuestEmail] = React.useState("");
  const [newGuestPreferred, setNewGuestPreferred] = React.useState("");
  const [guestId, setGuestId] = React.useState(guests[0]?.id ?? "");

  // Filter Kategori / Kelas Kamar
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");

  // KAMAR YANG SUDAH TERISI TIDAK TAMPIL (Hanya tampilkan kamar kosong & siap pakai)
  const vacantRooms = React.useMemo(() => {
    return rooms.filter((r) => r.occupancyStatus !== "OCCUPIED" && r.serviceStatus !== "OUT_OF_ORDER");
  }, [rooms]);

  // Daftar Kategori Kelas Kamar yang tersedia
  const categories = React.useMemo(() => {
    const map = new Map<string, { name: string; baseRate: number; count: number }>();
    for (const r of vacantRooms) {
      const existing = map.get(r.roomType.name);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(r.roomType.name, {
          name: r.roomType.name,
          baseRate: r.roomType.baseRate,
          count: 1,
        });
      }
    }
    return Array.from(map.values());
  }, [vacantRooms]);

  // Kamar kosong terfilter berdasarkan kategori
  const filteredRooms = React.useMemo(() => {
    if (selectedCategory === "ALL") return vacantRooms;
    return vacantRooms.filter((r) => r.roomType.name === selectedCategory);
  }, [vacantRooms, selectedCategory]);

  // Pilih kamar awal (utamakan kamar yang VACANT dan CLEAN)
  const readyRoom = vacantRooms.find(
    (r) => r.housekeepingStatus === "CLEAN" && r.serviceStatus === "AVAILABLE",
  );
  const [roomId, setRoomId] = React.useState(readyRoom?.id ?? vacantRooms[0]?.id ?? "");

  const [checkInAt, setCheckInAt] = React.useState(todayStr);
  const [checkOutAt, setCheckOutAt] = React.useState(tomorrowStr);
  const [adults, setAdults] = React.useState(1);
  const [children, setChildren] = React.useState(0);
  const [rateApplied, setRateApplied] = React.useState(
    readyRoom?.roomType.baseRate ?? vacantRooms[0]?.roomType.baseRate ?? 500000,
  );
  const [source, setSource] = React.useState("WALK_IN");
  const [notes, setNotes] = React.useState("");

  // Durasi malam
  const checkInDate = new Date(checkInAt);
  const checkOutDate = new Date(checkOutAt);
  const nights = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));

  function handleCategoryChange(catName: string) {
    setSelectedCategory(catName);
    const matchingRooms = catName === "ALL" ? vacantRooms : vacantRooms.filter((r) => r.roomType.name === catName);
    if (matchingRooms.length > 0) {
      const firstClean = matchingRooms.find((r) => r.housekeepingStatus === "CLEAN" && r.serviceStatus === "AVAILABLE") ?? matchingRooms[0];
      setRoomId(firstClean.id);
      setRateApplied(firstClean.roomType.baseRate);
    } else {
      setRoomId("");
    }
  }

  function handleRoomChange(newRoomId: string) {
    setRoomId(newRoomId);
    const selectedRoom = rooms.find((r) => r.id === newRoomId);
    if (selectedRoom) {
      setRateApplied(selectedRoom.roomType.baseRate);
    }
  }

  async function submitForm(instantCheckIn: boolean) {
    if (guestMode === "new" && !newGuestName.trim()) {
      toast.error("Nama tamu wajib diisi.");
      return;
    }
    if (guestMode === "existing" && !guestId) {
      toast.error("Pilih tamu terdaftar terlebih dahulu.");
      return;
    }
    if (!roomId) {
      toast.error("Pilih kamar yang tersedia terlebih dahulu.");
      return;
    }

    setPending(true);
    const res = await createReservationAction({
      guestMode,
      guestId: guestMode === "existing" ? guestId : undefined,
      newGuestName: guestMode === "new" ? newGuestName : undefined,
      newGuestPhone: guestMode === "new" ? newGuestPhone : undefined,
      newGuestEmail: guestMode === "new" ? newGuestEmail : undefined,
      newGuestPreferred: guestMode === "new" ? newGuestPreferred : undefined,
      roomId,
      checkInAt,
      checkOutAt,
      adults,
      children,
      rateApplied: Number(rateApplied),
      source,
      notes,
      instantCheckIn,
    });
    setPending(false);

    if (res.ok) {
      toast.success(res.message);
      setOpen(false);
      setNewGuestName("");
      setNewGuestPhone("");
      setNewGuestEmail("");
      setNewGuestPreferred("");
      setNotes("");
    } else {
      toast.error(res.message);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <CalendarPlus className="h-4 w-4" />
        Reservasi / Walk-In
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Reservasi &amp; Walk-In Front Desk"
        description="Input tamu, tentukan kelas kamar yang kosong, dan simpan booking atau langsung check-in."
      >
        <div className="space-y-4">
          {/* Tab Pilihan Tamu Baru vs Terdaftar */}
          <div className="flex rounded-[10px] bg-surface-muted p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setGuestMode("new")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-[8px] py-1.5 transition-all ${
                guestMode === "new"
                  ? "bg-white text-theta-navy shadow-sm"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Tamu Baru (Walk-In Cepat)
            </button>
            <button
              type="button"
              onClick={() => setGuestMode("existing")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-[8px] py-1.5 transition-all ${
                guestMode === "existing"
                  ? "bg-white text-theta-navy shadow-sm"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Tamu Terdaftar ({guests.length})
            </button>
          </div>

          {/* Form Bagian Tamu */}
          {guestMode === "new" ? (
            <div className="space-y-3 rounded-[12px] border border-border/80 bg-surface p-3">
              <div className="space-y-1">
                <Label htmlFor="new-guest-name" className="text-xs">Nama Lengkap Tamu *</Label>
                <Input
                  id="new-guest-name"
                  placeholder="Contoh: Hendra Kusuma"
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="new-guest-phone" className="text-xs">Nomor HP / WhatsApp</Label>
                  <Input
                    id="new-guest-phone"
                    type="tel"
                    placeholder="08123456789"
                    value={newGuestPhone}
                    onChange={(e) => setNewGuestPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-guest-pref" className="text-xs">Catatan / Preferensi</Label>
                  <Input
                    id="new-guest-pref"
                    placeholder="Misal: Non-smoking, lantai 2"
                    value={newGuestPreferred}
                    onChange={(e) => setNewGuestPreferred(e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 rounded-[12px] border border-border/80 bg-surface p-3">
              <Label htmlFor="res-guest" className="text-xs">Pilih Tamu Terdaftar *</Label>
              <Select
                id="res-guest"
                value={guestId}
                onChange={(e) => setGuestId(e.target.value)}
                required
              >
                <option value="" disabled>Pilih nama tamu</option>
                {guests.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} {g.phone ? `(${g.phone})` : ""}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* Form Bagian Kamar Berdasarkan Kategori Kelas */}
          <div className="space-y-3 rounded-[12px] border border-border/80 bg-surface p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Dropdown Kategori / Kelas Kamar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="room-category" className="text-xs flex items-center gap-1 font-semibold text-theta-navy">
                    <Filter className="h-3.5 w-3.5 text-teal-700" />
                    Kategori / Kelas Kamar
                  </Label>
                  <span className="text-[11px] font-medium text-teal-800">
                    {vacantRooms.length} kamar kosong
                  </span>
                </div>
                <Select
                  id="room-category"
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  <option value="ALL">Semua Kelas ({vacantRooms.length} kamar kosong)</option>
                  {categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name} — Rp {cat.baseRate.toLocaleString("id-ID")}/mlm ({cat.count} kosong)
                    </option>
                  ))}
                </Select>
              </div>

              {/* Dropdown Kamar Kosong Terfilter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="res-room" className="text-xs flex items-center gap-1 font-semibold text-theta-navy">
                    <BedDouble className="h-3.5 w-3.5 text-teal-700" />
                    Kamar Tersedia (Kosong) *
                  </Label>
                  <span className="text-[11px] text-text-muted">
                    Hijau: Siap &amp; Bersih
                  </span>
                </div>
                {filteredRooms.length === 0 ? (
                  <div className="rounded-[8px] border border-dashed border-danger/40 bg-danger-soft p-2 text-xs text-danger">
                    Semua kamar kelas ini sedang terisi/penuh. Silakan pilih kelas kamar lain.
                  </div>
                ) : (
                  <Select
                    id="res-room"
                    value={roomId}
                    onChange={(e) => handleRoomChange(e.target.value)}
                    required
                  >
                    <option value="" disabled>Pilih kamar kosong</option>
                    {selectedCategory === "ALL" ? (
                      categories.map((cat) => {
                        const catRooms = vacantRooms.filter((r) => r.roomType.name === cat.name);
                        if (catRooms.length === 0) return null;
                        return (
                          <optgroup
                            key={cat.name}
                            label={`Kelas ${cat.name} — Rp ${cat.baseRate.toLocaleString("id-ID")}/malam`}
                          >
                            {catRooms.map((r) => {
                              const isClean = r.housekeepingStatus === "CLEAN";
                              return (
                                <option key={r.id} value={r.id}>
                                  Kamar {r.number} — {r.roomType.name} (Lt {r.floor}) | Rp {r.roomType.baseRate.toLocaleString("id-ID")}/malam {isClean ? "✓ SIAP HUNI" : "(Perlu Bersih)"}
                                </option>
                              );
                            })}
                          </optgroup>
                        );
                      })
                    ) : (
                      filteredRooms.map((r) => {
                        const isClean = r.housekeepingStatus === "CLEAN";
                        return (
                          <option key={r.id} value={r.id}>
                            Kamar {r.number} — {r.roomType.name} (Lt {r.floor}) | Rp {r.roomType.baseRate.toLocaleString("id-ID")}/malam {isClean ? "✓ SIAP HUNI" : "(Perlu Bersih)"}
                          </option>
                        );
                      })
                    )}
                  </Select>
                )}
              </div>
            </div>

            {/* Jadwal Check-in & Check-out */}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/50">
              <div className="space-y-1">
                <Label htmlFor="res-checkin" className="text-xs">Tanggal Check-In</Label>
                <Input
                  id="res-checkin"
                  type="date"
                  value={checkInAt}
                  onChange={(e) => setCheckInAt(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="res-checkout" className="text-xs">Tanggal Check-Out ({nights} malam)</Label>
                <Input
                  id="res-checkout"
                  type="date"
                  value={checkOutAt}
                  onChange={(e) => setCheckOutAt(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Tarif & Tamu */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="res-rate" className="text-xs">Tarif/Malam (Rp)</Label>
                <Input
                  id="res-rate"
                  type="number"
                  min={0}
                  value={rateApplied}
                  onChange={(e) => setRateApplied(parseInt(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="res-adults" className="text-xs">Dewasa / Anak</Label>
                <div className="flex gap-1">
                  <Input
                    id="res-adults"
                    type="number"
                    min={1}
                    value={adults}
                    onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
                    title="Dewasa"
                  />
                  <Input
                    id="res-children"
                    type="number"
                    min={0}
                    value={children}
                    onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
                    title="Anak"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="res-source" className="text-xs">Sumber Booking</Label>
                <Select
                  id="res-source"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                >
                  <option value="WALK_IN">Walk-In</option>
                  <option value="DIRECT">Direct WA/Telp</option>
                  <option value="TRAVELOKA">Traveloka</option>
                  <option value="AGODA">Agoda</option>
                  <option value="BOOKING_COM">Booking.com</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="res-notes" className="text-xs">Catatan Tambahan</Label>
              <Textarea
                id="res-notes"
                placeholder="Catatan permintaan khusus tamu..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Tombol Aksi: Simpan Booking vs Langsung Check-In */}
          <div className="mt-5 border-t border-border pt-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Batal
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => submitForm(false)}
                disabled={pending || filteredRooms.length === 0}
                className="gap-1.5"
              >
                {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Simpan Booking Saja
              </Button>

              <Button
                type="button"
                variant="default"
                onClick={() => submitForm(true)}
                disabled={pending || filteredRooms.length === 0}
                className="gap-1.5 bg-teal-700 hover:bg-teal-800"
              >
                {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <LogIn className="h-4 w-4" />
                Langsung Check-In (Walk-In)
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
