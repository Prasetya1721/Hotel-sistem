"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { updateIncidentStatus } from "@/app/(app)/security/incidents/[id]/actions";
import { INCIDENT_TRANSITIONS } from "@/lib/incident-transitions";
import { incidentStatusConfig } from "@/lib/design";

export default function IncidentActions({
  incidentId,
  currentStatus,
  canManage,
}: {
  incidentId: string;
  currentStatus: string;
  canManage: boolean;
}) {
  const options = INCIDENT_TRANSITIONS[currentStatus] ?? [];
  const [next, setNext] = React.useState(options[0] ?? "");
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState(false);

  if (!canManage) {
    return (
      <p className="rounded-[10px] bg-surface-muted px-3 py-2 text-[13px] text-text-muted">
        Anda hanya dapat melihat insiden ini. Perubahan status terbatas untuk Keamanan, GM, dan Pemilik.
      </p>
    );
  }

  if (options.length === 0) {
    return (
      <p className="rounded-[10px] bg-surface-muted px-3 py-2 text-[13px] text-text-muted">
        Status {incidentStatusConfig[currentStatus]?.label ?? currentStatus} bersifat final.
      </p>
    );
  }

  const noteRequired = next === "RESOLVED" || next === "FALSE_POSITIVE";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (noteRequired && !note.trim()) {
      toast.error("Catatan wajib diisi untuk status ini.");
      return;
    }
    setPending(true);
    const result = await updateIncidentStatus(incidentId, next, note);
    setPending(false);
    if (result.ok) {
      toast.success(result.message);
      setNote("");
    } else {
      toast.error(result.message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="next-status">Ubah status ke</Label>
        <Select id="next-status" value={next} onChange={(e) => setNext(e.target.value)}>
          {options.map((status) => (
            <option key={status} value={status}>
              {incidentStatusConfig[status]?.label ?? status}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="note">
          Catatan {noteRequired ? "(wajib)" : "(opsional)"}
        </Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Tuliskan temuan, tindakan, atau alasan penutupan."
          rows={3}
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Menyimpan…" : "Simpan perubahan"}
      </Button>
    </form>
  );
}
