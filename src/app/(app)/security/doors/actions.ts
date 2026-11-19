"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { PERMISSIONS } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { getDoorProvider, isSimulatorEnabled } from "@/lib/doors";
import { ingestDoorEvents } from "@/lib/doors/ingest";
import { writeAudit } from "@/lib/audit";

export interface SimulateResult {
  ok: boolean;
  message: string;
}

/**
 * Tarik satu event dari provider simulasi lalu masukkan lewat jalur ingest
 * yang sama dengan webhook hardware, supaya deduplikasi dan rule engine
 * benar-benar teruji.
 */
export async function simulateDoorEventAction(): Promise<SimulateResult> {
  const user = await requireUser();

  if (!PERMISSIONS.securityManage.includes(user.role as never)) {
    return { ok: false, message: "Peran Anda tidak berwenang memicu event perangkat." };
  }
  if (!isSimulatorEnabled()) {
    return { ok: false, message: "Simulator nonaktif. Set ENABLE_SIMULATOR=true di luar production." };
  }

  const devices = await prisma.device.findMany({
    where: { propertyId: user.propertyId, roomId: { not: null } },
    select: { vendorDeviceId: true },
  });
  if (devices.length === 0) {
    return { ok: false, message: "Belum ada perangkat terhubung kamar untuk disimulasikan." };
  }

  try {
    const events = await getDoorProvider().fetchEvents(devices.map((d) => d.vendorDeviceId));
    const result = await ingestDoorEvents(events);

    await writeAudit(
      user,
      "DOOR_EVENT_SIMULATED",
      "DoorEvent",
      null,
      `stored=${result.stored} skipped=${result.skipped} insiden=${result.incidentsOpened.length}`,
    );

    revalidatePath("/security/doors");
    revalidatePath("/security/incidents");
    revalidatePath("/dashboard");

    if (result.stored === 0) {
      return { ok: false, message: "Event tidak tersimpan. Periksa pemetaan perangkat ke kamar." };
    }
    return {
      ok: true,
      message:
        result.incidentsOpened.length > 0
          ? `Event tersimpan. ${result.incidentsOpened.length} insiden dibuka.`
          : "Event tersimpan. Tidak ada insiden baru.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal memicu event simulasi.",
    };
  }
}