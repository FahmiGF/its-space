import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { AssistantPanel } from "@/components/assistant-panel";
import { CategoryIcon } from "@/components/category-icon";
import { FacilityCard } from "@/components/facility-card";
import { CATEGORY_META } from "@/lib/constants";
import {
  formatUtilization,
  getBuildings,
  getDashboardStats,
  getFeaturedFacilities,
} from "@/lib/facilities";
import { formatDate, todayInJakarta } from "@/lib/time";

export const dynamic = "force-dynamic";

const CATEGORY_COPY: Record<string, string> = {
  sports: "Lapangan & arena",
  auditorium: "Aula & convention",
  meeting: "Rapat & diskusi",
  lab: "Riset & praktikum",
  studio: "Produksi konten",
  outdoor: "Ruang terbuka",
};

export default async function HomePage() {
  const today = todayInJakarta();
  const [featured, buildings, stats] = await Promise.all([
    getFeaturedFacilities(4),
    getBuildings(),
    getDashboardStats(),
  ]);

  return (
    <div className="home">
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-badge">
              <i />
              Kampus Sukolilo · live facility inventory
            </span>
            <h1>
              Find your
              <br />
              <em>space.</em>
            </h1>
            <p className="hero-lead">
              Temukan auditorium, lapangan, laboratorium, atau ruang rapat yang
              benar-benar tersedia. Pesan dalam satu alur, pantau persetujuan, dan
              check-in dengan QR.
            </p>
            <div className="hero-actions">
              <Link href="/explore" className="button">
                Jelajahi fasilitas <ArrowRight size={17} />
              </Link>
              <Link href="#cara-kerja" className="hero-arrow-link">
                Lihat cara kerja <span><ArrowRight size={14} /></span>
              </Link>
            </div>
            <div className="hero-trust">
              <span><ShieldCheck size={14} /> Anti double-booking</span>
              <span><CheckCircle2 size={14} /> Approval terpusat</span>
              <span><Clock3 size={14} /> Ketersediaan langsung</span>
            </div>
          </div>

          <div className="hero-visual">
            <figure className="hero-media">
              <img
                src="https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=1300&q=85"
                alt="Auditorium kampus dengan pencahayaan hangat"
                fetchPriority="high"
              />
              <span className="hero-media-tag"><i /> Live availability</span>
              <figcaption className="hero-media-caption">
                <div>
                  <span>Fasilitas unggulan</span>
                  <strong>{featured[0]?.name ?? "Auditorium Utama"}</strong>
                </div>
                <Link
                  href={featured[0] ? `/facilities/${featured[0].slug}` : "/explore"}
                  aria-label="Lihat fasilitas unggulan"
                >
                  <ArrowUpRight size={19} />
                </Link>
              </figcaption>
            </figure>

            <div className="hero-float-card">
              <div className="hero-float-head">
                <span>Hari ini</span>
                <span>{formatDate(today)}</span>
              </div>
              {(featured.length ? featured.slice(0, 2) : []).map((facility) => (
                <div className="hero-float-item" key={facility.id}>
                  <span className="hero-float-icon">
                    <CategoryIcon category={facility.category} size={14} />
                  </span>
                  <div>
                    <strong>{facility.name}</strong>
                    <small>
                      {facility.buildingName} · {facility.capacity} orang
                    </small>
                  </div>
                  <CheckCircle2 size={15} className="hero-float-badge" />
                </div>
              ))}
              <div className="hero-float-item">
                <span className="hero-float-icon"><CalendarDays size={14} /></span>
                <div>
                  <strong>Cek kalender lengkap</strong>
                  <small>Slot kosong & terisi</small>
                </div>
                <Link href="/explore" aria-label="Buka explorer">
                  <ArrowUpRight size={15} />
                </Link>
              </div>
            </div>
            <span className="hero-side-note">Surabaya · 07° 16′ S</span>
          </div>
        </div>

        <div className="container">
          <form className="search-card" action="/explore" method="get">
            <div className="search-card-head">
              <span><Search size={17} /> Cari ruang yang tepat</span>
              <small>{stats.activeFacilities} fasilitas aktif · data langsung</small>
            </div>
            <div className="search-fields">
              <label className="search-field">
                <span>Ruang atau kegiatan</span>
                <input name="q" placeholder="Auditorium, futsal, rapat…" />
              </label>
              <label className="search-field">
                <span>Tanggal</span>
                <input type="date" name="date" defaultValue={today} min={today} />
              </label>
              <label className="search-field">
                <span>Mulai</span>
                <select name="start" defaultValue="09:00">
                  {Array.from({ length: 25 }, (_, index) => {
                    const hour = 6 + Math.floor(index / 2);
                    return `${String(hour).padStart(2, "0")}:${index % 2 ? "30" : "00"}`;
                  }).map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </label>
              <label className="search-field">
                <span>Selesai</span>
                <select name="end" defaultValue="11:00">
                  {Array.from({ length: 25 }, (_, index) => {
                    const hour = 6 + Math.floor(index / 2);
                    return `${String(hour).padStart(2, "0")}:${index % 2 ? "30" : "00"}`;
                  }).map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </label>
              <label className="search-field">
                <span>Kapasitas</span>
                <input type="number" name="minCapacity" min={1} placeholder="Min. orang" />
              </label>
              <button type="submit" className="button search-submit">
                Cari ruang <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="container stats-band-wrap" aria-label="Ringkasan platform">
        <div className="stats-band">
          <div className="stats-intro">
            <span>One campus.</span>
            <small>Terhubung dalam satu sistem</small>
          </div>
          <div className="stat-item">
            <strong>{stats.facilities}</strong>
            <span>Fasilitas terdaftar</span>
          </div>
          <div className="stat-item">
            <strong>{buildings.length}</strong>
            <span>Gedung & arena</span>
          </div>
          <div className="stat-item">
            <strong>{stats.totalBookings}</strong>
            <span>Booking terkelola</span>
          </div>
          <div className="stat-item">
            <strong>{formatUtilization(stats.utilization)}<em>%</em></strong>
            <span>Utilisasi 30 hari</span>
          </div>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Mulai dari kebutuhan</span>
              <h2>Setiap kegiatan punya <em>ruangnya.</em></h2>
            </div>
            <p>
              Dari latihan badminton sampai konferensi 800 orang. Filter berdasarkan
              kapasitas, gedung, jam, dan fasilitas pendukung.
            </p>
          </div>
          <div className="category-grid">
            {(Object.keys(CATEGORY_META) as Array<keyof typeof CATEGORY_META>).map(
              (category) => (
                <Link
                  key={category}
                  href={`/explore?category=${category}`}
                  className="category-card"
                >
                  <span className="category-card-icon">
                    <CategoryIcon category={category} size={19} />
                  </span>
                  <div>
                    <strong>{CATEGORY_META[category].label}</strong>
                    <span>{CATEGORY_COPY[category]}</span>
                  </div>
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Paling dicari</span>
              <h2>Ruang yang bikin ide <em>bergerak.</em></h2>
            </div>
            <Link href="/explore" className="section-link">
              Lihat semua fasilitas <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="featured-grid">
            {featured.map((facility, index) => (
              <FacilityCard key={facility.id} facility={facility} priority={index < 2} />
            ))}
          </div>
          <div className="availability-note">
            <i /> Status ketersediaan diperbarui dari database saat halaman dibuka.
          </div>
        </div>
      </section>

      <section className="section" id="cara-kerja">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Cara kerja</span>
              <h2>Dari ide ke kunci, <em>tiga langkah.</em></h2>
            </div>
            <p>
              Tidak ada formulir kertas yang hilang. Setiap langkah tercatat dan
              dapat dilacak oleh pemesan maupun pengelola.
            </p>
          </div>
          <div className="steps-grid">
            <article className="step-card">
              <span className="step-number">01</span>
              <ArrowUpRight size={35} className="step-line" />
              <h3>Temukan & bandingkan.</h3>
              <p>
                Cari berdasarkan kapasitas, lokasi, fasilitas, dan slot waktu.
                Ketersediaan dihitung dari booking aktif di database.
              </p>
            </article>
            <article className="step-card">
              <span className="step-number">02</span>
              <ArrowUpRight size={35} className="step-line" />
              <h3>Pesan dengan yakin.</h3>
              <p>
                Booking dikunci secara transaksional. Jika dua orang memilih slot
                yang sama, hanya satu yang berhasil—tanpa race condition.
              </p>
            </article>
            <article className="step-card">
              <span className="step-number">03</span>
              <ArrowUpRight size={35} className="step-line" />
              <h3>Check-in lewat QR.</h3>
              <p>
                Setelah disetujui, tiket QR bertanda tangan muncul di dashboard.
                Petugas memverifikasi token sebelum mencatat kehadiran.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="assistant-section">
          <div className="assistant-section-copy">
            <span className="eyebrow">Pencarian cerdas</span>
            <h2>Tanya seperti manusia. Dijawab dengan <em>data nyata.</em></h2>
            <p>
              Space Assist memahami kapasitas, tanggal, gedung, jenis ruangan, dan
              fasilitas. Jawabannya selalu berasal dari katalog dan jadwal yang
              tersimpan—bukan tebakan model bahasa.
            </p>
            <div className="assistant-proof">
              <span><ShieldCheck size={14} /> Tanpa status karangan</span>
              <span><Sparkles size={14} /> Filter bahasa alami</span>
            </div>
          </div>
          <AssistantPanel />
        </div>
      </section>

      <section className="container">
        <div className="closing-cta">
          <div>
            <span className="eyebrow">Untuk seluruh kampus</span>
            <h2>Punya acara? Mulai dari ruang yang benar.</h2>
            <p>Lihat fasilitas, cek slot, dan ajukan booking dalam hitungan menit.</p>
          </div>
          <div className="closing-actions">
            <Link href="/explore" className="button">
              Cari fasilitas <ArrowRight size={16} />
            </Link>
            <Link href="/register" className="button button-ghost">
              Buat akun
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
