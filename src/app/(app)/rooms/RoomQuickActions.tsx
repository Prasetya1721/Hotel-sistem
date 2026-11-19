"use client";

import * as React from "react";
import { Sparkles, Ban, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateRoomStatusAction } from "@/app/(app)/rooms/actions";

export default function RoomQuickActions({
  roomId,
  housekeepingStatus,
  serviceStatus,
}: {
  roomId: string;
  housekeepingStatus: string;
  serviceStatus: string;
  roomNumber?: string;
}) {
  const [pending, setPending] = React.useState(false);

  async function handleToggleHousekeeping() {
    setPending(true);
    const newStatus = housekeepingStatus === "CLEAN" ? "DIRTY" : "CLEAN";
    const res = await updateRoomStatusAction(roomId, { housekeepingStatus: newStatus });
    setPending(false);

    if (res.ok) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  }

  async function handleToggleService() {
    setPending(true);
    const newStatus = serviceStatus === "AVAILABLE" ? "OUT_OF_ORDER" : "AVAILABLE";
    const res = await updateRoomStatusAction(roomId, { serviceStatus: newStatus });
    setPending(false);

    if (res.ok) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="mt-3 flex items-center justify-between gap-1 border-t border-border pt-2.5">
      <Button
        size="sm"
        variant="ghost"
        onClick={handleToggleHousekeeping}
        disabled={pending}
        className="h-7 px-2 text-[11px] font-medium text-text-muted hover:text-teal-700"
        title={housekeepingStatus === "CLEAN" ? "Tandai Perlu Dibersihkan" : "Tandai Bersih"}
      >
        {housekeepingStatus === "CLEAN" ? (
          <span className="flex items-center gap-1">Set Kotor</span>
        ) : (
          <span className="flex items-center gap-1 text-teal-700 font-semibold">
            <Sparkles className="h-3 w-3" />
            Set Bersih
          </span>
        )}
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={handleToggleService}
        disabled={pending}
        className="h-7 px-2 text-[11px] font-medium text-text-muted hover:text-danger"
        title={serviceStatus === "AVAILABLE" ? "Set Out of Order" : "Set Siap Pakai"}
      >
        {serviceStatus === "AVAILABLE" ? (
          <span className="flex items-center gap-1">
            <Ban className="h-3 w-3 text-text-muted" />
            Out of Order
          </span>
        ) : (
          <span className="flex items-center gap-1 text-success font-semibold">
            <CheckCircle className="h-3 w-3" />
            Set Siap
          </span>
        )}
      </Button>
    </div>
  );
}
