# MASTER PROMPT — MEMBANGUN HOTEL MANAGEMENT SYSTEM DI VS CODE

> **Cara pakai:** Buat folder proyek kosong di VS Code. Letakkan `PRD.md` dan `desain.md` HotelOps Guard di root folder bersama dokumen prompt ini. Buka GitHub Copilot Chat **Agent Mode**, Cline, Roo Code, atau AI coding assistant lain yang dapat membaca/menulis file proyek. Salin seluruh bagian **PROMPT UTAMA** di bawah ke chat agent. Izinkan pembuatan file dan eksekusi perintah yang diperlukan setelah meninjau aksinya.

---

## PROMPT UTAMA — SALIN DARI SINI

Kamu adalah **Principal Full-Stack Engineer, Software Architect, UI/UX Designer, Database Engineer, dan QA Lead** yang sedang membangun aplikasi hotel sungguhan, bukan sekadar prototype atau gambar dashboard.

**Tugas:** Buat aplikasi web bernama **HotelOps Guard**, yaitu **Hotel Property Management System (PMS)** yang mengelola operasional hotel secara menyeluruh, dengan fitur unggulan **Smart Door Access Monitoring & Audit Trail** untuk mencatat penggunaan akses pintu kamar dan mendeteksi akses pegawai yang tidak sesuai tugas/otorisasi.

**Bahasa antarmuka:** Bahasa Indonesia yang natural, profesional, mudah dipahami pegawai hotel. Hindari teks generik seperti “Welcome to Dashboard”, kalimat promosi berlebihan, dan placeholder bahasa Inggris kecuali istilah teknis.

**Dokumen sumber:** Baca `PRD.md` sebagai acuan kebutuhan bisnis **dan `desain.md` sebagai acuan wajib UI/UX, design tokens, komponen, navigasi, responsive behavior, microcopy, serta visual QA** sebelum mulai membuat halaman. Jangan membuat palet, pola tombol, atau layout yang bertentangan dengan `desain.md`. Jika ada detail teknis yang belum ditentukan, gunakan keputusan default yang aman dan dokumentasikan asumsi, tanpa berhenti hanya untuk bertanya. Ketika ada konflik, utamakan keselamatan akses fisik, integritas data, keamanan, dan kemampuan perangkat yang sebenarnya.

### A. TARGET HASIL

Bangun aplikasi yang **benar-benar bisa dijalankan di localhost**, mempunyai database nyata, autentikasi, validasi, CRUD, alur reservasi/check-in/check-out, laporan, monitoring pintu, alur insiden, serta data demo yang realistis. **Jangan berhenti pada mockup, komponen statis, atau pseudo-code.**

Hasil akhir harus berisi:
- Source code lengkap di workspace VS Code, dengan struktur folder yang jelas.
- `README.md` berisi cara instalasi, konfigurasi, menjalankan, testing, dan akun demo (khusus development).
- `.env.example` tanpa secret asli, migrasi database, seed data, skrip development/build/test.
- `docker-compose.yml` minimal untuk PostgreSQL lokal; aplikasi web bisa dijalankan dengan `npm run dev`.
- Dokumentasi endpoint dan modul integrasi smart lock.
- Tests untuk aturan bisnis dan keamanan paling penting.
- Checklist modul yang sudah selesai vs belum selesai; jangan mengklaim fitur berjalan jika hanya dibuat tampilannya.

### B. TEKNOLOGI

Pakai stack yang konsisten dan relatif mudah dipelihara:
- **Frontend + backend:** Next.js App Router + TypeScript (versi stabil yang kompatibel).
- **Styling:** Tailwind CSS + shadcn/ui + Lucide icons.
- **Form/validasi:** React Hook Form + Zod.
- **Database:** PostgreSQL + Prisma ORM.
- **Autentikasi:** Auth.js/NextAuth dengan kredensial aman untuk demo, password di-hash (Argon2/bcrypt), cookie aman, server-side session, dan pemeriksaan izin di server untuk setiap operasi.
- **Grafik:** Recharts atau library chart stabil.
- **Real-time monitoring:** Server-Sent Events atau WebSocket yang benar-benar terhubung ke event backend; sediakan fallback polling dan tanda status koneksi.
- **Testing:** Vitest untuk logic/endpoint dan Playwright untuk alur penting (jika lingkungan mendukung).
- **Paket & runtime:** npm + Node.js LTS yang kompatibel.

