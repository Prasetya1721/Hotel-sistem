# DESAIN.md — HotelOps Guard

> **Design System & UX Guidelines**  
> Versi: 1.0 · Status: siap dipakai sebagai acuan implementasi · Platform: web responsif (desktop, tablet, mobile)  
> **Baca bersama:** `PRD.md` (kebutuhan produk) dan `PROMPT_VSCODE_HotelOps_Guard.md` (instruksi implementasi).

---

## 1. Arah Desain

**HotelOps Guard** adalah aplikasi kerja harian hotel, bukan halaman promosi. Tampilannya harus rapi, tenang, terasa premium, cepat dibaca, dan tetap nyaman digunakan saat resepsionis sedang melayani tamu atau petugas keamanan harus memeriksa kejadian.

**Karakter produk:** profesional, terpercaya, bersih, efisien, tidak berisik. Kesan premium dibangun lewat tipografi, hierarki, jarak, dan ketelitian detail; bukan dengan efek dekoratif berlebihan.

### Lima aturan utama

1. **Pekerjaan utama terlihat duluan.** Pengguna segera menemukan kamar tersedia, kedatangan hari ini, tugas yang belum selesai, atau insiden yang perlu ditangani.
2. **Status tidak boleh ambigu.** Status hunian, kebersihan, fisik pintu, mekanisme kunci, dan koneksi perangkat adalah lima informasi berbeda.
3. **Aksi tidak membuat pengguna menebak.** Gunakan label konkret: `Check-in tamu`, `Buat reservasi`, `Tetapkan petugas`, `Lihat riwayat akses`.
4. **Data asli dan simulasi tidak boleh tertukar.** Log simulasi dan perangkat offline harus diberi label yang jelas, termasuk saat pengguna melakukan ekspor.
5. **Satu pola berlaku di semua modul.** Komponen, warna, ukuran, navigasi, feedback, bentuk form, tabel, hingga pesan kesalahan konsisten.

### Sasaran pengalaman

- Pekerjaan harian dapat dijalankan tanpa harus membaca manual panjang.
- Pegawai baru mampu memahami alur inti melalui label, petunjuk singkat, dan urutan proses yang jelas.
- Security dapat menentukan prioritas pemeriksaan dalam beberapa detik dari daftar insiden.
- Owner dapat memahami kondisi hotel dalam satu layar ringkasan, lalu membuka detail bila perlu.
- Tidak ada informasi atau aksi penting yang hanya disampaikan lewat warna atau ikon.

---

## 2. Identitas Visual

Nama produk: **HotelOps Guard**. Gunakan logo sederhana berupa monogram `H` dengan aksen sudut pintu atau bentuk kartu akses. Hindari logo hotel fiktif yang menyerupai merek sungguhan.

**Arah visual:** dashboard operasional modern dengan latar abu sangat muda, kartu putih, teks navy, warna teal untuk aksi utama, dan sedikit aksen amber/merah hanya saat status memerlukannya.

### 2.1 Palet warna resmi

| Token | HEX | Kegunaan |
|---|---|---|
| `--brand-navy` | `#102A43` | Sidebar, judul utama, identitas produk |
| `--brand-navy-deep` | `#0A1B2A` | Bagian gelap / header ringkasan |
| `--brand-teal` | `#0F766E` | Tombol utama, tautan aktif, fokus terarah |
| `--brand-teal-hover` | `#115E59` | Hover tombol utama |
| `--brand-teal-soft` | `#E6F5F1` | Background item terpilih / info ringan |
| `--page` | `#F6F8FB` | Latar aplikasi |
| `--surface` | `#FFFFFF` | Card, tabel, dropdown, dialog |
| `--surface-muted` | `#F0F4F8` | Toolbar, blok informasi, hover row |
| `--text` | `#162B3D` | Teks utama |
| `--text-muted` | `#526579` | Teks pendukung |
| `--border` | `#DCE5ED` | Garis pembatas |
| `--success` | `#176B4D` | Sukses / tugas selesai |
| `--success-soft` | `#E9F7EF` | Latar status sukses |
| `--warning` | `#946000` | Peringatan dan keterlambatan |
| `--warning-soft` | `#FFF5DE` | Latar status waspada |
| `--danger` | `#B42318` | Kesalahan / insiden kritis |
| `--danger-soft` | `#FEECEB` | Latar status bahaya |
| `--info` | `#245EAD` | Informasi dan proses |
| `--info-soft` | `#EBF2FC` | Latar informasi |

**Aturan warna:**

