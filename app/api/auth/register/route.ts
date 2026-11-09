import { createSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { assertSameOrigin, errorResponse, HttpError, json } from "@/lib/http";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = registerSchema.parse(await request.json());
    const passwordHash = await hashPassword(input.password);

    let user: { id: string; name: string; email: string; role: string; organization: string | null };
    try {
      const rows = await query<{
        id: string;
        name: string;
        email: string;
        role: string;
        organization: string | null;
      }>(
        `INSERT INTO users (name, email, password_hash, role, organization)
         VALUES ($1, $2, $3, 'student', $4)
         RETURNING id, name, email, role, organization`,
        [input.name, input.email, passwordHash, input.organization || null],
      );
      user = rows[0];
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "23505") {
        throw new HttpError(409, "Email sudah terdaftar. Silakan masuk.");
      }
      throw error;
    }

    await createSession(user.id);
    await query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, metadata)
       VALUES ($1, 'auth.register', 'auth', $2)`,
      [user.id, JSON.stringify({ email: user.email })],
    );
    return json({ user }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
