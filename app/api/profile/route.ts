import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { assertSameOrigin, errorResponse, HttpError, json } from "@/lib/http";
import { updateUserProfile } from "@/lib/profile";
import { profileSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Masuk terlebih dahulu.");
    const input = profileSchema.parse(await request.json());
    const profile = await updateUserProfile(user.id, input);
    await query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'profile.update', 'user', $3, $2)`,
      [
        user.id,
        JSON.stringify({ fields: ["name", "organization", "phone", "notifications"] }),
        user.id,
      ],
    );
    return json({ profile });
  } catch (error) {
    return errorResponse(error);
  }
}