- Tombol utama: `brand-teal` + teks putih. Jangan memakai merah untuk tombol utama biasa.
- Judul dan data utama: `text` atau `brand-navy`.
- Card standar putih; sebagian besar latar aplikasi tetap `page`.
- Maksimal satu tombol primary per area keputusan; lainnya secondary/ghost.
- Gunakan warna semantik berdasarkan makna, **bukan** untuk mendekorasi angka statistik.
- Warna status harus ditemani teks dan bila perlu ikon. Misalnya: `Offline`, bukan titik merah saja.
- Jangan menggunakan hijau untuk menyatakan **pintu tertutup = aman**. Pintu tertutup tidak menjamin terkunci atau tidak ada orang di dalam.

### 2.2 Tipografi

- **Heading:** `Plus Jakarta Sans` (bila tersedia); fallback `Inter`, `ui-sans-serif`, system sans.
- **Body, angka dan tabel:** `Inter`; fallback `ui-sans-serif`, system sans.
- Gunakan tabular numbers pada angka KPI, jam, nominal uang, dan kolom tabel yang dibandingkan.

| Gaya | Desktop | Mobile | Berat / line-height |
|---|---|---|---|
| Page title | 28 px | 24 px | 700 / 1.3 |
| Section title | 18–20 px | 18 px | 650–700 / 1.35 |
| Card title | 15–16 px | 15 px | 650 / 1.4 |
| Body | 14 px | 14–15 px | 400 / 1.6 |
| Supporting text | 13 px | 13 px | 400 / 1.5 |
| Label | 13 px | 13 px | 600 / 1.4 |
| KPI utama | 28–32 px | 26–28 px | 700 / 1.2 |
| Tabel | 13–14 px | 13–14 px | 400 / 1.45 |

Jangan gunakan teks kurang dari 12 px untuk informasi operasional. Batasi jumlah bobot font agar UI tidak terlihat ramai.

### 2.3 Spacing, radius, shadow, ikon

- Sistem jarak kelipatan **4 px**: `4, 8, 12, 16, 20, 24, 32, 40, 48`.
- Padding card default **20–24 px**; mobile **16 px**.
- Jarak antar-card **16–20 px**; jarak antar-section **24–32 px**.
- Radius: input/button `10 px`, card `14 px`, dialog `16 px`, badge `999 px`.
- Border standar 1 px `--border`.
- Shadow card tipis saja: `0 2px 10px rgba(16,42,67,.04)`; dialog boleh lebih tegas.
- Ikon **Lucide**, ukuran **18–20 px** untuk menu dan tombol, 16 px untuk metadata; gunakan satu gaya stroke.
- Foto stok dan ilustrasi dekoratif tidak diperlukan dalam layar transaksi. Gunakan ikon, diagram sederhana, dan visualisasi data nyata.

### 2.4 Motion

- Hover/press: **120–160 ms**.
- Drawer/dialog: **180–220 ms**.
- Loading tidak boleh menggeser layout secara drastis.
- Hindari animasi perhatian terus-menerus. Gunakan status/perubahan teks untuk event real-time.
- Hormati `prefers-reduced-motion`.

---

## 3. Fondasi Layout dan Navigasi

### 3.1 Kerangka desktop

```text
┌────────────────┬─────────────────────────────────────────────────────┐
│ HotelOps Guard │ Hotel / properti    Cari...    Notifikasi   Akun    │
│                ├─────────────────────────────────────────────────────┤
│ RINGKASAN      │ Judul Halaman                             [Aksi]   │
│  Dashboard     │ Penjelasan singkat / breadcrumb                    │
│                │                                                     │
│ OPERASIONAL    │ [Ringkasan / KPI / status penting]                  │
│  Reservasi     │                                                     │
│  Kalender      │ [Filter dan pencarian]                              │
│  Kamar         │                                                     │
│  Tamu          │ [Konten kerja: tabel / kalender / board / timeline] │
│  Check-in/out  │                                                     │
│                │ [Pagination / hasil / pembaruan]                   │
│ TIM & LAYANAN  │                                                     │
│  Housekeeping  │                                                     │
│  Maintenance   │                                                     │
│                │                                                     │
│ KEAMANAN       │                                                     │
│  Monitoring    │                                                     │
│  Insiden       │                                                     │
│  Audit         │                                                     │
│                │                                                     │
│ ADMINISTRASI   │                                                     │
│  Keuangan      │                                                     │
│  Pengguna      │                                                     │
│  Perangkat     │                                                     │
│  Pengaturan    │                                                     │
└────────────────┴─────────────────────────────────────────────────────┘
```

- Sidebar lebar **248 px** (expanded); **72 px** (collapsed) di desktop, dengan label pada tooltip saat collapsed.
- Topbar tinggi **64 px**; konten maksimal **1600 px** di dalam area utama.
- Jarak samping konten **24–32 px desktop**, **20–24 px tablet**, **16 px mobile**.
- Sidebar memiliki highlight teal lembut dan penanda aktif yang terlihat jelas. Jangan ubah urutan menu antarhalaman.
- Header halaman: breadcrumb opsional, judul, deskripsi satu kalimat, satu aksi utama yang sesuai hak akses.
- Data operasional memakai **light theme** sebagai default. Dark mode dapat dikerjakan kemudian setelah seluruh komponen konsisten.

