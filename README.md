# ITS Space

Platform reservasi ruang dan fasilitas kampus ITS: katalog fasilitas, ketersediaan real-time, booking dengan persetujuan, tiket QR, check-in, dashboard pengguna, operations center admin, serta pembayaran fasilitas premium melalui Midtrans Snap.

Aplikasi ini adalah **Next.js full-stack** dengan PostgreSQL. Tidak ada mock availability di frontend: semua slot dan status berasal dari database. Anti double-booking dijaga oleh exclusion constraint PostgreSQL, bukan pengecekan di browser.

## Demo online

**https://flying-meteor-vie9rlx-sealius-hq.vercel.app**

Deployment production berjalan di Vercel region Singapura (`sin1`) dengan database Neon PostgreSQL 17 di `aws-ap-southeast-1`. Database demo berisi **21 fasilitas di 10 gedung** (20 fasilitas aktif).

### Akun demo

| Peran | Email | Password |
| --- | --- | --- |
| Admin | `admin@its-space.id` | `Admin#2026` |
| Mahasiswa | `mahasiswa@its-space.id` | `Mahasiswa#2026` |
| Staff | `staff@its-space.id` | `Staff#2026` |
| Load test 1–8 | `load1@its-space.id` … `load8@its-space.id` | `LoadTest#2026` |

`pnpm db:seed` mereset data demo, termasuk booking dan session.

## Fitur

- Landing page, katalog dengan filter kategori/gedung/kapasitas/amenity/tanggal/jam
- Ketersediaan per slot dan ringkasan seminggu
- Booking dengan persetujuan otomatis atau antrean admin
- Pembatalan, approve/reject, check-in/check-out
- Tiket dengan QR bertanda tangan dan endpoint PNG
- Dashboard pengguna, notifikasi, riwayat, dan pengaturan profil
- Ubah nama, organisasi, WhatsApp, preferensi notifikasi, dan kata sandi
- Operations center: antrean approval, check-in, status fasilitas, seluruh booking
- RBAC (`student`, `staff`, `admin`) dan audit log
- Halaman **Locations** dengan peta gedung dan 21 fasilitas
- Halaman **Help/FAQ**, **Tutorial** langkah-demi-langkah, dan **Emergency** dengan kontak penting
- Pembayaran fasilitas premium melalui Midtrans Snap (QRIS, VA, kartu)
- API health dan halaman status
- Space Assist: asisten berbasis aturan yang membaca database, bukan LLM yang mengarang ketersediaan
- PWA manifest, layout mobile dengan bottom dock

Fasilitas berbayar baru antara lain Auditorium GKU, GOR Indoor Multifungsi, Lab Jaringan & Keamanan, Lab Multimedia, dan Studio Podcast. Fasilitas gratis tetap dapat dipesan tanpa pembayaran.

## Pembayaran

Alur pembayaran:

1. Booking pada fasilitas berbayar membuat baris `payments` berstatus `pending` dengan nominal sesuai tarif per jam.
2. Pembayaran hanya dibuka setelah booking berstatus `approved`.
3. Tombol **Bayar sekarang** membuat transaksi Midtrans Snap. Pengguna diarahkan ke halaman pembayaran Midtrans.
4. Webhook Midtrans memverifikasi signature SHA-512 dan nominal transaksi sebelum mengubah status pembayaran.
5. Status `paid` membuka check-in. Check-in pada booking berbayar ditolak sampai pembayaran lunas.
6. Pembatalan booking dengan pembayaran `pending` menandai pembayaran menjadi `failed`.

Jika `MIDTRANS_SERVER_KEY` belum diisi, UI menampilkan bahwa pembayaran online belum aktif dan API mengembalikan `503 PAYMENT_NOT_CONFIGURED`. Integrasi belum dapat memproses pembayaran nyata sampai server key Midtrans dipasang.

### Konfigurasi Midtrans

Tambahkan ke environment Vercel (Production/Preview) dan `.env.local`:

```env
MIDTRANS_SERVER_KEY=server-key-dari-dashboard-midtrans
MIDTRANS_IS_PRODUCTION=false
```

