import crypto from "node:crypto";
import type { PoolClient } from "pg";
import { withTransaction, query, isExclusionViolation } from "./db";
import { HttpError } from "./http";
import { jakartaDateTime, minutesFromTime } from "./time";
import type { Booking, BookingStatus, FacilityCategory, PaymentStatus } from "./types";
import type { BookingCreateInput } from "./validation";

type BookingRow = {
  id: string;
  reference: string;
  starts_at: Date;
  ends_at: Date;
  status: BookingStatus;
  purpose: string;
  attendees: number;
  organization: string | null;
  rejection_reason: string | null;
  created_at: Date;
  approved_at: Date | null;
  checked_in_at: Date | null;
  facility_id: string;
  facility_slug: string;
  facility_name: string;
  facility_category: FacilityCategory;
  facility_image: string | null;
  facility_capacity: number;
  facility_approval: boolean;
  amount_due: number;
  payment_status: PaymentStatus;
  building_name: string;
  building_code: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  user_organization?: string | null;
};

function mapBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    reference: row.reference,
    startsAt: row.starts_at.toISOString(),
    endsAt: row.ends_at.toISOString(),
    status: row.status,
    purpose: row.purpose,
    attendees: row.attendees,
    organization: row.organization,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at.toISOString(),
    approvedAt: row.approved_at?.toISOString() ?? null,
    checkedInAt: row.checked_in_at?.toISOString() ?? null,
    amountDue: row.amount_due,
    paymentStatus: row.payment_status,
    facility: {
      id: row.facility_id,
      slug: row.facility_slug,
      name: row.facility_name,
      category: row.facility_category,
      imageUrl: row.facility_image,
      buildingName: row.building_name,
      buildingCode: row.building_code,
      capacity: row.facility_capacity,
      requiresApproval: row.facility_approval,
    },
    ...(row.user_id
      ? {
          user: {
            id: row.user_id,
            name: row.user_name ?? "",
            email: row.user_email ?? "",
            organization: row.user_organization ?? null,
          },
        }
      : {}),
  };
}

const BOOKING_SELECT = `
  SELECT b.id, b.reference, b.starts_at, b.ends_at, b.status, b.purpose,
         b.attendees, b.organization, b.rejection_reason, b.created_at,
         b.approved_at, b.checked_in_at,
         f.id AS facility_id, f.slug AS facility_slug, f.name AS facility_name,
         f.category AS facility_category, f.image_url AS facility_image,
         f.capacity AS facility_capacity, f.requires_approval AS facility_approval,
         COALESCE(p.amount, (f.price_per_hour * ceil(extract(epoch from (b.ends_at - b.starts_at)) / 3600))::int, 0) AS amount_due,
         COALESCE(p.status, 'none') AS payment_status,
         bld.name AS building_name, bld.code AS building_code,
         u.id AS user_id, u.name AS user_name, u.email AS user_email,
         u.organization AS user_organization
  FROM bookings b
  JOIN facilities f ON f.id = b.facility_id
  JOIN buildings bld ON bld.id = f.building_id
  JOIN users u ON u.id = b.user_id
  LEFT JOIN payments p ON p.booking_id = b.id
`;

function newReference(): string {
  return `ITS-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

function checkinSecret(): string {
  const secret = process.env.CHECKIN_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new HttpError(500, "CHECKIN_SECRET belum dikonfigurasi.");
  }
  return secret ?? "its-space-development-checkin-secret";
}

function sign(value: string): string {
  return crypto.createHmac("sha256", checkinSecret()).update(value).digest("base64url");
}

export function createCheckinToken(bookingId: string, endsAt: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      b: bookingId,
      e: Math.floor(new Date(endsAt).getTime() / 1000) + 2 * 60 * 60,
    }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readCheckinToken(token: string): { bookingId: string } {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) throw new HttpError(400, "Token check-in tidak valid.");
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new HttpError(400, "Tanda tangan token tidak valid.");
  }
  let decoded: { b?: string; e?: number };
  try {
    decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new HttpError(400, "Token check-in tidak dapat dibaca.");
  }
  if (!decoded.b || !decoded.e || decoded.e < Math.floor(Date.now() / 1000)) {
    throw new HttpError(400, "Token check-in sudah kedaluwarsa.");
  }
  return { bookingId: decoded.b };
}

async function notify(
  client: PoolClient,
  userId: string,
  title: string,
  body: string,
  href: string,
) {
  await client.query(
    `INSERT INTO notifications (user_id, title, body, href) VALUES ($1, $2, $3, $4)`,
    [userId, title, body, href],
  );
}

async function audit(
  client: PoolClient,
  actorId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
) {
  await client.query(
    `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [actorId, action, entityType, entityId, JSON.stringify(metadata)],
  );
}

