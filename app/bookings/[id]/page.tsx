import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  QrCode,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";
import { CancelBooking } from "@/components/admin-actions";
import { PaymentButton } from "@/components/payment-button";
import { BookingBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { createCheckinToken, getBookingById } from "@/lib/bookings";
import { CATEGORY_META } from "@/lib/constants";
import { formatRupiah } from "@/lib/format";
import { isMidtransConfigured } from "@/lib/payments";
import { formatDate, formatDateTime, formatRange } from "@/lib/time";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Tiket booking" };

export default async function BookingTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const booking = await getBookingById(id);
  if (!booking) notFound();
  if (user.role !== "admin" && booking.user?.id !== user.id) notFound();

  const canShowQr = ["approved", "checked_in", "completed"].includes(booking.status);
  const checkinToken = canShowQr ? createCheckinToken(booking.id, booking.endsAt) : "";
  const paymentsEnabled = isMidtransConfigured();
  const statusCopy: Record<string, string> = {
    pending: "Menunggu persetujuan pengelola",
    approved: "Disetujui · siap check-in",
    rejected: "Permintaan ditolak",
    cancelled: "Booking dibatalkan",
    checked_in: "Sudah check-in",
    completed: "Selesai",
    no_show: "Tidak hadir",
  };

  return (
    <div className="ticket-page">
      <div className="container">
        <div className="breadcrumb" style={{ marginBottom: 16 }}>
          <Link href="/dashboard">Dashboard</Link>
          <span>/</span>
          <span>Tiket {booking.reference}</span>
        </div>

        <article className="ticket-card">
          <div className="ticket-top">
            <div>
              <span className="eyebrow">E-ticket · ITS Space</span>
              <h1>{booking.facility.name}</h1>
              <p>
                {CATEGORY_META[booking.facility.category].label} ·{" "}
                {booking.facility.buildingName} · {booking.facility.capacity} orang
              </p>
            </div>
            <div className="ticket-ref">
              <span>Referensi booking</span>
              <strong>{booking.reference}</strong>
              <div style={{ marginTop: 8 }}><BookingBadge status={booking.status} /></div>
            </div>
          </div>

          <div className="ticket-body">
            <div className="ticket-qr">
              {canShowQr ? (
                <>
                  <img
                    src={`/api/bookings/${booking.id}/qr`}
                    alt={`QR check-in booking ${booking.reference}`}
                  />
                  <strong><QrCode size={13} /> Tunjukkan QR ini ke petugas</strong>
                  <small>
                    Token bertanda tangan dan hanya berlaku untuk booking ini.
                    Check-in dibuka 30 menit sebelum jadwal.
                  </small>
                </>
              ) : (
                <>
                  <div className="ticket-pending">
                    <ShieldCheck size={27} />
                    <span>QR aktif setelah disetujui</span>
                  </div>
                  <strong>{statusCopy[booking.status]}</strong>
                  <small>Anda akan menerima notifikasi saat status berubah.</small>
                </>
              )}
            </div>

            <div className="ticket-info">
              <div className="ticket-status-row">
                <BookingBadge status={booking.status} />
                <span className="small muted">{statusCopy[booking.status]}</span>
              </div>

              <div className="ticket-info-grid">
                <div>
                  <span>Tanggal</span>
                  <strong>{formatDate(booking.startsAt)}</strong>
                </div>
                <div>
                  <span>Waktu</span>
                  <strong>{formatRange(booking.startsAt, booking.endsAt)}</strong>
                </div>
                <div>
                  <span>Lokasi</span>
                  <strong><MapPin size={12} /> {booking.facility.buildingName}</strong>
                </div>
                <div>
                  <span>Peserta</span>
                  <strong><Users size={12} /> {booking.attendees} orang</strong>
                </div>
                <div>
                  <span>Pemesan</span>
                  <strong>{booking.user?.name}</strong>
                </div>
                <div>
                  <span>Organisasi</span>
                  <strong>{booking.organization || booking.user?.organization || "Pribadi"}</strong>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <span>Tujuan penggunaan</span>
                  <strong>{booking.purpose}</strong>
                </div>
              </div>

              {booking.rejectionReason && (
                <p className="ticket-note" style={{ color: "var(--red)" }}>
                  Alasan penolakan: {booking.rejectionReason}
                </p>
              )}
              {booking.checkedInAt && (
                <p className="ticket-note">
                  <CheckCircle2 size={12} /> Check-in tercatat{" "}
                  {formatDateTime(booking.checkedInAt)} WIB.
                </p>
              )}
              <p className="ticket-note">
                <CalendarDays size={12} /> Buffer persiapan dan pembersihan 15 menit
                sudah dihitung dalam slot. Datang 10 menit lebih awal untuk verifikasi.
              </p>
              {booking.paymentStatus === "paid" || booking.status === "approved" ? (
                <PaymentButton
                  bookingId={booking.id}
                  amountDue={booking.amountDue}
                  status={booking.paymentStatus}
                  configured={paymentsEnabled}
                />
              ) : booking.amountDue > 0 && booking.status === "pending" ? (
                <div className="payment-box">
                  <div>
                    <span className="eyebrow">Pembayaran</span>
                    <strong>{formatRupiah(booking.amountDue)}</strong>
                    <small>Pembayaran dibuka setelah booking disetujui pengelola.</small>
                  </div>
                </div>
              ) : null}

              <div className="ticket-actions">
                <Link href="/dashboard" className="button button-small">
                  <ArrowLeft size={13} /> Dashboard
                </Link>
                {user.role === "admin" && canShowQr && (
                  <Link
                    href={`/admin?checkin=${encodeURIComponent(checkinToken)}`}
                    className="button button-ghost button-small"
                  >
                    <QrCode size={13} /> Buka check-in
                  </Link>
                )}
                {["pending", "approved"].includes(booking.status) && (
                  <CancelBooking id={booking.id} />
                )}
              </div>
            </div>
          </div>
        </article>

        <div className="ticket-note" style={{ maxWidth: 850, margin: "13px auto 0", textAlign: "center" }}>
          <Ticket size={12} /> Simpan halaman ini atau unduh QR. Tiket tidak dapat
          dipindahtangankan tanpa persetujuan pengelola.
        </div>
      </div>
    </div>
  );
}
