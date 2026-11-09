import { query } from "./db";
import { ACTIVE_BOOKING_STATUSES, CATEGORY_META } from "./constants";
import {
  addDays,
  formatDate,
  formatTime,
  jakartaDateTime,
  minutesFromTime,
  todayInJakarta,
  weekdayShort,
} from "./time";
import type {
  AvailabilityBooking,
  AvailabilityDay,
  DashboardStats,
  Facility,
  FacilityCard,
  FacilityCategory,
  FacilityFilters,
  FacilityStatus,
} from "./types";

const CATEGORY_KEYS = Object.keys(CATEGORY_META) as FacilityCategory[];

type FacilityRow = {
  id: string;
  slug: string;
  name: string;
  category: FacilityCategory;
  floor: string;
  capacity: number;
  area_m2: number | null;
  description: string;
  amenities: string[];
  equipment: string[];
  rules: string[];
  image_url: string | null;
  requires_approval: boolean;
  status: FacilityStatus;
  opens_at: string;
  closes_at: string;
  featured: boolean;
  manager_name: string | null;
  manager_email: string | null;
  building_name: string;
  building_code: string;
  campus_name: string;
  institution_name?: string;
};

function mapFacility(row: FacilityRow): Facility {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    floor: row.floor,
    capacity: row.capacity,
    areaM2: row.area_m2,
    description: row.description,
    amenities: row.amenities,
    equipment: row.equipment,
    rules: row.rules,
    imageUrl: row.image_url,
    requiresApproval: row.requires_approval,
    status: row.status,
    opensAt: row.opens_at.slice(0, 5),
    closesAt: row.closes_at.slice(0, 5),
    featured: row.featured,
    managerName: row.manager_name,
    managerEmail: row.manager_email,
    buildingName: row.building_name,
    buildingCode: row.building_code,
    campusName: row.campus_name,
    institutionName: row.institution_name ?? "Institut Teknologi Sepuluh Nopember",
  };
}

export async function getFacilities(filters: FacilityFilters = {}): Promise<FacilityCard[]> {
  const values: unknown[] = [];
  const conditions = ["f.status = 'active'"];

  if (filters.q) {
    values.push(`%${filters.q.slice(0, 80)}%`);
    conditions.push(`(
      f.name ILIKE $${values.length} OR
      f.description ILIKE $${values.length} OR
      b.name ILIKE $${values.length} OR
      array_to_string(f.amenities, ' ') ILIKE $${values.length}
    )`);
  }

  if (filters.category && CATEGORY_KEYS.includes(filters.category)) {
    values.push(filters.category);
    conditions.push(`f.category = $${values.length}`);
  }

  if (filters.building) {
    values.push(filters.building);
    conditions.push(`b.code = $${values.length}`);
  }

  if (filters.minCapacity && filters.minCapacity > 0) {
    values.push(Math.min(filters.minCapacity, 5000));
    conditions.push(`f.capacity >= $${values.length}`);
  }

  if (filters.amenity) {
    values.push(filters.amenity);
    conditions.push(`EXISTS (
      SELECT 1 FROM unnest(f.amenities) AS amenity
      WHERE lower(amenity) = lower($${values.length})
    )`);
  }

  if (filters.date && filters.start && filters.end) {
    const startsAt = jakartaDateTime(filters.date, filters.start);
    const endsAt = jakartaDateTime(filters.date, filters.end);
    if (endsAt > startsAt) {
      values.push(startsAt.toISOString(), endsAt.toISOString());
      const s = values.length - 1;
      const e = values.length;
      conditions.push(`NOT EXISTS (
        SELECT 1 FROM bookings active_booking
        WHERE active_booking.facility_id = f.id
          AND active_booking.status IN ('pending', 'approved', 'checked_in')
          AND active_booking.slot_range && tstzrange(
            $${s}::timestamptz - interval '15 minutes',
            $${e}::timestamptz + interval '15 minutes',
            '[)'
          )
      )`);
      conditions.push(`NOT EXISTS (
        SELECT 1 FROM maintenance_blocks block
        WHERE block.facility_id = f.id
          AND block.starts_at < $${e}::timestamptz
          AND block.ends_at > $${s}::timestamptz
      )`);
    }
  }

  const sql = `
    SELECT f.*, b.name AS building_name, b.code AS building_code, c.name AS campus_name
    FROM facilities f
    JOIN buildings b ON b.id = f.building_id
    JOIN campuses c ON c.id = b.campus_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY f.featured DESC, f.capacity DESC, f.name ASC
    LIMIT 60
  `;
  const rows = await query<FacilityRow>(sql, values);
  return rows.map(mapFacility);
}

export async function getFacilityBySlug(slug: string): Promise<Facility | null> {
  const rows = await query<FacilityRow>(
    `SELECT f.*, b.name AS building_name, b.code AS building_code,
            c.name AS campus_name, i.name AS institution_name
     FROM facilities f
     JOIN buildings b ON b.id = f.building_id
     JOIN campuses c ON c.id = b.campus_id
     JOIN institutions i ON i.id = c.institution_id
     WHERE f.slug = $1
     LIMIT 1`,
    [slug],
  );
  return rows[0] ? mapFacility(rows[0]) : null;
}