Gunakan `MIDTRANS_IS_PRODUCTION=true` hanya setelah beralih ke akun production Midtrans.

Atur **Payment Notification URL** di dashboard Midtrans ke:

```text
https://flying-meteor-vie9rlx-sealius-hq.vercel.app/api/payments/webhook
```

Untuk pengujian sandbox, gunakan URL deployment yang sama setelah server key sandbox dipasang. Refund otomatis belum diimplementasikan; refund saat ini diproses manual melalui dashboard Midtrans.

## Stack

- Next.js 16.4.5 · React 19.3.1 · TypeScript strict
- PostgreSQL 17+ · driver `pg` · SQL langsung (tanpa ORM) · `pg_trgm` untuk pencarian
- Zod untuk validasi request
- Session cookie HttpOnly dengan token yang di-hash di database
- `scrypt` untuk password
- QR tiket ditandatangani HMAC-SHA256
- Midtrans Snap melalui `fetch` server-side (tanpa SDK tambahan)
- Vitest, autocannon, Playwright Core untuk verifikasi

## Menjalankan lokal

Prasyarat: Node.js 22+, pnpm, PostgreSQL 16+.

```bash
pnpm install
cp .env.example .env.local   # isi DATABASE_URL, CHECKIN_SECRET, dan Midtrans bila perlu
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Buka `http://localhost:3200`.

`.env.local`:

```env
DATABASE_URL=postgresql://postgres@127.0.0.1:55433/its_space
CHECKIN_SECRET=ganti-dengan-string-acak-panjang
NEXT_PUBLIC_SITE_URL=http://localhost:3200

MIDTRANS_SERVER_KEY=
MIDTRANS_IS_PRODUCTION=false
```

`CHECKIN_SECRET` dipakai untuk menandatangani QR. Jangan gunakan nilai contoh di production. Biarkan `MIDTRANS_SERVER_KEY` kosong untuk menjalankan aplikasi tanpa pembayaran online.

## Aturan anti double-booking

Constraint PostgreSQL, bukan pengecekan frontend:

```sql
ALTER TABLE bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    facility_id WITH =,
    slot_range WITH &&
  )
  WHERE (status IN ('pending', 'approved', 'checked_in'));
```

`slot_range` adalah `tstzrange` yang diisi trigger dari `starts_at` dan `ends_at`, ditambah buffer 15 menit. Kolom ini diperlukan karena expression `timestamptz - interval` tidak `IMMUTABLE` sehingga tidak bisa dipakai langsung di exclusion constraint.

Booking `pending` memblokir slot. Hanya satu request aktif yang bisa menang; sisanya menerima `409 SLOT_CONFLICT`. Pembatalan melepas slot.

## API utama

| Method | Endpoint | Akses |
| --- | --- | --- |
| `POST` | `/api/auth/login` | publik |
| `POST` | `/api/auth/register` | publik |
| `GET` | `/api/auth/me` | login |
| `GET` | `/api/facilities/[slug]/availability?date=` | publik |
| `POST` | `/api/bookings` | login |
| `POST` | `/api/bookings/[id]/cancel` | pemilik/admin |
| `GET` | `/api/bookings/[id]/qr` | pemilik/admin |
| `POST` | `/api/admin/bookings/[id]/approve` | admin |
| `POST` | `/api/admin/bookings/[id]/reject` | admin |
| `POST` | `/api/admin/checkin` | admin |
| `POST` | `/api/bookings/[id]/checkout` | pemilik/admin |
| `PATCH` | `/api/profile` | login |
| `PATCH` | `/api/profile/password` | login |
| `POST` | `/api/payments/[id]` | pemilik booking |
| `POST` | `/api/payments/webhook` | Midtrans |
| `GET` | `/api/health` | publik |