### 3.2 Mobile dan tablet

| Lebar layar | Perilaku |
|---|---|
| `>= 1280 px` | Sidebar penuh, tabel luas, KPI 4 kolom |
| `1024–1279 px` | Sidebar ringkas atau penuh sesuai ruang, KPI 2–4 kolom |
| `768–1023 px` | Sidebar sebagai drawer, KPI 2 kolom, filter dalam panel |
| `< 768 px` | Menu hamburger/drawer, KPI 1–2 kolom, aksi utama mudah dijangkau |

- Tidak ada horizontal scroll untuk seluruh halaman. Tabel panjang **boleh scroll horizontal di dalam kontainernya** dengan petunjuk kolom dan sticky identifier.
- Pada mobile, data tabel yang padat dapat berubah menjadi **list card** berisi informasi terpenting + menu aksi.
- Housekeeping harus nyaman digunakan di layar 360–390 px: nomor kamar besar, status jelas, tombol `Mulai tugas` / `Selesai` mudah ditekan.
- Jangan menaruh tombol hapus/aksi sensitif berdekatan dengan aksi rutin tanpa jarak.
- Minimal target sentuh **44×44 px**, meski ikon yang tampak lebih kecil.

### 3.3 Navigasi berdasarkan tugas

- **Dashboard** memberi ringkasan, bukan tempat melakukan semua pekerjaan.
- **Reservasi** adalah daftar booking dengan aksi buat/ubah/batalkan.
- **Kalender** menampilkan ketersediaan per hari dan kamar.
- **Kamar** adalah pusat data operasional kamar.
- **Check-in/out** adalah daftar kedatangan/keberangkatan dan alur penyelesaiannya.
- **Monitoring Pintu** adalah pengawasan status sensor dan aktivitas akses.
- **Insiden** adalah antrean investigasi, **bukan** salinan mentah semua log.
- **Audit** adalah catatan jejak aktivitas sistem dan akses yang dapat difilter/ekspor sesuai izin.

Menu yang tidak diizinkan oleh peran boleh disembunyikan untuk kenyamanan, namun server tetap **wajib menolak akses tak sah**.

---

## 4. Pola Komponen yang Wajib Dipakai Ulang

Jangan membuat ulang tombol, form, modal, tabel, atau badge yang berbeda pada setiap halaman. Utamakan `shadcn/ui` + variasi styling lokal yang distandarkan.

| Komponen | Panduan |
|---|---|
| `AppShell` | Sidebar, topbar, notifikasi, ruang konten, responsive drawer |
| `PageHeader` | Judul, breadcrumb/deskripsi, aksi utama |
| `StatCard` | Label, angka, periode, sumber/last update, indikator tren bila valid |
| `StatusBadge` | Label teks + warna semantik; variant status dan tone harus dipisahkan |
| `DataTable` | Search, filter, sorting, pagination, empty, loading, error |
| `FilterBar` | 3–5 filter inti terlihat; sisanya di panel `Filter lanjutan` |
| `FormField` | Label selalu terlihat, petunjuk singkat, error dekat field |
| `ConfirmDialog` | Menjelaskan konsekuensi, tombol aksi eksplisit, cancel aman |
| `DetailDrawer` | Detail cepat tanpa membuat pengguna kehilangan konteks daftar |
| `ActivityTimeline` | Event time, aksi, pelaku/sumber, sinkronisasi, tautan konteks |
| `RoomStatusCard` | Nomor, hunian, kebersihan, pintu, kunci, device, last seen |
| `AlertPanel` | Severity, alasan pemicu, waktu, kamar, status tindak lanjut |
| `EmptyState` | Alasan kosong + aksi relevan jika tersedia |
| `ConnectionState` | Online/offline/delay, waktu terakhir menerima data |

### Tombol

- Primary: mengerjakan aksi utama (`Buat reservasi`, `Simpan`, `Check-in`).
- Secondary: aksi alternatif (`Ekspor`, `Lihat detail`, `Atur filter`).
- Ghost: utilitas berfrekuensi tinggi (`Tutup`, `Batal`, `Kembali`) tanpa mendominasi.
- Destructive: aksi berisiko (`Batalkan reservasi`, `Cabut akses`); harus ada konfirmasi yang sesuai.
- Gunakan loading state selama proses. Cegah double-submit; setelah selesai berikan hasil yang jelas.
- Tidak boleh ada tombol yang terlihat aktif tetapi tidak punya fungsi.

### Form

