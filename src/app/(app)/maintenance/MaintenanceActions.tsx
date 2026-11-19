"use client";

import * as React from "react";
import { Wrench, Play, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createTicketAction, updateTicketStatusAction } from "@/app/(app)/maintenance/actions";

interface RoomOption {
  id: string;
  number: string;
}

export function CreateTicketDialog({ rooms }: { rooms: RoomOption[] }) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [roomId, setRoomId] = React.useState("");
  const [priority, setPriority] = React.useState("MEDIUM");
  const [markOutOfOrder, setMarkOutOfOrder] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Judul dan deskripsi wajib diisi.");
      return;
    }

    setPending(true);
    const res = await createTicketAction({
      title,
      description,
      roomId: roomId || undefined,
      priority,
      markOutOfOrder,
    });
    setPending(false);

    if (res.ok) {
      toast.success(res.message);
      setOpen(false);
      setTitle("");
      setDescription("");
      setRoomId("");
      setMarkOutOfOrder(false);
    } else {
      toast.error(res.message);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Wrench className="h-4 w-4" />
        Buat Tiket Perbaikan
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Lapor Kerusakan / Maintenance"
        description="Buat tiket perbaikan untuk fasilitas kamar atau area umum."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tkt-title">Judul Kendala *</Label>
            <Input
              id="tkt-title"
              placeholder="Contoh: Kran wastafel bocor / AC tidak dingin"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tkt-room">Lokasi / Kamar</Label>
              <Select id="tkt-room" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                <option value="">Area Umum / Fasilitas</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Kamar {r.number}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tkt-priority">Prioritas</Label>
              <Select id="tkt-priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="LOW">Rendah (Low)</option>
                <option value="MEDIUM">Sedang (Medium)</option>
                <option value="HIGH">Tinggi (High)</option>
                <option value="CRITICAL">Kritis (Critical)</option>
              </Select>
            </div>
          </div>

          {roomId && (
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-text-muted">
              <input
                type="checkbox"
                checked={markOutOfOrder}
                onChange={(e) => setMarkOutOfOrder(e.target.checked)}
                className="h-4 w-4 rounded border-border text-danger focus:ring-danger"
              />
              Tandai kamar sebagai <strong>Out of Order</strong> (tidak dapat dijual selama perbaikan)
            </label>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="tkt-desc">Deskripsi Kerusakan *</Label>
            <Textarea
              id="tkt-desc"
              placeholder="Jelaskan detail kerusakan, lokasi bagian yang rusak, dan instruksi penanganan."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="mt-6 flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {pending ? "Menyimpan…" : "Kirim Laporan"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export function TicketRowActions({ ticketId, currentStatus }: { ticketId: string; currentStatus: string }) {
  const [pending, setPending] = React.useState(false);

  async function handleUpdate(newStatus: string) {
    setPending(true);
    const res = await updateTicketStatusAction(ticketId, newStatus);
    setPending(false);

    if (res.ok) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {currentStatus === "OPEN" && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleUpdate("IN_PROGRESS")}
          disabled={pending}
          className="h-7 gap-1 px-2.5 text-xs text-theta-navy"
        >
          <Play className="h-3 w-3 text-teal-700" />
          Kerjakan
        </Button>
      )}

      {currentStatus === "IN_PROGRESS" && (
        <Button
          size="sm"
          variant="default"
          onClick={() => handleUpdate("DONE")}
          disabled={pending}
          className="h-7 gap-1 px-2.5 text-xs font-semibold"
        >
          <CheckCircle className="h-3 w-3" />
          Selesai
        </Button>
      )}
    </div>
  );
}
