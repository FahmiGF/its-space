import { loadEnv } from "./env.mjs";

loadEnv();
const base = process.env.STRESS_BASE_URL || process.env.SMOKE_BASE_URL || "http://localhost:3200";
const concurrency = Number(process.env.CONCURRENCY || 24);

function addDays(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)] ?? 0;
}

async function login(email, password) {
  const response = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(`Login failed for ${email}: ${await response.text()}`);
  return { cookie: response.headers.getSetCookie()[0].split(";")[0], data: await response.json() };
}

const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
const date = addDays(today, 30);
const users = [];
for (let index = 1; index <= 8; index += 1) {
  users.push(await login(`load${index}@its-space.id`, "LoadTest#2026"));
}
const admin = await login("admin@its-space.id", "Admin#2026");

console.log(`Target: ${base}`);
console.log(`Concurrent booking attempts: ${concurrency} across 8 users`);
console.log(`Slot: auditorium-utama · ${date} · 14:00–15:00 WIB\n`);

const payload = JSON.stringify({
  facilitySlug: "auditorium-utama",
  date,
  start: "14:00",
  end: "15:00",
  attendees: 120,
  purpose: "Concurrency certification test untuk slot eksklusif",
  organization: "QA ITS Space",
  agreement: true,
});

const started = performance.now();
const responses = await Promise.all(
  Array.from({ length: concurrency }, async (_, index) => {
    const user = users[index % users.length];
    const requestStarted = performance.now();
    try {
      const response = await fetch(`${base}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: base,
          Cookie: user.cookie,
        },
        body: payload,
      });
      const data = await response.json();
      return {
        status: response.status,
        data,
        cookie: user.cookie,
        latency: performance.now() - requestStarted,
      };
    } catch (error) {
      return {
        status: 0,
        data: { error: error instanceof Error ? error.message : String(error) },
        cookie: user.cookie,
        latency: performance.now() - requestStarted,
      };
    }
  }),
);
const elapsed = performance.now() - started;

const counts = responses.reduce((result, item) => {
  result[item.status] = (result[item.status] ?? 0) + 1;
  return result;
}, {});
const winners = responses.filter((item) => item.status === 201);
const latencies = responses.map((item) => item.latency);

console.log(`Status counts: ${JSON.stringify(counts)}`);
console.log(`Elapsed: ${Math.round(elapsed)} ms`);
console.log(`Latency p50/p95/max: ${Math.round(percentile(latencies, 50))}/${Math.round(percentile(latencies, 95))}/${Math.round(Math.max(...latencies))} ms`);
console.log(`Successful bookings: ${winners.length}`);

let result = 1;
if (winners.length === 1 && counts[409] === concurrency - 1 && !counts[500] && !counts[0]) {
  console.log("PASS  exactly one booking won; all other attempts were rejected with 409.");
  result = 0;
} else {
  console.log("FAIL  expected exactly 1 × 201 and the rest 409.");
}

if (winners.length === 1) {
  const cleanup = await fetch(`${base}/api/bookings/${winners[0].data.booking.id}/cancel`, {
    method: "POST",
    headers: { Origin: base, Cookie: admin.cookie },
  });
  console.log(`Cleanup cancel: ${cleanup.status}`);
} else {
  console.log("Cleanup skipped: no unique winner to cancel.");
}

process.exitCode = result;
