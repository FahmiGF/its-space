import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  LayoutDashboard,
  ListChecks,
  QrCode,
  ShieldCheck,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  AdminCheckin,
  AdminQueue,
  FacilityStatusControl,
} from "@/components/admin-actions";
import { Logo } from "@/components/logo";
import { BookingBadge } from "@/components/status-badge";
import { requireAdmin } from "@/lib/auth";
import { getAdminBookings } from "@/lib/bookings";
import {
  formatUtilization,
  getAdminFacilities,
  getDashboardStats,
} from "@/lib/facilities";
import { formatRange, formatLongDate, todayInJakarta } from "@/lib/time";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin dashboard" };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ checkin?: string }>;
}) {
  const user = await requireAdmin();
  const query = await searchParams;
  const [stats, bookings, facilities] = await Promise.all([
    getDashboardStats(),
    getAdminBookings(),
    getAdminFacilities(),
  ]);
  const pending = bookings.filter((booking) => booking.status === "pending");
  const maxDaily = Math.max(1, ...stats.daily.map((day) => day.count));
  const maxPopular = Math.max(1, ...stats.popular.map((item) => item.count));
  const today = todayInJakarta();

  return (
    <div className="admin-page">
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <Logo light />
          <nav className="admin-nav" aria-label="Navigasi admin">
            <span className="admin-nav-label">Operations</span>
            <Link href="/admin" className="active"><LayoutDashboard size={16} /> Ringkasan</Link>
            <a href="#antrean"><ListChecks size={16} /> Antrean approval</a>
            <a href="#checkin"><QrCode size={16} /> Check-in</a>
            <a href="#fasilitas"><Building2 size={16} /> Fasilitas</a>
            <span className="admin-nav-label">Data</span>
            <a href="#bookings"><CalendarDays size={16} /> Semua booking</a>
            <Link href="/explore"><ExternalLink size={16} /> Lihat situs publik</Link>
          </nav>
          <div className="admin-sidebar-foot">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
            <Link href="/dashboard">Dashboard pengguna <ArrowRight size={11} /></Link>
          </div>
        </aside>

        <div className="admin-main">
          <header className="admin-topbar">
            <div>
              <span className="eyebrow">Operations center</span>
              <h1>Selamat datang, {user.name.split(" ")[0]}.</h1>
            </div>
            <div className="admin-topbar-actions">
              <span className="admin-live"><i /> Live database</span>
              <span className="small muted">{formatLongDate(today)}</span>
            </div>
          </header>

          <section className="admin-kpis" aria-label="Ringkasan operasional">
            <div className="kpi">
              <div className="kpi-top"><span>Total fasilitas</span><Building2 size={15} /></div>
              <strong>{stats.facilities}</strong>
              <span className="kpi-foot"><span>{stats.activeFacilities} aktif</span> · siap dipesan</span>
            </div>
            <div className="kpi">
              <div className="kpi-top"><span>Booking hari ini</span><CalendarCheck2 size={15} /></div>
              <strong>{stats.todayBookings}</strong>
              <span className="kpi-foot">Termasuk semua status aktif</span>
            </div>
            <div className="kpi">
              <div className="kpi-top"><span>Menunggu approval</span><Clock3 size={15} /></div>
              <strong>{stats.pendingBookings}</strong>
              <span className="kpi-foot"><span>{pending.length} baru</span> di antrean</span>
            </div>
            <div className="kpi">
              <div className="kpi-top"><span>Utilisasi 30 hari</span><TrendingUp size={15} /></div>
              <strong>{formatUtilization(stats.utilization)}%</strong>
              <span className="kpi-foot">Jam terpakai / kapasitas tersedia</span>
            </div>
          </section>

          <div className="analytics-grid">
            <section className="chart-card">
              <div className="chart-head">
                <div>
                  <span className="eyebrow">Tren permintaan</span>
                  <h2>Aktivitas tujuh hari.</h2>
                </div>
                <span>{stats.totalBookings} total booking</span>
              </div>
              <div className="bar-chart">
                {stats.daily.map((day) => (
                  <div className="chart-bar" key={day.date} title={`${day.date}: ${day.count} booking`}>
                    <b>{day.count}</b>
                    <i style={{ height: `${Math.max(5, Math.round((day.count / maxDaily) * 100))}%` }} />
                    <span>{day.label}</span>
                  </div>
                ))}
              </div>
              <div className="bar-labels">
                <span>7 hari terakhir</span>
                <span>Pembuatan booking</span>
              </div>
            </section>

            <section className="chart-card">
              <div className="chart-head">
                <div>
                  <span className="eyebrow">Popularitas</span>
                  <h2>Ruang paling aktif.</h2>
                </div>
                <BarChart3 size={16} className="muted" />
              </div>
              <div className="popular-list">
                {stats.popular.map((item) => (
                  <div className="popular-row" key={item.name}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.capacity.toLocaleString("id-ID")} kapasitas</span>
                      <div className="popular-bar">
                        <i style={{ width: `${Math.max(6, (item.count / maxPopular) * 100)}%` }} />
                      </div>
                    </div>
                    <b>{item.count}</b>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="admin-content-grid">
            <section className="admin-panel" id="antrean">
              <div className="admin-panel-head">
                <div>
                  <span className="eyebrow">Approval queue</span>
                  <h2>Permintaan menunggu.</h2>
                </div>
                <span>{pending.length} item</span>
              </div>
              <AdminQueue bookings={pending} />
            </section>

            <div className="admin-side-stack">
              <section id="checkin">
                <AdminCheckin initialToken={query.checkin ?? ""} />
              </section>
              <section className="admin-panel" id="fasilitas">
                <div className="admin-panel-head">
                  <div>
                    <span className="eyebrow">Status fasilitas</span>
                    <h2>Operasional.</h2>
                  </div>
                  <Building2 size={16} className="muted" />
                </div>
                <div className="facility-admin-list">
                  {facilities.map((facility) => (
                    <FacilityStatusControl key={facility.id} facility={facility} />
                  ))}
                </div>
              </section>
            </div>
          </div>

          <section className="admin-panel" id="bookings" style={{ marginTop: 10 }}>
            <div className="admin-panel-head">
              <div>
                <span className="eyebrow">Audit trail</span>
                <h2>Semua booking.</h2>
              </div>
              <span>{bookings.length} entri terbaru</span>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Referensi</th>
                  <th>Fasilitas</th>
                  <th>Pemesan</th>
                  <th>Jadwal</th>
                  <th>Peserta</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 20).map((booking) => (
                  <tr key={booking.id}>
                    <td><strong>{booking.reference}</strong><small>{booking.organization || "Pribadi"}</small></td>
                    <td><strong>{booking.facility.name}</strong><small>{booking.facility.buildingName}</small></td>
                    <td><strong>{booking.user?.name}</strong><small>{booking.user?.email}</small></td>
                    <td><strong>{formatRange(booking.startsAt, booking.endsAt)}</strong><small>{formatLongDate(booking.startsAt)}</small></td>
                    <td>{booking.attendees} orang</td>
                    <td><BookingBadge status={booking.status} /></td>
                    <td>
                      <Link href={`/bookings/${booking.id}`} className="icon-button subtle" aria-label="Buka tiket">
                        <Ticket size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <footer style={{ display: "flex", justifyContent: "space-between", gap: 15, marginTop: 20, color: "var(--muted)", fontSize: 9 }}>
            <span><ShieldCheck size={12} /> RBAC aktif · setiap aksi tercatat di audit log</span>
            <span><CheckCircle2 size={12} /> PostgreSQL exclusion constraint aktif</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
