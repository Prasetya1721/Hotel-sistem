import { createHmac, timingSafeEqual } from "node:crypto";
import { doorEventBatchSchema, normalizeDoorEvents } from "@/lib/doors/normalize";
import { ingestDoorEvents } from "@/lib/doors/ingest";
import { writeAudit } from "@/lib/audit";

/** Batas ukuran body agar forwarder tidak bisa dipakai membanjiri memori. */
const MAX_BODY_BYTES = 1_000_000;

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Ingest event pintu dari forwarder vendor.
 *
 * Wajib bertanda tangan HMAC-SHA256 atas body mentah. Tanpa secret
 * terkonfigurasi endpoint menolak semua permintaan (fail closed) supaya
 * tidak pernah ada jalur tulis tanpa autentikasi.
 */
export async function POST(request: Request) {
  const secret = process.env.DOOR_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json(
      { error: "Endpoint ingest belum dikonfigurasi. Isi DOOR_WEBHOOK_SECRET." },
      { status: 503 },
    );
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return Response.json({ error: "Body terlalu besar." }, { status: 413 });
  }

  const provided = request.headers.get("x-door-signature")?.trim() ?? "";
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  if (!provided || !safeEqual(provided.replace(/^sha256=/, ""), expected)) {
    await writeAudit(
      null,
      "DOOR_INGEST_REJECTED",
      "DoorEvent",
      null,
      "Tanda tangan webhook tidak valid.",
      request.headers.get("x-forwarded-for") ?? undefined,
    );
    return Response.json({ error: "Tanda tangan tidak valid." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Body bukan JSON yang valid." }, { status: 400 });
  }

  const parsed = doorEventBatchSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { error: "Payload tidak sesuai skema.", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const events = normalizeDoorEvents(parsed.data, { source: "HARDWARE" });
  const result = await ingestDoorEvents(events);

  await writeAudit(
    null,
    "DOOR_INGEST_ACCEPTED",
    "DoorEvent",
    null,
    `provider=${parsed.data.provider} stored=${result.stored} skipped=${result.skipped} insiden=${result.incidentsOpened.length}`,
    request.headers.get("x-forwarded-for") ?? undefined,
  );

  return Response.json(result, { status: 202 });
}