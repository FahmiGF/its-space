import type { BookingStatus, FacilityCategory, FacilityStatus } from "./types";

export const CATEGORY_META: Record<
  FacilityCategory,
  { label: string; short: string; tone: string }
> = {
  sports: { label: "Olahraga", short: "Sport", tone: "green" },
  auditorium: { label: "Auditorium", short: "Event", tone: "orange" },
  meeting: { label: "Ruang rapat", short: "Meeting", tone: "blue" },
  lab: { label: "Laboratorium", short: "Lab", tone: "violet" },
  studio: { label: "Studio", short: "Studio", tone: "pink" },
  outdoor: { label: "Area terbuka", short: "Outdoor", tone: "lime" },
};

export const FACILITY_STATUS_LABEL: Record<FacilityStatus, string> = {
  active: "Aktif",
  maintenance: "Pemeliharaan",
  closed: "Ditutup",
};

export const BOOKING_STATUS_META: Record<
  BookingStatus,
  { label: string; tone: string }
> = {
  pending: { label: "Menunggu", tone: "pending" },
  approved: { label: "Disetujui", tone: "approved" },
  rejected: { label: "Ditolak", tone: "rejected" },
  cancelled: { label: "Dibatalkan", tone: "muted" },
  checked_in: { label: "Check-in", tone: "checked" },
  completed: { label: "Selesai", tone: "done" },
  no_show: { label: "No-show", tone: "rejected" },
};

export const BUILDING_CODES: Record<string, string> = {
  TW1: "Tower 1",
  TW2: "Tower 2",
  GA: "Gedung A",
  ARENA: "Arena Olahraga",
  LAB7: "Labtek VII",
  ROB: "Gedung Robotika",
  GKU: "Gedung Kuliah Umum",
  LAB1: "Labtek I",
  GOR: "GOR Indoor",
  PLAZA: "Plaza Kreatif",
};

export const PAYMENT_STATUS_LABEL = {
  none: "Tidak diperlukan",
  pending: "Menunggu pembayaran",
  paid: "Lunas",
  failed: "Gagal",
  expired: "Kedaluwarsa",
  refunded: "Dikembalikan",
} as const;

export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  "pending",
  "approved",
  "checked_in",
];

export const SITE = {
  name: "ITS Space",
  institution: "Institut Teknologi Sepuluh Nopember",
  tagline: "Satu ruang untuk setiap ide.",
  email: "space@its.ac.id",
  phone: "+62 31 594 7272",
  address: "Kampus Sukolilo, Surabaya",
};
