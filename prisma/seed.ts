import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const MIN = 60 * 1000;

async function main() {
  const property = await prisma.property.upsert({
    where: { id: "prop-demo" },
    update: {},
    create: {
      id: "prop-demo",
      name: "Hotel Cuan Indah",
      timezone: "Asia/Jakarta",
      currency: "IDR",
      address: "Jl. Merdeka No. 1, Jakarta",
      floors: 4,
    },
  });

  const passwordHash = await bcrypt.hash("rahasia1234", 10);
  const staffSeed = [
    ["U-OWNER", "Pemilik Hotel", "owner@hotelops.test", "OWNER"],
    ["U-GM", "Budi Santoso", "gm@hotelops.test", "GENERAL_MANAGER"],
    ["U-REC", "Siti Aminah", "receptionist@hotelops.test", "RECEPTIONIST"],
    ["U-HK", "Joko Susilo", "housekeeping@hotelops.test", "HOUSEKEEPING"],
    ["U-ENG", "Andi Wijaya", "engineering@hotelops.test", "ENGINEERING"],
    ["U-SEC", "Rudi Hartono", "security@hotelops.test", "SECURITY"],
    ["U-FIN", "Dewi Lestari", "finance@hotelops.test", "FINANCE"],
    ["U-AUD", "Tono Prasojo", "auditor@hotelops.test", "AUDITOR"],
    ["U-DEV", "Agus Kurniawan", "deviceadmin@hotelops.test", "DEVICE_ADMIN"],
  ] as const;

  const users: Record<string, string> = {};
  for (const [id, name, email, role] of staffSeed) {
    const u = await prisma.user.upsert({
      where: { email },
      update: { name, role },
      create: {
        id,
        propertyId: property.id,
        name,
        email,
        passwordHash,
        role,
        employeeCode: id.replace("U-", "EMP-"),
      },
    });
    users[role] = u.id;
  }

  const roomTypes = [
    { code: "STD", name: "Standard Twin", capacity: 2, baseRate: 500000, perFloor: 4 },
    { code: "SUP", name: "Superior Queen", capacity: 2, baseRate: 700000, perFloor: 3 },
    { code: "DLX", name: "Deluxe King", capacity: 2, baseRate: 1000000, perFloor: 2 },
    { code: "STE", name: "Suite", capacity: 4, baseRate: 1800000, perFloor: 1 },
  ];

  const typeByCode: Record<string, string> = {};
  for (const t of roomTypes) {
    const rt = await prisma.roomType.upsert({
      where: { propertyId_code: { propertyId: property.id, code: t.code } },
      update: { baseRate: t.baseRate, capacity: t.capacity },
      create: {
        propertyId: property.id,
        code: t.code,
        name: t.name,
        capacity: t.capacity,
        baseRate: t.baseRate,
      },
    });
    typeByCode[t.code] = rt.id;
  }

  const rooms: Record<string, { id: string; rate: number }> = {};
  for (let floor = 1; floor <= 4; floor++) {
    let index = 1;
    for (const t of roomTypes) {
      for (let n = 0; n < t.perFloor; n++) {
        const number = `${floor}${String(index).padStart(2, "0")}`;
        index += 1;
        const rate = t.baseRate + floor * 50000;
        const room = await prisma.room.upsert({
          where: { propertyId_number: { propertyId: property.id, number } },
          update: {},
          create: {
            propertyId: property.id,
            roomTypeId: typeByCode[t.code],
            number,
            floor,
            maxGuests: t.capacity,
          },
        });
        rooms[number] = { id: room.id, rate };
      }
    }
  }

  const now = new Date();
  const checkInAt = new Date(now.getTime() - 2 * DAY);
  const checkOutAt = new Date(now.getTime() + 3 * DAY);

  const guestSeed = [
    ["G-1", "Bambang Pamungkas", "081200000001"],
    ["G-2", "Sarah Connor", "081200000002"],
    ["G-3", "Rina Wijaya", "081200000003"],
    ["G-4", "David Beckham", "081200000004"],
  ] as const;
  for (const [id, name, phone] of guestSeed) {
    await prisma.guest.upsert({
      where: { id },
      update: {},
      create: { id, propertyId: property.id, name, phone },
    });
  }

  const reservationSeed = [
    {
      code: "BK-1001",
      guestId: "G-1",
      room: "305",
      status: "CHECKED_IN",
      rate: rooms["305"].rate,
      checkInAt,
      checkOutAt,
      source: "WALK_IN",
    },
    {
      code: "BK-1002",
      guestId: "G-2",
      room: "102",
      status: "CHECKED_IN",
      rate: rooms["102"].rate,
      checkInAt,
      checkOutAt,
      source: "AGODA",
    },
    {
      code: "BK-1003",
      guestId: "G-3",
      room: "203",
      status: "CONFIRMED",
      rate: rooms["203"].rate,
      checkInAt: new Date(now.getTime() + DAY),
      checkOutAt: new Date(now.getTime() + 4 * DAY),
      source: "TRAVELOKA",
    },
    {
      code: "BK-1004",
      guestId: "G-4",
      room: "104",
      status: "CHECKED_OUT",
      rate: rooms["104"].rate,
      checkInAt: new Date(now.getTime() - 6 * DAY),
      checkOutAt: new Date(now.getTime() - 3 * DAY),
      source: "DIRECT",
    },
  ];

  for (const r of reservationSeed) {
    const isIn = r.status === "CHECKED_IN" || r.status === "CHECKED_OUT";
    await prisma.reservation.upsert({
      where: { bookingCode: r.code },
      update: {},
      create: {
        bookingCode: r.code,
        propertyId: property.id,
        guestId: r.guestId,
        roomId: rooms[r.room].id,
        checkInAt: r.checkInAt,
        checkOutAt: r.checkOutAt,
        adults: 2,
        rateApplied: r.rate,
        source: r.source,
        status: r.status,
        checkedInById: isIn ? users.RECEPTIONIST : null,
        checkedInAt: isIn ? r.checkInAt : null,
        checkedOutById: r.status === "CHECKED_OUT" ? users.RECEPTIONIST : null,
        checkedOutAt: r.status === "CHECKED_OUT" ? r.checkOutAt : null,
      },
    });
  }

  for (const roomNo of ["305", "102"]) {
    await prisma.room.update({
      where: { id: rooms[roomNo].id },
      data: { occupancyStatus: "OCCUPIED", housekeepingStatus: "CLEAN" },
    });
  }
  await prisma.room.update({
    where: { id: rooms["104"].id },
    data: { occupancyStatus: "VACANT", housekeepingStatus: "DIRTY" },
  });

  const res1001 = await prisma.reservation.findUniqueOrThrow({ where: { bookingCode: "BK-1001" } });
  const folio = await prisma.folio.upsert({
    where: { reservationId: res1001.id },
    update: {},
    create: {
      reservationId: res1001.id,
      currency: "IDR",
      total: 0,
      paid: 0,
      status: "OPEN",
    },
  });

  const existingItems = await prisma.folioItem.count({ where: { folioId: folio.id } });
  if (existingItems === 0) {
    const roomCharge = res1001.rateApplied * 2;
    const fbCharge = 250000;
    const tax = Math.round((roomCharge + fbCharge) * 0.1);
    await prisma.folioItem.createMany({
      data: [
        { folioId: folio.id, description: "Kamar 2 malam", chargeType: "ROOM", amount: roomCharge, postedBy: "SISTEM" },
        { folioId: folio.id, description: "Makanan & minuman", chargeType: "FNB", amount: fbCharge, postedBy: "SISTEM" },
        { folioId: folio.id, description: "Pajak & service 10%", chargeType: "TAX", amount: tax, postedBy: "SISTEM" },
      ],
    });
    await prisma.payment.create({
      data: { folioId: folio.id, method: "CASH", amount: Math.round(roomCharge / 2), status: "RECORDED" },
    });
    await prisma.folio.update({
      where: { id: folio.id },
      data: { total: roomCharge + fbCharge + tax, paid: Math.round(roomCharge / 2) },
    });
  }

  await prisma.housekeepingTask.upsert({
    where: { id: "HK-001" },
    update: {},
    create: {
      id: "HK-001",
      propertyId: property.id,
      roomId: rooms["104"].id,
      assignedId: users.HOUSEKEEPING,
      priority: "HIGH",
      type: "DEPARTURE_CLEAN",
      status: "PENDING",
      targetAt: new Date(now.getTime() + 60 * MIN),
    },
  });
  await prisma.housekeepingTask.upsert({
    where: { id: "HK-002" },
    update: {},
    create: {
      id: "HK-002",
      propertyId: property.id,
      roomId: rooms["305"].id,
      assignedId: users.HOUSEKEEPING,
      priority: "NORMAL",
      type: "STAYOVER_CLEAN",
      status: "IN_PROGRESS",
      startedAt: new Date(now.getTime() - 20 * MIN),
    },
  });

  await prisma.maintenanceTicket.upsert({
    where: { id: "MNT-001" },
    update: {},
    create: {
      id: "MNT-001",
      propertyId: property.id,
      roomId: rooms["206"].id,
      title: "AC tidak dingin",
      description: "AC kamar 206 tidak menghasilkan udara dingin sejak sore.",
      priority: "HIGH",
      status: "ASSIGNED",
      assigneeId: users.ENGINEERING,
      dueAt: new Date(now.getTime() + DAY),
    },
  });
  await prisma.room.update({
    where: { id: rooms["206"].id },
    data: { serviceStatus: "OUT_OF_ORDER" },
  });

  // Daftarkan smart lock untuk setiap kamar (40 kamar)
  let device305Id = "";
  for (const [roomNo, rInfo] of Object.entries(rooms)) {
    const floor = parseInt(roomNo[0], 10);
    const gatewayId = floor <= 2 ? "GW-01" : "GW-02";
    const vendorDeviceId = `SIM-LOCK-${roomNo}`;
    const dev = await prisma.device.upsert({
      where: { vendorDeviceId },
      update: {},
      create: {
        propertyId: property.id,
        roomId: rInfo.id,
        gatewayId,
        vendor: "Simulated",
        model: "SIM-LOCK",
        vendorDeviceId,
        kind: "DOOR_LOCK",
        capabilities: "LOCK,UNLOCK,DOOR_SENSOR,BATTERY",
        healthStatus: "ONLINE",
        lastSeenAt: now,
        batteryPct: 75 + (parseInt(roomNo, 10) % 23),
      },
    });
    if (roomNo === "305") {
      device305Id = dev.id;
    }
  }

  const device = { id: device305Id };

  const credential = await prisma.credentialAssignment.upsert({
    where: { id: "CRED-305-1" },
    update: {},
    create: {
      id: "CRED-305-1",
      holderType: "RESERVATION",
      holderId: res1001.id,
      reservationId: res1001.id,
      kind: "RFID",
      scope: "room:305",
      validFrom: checkInAt,
      validUntil: checkOutAt,
      status: "ISSUED",
      issuedById: users.RECEPTIONIST,
      isSimulated: true,
      providerRef: "SIM-CRED-305",
    },
  });

  const timeline = [
    { offset: 12 * MIN, type: "ACCESS_GRANTED", door: "CLOSED", lock: "UNLOCKED", actor: "Tamu — Bambang P." },
    { offset: 11 * MIN, type: "DOOR_OPENED", door: "OPEN", lock: "UNLOCKED", actor: "Tamu — Bambang P." },
    { offset: 10 * MIN, type: "DOOR_CLOSED", door: "CLOSED", lock: "LOCKED", actor: "Tamu — Bambang P." },
  ];

  const createdEvents: string[] = [];
  for (const [i, ev] of timeline.entries()) {
    const occurredAt = new Date(now.getTime() - ev.offset);
    const row = await prisma.doorEvent.upsert({
      where: { providerEventId: `SIM-305-EV-${i + 1}` },
      update: {},
      create: {
        providerEventId: `SIM-305-EV-${i + 1}`,
        provider: "simulated",
        propertyId: property.id,
        roomId: rooms["305"].id,
        deviceId: device.id,
        credentialId: credential.id,
        eventType: ev.type,
        rawEventType: ev.type,
        occurredAt,
        receivedAt: new Date(occurredAt.getTime() + 200),
        source: "SIMULATED",
        syncStatus: "LIVE",
        doorState: ev.door,
        lockState: ev.lock,
        actorLabel: ev.actor,
        isRawStore: false,
      },
    });
    createdEvents.push(row.id);
  }

  const forcedEvent = await prisma.doorEvent.upsert({
    where: { providerEventId: "SIM-305-EV-FORCED" },
    update: {},
    create: {
      providerEventId: "SIM-305-EV-FORCED",
      provider: "simulated",
      propertyId: property.id,
      roomId: rooms["305"].id,
      deviceId: device.id,
      eventType: "DOOR_FORCED_OPEN",
      rawEventType: "FORCED_OPEN",
      occurredAt: new Date(now.getTime() - 10 * MIN),
      receivedAt: new Date(now.getTime() - 10 * MIN + 300),
      source: "SIMULATED",
      syncStatus: "LIVE",
      doorState: "OPEN",
      lockState: "LOCKED",
      actorLabel: null,
      riskLevel: "HIGH",
      isRawStore: false,
    },
  });

  const incident = await prisma.incident.upsert({
    where: { id: "INC-001" },
    update: {},
    create: {
      id: "INC-001",
      propertyId: property.id,
      roomId: rooms["305"].id,
      severity: "HIGH",
      status: "NEW",
      ruleLabel: "Pintu terbuka tanpa akses sah",
      openedAt: new Date(now.getTime() - 10 * MIN),
      isSimulated: true,
    },
  });

  await prisma.incidentEvent.upsert({
    where: { incidentId_doorEventId: { incidentId: incident.id, doorEventId: forcedEvent.id } },
    update: {},
    create: { incidentId: incident.id, doorEventId: forcedEvent.id },
  });
  await prisma.incidentEvent.upsert({
    where: { incidentId_doorEventId: { incidentId: incident.id, doorEventId: createdEvents[2] } },
    update: {},
    create: { incidentId: incident.id, doorEventId: createdEvents[2] },
  });

  await prisma.incidentHistory.upsert({
    where: { id: "INCH-001" },
    update: {},
    create: {
      id: "INCH-001",
      incidentId: incident.id,
      fromStatus: null,
      toStatus: "NEW",
      actor: "Aturan otomatis",
      note: "Insiden dibuka otomatis dari event DOOR_FORCED_OPEN (simulasi).",
    },
  });

  const notifCount = await prisma.notification.count({ where: { incidentId: incident.id } });
  if (notifCount === 0) {
    await prisma.notification.createMany({
      data: [
        {
          propertyId: property.id,
          incidentId: incident.id,
          recipientId: users.SECURITY,
          title: "Insiden prioritas tinggi — Kamar 305",
          body: "Pintu terbuka tanpa akses sah terdeteksi pada kamar 305. Mohon diperiksa.",
        },
        {
          propertyId: property.id,
          incidentId: incident.id,
          recipientId: users.GENERAL_MANAGER,
          title: "Insiden HIGH menunggu peninjauan",
          body: "Insiden kamar 305 berstatus NEW dan belum ditangani.",
        },
      ],
    });
  }

  await prisma.applicationAuditLog.create({
    data: {
      propertyId: property.id,
      actorId: users.OWNER,
      actorName: "Pemilik Hotel",
      action: "SEED_DATABASE",
      entityType: "System",
      summary: "Data demo dimuat: properti, staf, kamar, reservasi, perangkat, insiden.",
    },
  });

  const counts = {
    users: await prisma.user.count(),
    rooms: await prisma.room.count(),
    reservations: await prisma.reservation.count(),
    doorEvents: await prisma.doorEvent.count(),
    incidents: await prisma.incident.count(),
  };
  console.log("Seed selesai:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });