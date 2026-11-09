import { getCurrentUser } from "@/lib/auth";
import { createBooking } from "@/lib/bookings";
import { assertSameOrigin, errorResponse, HttpError, json } from "@/lib/http";
import { bookingCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Masuk terlebih dahulu untuk memesan fasilitas.");
    const input = bookingCreateSchema.parse(await request.json());
    const booking = await createBooking(user.id, input);
    return json({ booking }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
