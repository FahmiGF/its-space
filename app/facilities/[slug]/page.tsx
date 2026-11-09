import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Maximize2,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { BookingPanel } from "@/components/booking-panel";
import { CategoryIcon } from "@/components/category-icon";
import { formatRupiah } from "@/lib/format";
import { FacilityBadge } from "@/components/status-badge";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORY_META } from "@/lib/constants";
import {
  formatOperatingHours,
  getAvailability,
  getFacilityBySlug,
  getWeekAvailability,
} from "@/lib/facilities";
import { formatLongDate, isDateString, todayInJakarta } from "@/lib/time";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const facility = await getFacilityBySlug(slug);
  if (!facility) return { title: "Fasilitas tidak ditemukan" };
  return {
    title: facility.name,
    description: facility.description.slice(0, 155),
  };
}

export default async function FacilityDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query = await searchParams;
  const facility = await getFacilityBySlug(slug);
  if (!facility) notFound();

  const today = todayInJakarta();
  const initialDate = query.date && isDateString(query.date) && query.date >= today
    ? query.date
    : today;
  const [availability, week, user] = await Promise.all([
    getAvailability(facility.slug, initialDate),
    getWeekAvailability(facility.slug, today),
    getCurrentUser(),
  ]);
  const category = CATEGORY_META[facility.category];

  return (
    <div className="detail-page">
      <div className="container">
        <div className="breadcrumb detail-breadcrumb">
          <Link href="/">Beranda</Link>
          <span>/</span>
          <Link href="/explore">Fasilitas</Link>
          <span>/</span>
          <span>{facility.name}</span>
        </div>

        <div className="detail-head">
          <div className="detail-title">
            <span className={`category-pill category-${category.tone}`}>
              <CategoryIcon category={facility.category} size={14} />
              {category.label}
            </span>
            <h1>{facility.name}</h1>
            <div className="detail-subtitle">
              <span><MapPin size={13} /> {facility.buildingName}, {facility.floor}</span>
              <span><Users size={13} /> {facility.capacity.toLocaleString("id-ID")} orang</span>
              <span><Clock3 size={13} /> {formatOperatingHours(facility.opensAt, facility.closesAt)}</span>
            </div>
          </div>
          <Link href="/explore" className="section-link">
            <ArrowLeft size={14} /> Kembali ke katalog
          </Link>
        </div>

        <div className="detail-layout">
          <div className="detail-main">
            <div className="detail-gallery">
              {facility.imageUrl ? (
                <img src={facility.imageUrl} alt={`${facility.name} di ${facility.buildingName}`} />
              ) : (
                <div className="facility-image-fallback" />
              )}
              <div className="gallery-badges">
                <span className={`category-pill category-${category.tone}`}>
                  <CategoryIcon category={facility.category} size={14} /> {category.label}
                </span>
                <FacilityBadge status={facility.status} />
              </div>
              <span className="gallery-caption">Foto ilustrasi · {facility.campusName}</span>
            </div>

            <div className="detail-facts">
              <div className="detail-fact">
                <span>Kapasitas</span>
                <strong>{facility.capacity.toLocaleString("id-ID")} orang</strong>
              </div>
              <div className="detail-fact">
                <span>Luas</span>
                <strong>{facility.areaM2 ? `${facility.areaM2} m²` : "—"}</strong>
              </div>
              <div className="detail-fact">
                <span>Persetujuan</span>
                <strong>{facility.requiresApproval ? "Pengelola" : "Otomatis"}</strong>
              </div>
              <div className="detail-fact">
                <span>Buffer slot</span>
                <strong>15 menit</strong>
              </div>
              <div className="detail-fact">
                <span>Tarif</span>
                <strong>{facility.pricePerHour > 0 ? `${formatRupiah(facility.pricePerHour)}/jam` : "Gratis"}</strong>
              </div>
            </div>

            <section className="detail-section">
              <span className="eyebrow">Tentang ruang</span>
              <h2>Dirancang untuk kegiatan yang berjalan lancar.</h2>
              <p>{facility.description}</p>
            </section>

            <section className="detail-section">
              <span className="eyebrow">Fasilitas pendukung</span>
              <h2>Yang sudah tersedia.</h2>
              <div className="amenity-list">
                {facility.amenities.map((amenity) => (
                  <span key={amenity}>
                    <CheckCircle2 size={13} /> {amenity}
                  </span>
                ))}
              </div>
              {facility.equipment.length > 0 && (
                <>
                  <h2 style={{ marginTop: 28 }}>Peralatan.</h2>
                  <div className="amenity-list">
                    {facility.equipment.map((item) => (
                      <span key={item}><Maximize2 size={13} /> {item}</span>
                    ))}
                  </div>
                </>
              )}
            </section>

            <section className="detail-section">
              <span className="eyebrow">Aturan penggunaan</span>
              <h2>Sebelum Anda masuk.</h2>
              <ol className="rules-list">
                {facility.rules.map((rule) => <li key={rule}>{rule}</li>)}
              </ol>
            </section>

            {facility.pricePerHour > 0 && (
              <section className="detail-section payment-note">
                <span className="eyebrow">Pembayaran</span>
                <h2>Tarif transparan, dibayar setelah booking.</h2>
                <p>
                  Total {formatRupiah(facility.pricePerHour)} per jam. Setelah booking
                  dibuat, tiket menampilkan tombol pembayaran Midtrans. Check-in dibuka
                  setelah pembayaran lunas.
                </p>
              </section>
            )}

            <div className="detail-side-grid">
              <div className="info-card">
                <span className="eyebrow">Lokasi</span>
                <h3>{facility.buildingName}</h3>
                <p><MapPin size={13} /> {facility.floor}, {facility.campusName}</p>
                <p><CalendarDays size={13} /> {formatLongDate(today)}</p>
                <div className="map-sketch" aria-hidden="true">
                  <span className="map-pin"><MapPin size={13} /></span>
                  <span className="map-label">{facility.buildingCode} · {facility.campusName}</span>
                </div>
              </div>
              <div className="info-card">
                <span className="eyebrow">Pengelola</span>
                <h3>{facility.managerName ?? "Facility Team"}</h3>
                <p><UserRound size={13} /> Pengelola fasilitas</p>
                {facility.managerEmail && (
                  <a href={`mailto:${facility.managerEmail}`}>
                    <Mail size={13} /> {facility.managerEmail}
                  </a>
                )}
                <p style={{ marginTop: 15 }}>
                  <ShieldCheck size={13} />{" "}
                  {facility.requiresApproval
                    ? "Permintaan ditinjau sebelum slot dikunci."
                    : "Booking langsung dikonfirmasi dan slot langsung dikunci."}
                </p>
              </div>
            </div>
          </div>

          <BookingPanel
            facility={facility}
            initialDate={initialDate}
            initialAvailability={availability}
            week={week}
            today={today}
            signedIn={Boolean(user)}
            defaultOrganization={user?.organization ?? ""}
            loginHref={`/login?next=${encodeURIComponent(`/facilities/${facility.slug}`)}`}
          />
        </div>
      </div>
    </div>
  );
}
