import { getCurrentUser } from "@/lib/auth";
import { cancelBooking } from "@/lib/bookings";
import { assertSameOrigin, errorResponse, HttpError, json } from "@/lib/http";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Masuk terlebih dahulu.");
    const { id } = await context.params;
    const booking = await cancelBooking(id, user);
    return json({ booking });
  } catch (error) {
    return errorResponse(error);
  }
}
