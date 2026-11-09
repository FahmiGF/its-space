import { query } from "./db";
import type { ProfileInput } from "./validation";
import type { UserProfile } from "./types";

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  role: UserProfile["role"];
  organization: string | null;
  phone: string | null;
  notify_booking: boolean;
  notify_reminders: boolean;
  notify_announcements: boolean;
  created_at: Date;
};

function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    organization: row.organization,
    phone: row.phone,
    notifyBooking: row.notify_booking,
    notifyReminders: row.notify_reminders,
    notifyAnnouncements: row.notify_announcements,
    createdAt: row.created_at.toISOString(),
  };
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const rows = await query<ProfileRow>(
    `SELECT id, name, email, role, organization, phone,
            notify_booking, notify_reminders, notify_announcements, created_at
     FROM users WHERE id = $1 LIMIT 1`,
    [userId],
  );
  return rows[0] ? mapProfile(rows[0]) : null;
}

export async function updateUserProfile(
  userId: string,
  input: ProfileInput,
): Promise<UserProfile> {
  const rows = await query<ProfileRow>(
    `UPDATE users
     SET name = $2, organization = $3, phone = $4,
         notify_booking = $5, notify_reminders = $6, notify_announcements = $7,
         updated_at = now()
     WHERE id = $1
     RETURNING id, name, email, role, organization, phone,
               notify_booking, notify_reminders, notify_announcements, created_at`,
    [
      userId,
      input.name,
      input.organization || null,
      input.phone || null,
      input.notifyBooking,
      input.notifyReminders,
      input.notifyAnnouncements,
    ],
  );
  if (!rows[0]) throw new Error("Profil tidak ditemukan.");
  return mapProfile(rows[0]);
}
