import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, MapPin, PhoneCall, ShieldCheck } from "lucide-react";
import { EMERGENCY_CONTACTS } from "@/lib/support";

export const metadata: Metadata = {
  title: "Emergency call",
  description: "Nomor darurat kampus dan langkah awal saat terjadi keadaan darurat di ITS.",
};

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export default function EmergencyPage() {
  return (
    <div className="emergency-page">
      <section className="emergency-hero">
        <div className="container emergency-hero-inner">
          <div>
            <div className="breadcrumb"><Link href="/">Beranda</Link><span>/</span><Link href="/help">Bantuan</Link><span>/</span><span>Emergency</span></div>
            <span className="eyebrow"><span className="emergency-live-dot" /> Bantuan mendesak</span>
            <h1>Tetap tenang.<br /><em>Minta bantuan.</em></h1>
            <p>Jika ada bahaya medis, kebakaran, atau keselamatan, hubungi layanan darurat terlebih dahulu. Jangan menunggu balasan chat.</p>
          </div>
          <div className="emergency-hero-mark"><PhoneCall size={88} strokeWidth={1} /></div>
        </div>
      </section>

      <div className="container emergency-content">
        <section>
          <div className="emergency-section-head">
            <div>
              <span className="eyebrow">Satu ketuk</span>
              <h2>Nomor yang perlu dihubungi.</h2>
            </div>
            <span className="emergency-warning"><AlertTriangle size={14} /> Gunakan hanya untuk keadaan darurat</span>
          </div>
          <div className="emergency-grid">
            {EMERGENCY_CONTACTS.map((contact) => (
              <a className={`emergency-card emergency-${contact.tone}`} href={telHref(contact.phone)} key={contact.phone}>
                <span className="emergency-card-icon"><PhoneCall size={20} /></span>
                <span className="emergency-card-copy">
                  <strong>{contact.label}</strong>
                  <small>{contact.detail}</small>
                  <b>{contact.phone}</b>
                </span>
                <ArrowRight size={17} />
              </a>
            ))}
          </div>
        </section>

        <div className="emergency-lower">
          <section className="emergency-steps">
            <span className="eyebrow">Langkah awal</span>
            <h2>Lakukan ini saat di lokasi.</h2>
            <ol>
              <li><b>Pastikan area aman.</b> Menjauh dari sumber bahaya, namun jangan memindahkan korban kecuali ada risiko langsung.</li>
              <li><b>Hubungi nomor darurat.</b> Sebutkan lokasi persis: nama gedung, lantai, dan fasilitas terdekat.</li>
              <li><b>Informasikan kondisi.</b> Jelaskan jumlah korban, jenis kejadian, dan akses masuk yang paling cepat.</li>
              <li><b>Ikuti arahan petugas.</b> Tetap di dekat lokasi jika aman agar bisa mengarahkan tim penyelamat.</li>
            </ol>
          </section>
          <aside className="emergency-aside">
            <span className="eyebrow">Lokasi kampus</span>
            <h3>Kampus Sukolilo</h3>
            <p><MapPin size={14} /> Jl. Raya ITS, Keputih, Surabaya</p>
            <p><ShieldCheck size={14} /> Security kampus dapat dihubungi melalui operator.</p>
            <Link href="/locations" className="text-button">Lihat peta gedung <ArrowRight size={13} /></Link>
            <Link href="/help" className="text-button"><ArrowLeft size={13} /> Kembali ke pusat bantuan</Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
