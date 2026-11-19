# HotelOps Guard

Sistem manajemen hotel (reservasi, front desk, housekeeping, finance) dengan
monitoring akses pintu kamar dan alur penanganan insiden berbasis peran.

Stack: Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4,
Prisma 6, Auth.js v5, SQLite (development) / PostgreSQL (produksi).

## Menjalankan

```bash
npm install
copy .env.example .env      # lalu isi AUTH_SECRET
npx prisma migrate dev
npm run db:seed
npm run dev
```

Buka http://localhost:3000 — diarahkan ke `/login`.

`AUTH_SECRET` wajib diisi. Generate dengan `openssl rand -base64 32`, atau di
PowerShell:

```powershell
$b = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
[Convert]::ToBase64String($b)
```

## Akun demo

Kata sandi semua akun: `rahasia1234`

| Email | Peran |
| --- | --- |
| owner@hotelops.test | Pemilik |
| gm@hotelops.test | General Manager |
| receptionist@hotelops.test | Resepsionis |
| housekeeping@hotelops.test | Housekeeping |
| engineering@hotelops.test | Teknisi |
| security@hotelops.test | Keamanan |
| finance@hotelops.test | Keuangan |
| auditor@hotelops.test | Auditor |
| deviceadmin@hotelops.test | Admin Perangkat |

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server development |
| `npm run build` | Build produksi |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Migrasi Prisma |
| `npm run db:seed` | Isi data demo (idempoten) |
| `npm run db:reset` | Reset database + migrasi |
| `npm test` atau `npm run verify` | Verifikasi menyeluruh logika bisnis, DB, & RBAC |
| `npx tsx scripts/check.ts` | Cek cepat aturan insiden & transisi status |

## Catatan desain

- **Status terpisah per domain.** `occupancyStatus`, `housekeepingStatus`,
  `serviceStatus` tidak pernah digabung, sehingga kamar "terisi tapi kotor"
  tetap terbaca benar.
- **Event pintu append-only.** `DoorEvent` menyimpan `occurredAt` (waktu
  perangkat) terpisah dari `receivedAt` (waktu server), plus `source`
  (`HARDWARE`/`SIMULATED`/`SYSTEM`) dan `syncStatus`.
- **`ACCESS_GRANTED` bukan bukti pintu terbuka.** Status pintu hanya diambil
  dari `DOOR_OPENED`/`DOOR_CLOSED`.
- **Insiden punya jejak.** Setiap perubahan status menulis `IncidentHistory`
  dan `ApplicationAuditLog`; penutupan wajib disertai catatan.
- **RBAC di server.** Pemeriksaan izin ada di page dan server action, bukan
  hanya menyembunyikan menu.

## Simulator perangkat

`ENABLE_SIMULATOR=true` hanya berlaku di luar production. Semua event dari
simulator ditandai `source=SIMULATED` dan ditampilkan dengan badge "Simulasi"
agar tidak tertukar dengan data hardware. Buka pintu jarak jauh sengaja
mengembalikan `accepted: false` — fitur ini harus diaktifkan lewat adapter
vendor dan persetujuan MFA sebelum dipakai.

## PostgreSQL

`docker-compose.yml` menyediakan Postgres 16. Ubah `.env`:

```
DATABASE_URL="postgresql://hotelops:hotelops@localhost:5432/hotelops"
```

lalu ubah `provider = "sqlite"` menjadi `"postgresql"` di
`prisma/schema.prisma` dan jalankan `npx prisma migrate dev`. Status disimpan
sebagai `String`, jadi tidak ada enum khusus SQLite yang perlu dimigrasi.