export async function getFacilityById(id: string): Promise<Facility | null> {
  const rows = await query<FacilityRow>(
    `SELECT f.*, b.name AS building_name, b.code AS building_code, c.name AS campus_name
     FROM facilities f
     JOIN buildings b ON b.id = f.building_id
     JOIN campuses c ON c.id = b.campus_id
     WHERE f.id = $1
     LIMIT 1`,
    [id],
  );
  return rows[0] ? mapFacility(rows[0]) : null;
}

export async function getAdminFacilities(): Promise<
  Array<{ id: string; name: string; status: FacilityStatus; buildingName: string }>
> {
  return query<{ id: string; name: string; status: FacilityStatus; buildingName: string }>(
    `SELECT f.id, f.name, f.status, b.name AS "buildingName"
     FROM facilities f JOIN buildings b ON b.id = f.building_id
     ORDER BY b.name, f.name`,
  );
}

export async function getBuildings(): Promise<Array<{ code: string; name: string; count: number }>> {
  return query<{ code: string; name: string; count: number }>(
    `SELECT b.code, b.name, count(f.id)::int AS count
     FROM buildings b
     LEFT JOIN facilities f ON f.building_id = b.id AND f.status = 'active'
     GROUP BY b.code, b.name
     ORDER BY b.name`,
  );
}

type AvailabilityRow = {
  id: string;
  reference: string;
  starts_at: Date;
  ends_at: Date;
  status: AvailabilityBooking["status"];
  purpose: string;
};

export async function getAvailability(
  slug: string,
  date: string,
): Promise<{ bookings: AvailabilityBooking[]; openings: string; closings: string }> {
  const facility = await getFacilityBySlug(slug);
  if (!facility) return { bookings: [], openings: "08:00", closings: "22:00" };
  const startsAt = jakartaDateTime(date, "00:00");
  const endsAt = jakartaDateTime(addDays(date, 1), "00:00");
  const rows = await query<AvailabilityRow>(
    `SELECT b.id, b.reference, b.starts_at, b.ends_at, b.status, b.purpose
     FROM bookings b
     WHERE b.facility_id = $1
       AND b.status IN ('pending', 'approved', 'checked_in')
       AND b.starts_at < $3
       AND b.ends_at > $2
     ORDER BY b.starts_at`,
    [facility.id, startsAt.toISOString(), endsAt.toISOString()],
  );
  return {
    bookings: rows.map((row) => ({
      id: row.id,
      reference: row.reference,
      startsAt: row.starts_at.toISOString(),
      endsAt: row.ends_at.toISOString(),
      status: row.status,
      purpose: row.purpose,
    })),
    openings: facility.opensAt,
    closings: facility.closesAt,
  };
}

export async function getWeekAvailability(slug: string, startDate: string): Promise<AvailabilityDay[]> {
  const facility = await getFacilityBySlug(slug);
  if (!facility) return [];
  const days = Array.from({ length: 7 }, (_, index) => addDays(startDate, index));
  const first = jakartaDateTime(days[0], "00:00");
  const last = jakartaDateTime(addDays(days[6], 1), "00:00");
  const rows = await query<{
    id: string;
    starts_at: Date;
    ends_at: Date;
    status: AvailabilityBooking["status"];
  }>(
    `SELECT b.id, b.starts_at, b.ends_at, b.status
     FROM bookings b
     WHERE b.facility_id = $1
       AND b.status IN ('pending', 'approved', 'checked_in')
       AND b.starts_at < $3
       AND b.ends_at > $2`,
    [facility.id, first.toISOString(), last.toISOString()],
  );

  const slotLength = 60;
  const openMinutes = minutesFromTime(facility.opensAt);
  const closeMinutes = minutesFromTime(facility.closesAt);
  const totalSlots = Math.max(1, Math.floor((closeMinutes - openMinutes) / slotLength));
  const isClosed = facility.status !== "active";

  return days.map((date) => {
    let freeSlots = 0;
    if (!isClosed) {
      for (let index = 0; index < totalSlots; index += 1) {
        const slotStart = new Date(jakartaDateTime(date, "00:00").getTime() + (openMinutes + index * slotLength) * 60000);
        const slotEnd = new Date(slotStart.getTime() + slotLength * 60000);
        const blocked = rows.some(
          (row) => row.starts_at < slotEnd && row.ends_at > slotStart,
        );
        if (!blocked) freeSlots += 1;
      }
    }
    return {
      date,
      label: formatDate(date),
      weekday: weekdayShort(date),
      freeSlots,
      totalSlots,
      isClosed,
    };
  });
}

