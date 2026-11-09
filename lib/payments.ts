import crypto from "node:crypto";
import { getBookingById } from "./bookings";
import { query, withTransaction } from "./db";
import { getBaseUrl, HttpError } from "./http";
import type { PaymentStatus } from "./types";

type PaymentRow = {
  id: string;
  booking_id: string;
  order_id: string;
  amount: number;
  status: PaymentStatus;
  snap_token: string | null;
  redirect_url: string | null;
};

type MidtransNotification = {
  order_id?: string;
  status_code?: string;
  gross_amount?: string | number;
  signature_key?: string;
  transaction_status?: string;
  fraud_status?: string;
  payment_type?: string;
};

export function isMidtransConfigured(): boolean {
  return Boolean(process.env.MIDTRANS_SERVER_KEY);
}

export function calculateAmount(pricePerHour: number, startsAt: string | Date, endsAt: string | Date): number {
  if (pricePerHour <= 0) return 0;
  const minutes = (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000;
  return Math.max(0, Math.round(pricePerHour * Math.ceil(minutes / 60)));
}

export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string,
  serverKey: string,
): boolean {
  if (!orderId || !statusCode || !grossAmount || !signatureKey || !serverKey) return false;
  const expected = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
  const actualBuffer = Buffer.from(signatureKey);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function midtransBaseUrl(): string {
  return process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";
}

function mapNotificationStatus(notification: MidtransNotification): PaymentStatus {
  if (notification.transaction_status === "capture") {
    return notification.fraud_status === "accept" ? "paid" : "pending";
  }
  if (notification.transaction_status === "settlement") return "paid";
  if (notification.transaction_status === "pending") return "pending";
  if (notification.transaction_status === "expire") return "expired";
  if (notification.transaction_status === "refund" || notification.transaction_status === "partial_refund") {
    return "refunded";
  }
  return "failed";
}

export async function createPaymentSession(
  bookingId: string,
  userId: string,
  requestBaseUrl?: string,
): Promise<{ paid: boolean; redirectUrl?: string; token?: string; message?: string }> {
  const booking = await getBookingById(bookingId, userId);
  if (!booking) throw new HttpError(404, "Booking tidak ditemukan.");
  if (booking.amountDue <= 0) throw new HttpError(409, "Booking ini tidak memerlukan pembayaran.");
  if (booking.paymentStatus === "paid") return { paid: true };
  if (booking.status !== "approved") {
    throw new HttpError(
      409,
      "Pembayaran hanya dapat dilakukan setelah booking disetujui.",
      { code: "PAYMENT_NOT_AVAILABLE" },
    );
  }

  const existingRows = await query<PaymentRow>(
    "SELECT id, booking_id, order_id, amount, status, snap_token, redirect_url FROM payments WHERE booking_id = $1 LIMIT 1",
    [bookingId],
  );
  const existing = existingRows[0];
  if (existing?.status === "paid") return { paid: true };
  if (existing?.status === "pending" && existing.redirect_url) {
    return { paid: false, redirectUrl: existing.redirect_url, token: existing.snap_token ?? undefined };
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    throw new HttpError(
      503,
      "Payment gateway belum dikonfigurasi. Hubungi pengelola untuk menyelesaikan pembayaran.",
      { code: "PAYMENT_NOT_CONFIGURED" },
    );
  }

  const orderId =
    existing && existing.status === "pending"
      ? existing.order_id
      : `${booking.reference}-PAY-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const baseUrl = requestBaseUrl ?? getBaseUrl();
  const payload = {
    transaction_details: { order_id: orderId, gross_amount: booking.amountDue },
    item_details: [
      {
        id: booking.facility.slug,
        price: booking.amountDue,
        quantity: 1,
        name: `${booking.facility.name} · ${booking.reference}`.slice(0, 50),
      },
    ],
    customer_details: {
      first_name: booking.user?.name ?? "Pemesan",
      email: booking.user?.email,
    },
    callbacks: { finish: `${baseUrl}/bookings/${booking.id}` },
    expiry: { unit: "minutes", duration: 60 },
  };

  const response = await fetch(`${midtransBaseUrl()}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(12_000),
  }).catch(() => null);

  if (!response) throw new HttpError(502, "Payment gateway tidak dapat dihubungi. Coba lagi.");
  const data = (await response.json().catch(() => null)) as
    | { token?: string; redirect_url?: string; error_messages?: string[] }
    | null;
  if (!response.ok || !data?.token || !data.redirect_url) {
    throw new HttpError(502, "Transaksi pembayaran gagal dibuat. Coba lagi beberapa saat.");
  }

  await query(
    `INSERT INTO payments (booking_id, order_id, amount, status, snap_token, redirect_url, raw_payload)
     VALUES ($1, $2, $3, 'pending', $4, $5, $6)
     ON CONFLICT (booking_id) DO UPDATE SET
       order_id = EXCLUDED.order_id, amount = EXCLUDED.amount, status = 'pending',
       snap_token = EXCLUDED.snap_token, redirect_url = EXCLUDED.redirect_url,
       raw_payload = EXCLUDED.raw_payload, updated_at = now()`,
    [booking.id, orderId, booking.amountDue, data.token, data.redirect_url, JSON.stringify(data)],
  );

  return { paid: false, redirectUrl: data.redirect_url, token: data.token };
}

