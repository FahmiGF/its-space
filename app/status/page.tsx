import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  Gauge,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { StatusRefresh } from "@/components/status-refresh";
import { query } from "@/lib/db";
import { formatLongDate, todayInJakarta } from "@/lib/time";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Status sistem",
  description: "Status operasional, latency database, dan jaminan konsistensi ITS Space.",
};

export default async function StatusPage() {
  const started = performance.now();
  let metrics: { facilities: number; active: number; bookings: number; pending: number } | null = null;
  let error = "";
  try {
    const rows = await query<{
      facilities: number;
      active: number;
      bookings: number;
      pending: number;
    }>(
      `SELECT
        (SELECT count(*)::int FROM facilities) AS facilities,
        (SELECT count(*)::int FROM facilities WHERE status = 'active') AS active,
        (SELECT count(*)::int FROM bookings) AS bookings,
        (SELECT count(*)::int FROM bookings WHERE status = 'pending') AS pending`,
    );
    metrics = rows[0];
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Database tidak dapat dijangkau.";
  }
  const latency = Math.round(performance.now() - started);
  const operational = Boolean(metrics) && latency < 1200;
  const today = todayInJakarta();

  return (
    <div className="status-page">
      <div className="container">
        <div className="status-hero">
          <div>
            <div className="breadcrumb">
              <Link href="/">Beranda</Link><span>/</span><span>Status</span>
            </div>
            <span className="eyebrow">Transparansi layanan</span>
            <h1>Kampus berjalan. <em>Sistemnya juga.</em></h1>
            <p>
              Status ini membaca database produksi secara langsung. Latency dan
              jumlah data di bawah bukan angka statis.
            </p>
          </div>
          <StatusRefresh />
        </div>

        <div className="status-banner">
          <span className="status-pulse" style={!operational ? { background: "var(--red)", boxShadow: "0 0 0 5px rgba(184,58,50,.12)" } : undefined} />
          <div>
            <strong>{operational ? "Semua sistem operasional" : "Gangguan terdeteksi"}</strong>
            <p>
              {operational
                ? `Database merespons dalam ${latency} ms. Data ketersediaan dapat diverifikasi.`
                : error || "Database belum merespons."}
            </p>
          </div>
          <span className="small muted">Diperiksa {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })} WIB</span>
        </div>

        <div className="status-grid">
          <div className="status-metric">
            <span>Database</span>
            <strong>{metrics ? "Connected" : "Offline"}</strong>
            <small>PostgreSQL · TLS di produksi</small>
          </div>
          <div className="status-metric">
            <span>Query latency</span>
            <strong>{latency} ms</strong>
            <small>Single aggregate query</small>
          </div>
          <div className="status-metric">
            <span>Fasilitas aktif</span>
            <strong>{metrics?.active ?? "—"}</strong>
            <small>dari {metrics?.facilities ?? "—"} terdaftar</small>
          </div>
          <div className="status-metric">
            <span>Booking tercatat</span>
            <strong>{metrics?.bookings ?? "—"}</strong>
            <small>{metrics?.pending ?? "—"} menunggu approval</small>
          </div>
        </div>

        <div className="status-content">
          <section className="status-section">
            <span className="eyebrow">Konsistensi</span>
            <h2>Double booking ditolak oleh database.</h2>
            <p>
              Bukan hanya validasi frontend. Constraint eksklusi PostgreSQL mengunci
              rentang waktu per fasilitas, termasuk buffer 15 menit. Dua transaksi
              bersamaan tidak bisa sama-sama berhasil.
            </p>
            <pre className="status-code"><code>{`EXCLUDE USING gist (
  facility_id WITH =,
  slot_range WITH &&
) WHERE (status IN (
  'pending', 'approved', 'checked_in'
))`}</code></pre>
            <ul className="guarantee-list">
              <li>
                <ShieldCheck size={16} />
                <div><strong>Transaksi atomik</strong><span>Insert booking, notifikasi, dan audit berjalan dalam satu transaksi.</span></div>
              </li>
              <li>
                <Database size={16} />
                <div><strong>Constraint-level locking</strong><span>Race condition ditangkap sebagai HTTP 409, bukan lolos menjadi jadwal ganda.</span></div>
              </li>
              <li>
                <Zap size={16} />
                <div><strong>Idempotent approval</strong><span>Approval hanya bekerja pada status pending dan mengunci baris.</span></div>
              </li>
            </ul>
          </section>

          <section className="status-section">
            <span className="eyebrow">Quality gate</span>
            <h2>Bukti yang dijalankan.</h2>
            <p>{formatLongDate(today)} · build produksi</p>
            <ul className="guarantee-list">
              <li>
                <CheckCircle2 size={16} />
                <div><strong>TypeScript strict</strong><span>Typecheck dan build produksi harus lulus sebelum deploy.</span></div>
              </li>
              <li>
                <CheckCircle2 size={16} />
                <div><strong>Concurrency test</strong><span>Banyak request ke slot yang sama; hanya satu mendapat 201, sisanya 409.</span></div>
              </li>
              <li>
                <Activity size={16} />
                <div><strong>Load test</strong><span>Endpoint baca diuji dengan koneksi paralel; hasil dilaporkan di README.</span></div>
              </li>
              <li>
                <Gauge size={16} />
                <div><strong>Health endpoint</strong><span><Link href="/api/health">/api/health</Link> mengembalikan latency dan status database secara real-time.</span></div>
              </li>
            </ul>
            <p className="small muted" style={{ marginTop: 14 }}>
              <AlertTriangle size={12} /> Status page memeriksa koneksi dan latency,
              bukan SLA penuh. Target 5.000 pengguna bersamaan harus divalidasi pada
              infrastruktur produksi dengan beban yang disepakati.
            </p>
          </section>
        </div>

        <p className="small muted" style={{ marginTop: 19, display: "flex", alignItems: "center", gap: 5 }}>
          <Clock3 size={12} /> Halaman ini membaca data langsung setiap refresh.
        </p>
      </div>
    </div>
  );
}
