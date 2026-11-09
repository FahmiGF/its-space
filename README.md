# ITS Space

Platform reservasi ruang dan fasilitas kampus ITS: pencarian fasilitas, ketersediaan real-time, booking dengan persetujuan, tiket QR, check-in, dashboard pengguna, dan operations center admin.

Aplikasi ini adalah **Next.js full-stack** dengan PostgreSQL. Tidak ada mock availability di frontend: semua slot dan status berasal dari database.

## Demo online

**https://flying-meteor-vie9rlx-sealius-hq.vercel.app**

Deployment production berjalan di Vercel region Singapura (`sin1`) dengan database Neon PostgreSQL 17 di `aws-ap-southeast-1`. Gunakan akun demo di bawah untuk mencoba alur booking dan admin.

## Stack

- Next.js 16.4.5 · React 19.3.1 · TypeScript strict
- PostgreSQL 17+ · driver `pg` · SQL langsung (tanpa ORM)
- Zod untuk validasi request
- Session cookie HttpOnly dengan token yang di-hash di database
- `scrypt` untuk password
- QR tiket ditandatangani HMAC-SHA256
- Vitest, autocannon, Playwright Core untuk verifikasi

## Menjalankan lokal

Prasyarat: Node.js 22+, pnpm, PostgreSQL 16+.

```bash
pnpm install
cp .env.example .env.local   # isi DATABASE_URL dan CHECKIN_SECRET
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
```

`CHECKIN_SECRET` dipakai untuk menandatangani QR. Jangan gunakan nilai contoh di production.

### Akun demo

| Peran | Email | Password |
| --- | --- | --- |
| Admin | `admin@its-space.id` | `Admin#2026` |
| Mahasiswa | `mahasiswa@its-space.id` | `Mahasiswa#2026` |
| Staff | `staff@its-space.id` | `Staff#2026` |
| Load test 1–8 | `load1@its-space.id` … `load8@its-space.id` | `LoadTest#2026` |

`pnpm db:seed` mereset data demo, termasuk booking dan session.

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

## Fitur

- Landing page, katalog dengan filter kategori/gedung/kapasitas/amenity/tanggal/jam
- Ketersediaan per slot dan ringkasan seminggu
- Booking dengan persetujuan otomatis atau antrean admin
- Pembatalan, approve/reject, check-in/check-out
- Tiket dengan QR bertanda tangan dan endpoint PNG
- Dashboard pengguna, notifikasi, riwayat
- Operations center: antrean approval, check-in, status fasilitas, seluruh booking
- RBAC (`student`, `staff`, `admin`) dan audit log
- API health dan halaman status
- Space Assist: asisten berbasis aturan yang membaca database, bukan LLM yang mengarang ketersediaan
- PWA manifest, layout mobile dengan bottom dock

## API utama

| Method | Endpoint | Akses |
| --- | --- | --- |
| `POST` | `/api/auth/login` | publik |
| `POST` | `/api/auth/register` | publik |
| `GET` | `/api/facilities/[slug]/availability?date=` | publik |
| `POST` | `/api/bookings` | login |
| `POST` | `/api/bookings/[id]/cancel` | pemilik/admin |
| `GET` | `/api/bookings/[id]/qr` | pemilik/admin |
| `POST` | `/api/admin/bookings/[id]/approve` | admin |
| `POST` | `/api/admin/bookings/[id]/reject` | admin |
| `POST` | `/api/admin/checkin` | admin |
| `POST` | `/api/bookings/[id]/checkout` | pemilik/admin |
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

Hasil pada mesin pengembangan (production build lokal, PostgreSQL lokal):

- TypeScript: lulus
- Unit test: **14/14 lulus**
- API smoke: **13/13 lulus** — login, pembuatan booking, overlap `409`, pembatalan, approve, QR, check-in, check-out, RBAC
- Concurrency: **24 request paralel → 1 × 201, 23 × 409** pada slot yang sama; p95 190 ms
- Load test lokal, 20 koneksi, 8 detik per skenario:
  - `/api/health`: 466 req/s, p95 65 ms
  - `/explore`: 63 req/s, p95 239 ms
  - `/facilities/auditorium-utama`: 62 req/s, p95 201 ms
  - 0 non-2xx, 0 error
- Visual check desktop 1440 px dan mobile 390 px: halaman utama, explore, detail, dashboard, admin; tidak ada console error atau horizontal overflow

Hasil pada deployment publik (Vercel `sin1` + Neon `aws-ap-southeast-1`):

- API smoke: **13/13 lulus** — termasuk QR check-in dengan secret production
- Concurrency: **24 request paralel → 1 × 201, 23 × 409**; elapsed 1,0 detik, p95 975 ms
- Load test, 20 koneksi, 8 detik per skenario:
  - `/api/health`: 294 req/s, p95 170 ms, p99 264 ms
  - `/explore`: 82 req/s, p95 487 ms, p99 954 ms
  - `/facilities/auditorium-utama`: 90 req/s, p95 299 ms, p99 355 ms
  - 0 non-2xx, 0 connection error
- Database setelah warm: **2–3 ms** per query; health endpoint `operational`
- Visual check desktop, mobile, dashboard, dan admin pada URL publik: lulus tanpa console error atau horizontal overflow

Angka lokal dan publik di atas adalah baseline pengujian, bukan jaminan kapasitas produksi. Target 5.000 pengguna bersamaan belum divalidasi dan tidak diklaim tercapai.

## Struktur

```text
app/                  route dan UI
components/           komponen interaktif
lib/                  auth, booking engine, fasilitas, waktu, validasi
db/schema.sql         schema + trigger + exclusion constraint
scripts/              migrate, seed, smoke, concurrency, load, visual
tests/                unit test Vitest
```

## Deployment

Aplikasi memerlukan PostgreSQL yang mendukung exclusion constraint GiST (Neon, Supabase, RDS, dan PostgreSQL standar mendukungnya).

Environment production:

```env
DATABASE_URL=postgresql://...
CHECKIN_SECRET=string-acak-panjang
NEXT_PUBLIC_SITE_URL=https://domain-anda
```

Jalankan migrasi dan seed ke database production:

```bash
DATABASE_URL="..." pnpm db:migrate
DATABASE_URL="..." pnpm db:seed
```

Deployment production saat ini memakai `vercel.json` untuk menempatkan function di region Singapura, sehingga satu region dengan database Neon:

```json
{ "regions": ["sin1"] }
```

Setelah deploy, set `NEXT_PUBLIC_SITE_URL` ke URL publik dan jalankan smoke, concurrency, load, serta visual check terhadap URL tersebut:

```bash
STRESS_BASE_URL=https://domain-anda pnpm test:smoke
STRESS_BASE_URL=https://domain-anda pnpm test:concurrency
STRESS_BASE_URL=https://domain-anda pnpm test:load
VISUAL_BASE_URL=https://domain-anda pnpm test:visual
```

## Batasan saat ini

- Belum ada email/WhatsApp notification; notifikasi hanya in-app.
- Belum ada payment, upload surat izin, SSO institusional, atau integrasi kalender.
- Mobile tersedia sebagai PWA responsif, bukan aplikasi native terpisah.
- Rate limit login disimpan di audit log database; untuk traffic besar sebaiknya dipindah ke Redis/edge rate limiter.
- Kapasitas 5.000 concurrent users belum diuji; load test di atas adalah baseline, bukan sertifikasi kapasitas.
- Seed memakai foto Unsplash dan data demo; ganti sebelum penggunaan nyata.
