import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { assertSameOrigin, errorResponse, HttpError, json } from "@/lib/http";
import { facilityStatusSchema } from "@/lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Masuk terlebih dahulu.");
    if (user.role !== "admin") throw new HttpError(403, "Hanya admin yang dapat mengubah fasilitas.");
    const { id } = await context.params;
    const input = facilityStatusSchema.parse(await request.json());
    const rows = await query<{ id: string; name: string; status: string }>(
      `UPDATE facilities SET status = $2, updated_at = now()
       WHERE id = $1 RETURNING id, name, status`,
      [id, input.status],
    );
    const facility = rows[0];
    if (!facility) throw new HttpError(404, "Fasilitas tidak ditemukan.");
    await query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'facility.status', 'facility', $2, $3)`,
      [user.id, id, JSON.stringify({ status: input.status })],
    );
    return json({ facility });
  } catch (error) {
    return errorResponse(error);
  }
}