Jangan menggunakan Firebase sebagai database utama, jangan membuat seluruh backend berbasis data hardcoded, dan jangan memerlukan layanan cloud berbayar untuk menjalankan versi lokal. Jika ada fitur yang tergantung hardware/vendor, buat **adapter interface** dan **simulator aman** terlebih dahulu.

### C. DESAIN PRODUK / UI

**Aturan wajib:** Implementasikan `desain.md` sebagai *single source of truth* untuk warna, tipografi, spacing, komponen, state, responsivitas dan tata bahasa UI. Buat `AppShell`, `PageHeader`, `StatCard`, `DataTable`, `StatusBadge`, `FilterBar`, `EmptyState`, `ConnectionState`, serta token tema yang dapat digunakan ulang. Jangan membuat setiap halaman dengan desain yang berubah-ubah. Cek tampilan minimal pada lebar 360, 768, 1024, dan 1440 px. Jangan mengganti fungsi bisnis dengan dekorasi.

Tampilkan aplikasi seperti software hotel profesional yang siap dipakai operasional:
- Desain modern, premium, bersih; identitas warna **navy gelap + teal + putih/abu muda**, warna status semantik untuk success/warning/danger.
- Sidebar kiri dengan ikon dan kelompok menu, topbar berisi pencarian, notifikasi, pergantian properti (bila perlu), profil pengguna.
- Dashboard dengan KPI, grafik tren, tabel, filter tanggal, status kamar, dan daftar alert.
- Mobile responsif, namun optimalkan desktop/tablet resepsionis.
- Komponen: cards, tabel yang dapat disortir, search, filter, pagination, modal konfirmasi, toast, loading skeleton, empty/error states, badge status, timeline kejadian.
- Seluruh tombol penting harus punya aksi nyata dan hasil yang terlihat. Jangan buat tombol dekoratif tanpa fungsi.
- Format uang **Rupiah (IDR)**, tanggal/jam dalam zona waktu properti (default **Asia/Jakarta**, bisa diubah), penyimpanan timestamp dalam UTC.
- Buat contoh data realistis: 1 hotel, 4 lantai, sekitar 40 kamar, beberapa tipe kamar, tamu, reservasi, pegawai, shift, tugas housekeeping, tiket maintenance, transaksi, perangkat, log pintu, dan insiden.

**Menu utama:**
1. Dashboard
2. Front Desk / Reservasi
3. Kalender Ketersediaan
4. Kamar & Tipe Kamar
5. Tamu & Pengunjung
6. Check-in / Check-out
7. Housekeeping
8. Maintenance
9. Keuangan & Pembayaran
10. Monitoring Pintu
11. Insiden Keamanan
12. Laporan & Audit
13. Manajemen Pengguna
14. Pengaturan & Perangkat

### D. ROLE DAN AKSES

Implementasikan RBAC **di backend**, bukan sekadar menyembunyikan menu. Peran default:
- **Owner:** melihat ringkasan bisnis, laporan, audit dan keamanan.
- **General Manager:** operasional, investigasi, persetujuan akses khusus.
- **Resepsionis:** booking, tamu, check-in/out, tagihan, penerbitan kredensial tamu sesuai izin.
- **Housekeeping:** hanya melihat tugas dan kamar yang ditugaskan.
- **Engineering:** maintenance dan akses yang terikat tiket.
- **Security:** monitoring event, alert, investigasi insiden.
- **Finance:** folio, pembayaran, rekonsiliasi; tanpa hak mengubah audit pintu.
- **Auditor:** baca saja data audit yang diizinkan.
- **Device Admin / IT:** perangkat, gateway, integrasi; tidak otomatis berwenang membuka kamar.

Tambahkan pembatasan menurut hotel/properti, kamar, shift, masa berlaku kredensial, dan status tugas. Tindakan sensitif wajib dicatat. Akses berisiko tinggi memerlukan MFA atau persetujuan sesuai kebijakan (bila MFA belum diimplementasikan, **nonaktifkan tindakan sensitif tersebut**, jangan hanya mengaku sudah aman).

### E. FITUR STANDAR HOTEL (MVP FUNGSIONAL)

