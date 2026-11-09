import QRCode from "qrcode";
import { getCurrentUser } from "@/lib/auth";
import { createCheckinToken, getBookingById } from "@/lib/bookings";
import { errorResponse, getBaseUrl, HttpError } from "@/lib/http";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Masuk terlebih dahulu.");
    const { id } = await context.params;
    const booking = await getBookingById(id);
    if (!booking) throw new HttpError(404, "Booking tidak ditemukan.");
    if (user.role !== "admin" && booking.user?.id !== user.id) {
      throw new HttpError(403, "Tiket ini bukan milik Anda.");
    }
    if (!["approved", "checked_in", "completed"].includes(booking.status)) {
      throw new HttpError(409, "QR tersedia setelah booking disetujui.");
    }
    const token = createCheckinToken(booking.id, booking.endsAt);
    const url = `${getBaseUrl(request)}/admin?checkin=${encodeURIComponent(token)}`;
    const png = await QRCode.toBuffer(url, {
      width: 420,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#10201B", light: "#FFFFFF" },
    });
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-store",
        "Content-Disposition": `inline; filename="ticket-${booking.reference}.png"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
