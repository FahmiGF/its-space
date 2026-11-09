import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { AssistantPanel } from "@/components/assistant-panel";
import { FacilityCard } from "@/components/facility-card";
import { CATEGORY_META } from "@/lib/constants";
import { getBuildings, getFacilities } from "@/lib/facilities";
import type { FacilityCategory } from "@/lib/types";
import { formatDate, isDateString, isTimeString, todayInJakarta } from "@/lib/time";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jelajahi fasilitas",
  description:
    "Cari ruang dan fasilitas kampus berdasarkan kategori, gedung, kapasitas, fasilitas, dan ketersediaan waktu.",
};

type Params = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const q = one(params.q).slice(0, 80);
  const categoryValue = one(params.category);
  const category =
    categoryValue && categoryValue in CATEGORY_META
      ? (categoryValue as FacilityCategory)
      : undefined;
  const building = one(params.building);
  const minCapacityRaw = Number(one(params.minCapacity));
  const minCapacity = Number.isFinite(minCapacityRaw) && minCapacityRaw > 0 ? minCapacityRaw : undefined;
  const dateValue = one(params.date);
  const date = isDateString(dateValue) ? dateValue : undefined;
  const startValue = one(params.start);
  const endValue = one(params.end);
  const start = isTimeString(startValue) ? startValue : "09:00";
  const end = isTimeString(endValue) ? endValue : "11:00";
  const amenity = one(params.amenity).slice(0, 50);
  const today = todayInJakarta();

  const [facilities, buildings] = await Promise.all([
    getFacilities({
      q: q || undefined,
      category,
      building: building || undefined,
      minCapacity,
      date,
      start: date ? start : undefined,
      end: date ? end : undefined,
      amenity: amenity || undefined,
    }),
    getBuildings(),
  ]);

  const hasFilters = Boolean(q || category || building || minCapacity || date || amenity);
  const activeLabels = [
    q && `“${q}”`,
    category && CATEGORY_META[category].label,
    building && buildings.find((item) => item.code === building)?.name,
    minCapacity && `≥ ${minCapacity} orang`,
    date && `${formatDate(date)} · ${start}–${end}`,
    amenity && amenity,
  ].filter(Boolean) as string[];

  return (
    <div>
      <section className="page-hero">
        <div className="container page-hero-inner">
          <div>
            <div className="breadcrumb">
              <Link href="/">Beranda</Link>
              <span>/</span>
              <span>Jelajahi</span>
            </div>
            <span className="eyebrow">Katalog fasilitas</span>
            <h1>Ruang untuk setiap <em>agenda.</em></h1>
            <p>
              {facilities.length} fasilitas aktif ditemukan. Filter ketersediaan
              memakai jadwal asli, bukan status statis.
            </p>
          </div>
          <Link href="/#cara-kerja" className="section-link">
            Panduan booking <Sparkles size={14} />
          </Link>
        </div>
      </section>

      <section className="explore-section">
        <div className="container explore-layout">
          <aside className="filter-panel">
            <div className="filter-head">
              <strong>Filter</strong>
              {hasFilters ? (
                <Link href="/explore">Reset semua</Link>
              ) : (
                <span className="muted small">6 kategori</span>
              )}
            </div>
            <form className="filter-form" action="/explore" method="get">
              <label className="field">
                <span>Kata kunci</span>
                <input name="q" defaultValue={q} placeholder="Nama atau kegiatan" />
              </label>
              <label className="field">
                <span>Kategori</span>
                <select name="category" defaultValue={category ?? ""}>
                  <option value="">Semua kategori</option>
                  {Object.entries(CATEGORY_META).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Gedung</span>
                <select name="building" defaultValue={building}>
                  <option value="">Semua gedung</option>
                  {buildings.map((item) => (
                    <option key={item.code} value={item.code}>{item.name}</option>
                  ))}
                </select>
              </label>
              <div className="field-row">
                <label className="field">
                  <span>Min. kapasitas</span>
                  <input
                    type="number"
                    name="minCapacity"
                    min={1}
                    defaultValue={minCapacity}
                    placeholder="orang"
                  />
                </label>
                <label className="field">
                  <span>Fasilitas</span>
                  <select name="amenity" defaultValue={amenity}>
                    <option value="">Apa saja</option>
                    <option value="Proyektor">Proyektor</option>
                    <option value="AC">AC</option>
                    <option value="Wi-Fi">Wi-Fi</option>
                    <option value="Sound system">Sound system</option>
                    <option value="Parkir">Parkir</option>
                    <option value="Papan tulis">Papan tulis</option>
                  </select>
                </label>
              </div>
              <label className="field">
                <span>Cek tanggal</span>
                <input type="date" name="date" defaultValue={date} min={today} />
              </label>
              <div className="field-row">
                <label className="field">
                  <span>Mulai</span>
                  <input type="time" name="start" defaultValue={start} step={1800} />
                </label>
                <label className="field">
                  <span>Selesai</span>
                  <input type="time" name="end" defaultValue={end} step={1800} />
                </label>
              </div>
              <button type="submit" className="button button-block">
                <SlidersHorizontal size={14} /> Terapkan filter
              </button>
              <p className="filter-note">
                Tanggal + jam akan menyaring ruang yang benar-benar kosong, termasuk
                buffer persiapan 15 menit.
              </p>
            </form>
          </aside>

          <div className="results-panel">
            <div className="results-head">
              <div>
                <h2>{category ? CATEGORY_META[category].label : "Semua fasilitas"}</h2>
                <p>
                  {date
                    ? `Ketersediaan ${formatDate(date)}, ${start}–${end} WIB`
                    : "Jelajahi seluruh ruang dan fasilitas kampus"}
                </p>
              </div>
              <span className="results-count">
                <Compass size={13} /> {facilities.length} hasil
              </span>
            </div>
            {activeLabels.length > 0 && (
              <div className="active-filters">
                {activeLabels.map((label) => <span key={label}>{label}</span>)}
                <Link href="/explore" className="text-button" aria-label="Hapus semua filter">
                  <X size={12} /> Hapus
                </Link>
              </div>
            )}

            {facilities.length ? (
              <div className="results-grid">
                {facilities.map((facility, index) => (
                  <FacilityCard key={facility.id} facility={facility} priority={index < 3} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-state-icon"><Search size={23} /></span>
                <h3>Belum ada ruang yang cocok.</h3>
                <p>
                  Coba longgarkan jam, kurangi kapasitas minimum, atau hapus filter
                  gedung. Ketersediaan berubah saat booking baru masuk.
                </p>
                <Link href="/explore" className="button button-small">
                  Tampilkan semua fasilitas
                </Link>
              </div>
            )}

            <div className="explore-assistant">
              <AssistantPanel compact />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
