import { getCurrentUser } from "@/lib/auth";
import { markNotificationsRead } from "@/lib/bookings";
import { assertSameOrigin, errorResponse, HttpError, json } from "@/lib/http";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Masuk terlebih dahulu.");
    await markNotificationsRead(user.id);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
