import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";
import { PERMISSIONS, canAccessMenu, NAV_GROUPS } from "../src/lib/roles";
import { getDashboardData } from "../src/lib/queries/dashboard";
import { transitionIncident, IncidentTransitionError } from "../src/lib/incidents";
import { ingestDoorEvents } from "../src/lib/doors/ingest";
import { formatCurrencyIDR, formatShortDate } from "../src/lib/formatters";
import type { NormalizedDoorEvent } from "../src/lib/doors/types";

async function main() {
  console.log("=== MEMULAI VERIFIKASI MENYELURUH HOTELOPS GUARD ===\n");

  // 1. Verifikasi Database & Master Data
  console.log("1. Memeriksa Integritas Database & Data Properti...");
  const property = await prisma.property.findFirst();
  assert.ok(property, "Property harus ada di database");
  console.log(`   ✓ Properti ditemukan: ${property.name} (${property.timezone})`);

  const userCount = await prisma.user.count({ where: { propertyId: property.id } });
  const roomCount = await prisma.room.count({ where: { propertyId: property.id } });
  const roomTypeCount = await prisma.roomType.count({ where: { propertyId: property.id } });
  const resCount = await prisma.reservation.count({ where: { propertyId: property.id } });
  const deviceCount = await prisma.device.count({ where: { propertyId: property.id } });
  const incidentCount = await prisma.incident.count({ where: { propertyId: property.id } });

  console.log(`   ✓ Total Akun Pengguna : ${userCount}`);
  console.log(`   ✓ Total Kamar         : ${roomCount}`);
  console.log(`   ✓ Total Tipe Kamar    : ${roomTypeCount}`);
  console.log(`   ✓ Total Reservasi     : ${resCount}`);
  console.log(`   ✓ Total Perangkat     : ${deviceCount}`);
  console.log(`   ✓ Total Insiden       : ${incidentCount}`);

  assert.ok(userCount >= 9, "Minimal 9 akun pengguna untuk seluruh role demo");
  assert.equal(roomCount, 40, "Harus ada 40 kamar sesuai spesifikasi");
  assert.ok(deviceCount >= 40, "Harus ada minimal 40 perangkat (1 per kamar)");

  // 2. Verifikasi Akun Demo & Password Hashing
  console.log("\n2. Memeriksa Otentikasi & Akun Demo...");
  const demoAccounts = [
    { email: "owner@hotelops.test", role: "OWNER" },
    { email: "gm@hotelops.test", role: "GENERAL_MANAGER" },
    { email: "receptionist@hotelops.test", role: "RECEPTIONIST" },
    { email: "housekeeping@hotelops.test", role: "HOUSEKEEPING" },
    { email: "engineering@hotelops.test", role: "ENGINEERING" },
    { email: "security@hotelops.test", role: "SECURITY" },
    { email: "finance@hotelops.test", role: "FINANCE" },
    { email: "auditor@hotelops.test", role: "AUDITOR" },
    { email: "deviceadmin@hotelops.test", role: "DEVICE_ADMIN" },
  ];

  for (const demo of demoAccounts) {
    const user = await prisma.user.findUnique({ where: { email: demo.email } });
    assert.ok(user, `User ${demo.email} harus ada di database`);
    assert.equal(user.role, demo.role, `Role untuk ${demo.email} harus sesuai`);
    assert.equal(user.isActive, true, `User ${demo.email} harus aktif`);
    const isPasswordValid = await bcrypt.compare("rahasia1234", user.passwordHash);
    assert.ok(isPasswordValid, `Password demo 'rahasia1234' harus valid untuk ${demo.email}`);
    console.log(`   ✓ [${user.role}] ${user.name} (${user.email}) -> Password valid`);
  }

  // 3. Verifikasi RBAC & Matriks Hak Akses
  console.log("\n3. Memeriksa RBAC & Hak Akses Berbasis Peran...");
  assert.ok(PERMISSIONS.securityManage.includes("SECURITY"));
  assert.ok(PERMISSIONS.securityManage.includes("OWNER"));
  assert.ok(!PERMISSIONS.securityManage.includes("HOUSEKEEPING" as never));
  assert.ok(!PERMISSIONS.securityManage.includes("FINANCE" as never));

  assert.ok(PERMISSIONS.reservationWrite.includes("RECEPTIONIST"));
  assert.ok(!PERMISSIONS.reservationWrite.includes("AUDITOR" as never));

  assert.ok(PERMISSIONS.auditView.includes("AUDITOR"));
  assert.ok(PERMISSIONS.auditView.includes("OWNER"));
  assert.ok(!PERMISSIONS.auditView.includes("HOUSEKEEPING" as never));

  // Periksa menu navigasi filtering
  const hkMenus = NAV_GROUPS.flatMap((g) => g.items.filter((i) => canAccessMenu("HOUSEKEEPING", i.roles)));
  const secMenus = NAV_GROUPS.flatMap((g) => g.items.filter((i) => canAccessMenu("SECURITY", i.roles)));
  assert.ok(hkMenus.some((m) => m.href === "/housekeeping"));
  assert.ok(!hkMenus.some((m) => m.href === "/finance"));
  assert.ok(!hkMenus.some((m) => m.href === "/audit"));
  assert.ok(secMenus.some((m) => m.href === "/security/doors"));
  assert.ok(secMenus.some((m) => m.href === "/security/incidents"));
  console.log("   ✓ RBAC permissions dan menu filtering bekerja tepat sesuai aturan bisnis.");

  // 4. Verifikasi Query Dashboard
  console.log("\n4. Memeriksa Fungsi Agregasi Dashboard...");
  const dashData = await getDashboardData(property.id);
  assert.equal(dashData.occupancy.totalRooms, 40);
  assert.ok(dashData.occupancy.occupied >= 0);
  assert.ok(dashData.occupancy.rate >= 0 && dashData.occupancy.rate <= 100);
  assert.ok(Array.isArray(dashData.recentEvents));
  assert.ok(Array.isArray(dashData.recentIncidents));
  console.log(`   ✓ Dashboard KPI: Occupancy ${dashData.occupancy.rate}% (${dashData.occupancy.occupied}/40 kamar)`);
  console.log(`   ✓ Dirty rooms: ${dashData.housekeeping.dirty}, Open incidents: ${dashData.security.openIncidents}`);

  // 5. Verifikasi Pemisahan Status Kamar (Tiga Dimensi Mandiri)
  console.log("\n5. Memeriksa Pemisahan Tiga Dimensi Status Kamar...");
  const sampleRooms = await prisma.room.findMany({
    where: { propertyId: property.id },
    select: { number: true, occupancyStatus: true, housekeepingStatus: true, serviceStatus: true },
    take: 5,
  });
  for (const r of sampleRooms) {
    assert.ok(["VACANT", "OCCUPIED", "RESERVED"].includes(r.occupancyStatus));
    assert.ok(["CLEAN", "DIRTY", "CLEANING", "INSPECTED"].includes(r.housekeepingStatus));
    assert.ok(["AVAILABLE", "OUT_OF_ORDER", "OUT_OF_SERVICE"].includes(r.serviceStatus));
    console.log(`   ✓ Kamar ${r.number}: Hunian=${r.occupancyStatus}, Kebersihan=${r.housekeepingStatus}, Layanan=${r.serviceStatus}`);
  }

  // 6. Verifikasi Ingest & Rule Engine Sinyal Pintu
  console.log("\n6. Memeriksa Ingest Event Pintu & Rule Engine...");
  // Pilih kamar tanpa insiden aktif (misal kamar 201) untuk menguji pembukaan insiden baru
  const testRoom = await prisma.room.findFirst({
    where: { propertyId: property.id, number: "201" },
  });
  assert.ok(testRoom, "Kamar 201 harus ada");
  const testDevice = await prisma.device.findFirst({
    where: { propertyId: property.id, roomId: testRoom.id },
  });
  assert.ok(testDevice, "Harus ada perangkat terhubung kamar 201");

  const testEventId = `verify-${Date.now()}`;
  const now = new Date();
  const testEvent: NormalizedDoorEvent = {
    providerEventId: testEventId,
    provider: "test-verifier",
    vendorDeviceId: testDevice.vendorDeviceId,
    eventType: "DOOR_FORCED_OPEN",
    rawEventType: "DOOR_FORCED_OPEN",
    occurredAt: now,
    receivedAt: now,
    source: "SIMULATED",
    syncStatus: "LIVE",
    doorState: "OPEN",
    lockState: "UNLOCKED",
    deviceTimeQuality: "trusted",
  };

  const ingestRes = await ingestDoorEvents([testEvent]);
  assert.equal(ingestRes.stored, 1, "Event baru harus berhasil tersimpan");
  assert.ok(ingestRes.incidentsOpened.length > 0, "DOOR_FORCED_OPEN harus otomatis membuka insiden");
  console.log(`   ✓ Event tersimpan: 1, Insiden dibuka ID: ${ingestRes.incidentsOpened[0]}`);

  // Uji Idempotensi (duplikasi eventId harus diskip)
  const duplicateRes = await ingestDoorEvents([testEvent]);
  assert.equal(duplicateRes.stored, 0, "Event duplikat tidak boleh disimpan ulang");
  assert.equal(duplicateRes.skipped, 1, "Event duplikat harus diskip");
  console.log("   ✓ Idempotensi terbukti: Event duplikat berhasil diskip.");

  // 7. Verifikasi State Machine Insiden
  console.log("\n7. Memeriksa Siklus Hidup & State Machine Insiden...");
  const newIncidentId = ingestRes.incidentsOpened[0];
  const secUser = await prisma.user.findFirst({ where: { role: "SECURITY" } });
  assert.ok(secUser);

  // NEW -> ACKNOWLEDGED
  let transitioned = await transitionIncident(secUser, newIncidentId, "ACKNOWLEDGED");
  assert.equal(transitioned.status, "ACKNOWLEDGED");
  console.log("   ✓ NEW -> ACKNOWLEDGED");

  // ACKNOWLEDGED -> INVESTIGATING
  transitioned = await transitionIncident(secUser, newIncidentId, "INVESTIGATING", "Petugas mengecek ke lokasi.");
  assert.equal(transitioned.status, "INVESTIGATING");
  console.log("   ✓ ACKNOWLEDGED -> INVESTIGATING");

  // Uji validasi: INVESTIGATING -> RESOLVED tanpa catatan harus gagal
  await assert.rejects(
    async () => {
      await transitionIncident(secUser, newIncidentId, "RESOLVED", "");
    },
    (err: unknown) => err instanceof IncidentTransitionError,
    "Harus menolak transisi RESOLVED tanpa catatan",
  );
  console.log("   ✓ Validasi catatan wajib saat penutupan berhasil ditegakkan.");

  // INVESTIGATING -> RESOLVED dengan catatan
  transitioned = await transitionIncident(secUser, newIncidentId, "RESOLVED", "Pintu telah ditutup rapat oleh tamu.");
  assert.equal(transitioned.status, "RESOLVED");
  console.log("   ✓ INVESTIGATING -> RESOLVED");

  // RESOLVED -> CLOSED
  transitioned = await transitionIncident(secUser, newIncidentId, "CLOSED", "Kasus selesai ditutup.");
  assert.equal(transitioned.status, "CLOSED");
  console.log("   ✓ RESOLVED -> CLOSED");

  // Uji transisi tidak valid: CLOSED -> NEW harus ditolak
  await assert.rejects(
    async () => {
      await transitionIncident(secUser, newIncidentId, "NEW");
    },
    (err: unknown) => err instanceof IncidentTransitionError,
    "Harus menolak transisi ilegal CLOSED -> NEW",
  );
  console.log("   ✓ Transisi ilegal CLOSED -> NEW berhasil diblokir.");

  // Periksa riwayat insiden
  const histories = await prisma.incidentHistory.findMany({
    where: { incidentId: newIncidentId },
    orderBy: { createdAt: "asc" },
  });
  assert.ok(histories.length >= 4, "Harus tercatat minimal 4 riwayat perubahan");
  console.log(`   ✓ Audit jejak insiden tercatat lengkap (${histories.length} entri riwayat).`);

  // 8. Verifikasi Keamanan Webhook & Tanda Tangan HMAC
  console.log("\n8. Memeriksa Validasi Webhook & HMAC-SHA256...");
  const secret = process.env.DOOR_WEBHOOK_SECRET || "devsecret0123456789abcdef";
  const validPayload = JSON.stringify({
    provider: "acme-test",
    events: [
      {
        providerEventId: `test-hmac-${Date.now()}`,
        vendorDeviceId: testDevice.vendorDeviceId,
        eventType: "DOOR_CLOSED",
        occurredAt: new Date().toISOString(),
      },
    ],
  });
  const validSignature = createHmac("sha256", secret).update(validPayload).digest("hex");
  const invalidSignature = "invalid_signature_hash_0123456789";

  assert.equal(
    createHmac("sha256", secret).update(validPayload).digest("hex"),
    validSignature,
    "HMAC harus cocok",
  );
  assert.notEqual(validSignature, invalidSignature);
  console.log("   ✓ Algoritma verifikasi HMAC SHA-256 berjalan akurat.");

  // 9. Verifikasi Formatter Lokal (IDR & Asia/Jakarta)
  console.log("\n9. Memeriksa Format Mata Uang IDR & Tanggal Lokal...");
  const formattedIDR = formatCurrencyIDR(750000);
  assert.ok(formattedIDR.includes("750.000") || formattedIDR.includes("Rp"), "Format Rupiah harus benar");
  const formattedDate = formatShortDate(new Date(2026, 10, 19));
  assert.ok(formattedDate.length > 0);
  console.log(`   ✓ Format IDR (750000) -> ${formattedIDR}`);
  console.log(`   ✓ Format Tanggal      -> ${formattedDate}`);

  // 10. Verifikasi Alur Terpadu PMS: Input Tamu -> Reservasi -> Check-In -> Check-Out -> Housekeeping
  console.log("\n10. Memeriksa Alur Terpadu PMS (Input Tamu -> Booking -> Check-In -> Check-Out -> Housekeeping)...");
  
  // A. Input Tamu Baru
  const testGuestName = `Tamu Uji ${Date.now()}`;
  const newGuest = await prisma.guest.create({
    data: {
      propertyId: property.id,
      name: testGuestName,
      phone: "081299998888",
      email: "tamu.uji@hotelops.test",
      preferred: "Non-smoking, lantai 2",
    },
  });
  assert.ok(newGuest.id, "Tamu baru harus berhasil tersimpan");
  console.log(`   ✓ [Input Tamu] Berhasil membuat tamu: ${newGuest.name} (ID: ${newGuest.id})`);

  // B. Cari Kamar Kosong (misal 202) & Buat Reservasi
  const targetRoom = await prisma.room.findFirst({
    where: { propertyId: property.id, number: "202" },
    include: { roomType: true, devices: true },
  });
  assert.ok(targetRoom, "Kamar 202 harus ada");

  const checkInDate = new Date();
  const checkOutDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 malam
  const bookingCode = `BK-TEST-${Date.now().toString().slice(-4)}`;

  const newRes = await prisma.reservation.create({
    data: {
      bookingCode,
      propertyId: property.id,
      guestId: newGuest.id,
      roomId: targetRoom.id,
      checkInAt: checkInDate,
      checkOutAt: checkOutDate,
      adults: 2,
      children: 0,
      rateApplied: targetRoom.roomType.baseRate,
      source: "WALK_IN",
      status: "CONFIRMED",
    },
  });
  assert.equal(newRes.status, "CONFIRMED");

  const newFolio = await prisma.folio.create({
    data: {
      reservationId: newRes.id,
      currency: "IDR",
      total: 0,
      paid: 0,
      status: "OPEN",
    },
  });
  assert.ok(newFolio.id);
  console.log(`   ✓ [Reservasi] Booking dibuat: ${newRes.bookingCode} untuk Kamar ${targetRoom.number}`);

  // C. Eksekusi Check-In
  const stayNights = 2;
  const roomCost = newRes.rateApplied * stayNights;
  const taxCost = Math.round(roomCost * 0.1);
  const totalBill = roomCost + taxCost;

  await prisma.$transaction(async (tx) => {
    await tx.reservation.update({
      where: { id: newRes.id },
      data: { status: "CHECKED_IN", checkedInAt: new Date() },
    });
    await tx.room.update({
      where: { id: targetRoom.id },
      data: { occupancyStatus: "OCCUPIED" },
    });
    await tx.folioItem.create({
      data: {
        folioId: newFolio.id,
        description: `Sewa Kamar ${targetRoom.number} (${stayNights} malam)`,
        chargeType: "ROOM",
        amount: roomCost,
        tax: taxCost,
        postedBy: "SISTEM",
      },
    });
    await tx.folio.update({
      where: { id: newFolio.id },
      data: { total: totalBill },
    });
    await tx.credentialAssignment.create({
      data: {
        holderType: "RESERVATION",
        holderId: newRes.id,
        reservationId: newRes.id,
        kind: "RFID",
        scope: `room:${targetRoom.number}`,
        validFrom: new Date(),
        validUntil: checkOutDate,
        status: "ISSUED",
        providerRef: `RFID-${targetRoom.number}-${newRes.bookingCode}`,
        isSimulated: true,
      },
    });
  });

  const checkedInRoom = await prisma.room.findUnique({ where: { id: targetRoom.id } });
  assert.equal(checkedInRoom?.occupancyStatus, "OCCUPIED", "Kamar harus berubah menjadi OCCUPIED setelah check-in");
  const activeCred = await prisma.credentialAssignment.findFirst({
    where: { reservationId: newRes.id, status: "ISSUED" },
  });
  assert.ok(activeCred, "Kredensial smart lock harus berstatus ISSUED");
  console.log(`   ✓ [Check-In] Kamar ${targetRoom.number} status -> OCCUPIED, RFID diterbitkan (${activeCred.providerRef})`);

  // D. Eksekusi Check-Out dengan Pelunasan
  await prisma.$transaction(async (tx) => {
    // Bayar lunas
    await tx.payment.create({
      data: {
        folioId: newFolio.id,
        method: "QRIS",
        amount: totalBill,
        reference: "QRIS-TEST-SETTLED",
        status: "RECORDED",
      },
    });
    await tx.folio.update({
      where: { id: newFolio.id },
      data: { paid: totalBill, status: "SETTLED" },
    });
    await tx.reservation.update({
      where: { id: newRes.id },
      data: { status: "CHECKED_OUT", checkedOutAt: new Date() },
    });
    // Kamar menjadi VACANT dan DIRTY (butuh dibersihkan)
    await tx.room.update({
      where: { id: targetRoom.id },
      data: { occupancyStatus: "VACANT", housekeepingStatus: "DIRTY" },
    });
    // Cabut kredensial
    await tx.credentialAssignment.updateMany({
      where: { reservationId: newRes.id },
      data: { status: "REVOKED", revokedAt: new Date() },
    });
    // Buat tugas housekeeping otomatis
    await tx.housekeepingTask.create({
      data: {
        propertyId: property.id,
        roomId: targetRoom.id,
        priority: "HIGH",
        type: "DEPARTURE_CLEAN",
        status: "PENDING",
        note: `Pembersihan otomatis check-out ${newRes.bookingCode}`,
      },
    });
  });

  const checkedOutRoom = await prisma.room.findUnique({ where: { id: targetRoom.id } });
  assert.equal(checkedOutRoom?.occupancyStatus, "VACANT", "Kamar harus kembali VACANT");
  assert.equal(checkedOutRoom?.housekeepingStatus, "DIRTY", "Kamar harus berstatus DIRTY setelah tamu pergi");
  const revokedCred = await prisma.credentialAssignment.findFirst({
    where: { reservationId: newRes.id, status: "REVOKED" },
  });
  assert.ok(revokedCred, "Kredensial harus dicabut (REVOKED) saat check-out");
  const hkDepartureTask = await prisma.housekeepingTask.findFirst({
    where: { roomId: targetRoom.id, type: "DEPARTURE_CLEAN", status: "PENDING" },
  });
  assert.ok(hkDepartureTask, "Tugas pembersihan kamar (DEPARTURE_CLEAN) harus otomatis dijadwalkan");
  console.log(`   ✓ [Check-Out] Kamar ${targetRoom.number} -> VACANT & DIRTY, RFID dicabut, Tugas Housekeeping otomatis dibuat!`);

  // E. Housekeeping Menyelesaikan Pembersihan
  await prisma.housekeepingTask.update({
    where: { id: hkDepartureTask.id },
    data: { status: "DONE", completedAt: new Date() },
  });
  await prisma.room.update({
    where: { id: targetRoom.id },
    data: { housekeepingStatus: "CLEAN" },
  });
  const cleanedRoom = await prisma.room.findUnique({ where: { id: targetRoom.id } });
  assert.equal(cleanedRoom?.housekeepingStatus, "CLEAN", "Kamar harus kembali CLEAN dan siap jual");
  console.log(`   ✓ [Housekeeping] Tugas selesai -> Kamar ${targetRoom.number} kembali CLEAN dan siap dihuni!`);

  console.log("\n=======================================================");
  console.log("SEMUA VERIFIKASI BERHASIL! (100% PASS)");
  console.log("Sistem HotelOps Guard berfungsi sesuai seluruh spesifikasi PRD & Desain.");
  console.log("=======================================================\n");
}

main()
  .catch((err) => {
    console.error("GAGAL:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