- Label selalu di atas input; **placeholder bukan label**.
- Field wajib ditandai wajar; error menggunakan kalimat yang membantu, misalnya: `Tanggal check-out harus setelah tanggal check-in.`
- Urutkan input mengikuti alur kerja; gunakan default aman dan tidak mengubah data tanpa persetujuan.
- Tampilkan perubahan belum disimpan saat pengguna hendak keluar halaman.
- Untuk input panjang gunakan section bertahap, bukan satu dialog berisi puluhan field.
- Search memiliki ikon + shortcut opsional; hasil dan clear action terlihat.

### Tabel

- Tinggi row nyaman **48–56 px**; header 44–48 px.
- Kolom identitas penting di kiri, tanggal/status di tengah, aksi di kanan.
- Sort hanya untuk kolom yang benar-benar mendukungnya di backend.
- Filter aktif ditampilkan sebagai chip dan ada `Hapus filter`.
- Tampilkan `Menampilkan 1–20 dari 142 reservasi` atau informasi sejenis sesuai data nyata.
- Gunakan pagination server-side untuk data besar. Jangan memuat seluruh audit log ke browser.
- Tidak mengandalkan tooltip untuk informasi kritis.

### State standar

Semua halaman wajib menangani:

1. **Loading:** skeleton menyerupai bentuk konten.
2. **Empty:** alasan dan tindakan berikutnya, misalnya `Belum ada reservasi untuk tanggal ini.`
3. **Error:** pesan bahasa manusia + `Coba lagi`.
4. **Success:** umpan balik dengan tindakan/nomor referensi jika ada.
5. **No permission:** halaman/komponen jelas dengan jalur kembali.
6. **Stale / offline:** peringatan status data; jangan menampilkan angka lama seolah data live.

---

## 5. Rancangan Halaman Utama

### 5.1 Dashboard — `/dashboard`

**Tujuan:** pemilik/manajer/resepsionis melihat pekerjaan dan situasi hari ini.

Susunan desktop:

1. Header `Ringkasan Hotel`, nama properti, pemilih tanggal/shift yang relevan.
2. **Empat KPI:** tingkat hunian, kamar tersedia, kedatangan hari ini, keberangkatan hari ini.
3. Ringkasan pendapatan dan grafik tren (7/30 hari) untuk role berizin.
4. Dua panel utama: `Kedatangan & keberangkatan` dan `Kamar perlu ditangani`.
5. Panel keamanan ringkas: perangkat offline, insiden aktif, event terakhir, tautan `Buka Monitoring`.

**Visual:** bagian identitas/header beraksen navy secukupnya; card putih dominan; angka kontras; grafik sederhana dengan label jelas. Pendapatan hanya terlihat sesuai izin. Tambahkan definisi singkat untuk ADR/RevPAR bila ditampilkan.

### 5.2 Reservasi — `/reservations`

- Header: `Reservasi` + tombol `Buat reservasi`.
- Bar filter: tanggal menginap, status, nama tamu/nomor booking, sumber booking.
- Table: kode, tamu (sesuai role), kamar/tipe, check-in, check-out, status, total, aksi.
- Aksi baris: `Lihat`, `Ubah`, `Check-in` (hanya bila memenuhi kondisi), `Batalkan` (konfirmasi).
- Form baru berbentuk alur: **Tamu → Tanggal & kamar → Tarif → Tinjau → Simpan**.
- Cegah double booking; konflik ditampilkan dekat field kamar/tanggal, dengan alternatif kamar jika tersedia.

### 5.3 Kalender Ketersediaan — `/availability`

- Grid tanggal (kolom) × kamar/tipe (baris), legend status, filter lantai/tipe.
- Header tanggal tetap terlihat, nomor kamar sticky saat scroll horizontal.
- Warna booking bukan satu-satunya kode; blok perlu tooltip dan teks ringkas.
- Klik area kosong hanya membuka form reservasi jika kamar sungguh tersedia dan pengguna berizin.
- Mobile: beralih ke daftar kamar tersedia berdasarkan tanggal, bukan memaksakan seluruh grid.

### 5.4 Kamar — `/rooms` dan `/rooms/[id]`

- Tabel atau grid dapat dipilih pengguna; filter lantai, tipe, hunian, kebersihan, layanan.
- **Card kamar menampilkan status berbeda:**
  - Hunian: `Kosong`, `Dipesan`, `Terisi`.
  - Kebersihan: `Kotor`, `Sedang dibersihkan`, `Siap diperiksa`, `Bersih`.
  - Layanan: `Tersedia`, `Tidak dijual`, `Dalam perbaikan`.
- Detail kamar memiliki tab: `Ringkasan`, `Reservasi`, `Housekeeping`, `Maintenance`, `Akses pintu`, `Riwayat perubahan`.
- Jangan menampilkan identitas tamu penuh kepada role yang tidak berizin.

### 5.5 Check-in / Check-out — `/front-desk`

