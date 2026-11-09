import { getCurrentUser } from "@/lib/auth";
import { checkOutBooking, getBookingById } from "@/lib/bookings";
import { assertSameOrigin, errorResponse, HttpError, json } from "@/lib/http";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Masuk terlebih dahulu.");
    const { id } = await context.params;
    const booking = await getBookingById(id);
    if (!booking) throw new HttpError(404, "Booking tidak ditemukan.");
    if (user.role !== "admin" && booking.user?.id !== user.id) {
      throw new HttpError(403, "Anda tidak berhak menyelesaikan booking ini.");
    }
    const updated = await checkOutBooking(id, user.id);
    return json({ booking: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
