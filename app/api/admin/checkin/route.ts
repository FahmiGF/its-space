import { getCurrentUser } from "@/lib/auth";
import { checkInBooking } from "@/lib/bookings";
import { assertSameOrigin, errorResponse, HttpError, json } from "@/lib/http";
import { checkinSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Masuk terlebih dahulu.");
    if (user.role !== "admin") throw new HttpError(403, "Hanya petugas yang dapat check-in.");
    const input = checkinSchema.parse(await request.json());
    const booking = await checkInBooking(input.token, user.id);
    return json({ booking });
  } catch (error) {
    return errorResponse(error);
  }
}
