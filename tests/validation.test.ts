import { describe, expect, it } from "vitest";
import { bookingCreateSchema, passwordChangeSchema, profileSchema, registerSchema } from "../lib/validation";

const validBooking = {
  facilitySlug: "auditorium-utama",
  date: "2026-11-20",
  start: "09:00",
  end: "11:00",
  attendees: 100,
  purpose: "Seminar dan diskusi panel mahasiswa",
  agreement: true,
};

describe("booking validation", () => {
  it("accepts a valid booking", () => {
    expect(bookingCreateSchema.safeParse(validBooking).success).toBe(true);
  });

  it("rejects an end time before the start time", () => {
    const result = bookingCreateSchema.safeParse({
      ...validBooking,
      start: "12:00",
      end: "10:00",
    });
    expect(result.success).toBe(false);
  });

  it("requires agreement to the facility rules", () => {
    const result = bookingCreateSchema.safeParse({
      ...validBooking,
      agreement: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("profile validation", () => {
  it("accepts profile preferences", () => {
    const result = profileSchema.safeParse({
      name: "Raka Mahendra",
      organization: "Teknik Informatika",
      phone: "081234567890",
      notifyBooking: true,
      notifyReminders: false,
      notifyAnnouncements: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched password confirmation", () => {
    const result = passwordChangeSchema.safeParse({
      currentPassword: "OldPassword1",
      newPassword: "NewPassword2",
      confirmPassword: "NewPassword3",
    });
    expect(result.success).toBe(false);
  });
});

describe("registration validation", () => {
  it("requires a password with letters and numbers", () => {
    const result = registerSchema.safeParse({
      name: "Raka Mahendra",
      email: "raka@its-space.id",
      password: "onlyletters",
    });
    expect(result.success).toBe(false);
  });

  it("normalizes email casing", () => {
    const result = registerSchema.parse({
      name: "Raka Mahendra",
      email: "RAKA@ITS-SPACE.ID",
      password: "Raka12345",
    });
    expect(result.email).toBe("raka@its-space.id");
  });
});