- Tampilan kerja berupa dua tab/kolom: `Kedatangan` dan `Keberangkatan`.
- Gunakan langkah check-in jelas: **Cari reservasi → Verifikasi → Pilih kamar → Konfirmasi → Terbitkan akses (jika tersedia)**.
- Setelah check-out: tampilkan hasil tagihan, status akhir reservasi, tugas housekeeping, dan status pencabutan akses tamu yang benar-benar dikonfirmasi perangkat.
- Jika perangkat gagal menerima pencabutan akses, tampilkan `Perlu tindak lanjut`, bukan `Berhasil dicabut`.

### 5.6 Housekeeping — `/housekeeping`

- Tab: `Tugas saya`, `Seluruh tugas` (sesuai role), `Menunggu inspeksi`.
- Kartu tugas: nomor kamar besar, prioritas, jam target, detail singkat, status, tombol utama.
- Di mobile, tombol `Mulai tugas` dan `Selesai` mudah dijangkau; status berubah setelah backend berhasil menyimpan.
- Catat siapa memulai/menyelesaikan, kapan, dan checklist. Akses pintu terkait hanya boleh dipakai sebagai data pendukung, bukan bukti pekerjaan telah dilakukan.

### 5.7 Maintenance — `/maintenance`

- Daftar tiket dengan prioritas, kamar, penanggung jawab, tenggat, status.
- Detail tiket memuat kronologi, catatan, foto bila memang digunakan, dan izin akses jika dibutuhkan.
- Aksi menyetujui akses berisiko harus jelas dan dibatasi role; alasan tersimpan.

### 5.8 Monitoring Pintu — `/security/doors`

**Halaman utama pengawasan akses** harus mengutamakan kejelasan sumber data dan keterbatasan perangkat.

Susunan:

1. Header `Monitoring Pintu` + indikator `Terhubung`, `Terlambat`, atau `Terputus` beserta *terakhir diperbarui*.
2. Banner mode: `MODE SIMULASI — Data ini bukan aktivitas pintu fisik` bila simulator aktif.
3. KPI **terpisah**: `Perangkat online`, `Sensor pintu terbuka`, `Sensor tidak tersedia`, `Insiden aktif`.
4. Filter lokasi (properti/lantai/kamar), status device, jenis event, rentang waktu, petugas.
5. Pilihan view `Kartu kamar` / `Linimasa akses`.
6. Detail kamar dengan riwayat event, hubungan reservasi/tugas, dan tombol `Lihat insiden`.

**Rancangan kartu akses kamar**

```text
┌───────────────────────────────────────────────────┐
│ Kamar 305                     [Insiden: Tinggi]  │
│ Hunian      : Kosong                              │
│ Sensor pintu: Terbuka · 21:03                      │
│ Kunci       : Tidak diketahui                     │
│ Perangkat   : Online · Terakhir 21:07              │
│ Aktivitas   : Kartu staf terdeteksi                │
│ Sumber      : Hardware · Live                      │
│ [Lihat riwayat]              [Periksa insiden]     │
└───────────────────────────────────────────────────┘
```

**Jangan mencampur fakta berikut:**

| Label UI | Artinya | Tidak membuktikan |
|---|---|---|
| `Akses diterima` | Kredensial diterima perangkat | Pintu benar-benar dibuka |
| `Pintu terbuka` | Sensor fisik menyatakan daun pintu terbuka | Seseorang masuk; siapa yang masuk |
| `Pintu tertutup` | Sensor fisik menyatakan daun pintu tertutup | Kunci telah terkunci |
| `Kunci terkunci` | Perangkat mendeteksi lock state terkunci | Kamar kosong / aman sepenuhnya |
| `Belum diketahui` | Sensor tidak tersedia, offline, atau data belum diterima | Kondisi terkini pintu |

Jika tidak ada sensor pintu, tampilkan `Status pintu tidak tersedia` dan penjelasan singkat. **Jangan menebak `Terbuka` dari `Akses diterima`.**

### 5.9 Insiden Keamanan — `/security/incidents`

- Halaman antrean, bukan layar yang menakut-nakuti: `Perlu ditinjau`, `Sedang diperiksa`, `Selesai`.
- Setiap item: severity, kamar, alasan alert, waktu kejadian, waktu terima, status, petugas penanggung jawab.
- Detail berupa **kronologi**: event → pemicu aturan → data pendukung → komentar petugas → keputusan.
- CTA primer: `Mulai pemeriksaan` atau `Tetapkan petugas` sesuai keadaan.
- Gunakan red tone hanya untuk critical/high yang memang berisiko; bedakan alert dari **temuan yang sudah diverifikasi**.
- Contoh label: `Akses di luar penugasan — perlu diperiksa`, **bukan** `Pegawai memasukkan tamu ilegal`.
- Setelah ditutup, alasan dan pengguna yang memutuskan tetap terlihat dalam audit sesuai izin.

### 5.10 Keuangan — `/finance`

