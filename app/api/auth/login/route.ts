import { createSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { assertSameOrigin, errorResponse, HttpError, json, requestIp } from "@/lib/http";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = loginSchema.parse(await request.json());
    const ip = requestIp(request);

    const recent = await query<{ count: number }>(
      `SELECT count(*)::int AS count FROM audit_logs
       WHERE action = 'auth.login_failed'
         AND created_at > now() - interval '15 minutes'
         AND metadata->>'email' = $1
         AND metadata->>'ip' = $2`,
      [input.email, ip],
    );
    if ((recent[0]?.count ?? 0) >= 8) {
      throw new HttpError(429, "Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit.");
    }

    const rows = await query<{
      id: string;
      name: string;
      email: string;
      role: "student" | "staff" | "admin";
      organization: string | null;
      password_hash: string;
    }>(
      `SELECT id, name, email, role, organization, password_hash
       FROM users WHERE lower(email) = $1 LIMIT 1`,
      [input.email],
    );
    const user = rows[0];
    const valid = user ? await verifyPassword(input.password, user.password_hash) : false;

    if (!user || !valid) {
      await query(
        `INSERT INTO audit_logs (action, entity_type, metadata)
         VALUES ('auth.login_failed', 'auth', $1)`,
        [JSON.stringify({ email: input.email, ip })],
      );
      throw new HttpError(401, "Email atau kata sandi tidak cocok.");
    }

    await createSession(user.id);
    await query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, metadata)
       VALUES ($1, 'auth.login', 'auth', $2)`,
      [user.id, JSON.stringify({ ip })],
    );

    return json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