export async function getNextAvailableLabel(slug: string): Promise<string> {
  const today = todayInJakarta();
  for (let index = 0; index < 14; index += 1) {
    const date = addDays(today, index);
    const { bookings, openings, closings } = await getAvailability(slug, date);
    if (!bookings.length) {
      return index === 0 ? "Tersedia hari ini" : `Tersedia ${formatDate(date)}`;
    }
    const firstStart = Math.min(...bookings.map((booking) => new Date(booking.startsAt).getTime()));
    const lastEnd = Math.max(...bookings.map((booking) => new Date(booking.endsAt).getTime()));
    const open = new Date(jakartaDateTime(date, openings)).getTime();
    const close = new Date(jakartaDateTime(date, closings)).getTime();
    if (firstStart - open >= 60 * 60000 || close - lastEnd >= 60 * 60000) {
      return `Slot tersedia ${formatDate(date)}`;
    }
  }
  return "Cek jadwal";
}

export async function getFeaturedFacilities(limit = 4): Promise<FacilityCard[]> {
  const facilities = await getFacilities();
  return facilities.filter((facility) => facility.featured).slice(0, limit);
}

export async function getFacilityCount(): Promise<number> {
  const rows = await query<{ count: number }>("SELECT count(*)::int AS count FROM facilities");
  return rows[0]?.count ?? 0;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [counts, popular, byBuilding, daily] = await Promise.all([
    query<{
      facilities: number;
      active: number;
      today: number;
      pending: number;
      utilization: number;
      total: number;
      cancelled: number;
      no_show: number;
    }>(
      `WITH boundaries AS (
         SELECT (date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta') AS day_start
       )
       SELECT
         (SELECT count(*)::int FROM facilities) AS facilities,
         (SELECT count(*)::int FROM facilities WHERE status = 'active') AS active,
         (SELECT count(*)::int FROM bookings, boundaries
          WHERE starts_at >= day_start AND starts_at < day_start + interval '1 day'
            AND status NOT IN ('cancelled', 'rejected')) AS today,
         (SELECT count(*)::int FROM bookings WHERE status = 'pending') AS pending,
         COALESCE((
           SELECT sum(extract(epoch from (least(ends_at, now()) - greatest(starts_at, now() - interval '30 days')))) / 3600
           FROM bookings
           WHERE status IN ('approved', 'checked_in', 'completed')
             AND starts_at >= now() - interval '30 days'
             AND ends_at <= now()
         ), 0)::float AS utilization,
         (SELECT count(*)::int FROM bookings) AS total,
         (SELECT count(*)::int FROM bookings WHERE status = 'cancelled') AS cancelled,
         (SELECT count(*)::int FROM bookings WHERE status = 'no_show') AS no_show
      `,
    ),
    query<{ name: string; count: number; capacity: number }>(
      `SELECT f.name, count(b.id)::int AS count, f.capacity
       FROM facilities f
       LEFT JOIN bookings b ON b.facility_id = f.id
         AND b.created_at >= now() - interval '30 days'
         AND b.status NOT IN ('cancelled', 'rejected')
       GROUP BY f.id, f.name, f.capacity
       ORDER BY count DESC, f.capacity DESC
       LIMIT 5`,
    ),
    query<{ name: string; count: number }>(
      `SELECT bld.name, count(b.id)::int AS count
       FROM buildings bld
       LEFT JOIN facilities f ON f.building_id = bld.id
       LEFT JOIN bookings b ON b.facility_id = f.id
         AND b.created_at >= now() - interval '30 days'
         AND b.status NOT IN ('cancelled', 'rejected')
       GROUP BY bld.id, bld.name
       ORDER BY count DESC`,
    ),
    query<{ day: string; count: number }>(
      `SELECT to_char(day, 'YYYY-MM-DD') AS day,
              count(b.id)::int AS count
       FROM generate_series(
         (current_date AT TIME ZONE 'Asia/Jakarta') - interval '6 days',
         current_date AT TIME ZONE 'Asia/Jakarta',
         interval '1 day'
       ) AS day
       LEFT JOIN bookings b
         ON (b.created_at AT TIME ZONE 'Asia/Jakarta')::date = day::date
         AND b.status NOT IN ('cancelled', 'rejected')
       GROUP BY day
       ORDER BY day`,
    ),
  ]);

  const row = counts[0];
  const utilizationHours = row?.utilization ?? 0;
  const availableHours = Math.max(1, (row?.active ?? 1) * 14 * 30);
  return {
    facilities: row?.facilities ?? 0,
    activeFacilities: row?.active ?? 0,
    todayBookings: row?.today ?? 0,
    pendingBookings: row?.pending ?? 0,
    utilization: Math.min(100, Number(((utilizationHours / availableHours) * 100).toFixed(1))),
    totalBookings: row?.total ?? 0,
    cancelled: row?.cancelled ?? 0,
    noShow: row?.no_show ?? 0,
    popular,
    byBuilding,
    daily: daily.map((entry) => ({
      date: entry.day,
      label: weekdayShort(entry.day),
      count: entry.count,
    })),
  };
}

export function formatUtilization(value: number): string {
  if (value <= 0) return "0";
  if (value < 1) return "<1";
  return String(Math.round(value));
}

export function formatOperatingHours(opensAt: string, closesAt: string): string {
  return `${formatTime(`2000-01-01T${opensAt}:00+07:00`)}–${formatTime(`2000-01-01T${closesAt}:00+07:00`)} WIB`;
}
