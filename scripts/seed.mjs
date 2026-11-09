import crypto from "node:crypto";
import { promisify } from "node:util";
import pg from "pg";
import { requireDatabaseUrl } from "./env.mjs";

const { Client } = pg;
const scrypt = promisify(crypto.scrypt);
const DATABASE_URL = requireDatabaseUrl();

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function todayInJakarta() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

function addDays(date, amount) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function atJakarta(date, time) {
  return new Date(`${date}T${time}:00+07:00`);
}

function reference(index) {
  return `ITS-${String(index).padStart(5, "0")}-DEMO`;
}

const FACILITIES = [
  {
    slug: "auditorium-utama",
    name: "Auditorium Utama",
    category: "auditorium",
    building: "TW2",
    floor: "Lantai 2",
    capacity: 1200,
    area: 1600,
    description:
      "Auditorium utama kampus dengan tata suara panorama, panggung modular, dan ruang tunggu VIP. Cocok untuk seminar nasional, wisuda program studi, serta pertunjukan mahasiswa.",
    amenities: ["Proyektor 4K", "Sound system", "AC", "Wi-Fi", "Panggung", "Ruang tunggu"],
    equipment: ["Mikrofon wireless", "Layar LED", "Podium", "Piano akustik"],
    rules: ["Gunakan alas kaki tertutup", "Konfirmasi technical meeting H-1", "Dilarang membawa makanan ke area tribun"],
    image: "https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=1400&q=80",
    featured: true,
    approval: true,
    open: "07:00",
    close: "22:00",
    manager: "Dewi Anggraini",
    email: "auditorium@its-space.id",
  },
  {
    slug: "convention-hall",
    name: "Convention Hall",
    category: "auditorium",
    building: "GA",
    floor: "Lantai 1",
    capacity: 800,
    area: 1200,
    description:
      "Hall serbaguna dengan langit-langit tinggi, akses eksibisi, dan konfigurasi kursi teater maupun meja bundar. Ideal untuk konferensi, pameran inovasi, dan temu industri.",
    amenities: ["Proyektor", "Sound system", "AC", "Wi-Fi", "Area eksibisi", "Parkir bus"],
    equipment: ["Layar proyektor", "Mikrofon", "Meja registrasi", "Partisi"],
    rules: ["Wajib menyertakan proposal acara", "Batas maksimal panggung 12 x 6 meter"],
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=80",
    featured: true,
    approval: true,
    open: "07:00",
    close: "22:00",
    manager: "Rizky Pratama",
    email: "convention@its-space.id",
  },
  {
    slug: "lapangan-futsal-a",
    name: "Lapangan Futsal A",
    category: "sports",
    building: "ARENA",
    floor: "Area outdoor",
    capacity: 200,
    area: 1200,
    description:
      "Lapangan futsal berstandar kompetisi dengan rumput sintetis, lampu sorot malam, tribun penonton, dan ruang ganti terpisah.",
    amenities: ["Rumput sintetis", "Lampu sorot", "Ruang ganti", "Tribun", "Papan skor"],
    equipment: ["Bola futsal", "Rompi tim", "Gawang portable"],
    rules: ["Gunakan sepatu futsal", "Batas waktu pemanasan 10 menit", "Jaga kebersihan area tribun"],
    image: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1400&q=80",
    featured: true,
    approval: false,
    open: "06:00",
    close: "22:00",
    manager: "Bagas Saputra",
    email: "sports@its-space.id",
  },
  {
    slug: "lapangan-basket",
    name: "Lapangan Basket",
    category: "sports",
    building: "ARENA",
    floor: "Area outdoor",
    capacity: 300,
    area: 900,
    description:
      "Lapangan basket outdoor dengan permukaan akrilik, ring hidrolik, dan pencahayaan LED untuk latihan maupun pertandingan antar-fakultas.",
    amenities: ["Lampu sorot", "Ruang ganti", "Tribun", "Papan skor", "Air minum"],
    equipment: ["Bola basket", "Ring portable", "Papan taktik"],
    rules: ["Gunakan sepatu olahraga", "Dilarang menggantung di ring"],
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1400&q=80",
    featured: false,
    approval: false,
    open: "06:00",
    close: "22:00",
    manager: "Bagas Saputra",
    email: "sports@its-space.id",
  },
  {
    slug: "lapangan-badminton",
    name: "Lapangan Badminton",
    category: "sports",
    building: "ARENA",
    floor: "Hall B",
    capacity: 100,
    area: 500,
    description:
      "Dua lapangan badminton indoor dengan lantai vinyl, net standar BWF, dan ventilasi alami. Tersedia untuk latihan rutin maupun turnamen internal.",
    amenities: ["Indoor", "Lantai vinyl", "Net BWF", "Lampu LED", "Ruang ganti"],
    equipment: ["Net", "Tiang net", "Kok latihan"],
    rules: ["Gunakan sepatu non-marking", "Booking maksimal 2 jam per sesi"],
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1400&q=80",
    featured: false,
    approval: false,
    open: "07:00",
    close: "22:00",
    manager: "Bagas Saputra",
    email: "sports@its-space.id",
  },
  {
    slug: "lab-ai-data",
    name: "Lab AI & Data",
    category: "lab",
    building: "LAB7",
    floor: "Lantai 3",
    capacity: 40,
    area: 120,
    description:
      "Laboratorium komputasi untuk riset kecerdasan artifisial dan analisis data. Dilengkapi workstation GPU, layar presentasi, dan meja kolaborasi.",
    amenities: ["Komputer GPU", "Proyektor", "AC", "Wi-Fi", "Papan tulis"],
    equipment: ["Workstation GPU", "Monitor 27 inci", "Akses JupyterHub"],
    rules: ["Wajib didampingi dosen atau laboran", "Dilarang menginstal perangkat lunak tanpa izin"],
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1400&q=80",
    featured: true,
    approval: true,
    open: "08:00",
    close: "21:00",
    manager: "Dr. Naufal Hakim",
    email: "labai@its-space.id",
  },
  {
    slug: "ruang-rapat-tower-2",
    name: "Ruang Rapat Tower 2",
    category: "meeting",
    building: "TW2",
    floor: "Lantai 5",
    capacity: 20,
    area: 64,
    description:
      "Ruang rapat eksekutif dengan meja konferensi, layar presentasi, dan sistem video conference untuk rapat program studi maupun organisasi.",
    amenities: ["TV 75 inci", "Video conference", "AC", "Wi-Fi", "Papan tulis"],
    equipment: ["Kamera meeting", "Speakerphone", "Kabel HDMI"],
    rules: ["Maksimal 20 peserta", "Kembalikan kursi ke posisi awal"],
    image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=80",
    featured: true,
    approval: false,
    open: "08:00",
    close: "20:00",
    manager: "Sari Wulandari",
    email: "meeting@its-space.id",
  },
  {
    slug: "ruang-diskusi-tower-1",
    name: "Ruang Diskusi Tower 1",
    category: "meeting",
    building: "TW1",
    floor: "Lantai 3",
    capacity: 12,
    area: 42,
    description:
      "Ruang diskusi ringkas untuk kelompok belajar, mentoring, dan rapat organisasi mahasiswa dengan pencahayaan alami.",
    amenities: ["TV 55 inci", "AC", "Wi-Fi", "Papan tulis", "Stop kontak"],
    equipment: ["Kabel HDMI", "Webcam", "Marker"],
    rules: ["Maksimal 12 peserta", "Bersihkan meja setelah digunakan"],
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80",
    featured: false,
    approval: false,
    open: "08:00",
    close: "21:00",
    manager: "Sari Wulandari",
    email: "meeting@its-space.id",
  },
  {
    slug: "studio-media",
    name: "Studio Media",
    category: "studio",
    building: "ROB",
    floor: "Lantai 2",
    capacity: 30,
    area: 90,
    description:
      "Studio produksi konten dengan green screen, lighting profesional, dan ruang kontrol audio. Tersedia untuk produksi konten organisasi dan tugas mata kuliah.",
    amenities: ["Green screen", "Lighting", "Kamera", "Audio mixer", "AC"],
    equipment: ["Kamera mirrorless", "Tripod", "Mikrofon boom", "Light stand"],
    rules: ["Wajib membawa operator sendiri", "Simpan rekaman di penyimpanan pribadi"],
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1400&q=80",
    featured: true,
    approval: true,
    open: "08:00",
    close: "21:00",
    manager: "Alya Prameswari",
    email: "studio@its-space.id",
  },
  {
    slug: "aula-gedung-a",
    name: "Aula Gedung A",
    category: "auditorium",
    building: "GA",
    floor: "Lantai 2",
    capacity: 400,
    area: 600,
    description:
      "Aula serbaguna untuk kuliah umum, pelatihan, dan kegiatan himpunan. Konfigurasi kursi dapat diatur ulang sesuai kebutuhan acara.",
    amenities: ["Proyektor", "Sound system", "AC", "Wi-Fi", "Panggung kecil"],
    equipment: ["Mikrofon", "Podium", "Meja panel"],
    rules: ["Ajukan rundown acara", "Batas waktu dekorasi 2 jam sebelum acara"],
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=80",
    featured: false,
    approval: true,
    open: "08:00",
    close: "22:00",
    manager: "Rizky Pratama",
    email: "convention@its-space.id",
  },
  {
    slug: "ruang-seminar-tower-1",
    name: "Ruang Seminar Tower 1",
    category: "meeting",
    building: "TW1",
    floor: "Lantai 4",
    capacity: 60,
    area: 110,
    description:
      "Ruang seminar dengan kursi teater dan proyektor. Sedang dalam perawatan sistem pendingin sampai akhir pekan.",
    amenities: ["Proyektor", "AC", "Wi-Fi", "Podium"],
    equipment: ["Proyektor", "Layar", "Mikrofon"],
    rules: ["Ikuti arahan petugas gedung"],
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1400&q=80",
    featured: false,
    approval: true,
    open: "08:00",
    close: "21:00",
    manager: "Sari Wulandari",
    email: "meeting@its-space.id",
    maintenance: true,
  },
];