export async function processPaymentNotification(
  notification: MidtransNotification,
): Promise<{ ok: true; status: PaymentStatus }> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) throw new HttpError(503, "Payment gateway belum dikonfigurasi.");
  const orderId = notification.order_id ?? "";
  const statusCode = notification.status_code ?? "";
  const grossAmount = String(notification.gross_amount ?? "");
  if (
    !verifyMidtransSignature(
      orderId,
      statusCode,
      grossAmount,
      notification.signature_key ?? "",
      serverKey,
    )
  ) {
    throw new HttpError(401, "Signature notifikasi pembayaran tidak valid.");
  }

  const nextStatus = mapNotificationStatus(notification);
  await withTransaction(async (client) => {
    const rows = await client.query<{
      id: string;
      booking_id: string;
      user_id: string;
      reference: string;
      status: PaymentStatus;
      amount: number;
    }>(
      `SELECT p.id, p.booking_id, p.status, p.amount, b.user_id, b.reference
       FROM payments p JOIN bookings b ON b.id = p.booking_id
       WHERE p.order_id = $1 FOR UPDATE`,
      [orderId],
    );
    const payment = rows.rows[0];
    if (!payment) throw new HttpError(404, "Pembayaran tidak ditemukan.");
    if (!Number.isFinite(Number(grossAmount)) || Math.round(Number(grossAmount)) !== payment.amount) {
      throw new HttpError(409, "Nominal notifikasi pembayaran tidak cocok.");
    }
    if (payment.status === nextStatus) return;
    if ((payment.status === "paid" || payment.status === "refunded") && nextStatus !== "refunded") {
      return;
    }

    await client.query(
      `UPDATE payments
       SET status = $2, paid_at = CASE WHEN $2 = 'paid' THEN now() ELSE paid_at END,
           raw_payload = $3, updated_at = now()
       WHERE id = $1`,
      [payment.id, nextStatus, JSON.stringify(notification)],
    );
    if (nextStatus === "paid") {
      await client.query(
        `INSERT INTO notifications (user_id, title, body, href)
         VALUES ($1, 'Pembayaran berhasil', $2, $3)`,
        [
          payment.user_id,
          `Pembayaran booking ${payment.reference} sudah diterima. Tiket siap digunakan.`,
          `/bookings/${payment.booking_id}`,
        ],
      );
    }
    await client.query(
      `INSERT INTO audit_logs (action, entity_type, entity_id, metadata)
       VALUES ('payment.notification', 'payment', $1, $2)`,
      [
        payment.id,
        JSON.stringify({
          orderId,
          status: nextStatus,
          transactionStatus: notification.transaction_status,
          paymentType: notification.payment_type ?? null,
        }),
      ],
    );
  });

  return { ok: true, status: nextStatus };
}
