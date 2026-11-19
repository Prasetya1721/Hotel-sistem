"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { PERMISSIONS } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

const createReservationSchema = z.object({
  guestMode: z.enum(["existing", "new"]).default("existing"),
  guestId: z.string().optional(),
  newGuestName: z.string().optional(),
  newGuestPhone: z.string().optional(),
  newGuestEmail: z.string().optional(),
  newGuestPreferred: z.string().optional(),
  roomId: z.string().min(1, "Pilih kamar"),
  checkInAt: z.string().min(1, "Tanggal check-in wajib diisi"),
  checkOutAt: z.string().min(1, "Tanggal check-out wajib diisi"),
  adults: z.number().int().min(1).default(1),
  children: z.number().int().min(0).default(0),
  rateApplied: z.number().int().positive("Tarif harus bernilai positif"),
  source: z.string().default("WALK_IN"),
  notes: z.string().optional(),
  instantCheckIn: z.boolean().default(false),
});

export async function createReservationAction(formData: {
  guestMode?: "existing" | "new";
  guestId?: string;
  newGuestName?: string;
  newGuestPhone?: string;
  newGuestEmail?: string;
  newGuestPreferred?: string;
  roomId: string;
  checkInAt: string;
  checkOutAt: string;
  adults?: number;
  children?: number;
  rateApplied: number;
  source?: string;
  notes?: string;
  instantCheckIn?: boolean;
}) {
  const user = await requireUser();

  if (!PERMISSIONS.reservationWrite.includes(user.role as never)) {
    return { ok: false, message: "Peran Anda tidak berwenang membuat reservasi." };
  }

  const parsed = createReservationSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Data reservasi tidak valid." };
  }

  const { guestMode, guestId, newGuestName, newGuestPhone, newGuestEmail, newGuestPreferred, instantCheckIn } = parsed.data;

  if (guestMode === "existing" && !guestId) {
    return { ok: false, message: "Pilih tamu terdaftar atau beralih ke tab Tamu Baru." };
  }

  if (guestMode === "new" && (!newGuestName || newGuestName.trim().length < 2)) {
    return { ok: false, message: "Nama tamu baru minimal 2 karakter." };
  }

  const checkIn = new Date(parsed.data.checkInAt);
  const checkOut = new Date(parsed.data.checkOutAt);

  if (checkOut <= checkIn) {
    return { ok: false, message: "Tanggal check-out harus setelah tanggal check-in." };
  }

  // Cek ketersediaan kamar
  const room = await prisma.room.findUnique({
    where: { id: parsed.data.roomId },
    include: { devices: true },
  });

  if (!room) {
    return { ok: false, message: "Kamar tidak ditemukan." };
  }

  if (instantCheckIn && room.occupancyStatus === "OCCUPIED") {
    return { ok: false, message: `Kamar ${room.number} saat ini masih terisi oleh tamu lain.` };
  }

  if (instantCheckIn && room.serviceStatus === "OUT_OF_ORDER") {
    return { ok: false, message: `Kamar ${room.number} sedang tidak siap huni (Out of Order).` };
  }

  // Validasi bentrokan booking pada kamar tersebut
  const conflict = await prisma.reservation.findFirst({
    where: {
      propertyId: user.propertyId,
      roomId: parsed.data.roomId,
      status: { in: ["CONFIRMED", "CHECKED_IN", "HOLD"] },
      checkInAt: { lt: checkOut },
      checkOutAt: { gt: checkIn },
    },
    include: { guest: { select: { name: true } } },
  });

  if (conflict) {
    return {
      ok: false,
      message: `Kamar ${room.number} sudah terpesan oleh ${conflict.guest.name} pada periode tersebut.`,
    };
  }

  const now = new Date();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const bookingCode = `BK-${Date.now().toString().slice(-4)}${randomSuffix}`;

  const diffDays = Math.max(
    1,
    Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const roomCharge = parsed.data.rateApplied * diffDays;
  const tax = Math.round(roomCharge * 0.1);
  const totalAmount = roomCharge + tax;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Tentukan Guest ID (Buat baru atau pakai yang ada)
      let resolvedGuestId = guestId!;
      let resolvedGuestName = "";

      if (guestMode === "new") {
        const createdGuest = await tx.guest.create({
          data: {
            propertyId: user.propertyId,
            name: newGuestName!.trim(),
            phone: newGuestPhone?.trim() || null,
            email: newGuestEmail?.trim() || null,
            preferred: newGuestPreferred?.trim() || null,
          },
        });
        resolvedGuestId = createdGuest.id;
        resolvedGuestName = createdGuest.name;
      } else {
        const existingGuest = await tx.guest.findUnique({ where: { id: guestId } });
        resolvedGuestName = existingGuest?.name ?? "Tamu";
      }

      // 2. Buat Reservasi
      const reservation = await tx.reservation.create({
        data: {
          bookingCode,
          propertyId: user.propertyId,
          guestId: resolvedGuestId,
          roomId: parsed.data.roomId,
          checkInAt: checkIn,
          checkOutAt: checkOut,
          adults: parsed.data.adults ?? 1,
          children: parsed.data.children ?? 0,
          rateApplied: parsed.data.rateApplied,
          source: parsed.data.source ?? "WALK_IN",
          status: instantCheckIn ? "CHECKED_IN" : "CONFIRMED",
          notes: parsed.data.notes || null,
          checkedInAt: instantCheckIn ? now : null,
          checkedInById: instantCheckIn ? user.id : null,
        },
      });

      // 3. Buat Folio
      const folio = await tx.folio.create({
        data: {
          reservationId: reservation.id,
          currency: "IDR",
          total: instantCheckIn ? totalAmount : 0,
          paid: 0,
          status: "OPEN",
        },
      });

      // 4. Jika Instant Check-In (Walk-In langsung masuk kamar)
      if (instantCheckIn) {
        // Update kamar jadi OCCUPIED
        await tx.room.update({
          where: { id: room.id },
          data: { occupancyStatus: "OCCUPIED" },
        });

        // Catat tagihan sewa kamar
        await tx.folioItem.create({
          data: {
            folioId: folio.id,
            description: `Sewa Kamar ${room.number} (${diffDays} malam)`,
            chargeType: "ROOM",
            amount: roomCharge,
            tax,
            postedBy: user.name,
            postedAt: now,
          },
        });

        // Terbitkan Kredensial Akses Pintu Smart Lock
        const credRef = `RFID-${room.number}-${bookingCode}`;
        const cred = await tx.credentialAssignment.create({
          data: {
            holderType: "RESERVATION",
            holderId: reservation.id,
            reservationId: reservation.id,
            kind: "RFID",
            scope: `room:${room.number}`,
            validFrom: now,
            validUntil: checkOut,
            status: "ISSUED",
            issuedById: user.id,
            providerRef: credRef,
            isSimulated: true,
          },
        });

        // Catat audit log event pintu jika kamar ada smart lock
        const targetDevice = room.devices[0];
        if (targetDevice) {
          await tx.doorEvent.create({
            data: {
              providerEventId: `CRED-ISS-${cred.id}`,
              provider: "simulated",
              propertyId: user.propertyId,
              roomId: room.id,
              deviceId: targetDevice.id,
              credentialId: cred.id,
              eventType: "CREDENTIAL_ISSUED",
              rawEventType: "CREDENTIAL_ISSUED",
              occurredAt: now,
              receivedAt: now,
              source: "SYSTEM",
              syncStatus: "LIVE",
              actorLabel: `Resepsionis: ${user.name}`,
            },
          });
        }
      }

      return { reservation, guestName: resolvedGuestName };
    });

    await writeAudit(
      user,
      instantCheckIn ? "WALK_IN_CHECK_IN" : "RESERVATION_CREATED",
      "Reservation",
      result.reservation.id,
      instantCheckIn
        ? `Walk-in instan: Tamu ${result.guestName} langsung check-in di Kamar ${room.number} (${bookingCode})`
        : `Reservasi baru dibuat: ${bookingCode} untuk tamu ${result.guestName} di Kamar ${room.number}`,
    );

    revalidatePath("/front-desk");
    revalidatePath("/availability");
    revalidatePath("/rooms");
    revalidatePath("/guests");
    revalidatePath("/finance");
    revalidatePath("/dashboard");

    return {
      ok: true,
      message: instantCheckIn
        ? `Walk-in berhasil! Tamu ${result.guestName} langsung check-in di Kamar ${room.number} & kunci RFID telah aktif.`
        : `Reservasi ${bookingCode} untuk tamu ${result.guestName} berhasil dibuat.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal memproses reservasi.",
    };
  }
}

export async function checkInAction(reservationId: string, assignedRoomId?: string) {
  const user = await requireUser();

  if (!PERMISSIONS.reservationWrite.includes(user.role as never)) {
    return { ok: false, message: "Peran Anda tidak berwenang melakukan check-in." };
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      room: { include: { devices: true } },
      guest: true,
      folio: true,
    },
  });

  if (!reservation) {
    return { ok: false, message: "Data reservasi tidak ditemukan." };
  }

  if (reservation.status === "CHECKED_IN") {
    return { ok: false, message: "Tamu sudah berstatus check-in sebelumnya." };
  }

  const roomId = assignedRoomId || reservation.roomId;
  if (!roomId) {
    return { ok: false, message: "Kamar belum ditentukan untuk reservasi ini." };
  }

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { devices: true },
  });

  if (!room) {
    return { ok: false, message: "Kamar tidak ditemukan." };
  }

  if (room.occupancyStatus === "OCCUPIED") {
    return { ok: false, message: `Kamar ${room.number} saat ini masih terisi oleh tamu lain.` };
  }

  if (room.serviceStatus === "OUT_OF_ORDER") {
    return { ok: false, message: `Kamar ${room.number} sedang dalam perbaikan (Out of Order).` };
  }

  const now = new Date();
  const diffDays = Math.max(
    1,
    Math.ceil((reservation.checkOutAt.getTime() - reservation.checkInAt.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const roomCharge = reservation.rateApplied * diffDays;
  const tax = Math.round(roomCharge * 0.1);
  const totalAmount = roomCharge + tax;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Update status reservasi
      await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: "CHECKED_IN",
          roomId,
          checkedInAt: now,
          checkedInById: user.id,
        },
      });

      // 2. Update status kamar
      await tx.room.update({
        where: { id: roomId },
        data: { occupancyStatus: "OCCUPIED" },
      });

      // 3. Update Folio & Tambah Biaya Kamar
      let folio = reservation.folio[0];
      if (!folio) {
        folio = await tx.folio.create({
          data: {
            reservationId: reservation.id,
            currency: "IDR",
            total: 0,
            paid: 0,
            status: "OPEN",
          },
        });
      }

      await tx.folioItem.createMany({
        data: [
          {
            folioId: folio.id,
            description: `Sewa Kamar ${room.number} (${diffDays} malam)`,
            chargeType: "ROOM",
            amount: roomCharge,
            tax,
            postedBy: user.name,
            postedAt: now,
          },
        ],
      });

      await tx.folio.update({
        where: { id: folio.id },
        data: { total: folio.total + totalAmount },
      });

      // 4. Terbitkan Kredensial Akses Pintu (RFID Card)
      const credRef = `RFID-${room.number}-${reservation.bookingCode}`;
      const cred = await tx.credentialAssignment.create({
        data: {
          holderType: "RESERVATION",
          holderId: reservation.id,
          reservationId: reservation.id,
          kind: "RFID",
          scope: `room:${room.number}`,
          validFrom: now,
          validUntil: reservation.checkOutAt,
          status: "ISSUED",
          issuedById: user.id,
          providerRef: credRef,
          isSimulated: true,
        },
      });

      // 5. Catat event penerbitan kredensial ke audit pintu (DoorEvent) jika device ada
      const targetDevice = room.devices[0];
      if (targetDevice) {
        await tx.doorEvent.create({
          data: {
            providerEventId: `CRED-ISS-${cred.id}`,
            provider: "simulated",
            propertyId: user.propertyId,
            roomId: room.id,
            deviceId: targetDevice.id,
            credentialId: cred.id,
            eventType: "CREDENTIAL_ISSUED",
            rawEventType: "CREDENTIAL_ISSUED",
            occurredAt: now,
            receivedAt: now,
            source: "SYSTEM",
            syncStatus: "LIVE",
            actorLabel: `Resepsionis: ${user.name}`,
          },
        });
      }
    });

    await writeAudit(
      user,
      "CHECK_IN_PROCESSED",
      "Reservation",
      reservation.id,
      `Tamu ${reservation.guest.name} check-in ke kamar ${room.number}`,
    );

    revalidatePath("/front-desk");
    revalidatePath("/rooms");
    revalidatePath("/availability");
    revalidatePath("/finance");
    revalidatePath("/dashboard");

    return {
      ok: true,
      message: `Check-in berhasil! Tamu ${reservation.guest.name} menempati Kamar ${room.number}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal memproses check-in.",
    };
  }
}