const USERS = [
  { name: "Admin ITS Space", email: "admin@its-space.id", password: "Admin#2026", role: "admin", org: "Direktorat Sarana dan Prasarana" },
  { name: "Raka Mahendra", email: "mahasiswa@its-space.id", password: "Mahasiswa#2026", role: "student", org: "Teknik Informatika 2024" },
  { name: "Nadia Putri", email: "staff@its-space.id", password: "Staff#2026", role: "staff", org: "Direktorat Kemahasiswaan" },
  ...Array.from({ length: 8 }, (_, index) => ({
    name: `Load Tester ${index + 1}`,
    email: `load${index + 1}@its-space.id`,
    password: "LoadTest#2026",
    role: "student",
    org: "QA",
  })),
];

const client = new Client({ connectionString: DATABASE_URL });

try {
  await client.connect();
  await client.query("BEGIN");
  await client.query(`
    TRUNCATE audit_logs, notifications, bookings, sessions, maintenance_blocks,
      facilities, buildings, campuses, institutions, users
    RESTART IDENTITY CASCADE
  `);

  const institution = await client.query(
    `INSERT INTO institutions (name, short_name) VALUES ($1, $2) RETURNING id`,
    ["Institut Teknologi Sepuluh Nopember", "ITS"],
  );
  const institutionId = institution.rows[0].id;
  const campus = await client.query(
    `INSERT INTO campuses (institution_id, name, address) VALUES ($1, $2, $3) RETURNING id`,
    [institutionId, "Kampus Sukolilo", "Jl. Raya ITS, Keputih, Surabaya"],
  );
  const campusId = campus.rows[0].id;

  const buildingRows = [
    ["Tower 1", "TW1", 30, 42],
    ["Tower 2", "TW2", 43, 39],
    ["Gedung A", "GA", 56, 30],
    ["Arena Olahraga", "ARENA", 24, 68],
    ["Labtek VII", "LAB7", 67, 58],
    ["Gedung Robotika", "ROB", 74, 44],
  ];
  const buildings = {};
  for (const [name, code, x, y] of buildingRows) {
    const result = await client.query(
      `INSERT INTO buildings (campus_id, name, code, map_x, map_y)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, code`,
      [campusId, name, code, x, y],
    );
    buildings[result.rows[0].code] = result.rows[0].id;
  }

  const users = {};
  for (const user of USERS) {
    const result = await client.query(
      `INSERT INTO users (name, email, password_hash, role, organization)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email`,
      [user.name, user.email, await hashPassword(user.password), user.role, user.org],
    );
    users[result.rows[0].email] = result.rows[0].id;
  }

  const facilities = {};
  for (const facility of FACILITIES) {
    const result = await client.query(
      `INSERT INTO facilities (
        building_id, slug, name, category, floor, capacity, area_m2, description,
        amenities, equipment, rules, image_url, requires_approval, status,
        opens_at, closes_at, featured, manager_name, manager_email
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING id, slug`,
      [
        buildings[facility.building],
        facility.slug,
        facility.name,
        facility.category,
        facility.floor,
        facility.capacity,
        facility.area,
        facility.description,
        facility.amenities,
        facility.equipment,
        facility.rules,
        facility.image,
        facility.approval,
        facility.maintenance ? "maintenance" : "active",
        facility.open,
        facility.close,
        facility.featured,
        facility.manager,
        facility.email,
      ],
    );
    facilities[result.rows[0].slug] = result.rows[0].id;
  }

  const today = todayInJakarta();
  const demoBookings = [
    { facility: "auditorium-utama", user: "mahasiswa@its-space.id", day: addDays(today, 1), start: "09:00", end: "11:00", status: "pending", purpose: "Seminar nasional mahasiswa: masa depan AI terbuka", attendees: 420, org: "Himpunan Teknik Informatika" },
    { facility: "auditorium-utama", user: "staff@its-space.id", day: addDays(today, 1), start: "13:00", end: "15:00", status: "approved", purpose: "Kuliah umum transformasi digital sektor publik", attendees: 650, org: "Direktorat Kemahasiswaan" },
    { facility: "auditorium-utama", user: "mahasiswa@its-space.id", day: addDays(today, 4), start: "18:00", end: "21:00", status: "approved", purpose: "Malam apresiasi seni mahasiswa ITS", attendees: 900, org: "BEM ITS" },
    { facility: "lapangan-futsal-a", user: "staff@its-space.id", day: addDays(today, 1), start: "16:00", end: "18:00", status: "approved", purpose: "Latihan tim futsal antar-fakultas", attendees: 40, org: "UKM Futsal" },
    { facility: "lapangan-futsal-a", user: "mahasiswa@its-space.id", day: addDays(today, 5), start: "10:00", end: "12:00", status: "pending", purpose: "Turnamen futsal internal angkatan 2024", attendees: 80, org: "Himpunan Teknik Informatika" },
    { facility: "lapangan-basket", user: "mahasiswa@its-space.id", day: addDays(today, 3), start: "15:00", end: "17:00", status: "approved", purpose: "Sparring basket persiapan Pekan Olahraga ITS", attendees: 60, org: "UKM Basket" },
    { facility: "lapangan-badminton", user: "staff@its-space.id", day: addDays(today, 2), start: "07:00", end: "09:00", status: "approved", purpose: "Latihan rutin badminton dosen dan staf", attendees: 24, org: "Dosen ITS" },
    { facility: "convention-hall", user: "staff@its-space.id", day: addDays(today, 2), start: "08:00", end: "12:00", status: "pending", purpose: "Temu industri dan pameran inovasi kampus", attendees: 500, org: "Direktorat Kerja Sama" },
    { facility: "lab-ai-data", user: "mahasiswa@its-space.id", day: addDays(today, 1), start: "13:00", end: "15:00", status: "pending", purpose: "Workshop praktikum computer vision untuk pemula", attendees: 36, org: "Laboratorium AI" },
    { facility: "lab-ai-data", user: "staff@its-space.id", day: addDays(today, 6), start: "09:00", end: "12:00", status: "approved", purpose: "Pelatihan data pipeline untuk laboran", attendees: 24, org: "Direktorat TIK" },
    { facility: "ruang-rapat-tower-2", user: "staff@its-space.id", day: addDays(today, 2), start: "10:00", end: "12:00", status: "approved", purpose: "Rapat koordinasi persiapan wisuda periode 3", attendees: 16, org: "Direktorat Akademik" },
    { facility: "ruang-diskusi-tower-1", user: "mahasiswa@its-space.id", day: addDays(today, 3), start: "13:00", end: "15:00", status: "pending", purpose: "Sprint planning proyek capstone tim Garuda", attendees: 8, org: "Tim Capstone Garuda" },
    { facility: "studio-media", user: "mahasiswa@its-space.id", day: addDays(today, 3), start: "09:00", end: "11:00", status: "pending", purpose: "Produksi video profil organisasi mahasiswa", attendees: 12, org: "BEM ITS" },
    { facility: "aula-gedung-a", user: "staff@its-space.id", day: addDays(today, 7), start: "08:00", end: "11:00", status: "approved", purpose: "Pelatihan keselamatan kerja laboratorium", attendees: 180, org: "K3L ITS" },
    { facility: "auditorium-utama", user: "mahasiswa@its-space.id", day: addDays(today, -3), start: "09:00", end: "12:00", status: "completed", purpose: "Seminar karier teknologi dan industri kreatif", attendees: 700, org: "Career Center" },
    { facility: "lapangan-futsal-a", user: "mahasiswa@its-space.id", day: addDays(today, -2), start: "16:00", end: "18:00", status: "completed", purpose: "Latihan mingguan UKM Futsal", attendees: 32, org: "UKM Futsal" },
    { facility: "lab-ai-data", user: "staff@its-space.id", day: addDays(today, -4), start: "10:00", end: "12:00", status: "completed", purpose: "Review riset mahasiswa pascasarjana", attendees: 18, org: "Laboratorium AI" },
    { facility: "ruang-rapat-tower-2", user: "staff@its-space.id", day: addDays(today, -1), start: "14:00", end: "16:00", status: "completed", purpose: "Evaluasi layanan akademik semester ganjil", attendees: 14, org: "Direktorat Akademik" },
    { facility: "lapangan-basket", user: "mahasiswa@its-space.id", day: addDays(today, -5), start: "15:00", end: "17:00", status: "cancelled", purpose: "Latihan tambahan tim basket", attendees: 20, org: "UKM Basket" },
    { facility: "studio-media", user: "mahasiswa@its-space.id", day: addDays(today, -6), start: "13:00", end: "15:00", status: "no_show", purpose: "Rekaman podcast organisasi", attendees: 6, org: "Radio Kampus" },
  ];

  let bookingIndex = 1;
  for (const booking of demoBookings) {
    const startsAt = atJakarta(booking.day, booking.start);
    const endsAt = atJakarta(booking.day, booking.end);
    const result = await client.query(
      `INSERT INTO bookings (
        reference, facility_id, user_id, starts_at, ends_at, status, purpose,
        attendees, organization, approved_by, approved_at, checked_in_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`,
      [
        reference(bookingIndex++),
        facilities[booking.facility],
        users[booking.user],
        startsAt,
        endsAt,
        booking.status,
        booking.purpose,
        booking.attendees,
        booking.org,
        ["approved", "completed", "checked_in"].includes(booking.status) ? users["admin@its-space.id"] : null,
        ["approved", "completed", "checked_in"].includes(booking.status) ? new Date() : null,
        booking.status === "checked_in" ? new Date() : null,
        new Date(Date.now() - ((bookingIndex - 2) % 7) * 24 * 60 * 60 * 1000),
      ],
    );
    if (booking.status === "pending") {
      await client.query(
        `INSERT INTO notifications (user_id, title, body, href)
         VALUES ($1, $2, $3, $4)`,
        [
          users["admin@its-space.id"],
          "Permintaan booking baru",
          `${booking.purpose} menunggu persetujuan.`,
          `/admin?booking=${result.rows[0].id}`,
        ],
      );
    }
  }

  await client.query(
    `INSERT INTO notifications (user_id, title, body, href)
     VALUES ($1, $2, $3, $4)`,
    [
      users["mahasiswa@its-space.id"],
      "Booking disetujui",
      "Malam apresiasi seni mahasiswa ITS telah disetujui. Tunjukkan QR tiket saat check-in.",
      "/dashboard",
    ],
  );
  await client.query(
    `INSERT INTO audit_logs (actor_id, action, entity_type, metadata)
     VALUES ($1, $2, $3, $4)`,
    [users["admin@its-space.id"], "seed.demo", "system", JSON.stringify({ facilities: FACILITIES.length, bookings: demoBookings.length })],
  );

  await client.query("COMMIT");
  console.log(`Seeded ${FACILITIES.length} facilities, ${USERS.length} users, and ${demoBookings.length} bookings.`);
  console.log("Admin: admin@its-space.id / Admin#2026");
  console.log("Student: mahasiswa@its-space.id / Mahasiswa#2026");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end();
}