export async function createBooking(userId: string, input: BookingCreateInput): Promise<Booking> {
  const facilityRows = await query<{
    id: string;
    name: string;
    capacity: number;
    status: string;
    opens_at: string;
    closes_at: string;
    requires_approval: boolean;
    buffer_minutes: number;
    price_per_hour: number;
  }>(
    `SELECT id, name, capacity, status, opens_at, closes_at, requires_approval, buffer_minutes, price_per_hour
     FROM facilities WHERE slug = $1 LIMIT 1`,
    [input.facilitySlug],
  );
  const facility = facilityRows[0];
  if (!facility) throw new HttpError(404, "Fasilitas tidak ditemukan.");
  if (facility.status !== "active") {
    throw new HttpError(409, "Fasilitas sedang tidak dapat dipesan.");
  }

  const startsAt = jakartaDateTime(input.date, input.start);
  const endsAt = jakartaDateTime(input.date, input.end);
  if (startsAt.getTime() <= Date.now() + 5 * 60 * 1000) {
    throw new HttpError(422, "Waktu mulai harus minimal 5 menit dari sekarang.");
  }
  if (input.attendees > facility.capacity) {
    throw new HttpError(422, `Kapasitas ruangan maksimal ${facility.capacity} orang.`);
  }

  const startMinutes = minutesFromTime(input.start);
  const endMinutes = minutesFromTime(input.end);
  const openMinutes = minutesFromTime(facility.opens_at.slice(0, 5));
  const closeMinutes = minutesFromTime(facility.closes_at.slice(0, 5));
  if (startMinutes < openMinutes || endMinutes > closeMinutes) {
    throw new HttpError(
      422,
      `Booking harus di dalam jam operasional ${facility.opens_at.slice(0, 5)}–${facility.closes_at.slice(0, 5)} WIB.`,
    );
  }

  let bookingId = "";
  try {
    bookingId = await withTransaction(async (client) => {
      const status = facility.requires_approval ? "pending" : "approved";
      const reference = newReference();
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO bookings (
          reference, facility_id, user_id, starts_at, ends_at, status,
          purpose, attendees, organization, contact_phone, approved_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id`,
        [
          reference,
          facility.id,
          userId,
          startsAt,
          endsAt,
          status,
          input.purpose,
          input.attendees,
          input.organization || null,
          input.contactPhone || null,
          status === "approved" ? new Date() : null,
        ],
      );
      const id = inserted.rows[0].id;
      const amountDue = facility.price_per_hour * Math.ceil((endsAt.getTime() - startsAt.getTime()) / 3600000);
      if (amountDue > 0) {
        await client.query(
          `INSERT INTO payments (booking_id, order_id, amount)
           VALUES ($1, $2, $3) ON CONFLICT (booking_id) DO NOTHING`,
          [id, `${reference}-PAY`, amountDue],
        );
      }
      await notify(
        client,
        userId,
        status === "approved" ? "Booking dikonfirmasi" : "Booking menunggu persetujuan",
        status === "approved"
          ? `${facility.name} pada ${input.date} ${input.start}–${input.end} sudah dikonfirmasi.`
          : `${facility.name} pada ${input.date} ${input.start}–${input.end} sedang ditinjau pengelola.`,
        "/dashboard",
      );
      if (status === "pending") {
        await client.query(
          `INSERT INTO notifications (user_id, title, body, href)
           SELECT id, 'Permintaan booking baru', $1, '/admin'
           FROM users WHERE role = 'admin'`,
          [`${facility.name} menunggu persetujuan untuk ${input.date} ${input.start}–${input.end}.`],
        );
      }
      await audit(client, userId, "booking.create", "booking", id, {
        facility: facility.name,
        status,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      });
      return id;
    });
  } catch (error) {
    if (isExclusionViolation(error)) {
      throw new HttpError(
        409,
        "Slot tersebut baru saja dipesan pengguna lain. Pilih jam atau ruangan lain.",
        { code: "SLOT_CONFLICT" },
      );
    }
    throw error;
  }

  const booking = await getBookingById(bookingId);
  if (!booking) throw new HttpError(500, "Booking berhasil dibuat tetapi tidak dapat dimuat.");
  return booking;
}

export async function getBookingById(id: string, userId?: string): Promise<Booking | null> {
  const values: unknown[] = [id];
  let ownerFilter = "";
  if (userId) {
    values.push(userId);
    ownerFilter = "AND b.user_id = $2";
  }
  const rows = await query<BookingRow>(`${BOOKING_SELECT} WHERE b.id = $1 ${ownerFilter} LIMIT 1`, values);
  return rows[0] ? mapBooking(rows[0]) : null;
}

export async function getUserBookings(userId: string): Promise<Booking[]> {
  const rows = await query<BookingRow>(
    `${BOOKING_SELECT} WHERE b.user_id = $1 ORDER BY b.starts_at DESC LIMIT 100`,
    [userId],
  );
  return rows.map(mapBooking);
}

export async function getAdminBookings(status?: BookingStatus): Promise<Booking[]> {
  const values: unknown[] = [];
  let filter = "";
  if (status) {
    values.push(status);
    filter = `WHERE b.status = $1`;
  }
  const rows = await query<BookingRow>(
    `${BOOKING_SELECT} ${filter} ORDER BY
      CASE b.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
      b.starts_at ASC
     LIMIT 200`,
    values,
  );
  return rows.map(mapBooking);
}

export async function approveBooking(id: string, adminId: string): Promise<Booking> {
  try {
    await withTransaction(async (client) => {
      const result = await client.query<{ user_id: string; reference: string; name: string }>(
        `UPDATE bookings b
         SET status = 'approved', approved_by = $2, approved_at = now(), updated_at = now()
         FROM facilities f
         WHERE b.id = $1 AND b.status = 'pending' AND f.id = b.facility_id
         RETURNING b.user_id, b.reference, f.name`,
        [id, adminId],
      );
      if (!result.rowCount) {
        throw new HttpError(409, "Booking sudah diproses atau tidak ditemukan.");
      }
      const booking = result.rows[0];
      await notify(
        client,
        booking.user_id,
        "Booking disetujui",
        `${booking.name} telah disetujui. Tunjukkan QR tiket saat check-in.`,
        "/dashboard",
      );
      await audit(client, adminId, "booking.approve", "booking", id, {
        reference: booking.reference,
      });
    });
  } catch (error) {
    if (isExclusionViolation(error)) {
      throw new HttpError(409, "Jadwal bentrok dengan booking lain dan tidak dapat disetujui.");
    }
    throw error;
  }
  const booking = await getBookingById(id);
  if (!booking) throw new HttpError(404, "Booking tidak ditemukan.");
  return booking;
}

export async function rejectBooking(id: string, adminId: string, reason: string): Promise<Booking> {
  await withTransaction(async (client) => {
    const result = await client.query<{ user_id: string; reference: string; name: string }>(
      `UPDATE bookings b
       SET status = 'rejected', rejection_reason = $3, approved_by = $2,
           approved_at = now(), updated_at = now()
       FROM facilities f
       WHERE b.id = $1 AND b.status = 'pending' AND f.id = b.facility_id
       RETURNING b.user_id, b.reference, f.name`,
      [id, adminId, reason],
    );
    if (!result.rowCount) {
      throw new HttpError(409, "Booking sudah diproses atau tidak ditemukan.");
    }
    const booking = result.rows[0];
    await notify(
      client,
      booking.user_id,
      "Booking ditolak",
      `${booking.name} tidak dapat disetujui. Alasan: ${reason}`,
      "/dashboard",
    );
    await audit(client, adminId, "booking.reject", "booking", id, {
      reference: booking.reference,
      reason,
    });
  });
  const booking = await getBookingById(id);
  if (!booking) throw new HttpError(404, "Booking tidak ditemukan.");
  return booking;
}

export async function cancelBooking(
  id: string,
  actor: { id: string; role: string },
): Promise<Booking> {
  await withTransaction(async (client) => {
    const rows = await client.query<{
      user_id: string;
      reference: string;
      status: BookingStatus;
      name: string;
    }>(
      `SELECT b.user_id, b.reference, b.status, f.name
       FROM bookings b JOIN facilities f ON f.id = b.facility_id
       WHERE b.id = $1 FOR UPDATE`,
      [id],
    );
    const booking = rows.rows[0];
    if (!booking) throw new HttpError(404, "Booking tidak ditemukan.");
    if (actor.role !== "admin" && booking.user_id !== actor.id) {
      throw new HttpError(403, "Anda tidak berhak membatalkan booking ini.");
    }
    if (!["pending", "approved"].includes(booking.status)) {
      throw new HttpError(409, "Booking pada status ini tidak dapat dibatalkan.");
    }
    await client.query(
      `UPDATE bookings SET status = 'cancelled', cancelled_at = now(), updated_at = now()
       WHERE id = $1`,
      [id],
    );
    await client.query(
      `UPDATE payments SET status = 'failed', updated_at = now()
       WHERE booking_id = $1 AND status = 'pending'`,
      [id],
    );
    await notify(
      client,
      booking.user_id,
      "Booking dibatalkan",
      `${booking.name} (${booking.reference}) telah dibatalkan.`,
      "/dashboard",
    );
    await audit(client, actor.id, "booking.cancel", "booking", id, {
      reference: booking.reference,
      byAdmin: actor.role === "admin",
    });
  });
  const booking = await getBookingById(id);
  if (!booking) throw new HttpError(404, "Booking tidak ditemukan.");
  return booking;
}

export async function checkInBooking(token: string, adminId: string): Promise<Booking> {
  const { bookingId } = readCheckinToken(token);
  await withTransaction(async (client) => {
    const rows = await client.query<{
      user_id: string;
      reference: string;
      status: BookingStatus;
      starts_at: Date;
      ends_at: Date;
      name: string;
      price_per_hour: number;
      payment_status: PaymentStatus;
    }>(
      `SELECT b.user_id, b.reference, b.status, b.starts_at, b.ends_at, f.name,
              f.price_per_hour, COALESCE(p.status, 'none') AS payment_status
       FROM bookings b
       JOIN facilities f ON f.id = b.facility_id
       LEFT JOIN payments p ON p.booking_id = b.id
       WHERE b.id = $1 FOR UPDATE OF b`,
      [bookingId],
    );
    const booking = rows.rows[0];
    if (!booking) throw new HttpError(404, "Booking tidak ditemukan.");
    if (booking.status === "checked_in") return;
    if (booking.status !== "approved") {
      throw new HttpError(409, "Hanya booking yang disetujui yang dapat check-in.");
    }
    if (booking.price_per_hour > 0 && booking.payment_status !== "paid") {
      throw new HttpError(409, "Selesaikan pembayaran booking sebelum check-in.");
    }
    const now = Date.now();
    if (now < booking.starts_at.getTime() - 30 * 60 * 1000) {
      throw new HttpError(409, "Check-in baru dibuka 30 menit sebelum jadwal.");
    }
    if (now > booking.ends_at.getTime()) {
      throw new HttpError(409, "Jadwal booking sudah berakhir.");
    }
    await client.query(
      `UPDATE bookings SET status = 'checked_in', checked_in_at = now(), updated_at = now()
       WHERE id = $1`,
      [bookingId],
    );
    await notify(
      client,
      booking.user_id,
      "Check-in berhasil",
      `${booking.name} tercatat check-in pada ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB.`,
      "/dashboard",
    );
    await audit(client, adminId, "booking.checkin", "booking", bookingId, {
      reference: booking.reference,
    });
  });
  const booking = await getBookingById(bookingId);
  if (!booking) throw new HttpError(404, "Booking tidak ditemukan.");
  return booking;
}

export async function checkOutBooking(id: string, actorId: string): Promise<Booking> {
  await withTransaction(async (client) => {
    const result = await client.query(
      `UPDATE bookings SET status = 'completed', updated_at = now()
       WHERE id = $1 AND status = 'checked_in'`,
      [id],
    );
    if (!result.rowCount) throw new HttpError(409, "Booking belum check-in atau sudah selesai.");
    await audit(client, actorId, "booking.checkout", "booking", id);
  });
  const booking = await getBookingById(id);
  if (!booking) throw new HttpError(404, "Booking tidak ditemukan.");
  return booking;
}

export async function getNotifications(userId: string) {
  return query<{
    id: string;
    title: string;
    body: string;
    href: string | null;
    read_at: Date | null;
    created_at: Date;
  }>(
    `SELECT id, title, body, href, read_at, created_at
     FROM notifications WHERE user_id = $1
     ORDER BY created_at DESC LIMIT 30`,
    [userId],
  );
}

export async function markNotificationsRead(userId: string): Promise<void> {
  await query(`UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL`, [
    userId,
  ]);
}
