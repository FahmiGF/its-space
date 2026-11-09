import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, MapPin, Navigation, Sparkles } from "lucide-react";
import { CATEGORY_META } from "@/lib/constants";
import { getCampusLocations, getFacilities } from "@/lib/facilities";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lokasi kampus",
  description: "Peta gedung dan fasilitas yang dapat dipesan di Kampus ITS Sukolilo.",
};

export default async function LocationsPage() {
  const [locations, facilities] = await Promise.all([getCampusLocations(), getFacilities()]);
  const byBuilding = new Map<string, typeof facilities>();
  for (const facility of facilities) {
    const list = byBuilding.get(facility.buildingCode) ?? [];
    list.push(facility);
    byBuilding.set(facility.buildingCode, list);
  }

  return (
    <div className="locations-page">
      <section className="page-hero">
        <div className="container page-hero-inner">
          <div>
            <div className="breadcrumb"><Link href="/">Beranda</Link><span>/</span><span>Lokasi</span></div>
            <span className="eyebrow">Peta kampus</span>
            <h1>Temukan gedung,<br /><em>lalu masuk.</em></h1>
            <p>{locations.length} gedung dan {facilities.length} fasilitas aktif di Kampus Sukolilo. Pilih titik untuk melihat ruang yang bisa dipesan.</p>
          </div>
          <Link href="/explore" className="button">Cari fasilitas <ArrowRight size={16} /></Link>
        </div>
      </section>

      <div className="container locations-layout">
        <section className="campus-map-card">
          <div className="campus-map-head">
            <div>
              <span className="eyebrow">Kampus Sukolilo</span>
              <h2>Peta fasilitas.</h2>
            </div>
            <span className="campus-map-legend"><i /> Gedung aktif</span>
          </div>
          <div className="campus-map">
            <span className="campus-map-road campus-map-road-a" />
            <span className="campus-map-road campus-map-road-b" />
            <span className="campus-map-green campus-map-green-a" />
            <span className="campus-map-green campus-map-green-b" />
            {locations.map((location) => (
              <Link
                key={location.code}
                href={`/explore?building=${location.code}`}
                className="campus-map-pin"
                style={{ left: `${location.mapX}%`, top: `${location.mapY}%` }}
                title={`${location.name} · ${location.count} fasilitas`}
              >
                <span><Building2 size={13} /></span>
                <small>{location.code}</small>
              </Link>
            ))}
            <span className="campus-map-label"><Navigation size={13} /> Kampus ITS · Surabaya</span>
          </div>
        </section>

        <section className="location-list">
          <div className="location-list-head">
            <div>
              <span className="eyebrow">Direktori</span>
              <h2>Gedung dan ruang.</h2>
            </div>
            <span className="small muted">{facilities.length} fasilitas</span>
          </div>
          {locations.map((location) => {
            const rooms = byBuilding.get(location.code) ?? [];
            return (
              <article className="location-card" key={location.code}>
                <div className="location-card-head">
                  <span className="location-code"><MapPin size={13} /> {location.code}</span>
                  <div>
                    <h3>{location.name}</h3>
                    <p>{location.count} fasilitas aktif</p>
                  </div>
                  <Link href={`/explore?building=${location.code}`} className="icon-button" aria-label={`Lihat ${location.name}`}>
                    <ArrowRight size={15} />
                  </Link>
                </div>
                <div className="location-room-list">
                  {rooms.slice(0, 5).map((room) => (
                    <Link href={`/facilities/${room.slug}`} key={room.id}>
                      <span><Sparkles size={11} /> {room.name}</span>
                      <small>{CATEGORY_META[room.category].label} · {room.capacity} orang</small>
                    </Link>
                  ))}
                  {rooms.length === 0 && <span className="muted small">Belum ada fasilitas aktif.</span>}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
