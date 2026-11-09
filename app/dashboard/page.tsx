import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Compass,
  LayoutDashboard,
  MapPin,
  Settings,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { CancelBooking, MarkNotificationsRead } from "@/components/admin-actions";
import { BookingBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { getNotifications, getUserBookings } from "@/lib/bookings";
import { CATEGORY_META } from "@/lib/constants";
import { formatDate, formatRange, formatTime } from "@/lib/time";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Booking saya" };

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const [bookings, notifications] = await Promise.all([
    getUserBookings(user.id),
    getNotifications(user.id),
  ]);

  const now = Date.now();
  const upcoming = bookings
    .filter(
      (booking) =>
        new Date(booking.endsAt).getTime() >= now &&
        ["pending", "approved", "checked_in"].includes(booking.status),
    )
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const past = bookings.filter(
    (booking) =>
      new Date(booking.endsAt).getTime() < now ||
      ["cancelled", "rejected", "completed", "no_show"].includes(booking.status),
  );
  const next = upcoming[0];
  const unread = notifications.filter((item) => !item.read_at).length;
  const totalHours = bookings
    .filter((booking) => ["approved", "checked_in", "completed"].includes(booking.status))
    .reduce(
      (total, booking) =>
        total + (new Date(booking.endsAt).getTime() - new Date(booking.startsAt).getTime()) / 3600000,
      0,
    );

  return (
    <div className="dashboard-page">
      <div className="container">
        <section className="dashboard-hero">
          <div className="dashboard-hero-copy">
            <span className="eyebrow">Dashboard pribadi</span>
            <h1>{greeting()}, <em>{user.name.split(" ")[0]}.</em></h1>
            <p>
              Semua peminjaman, status persetujuan, dan tiket Anda ada di satu
              tempat. Slot yang sudah dikunci tidak dapat diambil orang lain.
            </p>
            <div className="dashboard-hero-actions">
              <Link href="/explore" className="button">
                <Compass size={16} /> Temukan ruang baru
              </Link>
              {user.role === "admin" && (
                <Link href="/admin" className="button button-ghost">
                  <ShieldCheck size={16} /> Buka admin
                </Link>
              )}
            </div>
          </div>
          {next ? (
            <div className="next-booking-card">
              <span>Booking berikutnya</span>
              <strong>{next.facility.name}</strong>
              <p>
                {formatDate(next.startsAt)} · {formatRange(next.startsAt, next.endsAt)}
              </p>
              <Link href={`/bookings/${next.id}`}>
                Lihat tiket <ArrowRight size={13} />
              </Link>
            </div>
          ) : (
            <div className="next-booking-card">
              <span>Booking berikutnya</span>
              <strong>Belum ada jadwal.</strong>
              <p>Cari ruang yang tersedia dan mulai rencanakan kegiatan Anda.</p>
              <Link href="/explore">Jelajahi fasilitas <ArrowRight size={13} /></Link>
            </div>
          )}
        </section>

        <div className="dashboard-stats">
          <div className="dash-stat"><span>Booking aktif</span><strong>{upcoming.length}</strong></div>
          <div className="dash-stat"><span>Total booking</span><strong>{bookings.length}</strong></div>
          <div className="dash-stat"><span>Jam terpakai</span><strong>{Math.round(totalHours)}</strong></div>
          <div className="dash-stat"><span>Notifikasi baru</span><strong>{unread}</strong></div>
        </div>

        <div className="dashboard-grid">
          <div>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">Mendatang</span>
                  <h2>Booking aktif</h2>
                </div>
                <Link href="/explore">Tambah booking</Link>
              </div>
              {upcoming.length ? (
                <div className="booking-list">
                  {upcoming.map((booking) => {
                    const dateParts = formatDate(booking.startsAt).split(" ");
                    return (
                      <article className="booking-item" key={booking.id}>
                        <div className="booking-date">
                          <span>{dateParts[1]?.replace(".", "")}</span>
                          <strong>{dateParts[0]}</strong>
                          <small>{dateParts[2]}</small>
                        </div>
                        <div className="booking-info">
                          <div className="booking-info-top">
                            <span>{CATEGORY_META[booking.facility.category].label}</span>
                            <BookingBadge status={booking.status} />
                          </div>
                          <h4>{booking.facility.name}</h4>
                          <p>
                            {formatRange(booking.startsAt, booking.endsAt)} ·{" "}
                            {booking.facility.buildingName} · {booking.reference}
                          </p>
                        </div>
                        <div className="booking-actions">
                          <Link href={`/bookings/${booking.id}`} className="button button-small">
                            <Ticket size={13} /> Tiket
                          </Link>
                          {(booking.status === "pending" || booking.status === "approved") && (
                            <CancelBooking id={booking.id} compact />
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-inline">
                  <CalendarDays size={21} />
                  <div>
                    <strong>Belum ada booking aktif.</strong>
                    <p>Cari ruang yang tersedia dan ajukan peminjaman pertama Anda.</p>
                  </div>
                </div>
              )}
            </section>

            <section className="panel" style={{ marginTop: 12 }}>
              <div className="panel-head">
                <div>
                  <span className="eyebrow">Riwayat</span>
                  <h2>Booking sebelumnya</h2>
                </div>
                <span className="small muted">{past.length} entri</span>
              </div>
              {past.length ? (
                <div className="booking-list past-list">
                  {past.slice(0, 8).map((booking) => {
                    const dateParts = formatDate(booking.startsAt).split(" ");
                    return (
                      <article className="booking-item" key={booking.id}>
                        <div className="booking-date">
                          <span>{dateParts[1]?.replace(".", "")}</span>
                          <strong>{dateParts[0]}</strong>
                          <small>{dateParts[2]}</small>
                        </div>
                        <div className="booking-info">
                          <div className="booking-info-top">
                            <span>{booking.facility.buildingName}</span>
                            <BookingBadge status={booking.status} />
                          </div>
                          <h4>{booking.facility.name}</h4>
                          <p>
                            {formatDate(booking.startsAt)} · {formatRange(booking.startsAt, booking.endsAt)}
                          </p>
                        </div>
                        <div className="booking-actions">
                          <Link href={`/bookings/${booking.id}`} className="text-button">
                            Detail
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="muted small">Belum ada riwayat peminjaman.</p>
              )}
            </section>
          </div>

          <aside className="dashboard-side">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">Inbox</span>
                  <h2>Notifikasi</h2>
                </div>
                <MarkNotificationsRead unread={unread} />
              </div>
              {notifications.length ? (
                <div className="notification-list">
                  {notifications.slice(0, 7).map((notification) => (
                    <div
                      key={notification.id}
                      className={`notification-item ${notification.read_at ? "read" : ""}`}
                    >
                      <span className="notification-dot" />
                      <div>
                        <strong>{notification.title}</strong>
                        <p>{notification.body}</p>
                        <small>
                          {formatTime(notification.created_at)} ·{" "}
                          {formatDate(notification.created_at)}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted small">Belum ada notifikasi.</p>
              )}
            </section>

            <div className="profile-card">
              <span className="avatar">
                {user.name.split(" ").slice(0, 2).map((part) => part[0]).join("")}
              </span>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
              <span>{user.organization || "Mahasiswa ITS"}</span>
              <Link href="/settings"><Settings size={12} /> Pengaturan profil</Link>
              {user.role === "admin" && (
                <Link href="/admin"><LayoutDashboard size={12} /> Buka dashboard admin</Link>
              )}
            </div>

            <section className="panel" style={{ marginTop: 11 }}>
              <span className="eyebrow">Butuh bantuan?</span>
              <h2 style={{ fontSize: 23, margin: "4px 0 8px" }}>Sebelum check-in.</h2>
              <p className="small muted" style={{ marginBottom: 10 }}>
                Datang 10 menit lebih awal. Tunjukkan QR tiket kepada petugas di
                gedung. Check-in dibuka 30 menit sebelum jadwal.
              </p>
              <p className="small muted" style={{ display: "flex", gap: 5 }}>
                <MapPin size={13} /> {user.organization || "Kampus Sukolilo"}
              </p>
              <p className="small muted" style={{ display: "flex", gap: 5, marginBottom: 0 }}>
                <Clock3 size={13} /> Waktu Indonesia Barat (WIB)
              </p>
              <div className="dashboard-help-links">
                <Link href="/help">Pusat bantuan</Link>
                <Link href="/emergency">Emergency call</Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
