"use client";

import * as React from "react";
import { PlusCircle, Play, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createHousekeepingTaskAction, updateTaskStatusAction } from "@/app/(app)/housekeeping/actions";

interface RoomOption {
  id: string;
  number: string;
  housekeepingStatus: string;
}

export function CreateTaskDialog({ rooms }: { rooms: RoomOption[] }) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const [roomId, setRoomId] = React.useState(rooms[0]?.id ?? "");
  const [type, setType] = React.useState("STAYOVER_CLEAN");
  const [priority, setPriority] = React.useState("NORMAL");
  const [note, setNote] = React.useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId) {
      toast.error("Pilih kamar terlebih dahulu.");
      return;
    }

    setPending(true);
    const res = await createHousekeepingTaskAction({ roomId, type, priority, note });
    setPending(false);

    if (res.ok) {
      toast.success(res.message);
      setOpen(false);
      setNote("");
    } else {
      toast.error(res.message);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <PlusCircle className="h-4 w-4" />
        Tugas Pembersihan Baru
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Jadwalkan Tugas Housekeeping"
        description="Pilih kamar yang perlu dibersihkan atau dirapikan."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-room">Kamar *</Label>
            <Select id="task-room" value={roomId} onChange={(e) => setRoomId(e.target.value)} required>
              <option value="" disabled>Pilih kamar</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Kamar {r.number} (Status: {r.housekeepingStatus})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-type">Jenis Pembersihan</Label>
              <Select id="task-type" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="STAYOVER_CLEAN">Stayover Clean</option>
                <option value="DEPARTURE_CLEAN">Departure Clean</option>
                <option value="TOUCH_UP">Touch Up</option>
                <option value="DEEP_CLEAN">Deep Clean</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-priority">Prioritas</Label>
              <Select id="task-priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">Tinggi</option>
                <option value="URGENT">Mendesak (Urgent)</option>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-note">Catatan Petugas</Label>
            <Textarea
              id="task-note"
              placeholder="Contoh: Ganti sprei dan handuk tambahan"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>

          <div className="mt-6 flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {pending ? "Menyimpan…" : "Simpan Tugas"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export function TaskRowActions({ taskId, currentStatus }: { taskId: string; currentStatus: string }) {
  const [pending, setPending] = React.useState(false);

  async function handleUpdate(newStatus: string) {
    setPending(true);
    const res = await updateTaskStatusAction(taskId, newStatus);
    setPending(false);

    if (res.ok) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {currentStatus === "PENDING" && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleUpdate("IN_PROGRESS")}
          disabled={pending}
          className="h-7 gap-1 px-2.5 text-xs text-theta-navy"
        >
          <Play className="h-3 w-3 text-teal-700" />
          Mulai
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
          <CheckCircle2 className="h-3 w-3" />
          Selesai
        </Button>
      )}
    </div>
  );
}
