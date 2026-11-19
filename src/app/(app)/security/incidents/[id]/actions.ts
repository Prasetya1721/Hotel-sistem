"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { PERMISSIONS } from "@/lib/roles";
import { transitionIncident } from "@/lib/incidents";
import { writeAudit } from "@/lib/audit";

export interface ActionResult {
  ok: boolean;
  message: string;
}

export async function updateIncidentStatus(
  incidentId: string,
  toStatus: string,
  note: string,
): Promise<ActionResult> {
  const user = await requireUser();

  if (!PERMISSIONS.incidentManage.includes(user.role as never)) {
    return { ok: false, message: "Peran Anda tidak berwenang mengubah status insiden." };
  }

  try {
    await transitionIncident(user, incidentId, toStatus, note);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal mengubah status insiden.",
    };
  }

  await writeAudit(
    user,
    "INCIDENT_STATUS_CHANGED",
    "Incident",
    incidentId,
    `Status diubah ke ${toStatus}. Catatan: ${note || "-"}`,
  );

  revalidatePath("/security/incidents");
  revalidatePath(`/security/incidents/${incidentId}`);
  revalidatePath("/dashboard");
  return { ok: true, message: "Status insiden diperbarui." };
}
