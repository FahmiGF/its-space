import { createSession, getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { assertSameOrigin, errorResponse, HttpError, json } from "@/lib/http";
import { hashPassword, verifyPassword } from "@/lib/password";
import { passwordChangeSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Masuk terlebih dahulu.");
    const input = passwordChangeSchema.parse(await request.json());

    const rows = await query<{ password_hash: string }>(
      "SELECT password_hash FROM users WHERE id = $1 LIMIT 1",
      [user.id],
    );
    if (!rows[0] || !(await verifyPassword(input.currentPassword, rows[0].password_hash))) {
      throw new HttpError(401, "Kata sandi saat ini tidak cocok.");
    }

    const passwordHash = await hashPassword(input.newPassword);
    await query("UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1", [
      user.id,
      passwordHash,
    ]);
    await query("DELETE FROM sessions WHERE user_id = $1", [user.id]);
    await createSession(user.id);
    await query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id)
       VALUES ($1, 'profile.password_change', 'user', $2)`,
      [user.id, user.id],
    );
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