**1. Kamar dan inventory**
- Master data lantai, nomor kamar, tipe, kapasitas, fasilitas, tarif dasar.
- Bedakan **status hunian** (`VACANT`, `RESERVED`, `OCCUPIED`), **status housekeeping** (`DIRTY`, `CLEANING`, `INSPECTED`, `CLEAN`) dan **status layanan** (`AVAILABLE`, `OUT_OF_ORDER`, `OUT_OF_SERVICE`).
- Jangan menyatukan status kamar, posisi pintu, dan posisi kunci.

**2. Reservasi**
- Buat booking tamu, walk-in, pencarian ketersediaan, pindah kamar, ubah tanggal, konfirmasi, batal, no-show.
- Tampilkan calendar/room grid per tanggal.
- Validasi benturan rentang tanggal: tidak boleh double-booking di kamar yang sama; lakukan pengecekan **transaksional di server**, bukan hanya form.
- Booking terkait tamu, harga, sumber reservasi, tanggal, jumlah orang, dan catatan operasional.

**3. Check-in / Check-out**
- Check-in hanya untuk reservasi valid; verifikasi tamu, assign kamar, catat waktu dan petugas.
- Check-out menyelesaikan folio/tagihan, mengakhiri akses tamu, membuat kamar memerlukan housekeeping.
- Tampilkan status pencabutan credential berdasarkan konfirmasi vendor, bukan asumsi otomatis.

**4. Tamu dan pengunjung**
- Profil tamu, kontak, riwayat menginap, pendamping terdaftar.
- Registrasi pengunjung kamar dengan tujuan, host/reservasi, waktu kunjungan, persetujuan bila disyaratkan.
- Minimalkan data identitas sensitif dan sembunyikan dari role yang tidak perlu. Tidak menampilkan dokumen identitas sembarangan.

**5. Keuangan**
- Folio, room charge, layanan tambahan, deposit, pembayaran tunai/transfer/non-tunai sebagai metode pencatatan, diskon dengan izin, pajak/layanan yang dapat dikonfigurasi, invoice sederhana yang dapat dicetak.
- Jangan pura-pura mengintegrasikan pembayaran otomatis; labeli transaksi sebagai dicatat manual jika belum ada payment gateway.
- Dashboard pendapatan, occupancy, ADR, RevPAR, laporan transaksi harian.

**6. Housekeeping**
- Task board berdasarkan kamar, assign staf, status progress, checklist selesai, inspeksi supervisor.
- Waktu task, petugas, dan kamar menjadi salah satu dasar pemeriksaan akses pintu.

**7. Maintenance**
- Tiket kerusakan, prioritas, teknisi, jadwal, status, catatan penyelesaian, kamar out-of-order, persetujuan akses kamar bila diperlukan.

**8. Shift & pengguna**
- Jadwal shift pegawai, peran, status aktif, riwayat perubahan izin.

### F. FITUR INTI: SMART DOOR ACCESS MONITORING

Ini adalah fitur pembeda utama. **Bangun dengan hati-hati agar sistem tidak menyimpulkan sesuatu yang perangkatnya tidak dapat buktikan.**

#### 1. Empat hal yang berbeda
- `ACCESS_GRANTED`: kredensial diterima. **Belum membuktikan pintu fisik dibuka.**
- `DOOR_OPENED`: sensor fisik melihat daun pintu terbuka.
- `DOOR_CLOSED`: sensor fisik melihat daun pintu tertutup. **Belum membuktikan pintu terkunci.**
- `LOCK_LOCKED`: mekanisme kunci terkunci jika sensor/status vendor mendukung.

**Dilarang:** membuat event `DOOR_OPENED` dari `ACCESS_GRANTED` atau `DOOR_CLOSED` dari `LOCK_LOCKED`. Jika hardware belum mendukung sensor pintu, tampilkan `UNKNOWN` dan penjelasan “Sensor pintu belum terpasang/tersambung.”

#### 2. Perangkat dan integrasi
Buat pengelolaan property > building/floor > room > smart lock > sensor > gateway.
Buat antarmuka `DoorDeviceProvider` / `SmartLockAdapter` dengan operasi terpisah:
- baca daftar perangkat dan kemampuannya (`canReportOpenClose`, `canReportLockState`, `supportsRealTime`, `supportsOfflineSync`, `canRemoteUnlock`),
- menerima / memvalidasi webhook,
- normalisasi event,
- sinkronisasi batch bila didukung,
- permintaan penerbitan/pencabutan akses sesuai kemampuan vendor,
- **remote unlock tidak diaktifkan** pada demo tanpa desain otorisasi kuat dan vendor yang jelas.