- KPI keuangan sesuai role; tabel folio dan pembayaran; filter tanggal; status tagihan jelas.
- Rupiah menggunakan format `Rp 1.250.000`, pembulatan sesuai sistem; tampilkan periode dan konteks.
- Aksi refund/discount memakai konfirmasi, ringkasan nominal, dan otorisasi backend.
- Status `Dicatat manual` berbeda dari `Dikonfirmasi payment gateway`.

### 5.11 Laporan & Audit — `/reports` dan `/audit`

- Pilih jenis laporan, rentang tanggal, filter, pratinjau, lalu ekspor bila berizin.
- Tampilkan zona waktu, waktu pembuatan laporan, sumber data dan batas keterlambatan.
- Riwayat audit bukan form editable; tidak ada tombol `Hapus log` atau `Ubah event`.
- Pada ekspor, beri label data simulasi dan status tidak diketahui agar pembaca tidak salah menafsirkan.

### 5.12 Perangkat & Pengaturan — `/settings/devices`

- Daftar vendor, model, kemampuan, status koneksi, last seen, baterai/sensor bila tersedia.
- Tunjukkan fitur perangkat dengan daftar kemampuan yang faktual, misalnya `Sensor buka/tutup: Tidak didukung`.
- Aksi sensitif (ubah credential, reset, remote unlock) diatur berdasar kemampuan dan izin; jangan menampilkan aksi remote unlock seolah berfungsi jika belum diintegrasikan.

---

## 6. Status, Bahasa dan Microcopy

Gunakan Bahasa Indonesia yang langsung, sopan, dan masuk akal untuk staf hotel. Label bahasa Inggris hanya bila sudah menjadi istilah umum kerja hotel atau ada kebutuhan teknis.

| Kurang baik | Gunakan |
|---|---|
| `Welcome back, Admin` | `Ringkasan hotel hari ini` |
| `Submit` | `Simpan reservasi` / `Konfirmasi check-in` |
| `Something went wrong` | `Data belum berhasil dimuat. Coba lagi.` |
| `Unauthorized!` | `Akun Anda tidak memiliki akses ke halaman ini.` |
| `No data found` | `Belum ada data pada periode ini.` |
| `Employee breached room` | `Akses staf di luar penugasan — perlu diperiksa.` |
| `Door safe` | `Sensor mendeteksi pintu tertutup` |
| `Device dead` | `Perangkat tidak terhubung` |
| `All clear` | `Belum ada insiden aktif yang tercatat` |

**Pesan khusus keamanan:** selalu pisahkan `fakta yang tercatat`, `hasil analisis`, dan `kesimpulan investigasi`.

**Tanggal/waktu:** contoh `6 Nov 2026, 21.03 WIB` atau format zona properti. Untuk aktivitas penting, tampilkan tanggal penuh pada detail. Jika event diterima terlambat, tampilkan kedua waktu (`Terjadi` dan `Diterima`).

**Uang:** `Rp 850.000`; gunakan nilai angka dari backend, jangan hardcode nominal dashboard.

**Identitas:** gunakan data tamu/staf sesuai izin dan tampilkan hanya informasi yang dibutuhkan untuk tugas terkait.

---

## 7. Interaksi, Alur dan UX Safety

### 7.1 Aturan feedback

- Setiap aksi memicu feedback: spinner pendek, perubahan status, toast, atau pesan kesalahan.
- Jangan menampilkan `Berhasil` sebelum server/penyedia perangkat memberi konfirmasi yang sesuai.
- Untuk proses tertunda, tampilkan `Sedang diproses` dan cara memeriksa hasilnya.
- Aksi tak dapat dibatalkan harus punya dialog penegasan dan efek yang jelas.
- Jangan menggunakan modal untuk semua jenis pekerjaan. Form panjang lebih nyaman sebagai halaman sendiri.

### 7.2 Aksi dan izin

- UI boleh menyembunyikan aksi tak berizin, tetapi otorisasi wajib di server.
- Jangan bocorkan data ke state browser, HTML awal, maupun request API bagi pengguna yang tidak berwenang.
- Aksi sensitif tidak boleh didesain sebagai tombol cepat tanpa alasan/otorisasi.
- Status `Remote unlock` hanya boleh ada jika fitur hardware mendukung dan kontrol keamanan yang diwajibkan PRD terpenuhi.

### 7.3 Pemberitahuan real-time

- Bedakan `Data terbaru`, `Sinkronisasi tertunda`, `Koneksi terputus`, dan `Mode simulasi`.
- Jangan memutar bunyi alarm otomatis atau berkedip terus-menerus; fokus pada notifikasi yang bisa ditindaklanjuti.
- Urutkan insiden menurut severity + timestamp; izinkan filter `Belum ditangani`.
- Event telat datang harus diberi keterangan, bukan disisipkan seolah realtime.

### 7.4 Privasi

