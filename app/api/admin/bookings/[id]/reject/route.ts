import { getCurrentUser } from "@/lib/auth";
import { rejectBooking } from "@/lib/bookings";
import { assertSameOrigin, errorResponse, HttpError, json } from "@/lib/http";
import { rejectSchema } from "@/lib/validation";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Masuk terlebih dahulu.");
    if (user.role !== "admin") throw new HttpError(403, "Hanya admin yang dapat menolak.");
    const { id } = await context.params;
    const input = rejectSchema.parse(await request.json());
    const booking = await rejectBooking(id, user.id, input.reason);
    return json({ booking });
  } catch (error) {
    return errorResponse(error);
  }
}