Implementasi awal gunakan `SimulatedSmartLockProvider`, **hanya untuk lingkungan development**, dengan tombol khusus pada halaman admin/simulator untuk membuat event uji dan mendemonstrasikan webhook. Semua event simulator harus berlabel `SIMULATED`, tidak boleh terlihat seperti bukti sensor nyata. Sistem tetap berfungsi penuh sebagai PMS bila belum ada smart lock.

#### 3. Event yang dicatat
Minimal tipe:
`ACCESS_GRANTED`, `ACCESS_DENIED`, `LOCK_UNLOCKED`, `LOCK_LOCKED`, `DOOR_OPENED`, `DOOR_CLOSED`, `DOOR_HELD_OPEN`, `DOOR_FORCED_OPEN`, `MASTER_KEY_USED`, `CREDENTIAL_ISSUED`, `CREDENTIAL_REVOKED`, `DEVICE_ONLINE`, `DEVICE_OFFLINE`, `LOW_BATTERY`, `SENSOR_TAMPER`, `EVENT_SYNCED`.

Setiap event menyimpan minimal: `eventId`, `provider`, `providerEventId`, `propertyId`, `roomId`, `deviceId`, `credentialId?`, `actorId?`, `eventType`, `rawEventType`, `occurredAt` (asli perangkat), `receivedAt` (server), `source` (`HARDWARE`, `SIMULATED`, `SYSTEM`), `syncStatus` (`LIVE`, `DELAYED`, `OFFLINE`, `UNKNOWN`), `correlationId?`, `metadata`, `rawPayloadRef`/raw terproteksi.

Implementasikan deduplikasi berdasarkan provider/event ID, signature verification pada webhook bila tersedia, validasi payload Zod, rate limit, dan idempotency. Raw audit event **append-only**: tidak ada tombol edit/hapus untuk owner sekalipun. Perubahan/koreksi dilakukan lewat event tambahan, dan upaya mengubahnya lewat API harus ditolak. Tambahkan perlindungan akses DB, dan jelaskan bahwa append-only aplikasi bukan jaminan WORM fisik tanpa infrastruktur tambahan.

#### 4. Korelasi dan peringatan
Saat event masuk, cocokkan dengan **kondisi pada waktu event terjadi**: reservasi aktif, status kamar, pemilik credential, masa berlaku, shift, housekeeping task, maintenance ticket, izin khusus, dan pengecualian keadaan darurat. Jangan menilai event lampau memakai kondisi kamar hari ini.

Buat aturan yang bisa dikonfigurasi:
- Staf mengakses kamar kosong tanpa tugas atau izin -> **HIGH**.
- Staf mengakses kamar terisi tanpa penugasan/persetujuan -> **HIGH**.
- Master key dipakai di luar shift/cakupan -> **HIGH**.
- Pintu dibuka tanpa akses sah terkait -> **CRITICAL**, tetapi klasifikasikan sebagai “perlu verifikasi” bila sumber tidak bisa membedakan pembukaan dari dalam.
- Pintu tetap terbuka > 180 detik (jika sensor tersedia) -> **MEDIUM**.
- 5 akses ditolak dalam 10 menit -> **MEDIUM**.
- Credential kedaluwarsa/ditarik masih digunakan -> **HIGH**.
- Perangkat tidak melapor > 10 menit -> **MONITORING GAP**, bukan klaim “pintu aman”.
- Kartu/master/duplikat diterbitkan tanpa tiket/otorisasi -> **CRITICAL**.

Semua aturan harus mempertimbangkan sumber event, kemampuan sensor, downtime dan alasan sah. **Alert adalah tanda untuk diperiksa, bukan bukti pegawai memasukkan tamu ilegal**. Sistem tidak dapat memastikan berapa orang masuk hanya dari lock/sensor.