- Tidak menampilkan dokumen identitas tamu di preview tabel atau notifikasi.
- Tidak ada tampilan CCTV/kamera dalam kamar.
- Hindari istilah yang menuduh pekerja sebelum investigasi selesai.

---

## 8. Aksesibilitas dan Kualitas Visual

**Wajib diterapkan sebelum halaman dianggap selesai:**

- Kontras teks normal minimal setara **WCAG AA 4.5:1**, teks besar minimal **3:1**; cek implementasi final, bukan hanya nilai token di dokumen.
- Keyboard navigation: Tab/Shift+Tab, Enter/Space, Escape pada dialog yang sesuai.
- Focus ring jelas, tidak dihilangkan; warna teal/outline yang terlihat di atas semua surface.
- Form punya `label`, error dengan asosiasi ARIA; dialog punya judul dan pengelolaan fokus.
- Icon-only button punya `aria-label`.
- Gunakan heading berurutan; landmark navigasi dan main tersedia.
- Semua status dapat dipahami tanpa membedakan hijau-merah saja.
- Layout diuji pada zoom 200% dan viewport kecil tanpa memotong aksi penting.
- Grafik punya legenda, satuan, rentang waktu, tooltip, dan alternatif tabel/ringkasan bila diperlukan.
- Skeleton/loading tidak membuat halaman bergeser berlebihan.

---

## 9. Design Tokens dan Struktur Implementasi

Gunakan satu sumber token. Penerapannya boleh mengikuti versi Tailwind/shadcn yang dipakai proyek, **tetapi nilai dan nama semantiknya harus tetap konsisten**.

### 9.1 Contoh token dasar CSS

```css
:root {
  --brand-navy: #102A43;
  --brand-navy-deep: #0A1B2A;
  --brand-teal: #0F766E;
  --brand-teal-hover: #115E59;
  --brand-teal-soft: #E6F5F1;

  --page: #F6F8FB;
  --surface: #FFFFFF;
  --surface-muted: #F0F4F8;
  --text: #162B3D;
  --text-muted: #526579;
  --border: #DCE5ED;

  --success: #176B4D;
  --success-soft: #E9F7EF;
  --warning: #946000;
  --warning-soft: #FFF5DE;
  --danger: #B42318;
  --danger-soft: #FEECEB;
  --info: #245EAD;
  --info-soft: #EBF2FC;

  --radius-control: 10px;
  --radius-card: 14px;
  --radius-dialog: 16px;
  --app-sidebar-width: 248px;
  --app-topbar-height: 64px;
}
```

> Ini adalah **nilai desain**, bukan konfigurasi shadcn yang boleh langsung disalin tanpa adaptasi. Hubungkan token ke theme Tailwind dan variabel shadcn yang sesuai versi proyek; hindari dua sumber tema yang saling bertentangan.

### 9.2 Struktur yang dianjurkan

```text
src/
  app/
    (auth)/login/
    (app)/dashboard/
    (app)/reservations/
    (app)/availability/
    (app)/rooms/
    (app)/front-desk/
    (app)/housekeeping/
    (app)/maintenance/
    (app)/finance/
    (app)/security/doors/
    (app)/security/incidents/
    (app)/reports/
    (app)/audit/
    (app)/settings/devices/
  components/
    layout/          # AppShell, Sidebar, Topbar, PageHeader
    ui/              # shadcn primitives
    shared/          # StatCard, DataTable, FilterBar, StatusBadge
    rooms/           # RoomStatusCard, RoomStatusLegend
    security/        # DoorEventTimeline, ConnectionState, AlertPanel
  lib/
    design/          # label status, formatter, navigation, variants
  styles/            # tokens/theme jika proyek membutuhkannya
```

### 9.3 Aturan komponen reusable

- Sediakan `statusConfig` terpusat untuk label/warna/ikon berdasarkan jenis status **dan domain** (`room`, `housekeeping`, `device`, `door`, `incident`). Jangan satu enum `status` untuk semua.
- Sediakan formatters tunggal: `formatCurrencyIDR`, `formatLocalDateTime(timeZone)`, `formatStatusLabel`, `formatRelativeTime`.
- Gunakan hook atau provider khusus status koneksi/event; jangan membuat timer polling sendiri di tiap kartu kamar.
- Tanpa copy-paste komponen KPI, badge, empty-state, atau modal untuk modul berbeda.
- Jangan menambah library UI kedua yang menyebabkan dua gaya tombol/tabel berbeda.
- Implementasi halaman mengikuti pola `PageHeader → Summary → Toolbar → Content → Feedback` kecuali alur transaksi bertahap.

---

## 10. Contoh Layar dan Data Demo

Saat seed awal tersedia, tampilkan contoh yang **masuk akal dan ditandai sebagai data demo di lingkungan development**:

