import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(3, "Email wajib diisi.")
  .max(160, "Email terlalu panjang.")
  .email("Format email tidak valid.")
  .transform((value) => value.toLowerCase());

const password = z
  .string()
  .min(8, "Kata sandi minimal 8 karakter.")
  .max(128, "Kata sandi terlalu panjang.")
  .regex(/[A-Za-z]/, "Kata sandi harus memiliki huruf.")
  .regex(/\d/, "Kata sandi harus memiliki angka.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Kata sandi wajib diisi.").max(128),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(100, "Nama terlalu panjang."),
  email,
  password,
  organization: z.string().trim().max(120, "Nama organisasi terlalu panjang.").optional(),
});

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid.")
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()), "Tanggal tidak valid.");

const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam tidak valid.");

export const bookingCreateSchema = z
  .object({
    facilitySlug: z.string().trim().min(2).max(100),
    date,
    start: time,
    end: time,
    attendees: z.coerce.number().int().min(1, "Jumlah peserta minimal 1.").max(5000),
    purpose: z
      .string()
      .trim()
      .min(10, "Tujuan penggunaan minimal 10 karakter.")
      .max(500, "Tujuan penggunaan maksimal 500 karakter."),
    organization: z.string().trim().max(120).optional().or(z.literal("")),
    contactPhone: z
      .string()
      .trim()
      .max(30)
      .regex(/^[0-9+\-\s()]*$/, "Nomor kontak tidak valid.")
      .optional()
      .or(z.literal("")),
    agreement: z.literal(true, { message: "Setujui aturan penggunaan terlebih dahulu." }),
  })
  .refine((value) => value.start < value.end, {
    message: "Jam selesai harus setelah jam mulai.",
    path: ["end"],
  });

export const rejectSchema = z.object({
  reason: z.string().trim().min(5, "Alasan penolakan minimal 5 karakter.").max(300),
});

export const checkinSchema = z.object({
  token: z.string().trim().min(20, "Token check-in tidak valid.").max(500),
});

export const facilityStatusSchema = z.object({
  status: z.enum(["active", "maintenance", "closed"]),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(100, "Nama terlalu panjang."),
  organization: z.string().trim().max(120, "Nama organisasi terlalu panjang.").optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(30, "Nomor telepon terlalu panjang.")
    .regex(/^[0-9+\-\s()]*$/, "Nomor telepon tidak valid.")
    .optional()
    .or(z.literal("")),
  notifyBooking: z.boolean().default(true),
  notifyReminders: z.boolean().default(true),
  notifyAnnouncements: z.boolean().default(false),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi.").max(128),
    newPassword: password,
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi.").max(128),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
  });

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