## Verifikasi

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm test:smoke
pnpm test:concurrency
pnpm test:load
pnpm test:visual
```

Hasil terakhir pada deployment publik (9 November 2026):

- TypeScript strict: **lulus, 0 error**
- Unit test: **20/20 lulus** (`time`, `validation`, `assistant`, `payment`)
- Production build Next.js: **lulus, 17 route**
- API smoke: **21/21 lulus** — login, profil, halaman bantuan, booking, overlap `409`, pembatalan, approve, QR, check-in, check-out, tarif premium, payment menunggu approval, dan RBAC
- Uji ubah password: lulus, termasuk login dengan password baru dan pemulihan password lama
- Concurrency: **24 request paralel → 1 × 201, 23 × 409**, elapsed 450 ms, p95 352 ms
- Load test publik, 20 koneksi health / 10 koneksi halaman, 8 detik per skenario:
  - `/api/health`: 307 req/s, avg 65 ms, p95 105 ms, p99 267 ms
  - `/explore?category=sports&minCapacity=50`: 68 req/s, avg 145 ms, p95 409 ms, p99 449 ms
  - `/facilities/auditorium-utama`: 84 req/s, avg 118 ms, p95 317 ms, p99 422 ms
  - 0 non-2xx, 0 connection error
- Visual check: halaman utama, explore, detail, help, tutorial, emergency, locations, detail premium, settings, dashboard, dan admin; desktop 1440 px serta mobile 390 px lulus tanpa console error atau horizontal overflow
- Database setelah warm: 2–3 ms per query; health endpoint `operational`

Angka di atas adalah baseline pengujian, bukan jaminan kapasitas produksi. Target 5.000 pengguna bersamaan belum divalidasi dan tidak diklaim tercapai.

## Deployment

Aplikasi memerlukan PostgreSQL yang mendukung exclusion constraint GiST (Neon, Supabase, RDS, dan PostgreSQL standar mendukungnya).

Environment production:

```env
DATABASE_URL=postgresql://...
CHECKIN_SECRET=string-acak-panjang
NEXT_PUBLIC_SITE_URL=https://domain-anda
MIDTRANS_SERVER_KEY=server-key-midtrans
MIDTRANS_IS_PRODUCTION=false
```

Jalankan migrasi dan seed ke database production:

```bash
DATABASE_URL="..." pnpm db:migrate
DATABASE_URL="..." pnpm db:seed
```

Deployment production memakai `vercel.json` untuk menempatkan function di region Singapura, sehingga satu region dengan database Neon:

```json
{ "regions": ["sin1"] }
```

Setelah deploy, set `NEXT_PUBLIC_SITE_URL` ke URL publik, daftarkan webhook Midtrans, lalu jalankan smoke, concurrency, load, serta visual check:

```bash
STRESS_BASE_URL=https://domain-anda pnpm test:smoke
STRESS_BASE_URL=https://domain-anda pnpm test:concurrency
STRESS_BASE_URL=https://domain-anda pnpm test:load
VISUAL_BASE_URL=https://domain-anda pnpm test:visual
```

## Struktur

```text
app/                  route, halaman publik, settings, help, tutorial, emergency, locations
components/           komponen interaktif termasuk form profil dan tombol pembayaran
lib/                  auth, booking engine, fasilitas, pembayaran, profil, waktu, validasi
db/schema.sql         schema + trigger + exclusion constraint + payments
scripts/              migrate, seed, smoke, concurrency, load, visual
tests/                unit test Vitest
```

## Batasan saat ini

- Pembayaran online belum aktif sampai `MIDTRANS_SERVER_KEY` dipasang; pembayaran sandbox/production belum diuji end-to-end dari deployment ini.
- Refund otomatis belum ada; refund manual melalui dashboard Midtrans.
- Belum ada email/WhatsApp notification; notifikasi hanya in-app.
- Belum ada upload surat izin, SSO institusional, atau integrasi kalender.
- Mobile tersedia sebagai PWA responsif, bukan aplikasi native terpisah.
- Rate limit login disimpan di audit log database; untuk traffic besar sebaiknya dipindah ke Redis/edge rate limiter.
- Kapasitas 5.000 concurrent users belum diuji; load test di atas adalah baseline, bukan sertifikasi kapasitas.
- Seed memakai foto Unsplash dan data demo; ganti sebelum penggunaan nyata.