- Hotel contoh, 4 lantai, 40 kamar; jangan gunakan logo, nama, atau data asli pelanggan.
- Dashboard menunjukkan okupansi dan kedatangan hari ini dari database seed.
- Reservasi memperlihatkan beberapa status dan tanggal masuk akal.
- Housekeeping memuat tugas yang belum dimulai, sedang dikerjakan, dan menunggu inspeksi.
- Monitoring menunjukkan kamar yang sensornya ada, yang tidak didukung, dan yang perangkatnya offline.
- Simulasi insiden kamar 305 seperti pada PRD, **jelas berlabel `SIMULASI`**, bukan log hardware sungguhan.

**Larangan visual:** menampilkan data demo sebagai statistik nyata, membuat semua grafik tampak sama, menampilkan semua status hijau, menampilkan 0 tanpa menjelaskan apakah tidak ada data atau sistem belum terhubung.

---

## 11. Checklist Konsistensi per Halaman

AI coding assistant **wajib memeriksa** sebelum menyatakan sebuah halaman selesai.

- [ ] Menggunakan AppShell, sidebar, topbar, PageHeader yang sama.
- [ ] Menggunakan token warna dan tipografi resmi, bukan warna HEX acak.
- [ ] Heading, jarak, card, tombol, input, badge, tabel memakai komponen reusable.
- [ ] Teks UI bahasa Indonesia natural, bukan placeholder bahasa Inggris.
- [ ] Aksi utama mudah ditemukan dan hanya ditampilkan bila berizin.
- [ ] Loading, empty, error, success, dan no-permission state tersedia.
- [ ] Filter/pagination bekerja berdasarkan data backend, bukan hanya tampilan.
- [ ] Ukuran 360 px, 768 px, 1024 px, dan 1440 px layak digunakan.
- [ ] Tab dan dialog dapat dioperasikan dengan keyboard.
- [ ] Kontras dan focus state memenuhi standar aksesibilitas.
- [ ] Semua nominal dan tanggal diformat konsisten, sesuai properti.
- [ ] Tabel tidak mendorong seluruh halaman scroll horizontal di mobile.
- [ ] Pintu, kunci, hunian, sensor, dan insiden tidak digabung menjadi satu status.
- [ ] Data hardware, simulasi, offline, terlambat dan unknown dibedakan secara eksplisit.
- [ ] Alert memakai bahasa `perlu diperiksa`, bukan tuduhan sebelum terverifikasi.
- [ ] Tombol yang tampil punya fungsi nyata atau dinonaktifkan dengan alasan jelas.
- [ ] Tidak ada secret, dokumen identitas, atau informasi sensitif yang terbuka ke role salah.
- [ ] Screenshot desktop/mobile dibandingkan antarhalaman untuk memastikan pola konsisten.

### Kriteria penerimaan visual

Halaman belum dianggap selesai hanya karena komponen sudah muncul. Halaman baru dianggap layak ketika **bisa dipakai menyelesaikan pekerjaan, informasinya benar, aksesnya aman, dan desainnya tetap konsisten dalam kondisi normal maupun gagal**.

---

## 12. Instruksi untuk AI Coding Assistant di VS Code

> **Urutan sumber acuan:**
> 1. `PRD.md`: kebutuhan bisnis, aturan akses dan keamanan (sumber kebenaran fitur).
> 2. `desain.md`: visual, bahasa, navigasi, komponen dan alur UX (sumber kebenaran desain).
> 3. `PROMPT_VSCODE_HotelOps_Guard.md`: stack, proses implementasi dan target pengerjaan.
>
> Jika ada perbedaan, keputusan yang melindungi **keselamatan pengguna, keamanan data dan ketepatan event hardware** selalu diutamakan. Jangan mengorbankan fungsi atau aksesibilitas untuk mengejar tampilan.

**Perintah kerja:**

1. Baca dokumen ini **sebelum** membuat halaman atau komponen UI.
2. Buat layout dan komponen reusable terlebih dahulu, kemudian gunakan secara konsisten di seluruh modul.
3. Implementasikan satu halaman lengkap dengan data/backend dan state interaksi sebelum membuat banyak halaman kosong.
4. Gunakan token desain yang sama; jangan berimprovisasi dengan palet baru setiap halaman.
5. Periksa tampilan desktop dan mobile pada setiap tahap; perbaiki overflow, keterbacaan, dan urutan aksi.
6. Jika menambah pola atau komponen baru, perbarui dokumen ini dan gunakan kembali di seluruh aplikasi.
7. Saat melaporkan progres, sertakan halaman yang dibuat, komponen reusable, pengujian UI, dan bagian yang belum dikerjakan secara faktual.

**Prioritas UX:** Kejelasan kerja > ketepatan status > keamanan > konsistensi > estetika tambahan.

---

*Dokumen ini mengatur desain dan pengalaman pengguna; detail implementasi bisnis tetap mengikuti `PRD.md`. Integrasi perangkat fisik harus dibuktikan melalui kemampuan hardware yang sebenarnya.*