export async function checkOutAction(
  reservationId: string,
  options?: { settlePayment?: boolean; paymentMethod?: string },
) {
  const user = await requireUser();

  if (!PERMISSIONS.reservationWrite.includes(user.role as never)) {
    return { ok: false, message: "Peran Anda tidak berwenang memproses check-out." };
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      room: { include: { devices: true } },
      guest: true,
      folio: { include: { items: true, payments: true } },
      credentials: { where: { status: "ISSUED" } },
    },
  });

  if (!reservation) {
    return { ok: false, message: "Reservasi tidak ditemukan." };
  }

  if (reservation.status !== "CHECKED_IN") {
    return { ok: false, message: "Hanya tamu yang berstatus check-in yang dapat check-out." };
  }

  const now = new Date();
  const folio = reservation.folio[0];
  const outstanding = folio ? Math.max(0, folio.total - folio.paid) : 0;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Jika ada pelunasan otomatis saat check-out
      if (options?.settlePayment && outstanding > 0 && folio) {
        await tx.payment.create({
          data: {
            folioId: folio.id,
            method: options.paymentMethod || "CASH",
            amount: outstanding,
            reference: `Pelunasan saat Check-out oleh ${user.name}`,
            status: "RECORDED",
            processedAt: now,
          },
        });
        await tx.folio.update({
          where: { id: folio.id },
          data: { paid: folio.total, status: "SETTLED" },
        });
      } else if (folio && folio.paid >= folio.total) {
        await tx.folio.update({
          where: { id: folio.id },
          data: { status: "SETTLED" },
        });
      }

      // 2. Update status reservasi
      await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: "CHECKED_OUT",
          checkedOutAt: now,
          checkedOutById: user.id,
        },
      });

      // 3. Update status kamar: Kosong tapi Kotor (DIRTY)
      if (reservation.roomId) {
        await tx.room.update({
          where: { id: reservation.roomId },
          data: {
            occupancyStatus: "VACANT",
            housekeepingStatus: "DIRTY",
          },
        });

        // 4. Buat Tugas Housekeeping Otomatis (DEPARTURE_CLEAN)
        await tx.housekeepingTask.create({
          data: {
            propertyId: user.propertyId,
            roomId: reservation.roomId,
            priority: "HIGH",
            type: "DEPARTURE_CLEAN",
            status: "PENDING",
            targetAt: new Date(now.getTime() + 60 * 60 * 1000),
            note: `Pembersihan kamar check-out tamu ${reservation.guest.name} (${reservation.bookingCode})`,
          },
        });
      }

      // 5. Cabut seluruh kredensial akses pintu
      for (const cred of reservation.credentials) {
        await tx.credentialAssignment.update({
          where: { id: cred.id },
          data: {
            status: "REVOKED",
            revokedAt: now,
            revokeStatus: "CHECK_OUT",
          },
        });

        // Catat event pencabutan kunci di DoorEvent
        const device = reservation.room?.devices[0];
        if (device && reservation.roomId) {
          await tx.doorEvent.create({
            data: {
              providerEventId: `CRED-REV-${cred.id}-${now.getTime()}`,
              provider: "simulated",
              propertyId: user.propertyId,
              roomId: reservation.roomId,
              deviceId: device.id,
              credentialId: cred.id,
              eventType: "CREDENTIAL_REVOKED",
              rawEventType: "CREDENTIAL_REVOKED",
              occurredAt: now,
              receivedAt: now,
              source: "SYSTEM",
              syncStatus: "LIVE",
              actorLabel: `Resepsionis: ${user.name}`,
            },
          });
        }
      }
    });

    await writeAudit(
      user,
      "CHECK_OUT_PROCESSED",
      "Reservation",
      reservation.id,
      `Tamu ${reservation.guest.name} check-out dari kamar ${reservation.room?.number ?? "-"}`,
    );

    revalidatePath("/front-desk");
    revalidatePath("/rooms");
    revalidatePath("/availability");
    revalidatePath("/housekeeping");
    revalidatePath("/finance");
    revalidatePath("/dashboard");

    return {
      ok: true,
      message: `Check-out tamu ${reservation.guest.name} selesai. Kamar ${reservation.room?.number ?? ""} telah dijadwalkan untuk dibersihkan.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal memproses check-out.",
    };
  }
}

export async function cancelReservationAction(reservationId: string, reason?: string) {
  const user = await requireUser();

  if (!PERMISSIONS.reservationWrite.includes(user.role as never)) {
    return { ok: false, message: "Peran Anda tidak berwenang membatalkan reservasi." };
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { guest: true },
  });

  if (!reservation) {
    return { ok: false, message: "Reservasi tidak ditemukan." };
  }

  if (reservation.status === "CHECKED_IN") {
    return { ok: false, message: "Tamu yang sudah check-in tidak dapat dibatalkan, silakan lakukan check-out." };
  }

  try {
    await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: "CANCELLED",
        notes: reason ? `${reservation.notes ? reservation.notes + "\n" : ""}Dibatalkan: ${reason}` : reservation.notes,
      },
    });

    await writeAudit(
      user,
      "RESERVATION_CANCELLED",
      "Reservation",
      reservation.id,
      `Reservasi ${reservation.bookingCode} tamu ${reservation.guest.name} dibatalkan. Alasan: ${reason || "-"}`,
    );

    revalidatePath("/front-desk");
    revalidatePath("/availability");
    revalidatePath("/rooms");
    revalidatePath("/dashboard");

    return { ok: true, message: `Reservasi ${reservation.bookingCode} berhasil dibatalkan.` };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal membatalkan reservasi.",
    };
  }
}
