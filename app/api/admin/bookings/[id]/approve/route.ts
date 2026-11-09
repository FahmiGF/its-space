import { getCurrentUser } from "@/lib/auth";
import { approveBooking } from "@/lib/bookings";
import { assertSameOrigin, errorResponse, HttpError, json } from "@/lib/http";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Masuk terlebih dahulu.");
    if (user.role !== "admin") throw new HttpError(403, "Hanya admin yang dapat menyetujui.");
    const { id } = await context.params;
    const booking = await approveBooking(id, user.id);
    return json({ booking });
  } catch (error) {
    return errorResponse(error);
  }
}