#### 5. Tampilan monitoring keamanan
Buat halaman **Monitoring Pintu** lengkap dengan:
- Ringkasan jumlah kamar, perangkat online/offline, pintu open/closed/unknown, event terbaru, insiden aktif.
- Grid kartu kamar atau floor map sederhana.
- Event timeline per kamar dengan waktu lokal, event, credential/petugas terkait, sumber, status sinkronisasi, tingkat risiko, tautan reservasi/tugas.
- Filter properti, lantai, kamar, tanggal, pegawai, event, severity, dan status perangkat.
- Detail kamar: overview, booking, tugas, device, riwayat credential, door events, incident.
- Banner jelas ketika data berasal dari simulator atau ketika sensor belum terpasang.
- Pembaruan layar otomatis dari backend tanpa refresh manual untuk event baru.

**Contoh yang harus bisa direproduksi lewat simulator:**
- Kamar 305 berstatus `VACANT`.
- Petugas HK-024 tidak memiliki tugas aktif di kamar itu.
- Pukul 21:03:12 `ACCESS_GRANTED` dari kredensial HK-024.
- Pukul 21:03:15 `DOOR_OPENED` dari sensor pintu.
- Pukul 21:07:40 `DOOR_CLOSED`.
- Sistem membuat insiden **HIGH**: “Akses kamar 305 perlu diperiksa: kredensial staf digunakan di luar penugasan.”
- Security dapat membuka timeline, mencatat hasil investigasi, dan menutup kasus dengan alasan yang bisa diaudit.

#### 6. Manajemen insiden
Status: `NEW`, `ACKNOWLEDGED`, `INVESTIGATING`, `RESOLVED`, `FALSE_POSITIVE`, `CLOSED`, `REOPENED`.
Ada penanggung jawab, kronologi, event terkait, catatan investigasi, log perubahan status, severity, alasan penutupan, dan filter. Jangan mengizinkan menghapus bukti raw event.

#### 7. Keselamatan & privasi
- Jangan membuat fitur yang bisa menghambat orang keluar kamar saat darurat.
- Jangan aktifkan remote unlock tanpa otorisasi berlapis, MFA, alasan, logging, dan konfirmasi vendor.
- Tidak ada kamera/mikrofon dalam kamar; hanya data akses dan bila sah referensi CCTV area umum.
- Jangan menampilkan informasi tamu secara penuh kepada staf yang tidak berwenang.
- Gunakan kebijakan retensi dan ekspor audit sesuai kebutuhan hotel serta hukum yang berlaku. Logging data sensitif harus diminimalkan.

### G. DATA MODEL, API, DAN KONTROL MUTU

Rancang Prisma schema dengan entitas minimal:
`Property`, `User`, `Role`/`Permission`, `StaffShift`, `RoomType`, `Room`, `Guest`, `Reservation`, `RegisteredVisitor`, `Folio`, `FolioItem`, `Payment`, `HousekeepingTask`, `MaintenanceTicket`, `Device`, `DoorSensor`, `Gateway`, `Credential`, `CredentialAssignment`, `DoorEvent`, `Incident`, `IncidentHistory`, `AccessApproval`, `Notification`, `ApplicationAuditLog`.

Sediakan migrations, foreign keys, unique constraints, indeks `propertyId`, `roomId`, `occurredAt`, `eventType`, `severity`, `providerEventId`, pagination dan filter di backend.

Keamanan server:
- Role dan ownership diperiksa pada setiap route/server action.
- Sanitasi input/validasi Zod dan pembatasan update field (hindari mass assignment).
- Jangan taruh token vendor atau secret di frontend.
- Gunakan transaksi DB untuk reservasi, check-in, check-out, pembayaran, dan perubahan izin.
- Audit perubahan penting: siapa, kapan, aksi, target, ringkasan perubahan yang aman; jangan menulis password/token/raw dokumen sensitif ke audit.
- Endpoint simulator harus dinonaktifkan di production, ditambah autentikasi dan role khusus di development.
- API event inbound harus aman terhadap duplikat, event terlambat/out-of-order, dan jaringan terputus.

### H. CARA KERJA AGENT: IMPLEMENTASI BERTAHAP

**Jangan mencoba membuat ribuan baris dalam satu jawaban teks. Kerjakan langsung file di workspace dan lanjutkan secara bertahap.** Urutan pengerjaan:

**Tahap 1 — Fondasi:**
1. Periksa workspace, baca `PRD.md` **dan `desain.md`**, identifikasi dependensi yang tersedia.
2. Buat project Next.js + TypeScript, design tokens sesuai `desain.md`, layout dan komponen reusable, navigasi, halaman login, middleware dan RBAC server-side.
3. Setup PostgreSQL, Prisma schema, migration, seeder, `.env.example`, docker-compose, README.
4. Implementasi dashboard dengan query database nyata, skeleton, dan error states.
5. Jalankan lint/typecheck/build jika memungkinkan, lalu perbaiki error.

**Tahap 2 — PMS inti:**
1. Kamar dan tipe kamar.
2. Tamu, reservasi, kalender dan anti-double booking.
3. Check-in/out, folio, pembayaran manual dan invoice.
4. Housekeeping, maintenance dan shift.
5. Laporan KPI dari data nyata.
6. Verifikasi alur dengan test dan data seed.

**Tahap 3 — Smart door dan security:**
1. Model device/credential/event, capabilities dan adapter vendor.
2. Event ingestion aman, simulator development, deduplikasi dan penyimpanan append-only.
3. Monitoring real-time, status perangkat, timeline dan filter.
4. Rule engine korelasi (booking/shift/tugas), notifikasi dan incident workflow.
5. Tests: duplicate events, out-of-order, offline, sensor tidak ada, akses tidak sah, akses sah, dan incident lifecycle.

**Tahap 4 — Penyempurnaan:**
1. Uji batas akses antarroll, kualitas data, timezone dan transaksi.
2. Audit seluruh halaman memakai checklist `desain.md`: responsive, aksesibilitas, empty/loading/error states, microcopy, dashboard dan navigasi.
3. Dokumentasikan fitur yang butuh vendor smart lock, termasuk data yang tidak dapat dideteksi tanpa sensor.
4. Finalisasi README, contoh akun khusus development, dan instruksi integrasi hardware nyata.

**Disiplin eksekusi:**
- Di awal, berikan ringkasan arsitektur, struktur folder dan urutan kerja **singkat**, kemudian langsung membuat file, bukan berhenti pada rencana.
- Di akhir tiap tahap, laporkan file yang dibuat, perintah yang benar-benar berhasil, hasil tes, dan bagian yang belum berfungsi. Jangan mengarang hasil tes.
- Jika dependency/perintah gagal, perbaiki dan coba ulang. Jika tidak dapat menjalankan perintah, jelaskan batasannya dan tetap buat file yang diperlukan.
- Jangan mengganti source code dengan banyak `TODO`, dummy API, atau data palsu yang mengesankan fitur sudah production-ready.
- Bangun MVP end-to-end yang dapat diuji dulu sebelum memperluas fitur.
- **Mulai sekarang dari Tahap 1.** Jangan hanya menjelaskan cara membuat aplikasinya; lakukan perubahan file langsung pada proyek ini.

## AKHIR PROMPT UTAMA

---

## PROMPT LANJUTAN (JIKA AGENT BERHENTI DI TENGAH)

Lanjutkan implementasi HotelOps Guard dari keadaan file yang sudah ada di workspace. **Jangan ulangi dari nol dan jangan hapus kode yang sudah berfungsi.** Baca `PRD.md`, **`desain.md`**, `README.md`, `package.json`, Prisma schema, dan file terkait. Identifikasi tahap yang belum selesai dari master prompt. Prioritaskan menyelesaikan fungsi end-to-end, bukan sekadar mempercantik UI. Jalankan pengecekan nyata (typecheck, lint, build, test) lalu perbaiki error. Laporkan progres secara faktual, kemudian lanjutkan ke modul berikutnya.

---

## PROMPT KHUSUS CEK KELENGKAPAN DAN BUG

Audit seluruh proyek HotelOps Guard terhadap `PRD.md` **dan `desain.md`**. Periksa juga konsistensi design tokens, komponen, spacing, responsive behavior, kontras, keyboard navigation, status data live/simulasi dan kualitas microcopy. Buat matriks fitur dengan status **berfungsi / sebagian / belum dibuat**, beserta bukti file dan endpoint. Periksa semua menu, tombol, form, CRUD, role checks, database relations, migrasi, seed, konflik reservasi, transaksi, log append-only, simulator pintu, event duplikat, offline status, korelasi insiden, dan potensi kebocoran data. Jalankan tes dan build; perbaiki masalah yang bisa direproduksi. Jangan menandai selesai sebelum fungsi teruji.
