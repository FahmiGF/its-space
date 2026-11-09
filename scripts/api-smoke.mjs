import crypto from "node:crypto";
import { loadEnv } from "./env.mjs";

loadEnv();
const base = process.env.SMOKE_BASE_URL || "http://localhost:3200";

async function login(email, password) {
  const response = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Login ${email} failed: ${data.error}`);
  const cookie = response.headers.getSetCookie()[0].split(";")[0];
  return { cookie, user: data.user };
}

async function api(path, cookie, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Origin: base,
      ...(cookie ? { Cookie: cookie } : {}),
      ...(options.headers || {}),
    },
  });
  const type = response.headers.get("content-type") || "";
  const data = type.includes("application/json") ? await response.json() : null;
  return { response, data };
}

function atJakarta(date, time) {
  return new Date(`${date}T${time}:00+07:00`);
}

function jalaliParts(value) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(value);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function addDays(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function checkinToken(bookingId, endsAt) {
  const payload = Buffer.from(
    JSON.stringify({
      b: bookingId,
      e: Math.floor(new Date(endsAt).getTime() / 1000) + 2 * 60 * 60,
    }),
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", process.env.CHECKIN_SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

const results = [];
function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}
function fail(name, detail) {
  results.push({ name, ok: false, detail });
  console.log(`FAIL  ${name} — ${detail}`);
}

try {
  const student = await login("mahasiswa@its-space.id", "Mahasiswa#2026");
  pass("student login", student.user.role);
  const admin = await login("admin@its-space.id", "Admin#2026");
  pass("admin login", admin.user.role);

  const dashboard = await fetch(`${base}/dashboard`, { headers: { Cookie: student.cookie } });
  dashboard.status === 200 ? pass("dashboard page") : fail("dashboard page", String(dashboard.status));

  const settingsPage = await fetch(`${base}/settings`, { headers: { Cookie: student.cookie } });
  settingsPage.status === 200 ? pass("settings page") : fail("settings page", String(settingsPage.status));

  const profile = await api("/api/profile", student.cookie, {
    method: "PATCH",
    body: JSON.stringify({
      name: student.user.name,
      organization: student.user.organization || "QA ITS Space",
      phone: "081234567890",
      notifyBooking: true,
      notifyReminders: true,
      notifyAnnouncements: false,
    }),
  });
  profile.response.status === 200 && profile.data.profile
    ? pass("profile update", profile.data.profile.name)
    : fail("profile update", `${profile.response.status} ${JSON.stringify(profile.data)}`);

  for (const path of ["/help", "/tutorial", "/emergency", "/locations"]) {
    const page = await fetch(`${base}${path}`);
    page.status === 200 ? pass(`public page ${path}`) : fail(`public page ${path}`, String(page.status));
  }

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
  const bookingDate = addDays(today, 12);
  const body = {
    facilitySlug: "lapangan-basket",
    date: bookingDate,
    start: "09:00",
    end: "10:00",
    attendees: 12,
    purpose: "Smoke test booking otomatis dan pelepasan slot",
    organization: "QA ITS Space",
    contactPhone: "081234567890",
    agreement: true,
  };
  let created = await api("/api/bookings", student.cookie, { method: "POST", body: JSON.stringify(body) });
  if (created.response.status !== 201) throw new Error(created.data?.error || "create failed");
  pass("create auto-approved booking", `${created.data.booking.reference} · ${created.data.booking.status}`);
  const autoBooking = created.data.booking;

  const conflict = await api("/api/bookings", student.cookie, { method: "POST", body: JSON.stringify(body) });
  conflict.response.status === 409
    ? pass("overlap rejected", conflict.data.code)
    : fail("overlap rejected", `${conflict.response.status} ${JSON.stringify(conflict.data)}`);

  const cancel = await api(`/api/bookings/${autoBooking.id}/cancel`, student.cookie, { method: "POST" });
  cancel.response.status === 200 ? pass("cancel booking") : fail("cancel booking", String(cancel.response.status));

  const rebook = await api("/api/bookings", student.cookie, {
    method: "POST",
    body: JSON.stringify({ ...body, purpose: "Smoke test setelah slot dibatalkan" }),
  });
  rebook.response.status === 201
    ? pass("slot reusable after cancellation", rebook.data.booking.status)
    : fail("slot reusable after cancellation", `${rebook.response.status} ${JSON.stringify(rebook.data)}`);
  if (rebook.response.ok) {
    await api(`/api/bookings/${rebook.data.booking.id}/cancel`, student.cookie, { method: "POST" });
  }

  const pending = await api("/api/bookings", student.cookie, {
    method: "POST",
    body: JSON.stringify({
      ...body,
      facilitySlug: "auditorium-utama",
      start: "13:00",
      end: "14:00",
      attendees: 50,
      purpose: "Smoke test alur approval auditorium",
    }),
  });
  if (pending.response.status !== 201 || pending.data.booking.status !== "pending") {
    throw new Error(pending.data?.error || "pending booking failed");
  }
  pass("create pending booking", pending.data.booking.reference);

  const approve = await api(`/api/admin/bookings/${pending.data.booking.id}/approve`, admin.cookie, { method: "POST" });
  approve.response.status === 200 && approve.data.booking.status === "approved"
    ? pass("admin approve")
    : fail("admin approve", `${approve.response.status} ${JSON.stringify(approve.data)}`);

  const qr = await fetch(`${base}/api/bookings/${pending.data.booking.id}/qr`, {
    headers: { Cookie: student.cookie },
  });
  qr.status === 200 && qr.headers.get("content-type") === "image/png"
    ? pass("signed QR image", qr.headers.get("content-type"))
    : fail("signed QR image", String(qr.status));

  await api(`/api/bookings/${pending.data.booking.id}/cancel`, student.cookie, { method: "POST" });

  // Check-in path: use a slot starting in 10 minutes when the facility is open.
  const now = new Date();
  const parts = jalaliParts(now);
  const startMinutes = Number(parts.hour) * 60 + Number(parts.minute) + 12;
  const roundedStart = Math.ceil(startMinutes / 5) * 5;
  const roundedEnd = roundedStart + 30;
  const fmt = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  const start = fmt(roundedStart);
  const end = fmt(roundedEnd);
  if (roundedStart >= 8 * 60 && roundedEnd <= 21 * 60) {
    const live = await api("/api/bookings", student.cookie, {
      method: "POST",
      body: JSON.stringify({
        facilitySlug: "ruang-diskusi-tower-1",
        date: parts.year + "-" + parts.month + "-" + parts.day,
        start,
        end,
        attendees: 4,
        purpose: "Smoke test check-in QR dan checkout",
        agreement: true,
      }),
    });
    if (live.response.status === 201) {
      const token = checkinToken(live.data.booking.id, live.data.booking.endsAt);
      const checkin = await api("/api/admin/checkin", admin.cookie, {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      checkin.response.status === 200 && checkin.data.booking.status === "checked_in"
        ? pass("QR check-in", `${start}–${end} WIB`)
        : fail("QR check-in", `${checkin.response.status} ${JSON.stringify(checkin.data)}`);
      if (checkin.response.ok) {
        const checkout = await api(`/api/bookings/${live.data.booking.id}/checkout`, student.cookie, { method: "POST" });
        checkout.response.status === 200
          ? pass("check-out")
          : fail("check-out", `${checkout.response.status} ${JSON.stringify(checkout.data)}`);
      } else {
        await api(`/api/bookings/${live.data.booking.id}/cancel`, admin.cookie, { method: "POST" });
      }
    } else {
      console.log(`SKIP  QR check-in — slot ${start}–${end} unavailable (${live.response.status})`);
    }
  } else {
    console.log(`SKIP  QR check-in — outside operating hours (${start}–${end})`);
  }

  const paidDate = addDays(today, 13);
  const paid = await api("/api/bookings", student.cookie, {
    method: "POST",
    body: JSON.stringify({
      facilitySlug: "gor-indoor",
      date: paidDate,
      start: "09:00",
      end: "11:00",
      attendees: 20,
      purpose: "Smoke test tarif dan payment record fasilitas premium",
      organization: "QA ITS Space",
      agreement: true,
    }),
  });
  const paidBooking = paid.data?.booking;
  paid.response.status === 201 && paidBooking?.amountDue === 600000 && paidBooking?.paymentStatus === "pending"
    ? pass("paid booking amount", `${paidBooking.reference} · Rp600.000 · pending`)
    : fail("paid booking amount", `${paid.response.status} ${JSON.stringify(paid.data)}`);
  if (paid.response.ok) {
    const payment = await api(`/api/payments/${paidBooking.id}`, student.cookie, { method: "POST" });
    payment.response.status === 409 && payment.data.code === "PAYMENT_NOT_AVAILABLE"
      ? pass("payment waits for approval")
      : fail("payment waits for approval", `${payment.response.status} ${JSON.stringify(payment.data)}`);
    await api(`/api/bookings/${paidBooking.id}/cancel`, student.cookie, { method: "POST" });
  }

  const unauthorized = await api("/api/admin/checkin", student.cookie, {
    method: "POST",
    body: JSON.stringify({ token: "x".repeat(30) }),
  });
  unauthorized.response.status === 403
    ? pass("RBAC blocks student check-in")
    : fail("RBAC blocks student check-in", String(unauthorized.response.status));

  const failures = results.filter((item) => !item.ok);
  console.log(`\n${results.length - failures.length}/${results.length} checks passed.`);
  if (failures.length) process.exitCode = 1;
} catch (error) {
  console.error("SMOKE ERROR", error);
  process.exitCode = 1;
}
