import { query } from "@/lib/db";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = performance.now();
  try {
    const rows = await query<{ now: Date; facilities: number; active: number }>(
      `SELECT now(), (SELECT count(*)::int FROM facilities) AS facilities,
       (SELECT count(*)::int FROM facilities WHERE status = 'active') AS active`,
    );
    const latency = Math.round(performance.now() - started);
    return json(
      {
        status: latency < 1200 ? "operational" : "degraded",
        database: {
          status: "connected",
          latencyMs: latency,
          serverTime: rows[0].now.toISOString(),
        },
        facilities: rows[0].facilities,
        activeFacilities: rows[0].active,
        uptimeSeconds: Math.round(process.uptime()),
        commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
        timestamp: new Date().toISOString(),
      },
      200,
      { "Cache-Control": "no-store" },
    );
  } catch {
    return json(
      {
        status: "outage",
        database: { status: "unavailable" },
        timestamp: new Date().toISOString(),
      },
      503,
    );
  }
}
