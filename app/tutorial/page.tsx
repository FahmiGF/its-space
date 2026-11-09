import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Compass, CreditCard, QrCode, Search, Ticket } from "lucide-react";
import { TUTORIAL_STEPS } from "@/lib/support";

export const metadata: Metadata = {
  title: "Tutorial booking",
  description: "Panduan lima langkah memesan fasilitas kampus di ITS Space.",
};

const STEP_ICONS = [Search, Compass, Ticket, CreditCard, QrCode];

export default function TutorialPage() {
  return (
    <div className="tutorial-page">
      <section className="page-hero tutorial-hero">
        <div className="container page-hero-inner">
          <div>
            <div className="breadcrumb">
              <Link href="/">Beranda</Link><span>/</span><Link href="/help">Bantuan</Link><span>/</span><span>Tutorial</span>
            </div>
            <span className="eyebrow">Panduan penggunaan</span>
            <h1>Dari ide menjadi <em>jadwal.</em></h1>
            <p>Ikuti alur singkat ini agar booking Anda disetujui dan siap dipakai tanpa bolak-balik.</p>
          </div>
          <Link href="/explore" className="button">Mulai jelajahi <ArrowRight size={16} /></Link>
        </div>
      </section>

      <div className="container tutorial-layout">
        <div className="tutorial-intro">
          <span className="eyebrow">Alur booking</span>
          <h2>Lima langkah, satu slot yang pasti.</h2>
          <p>
            Setiap langkah terhubung ke data asli. Tidak ada ketersediaan palsu di
            frontend: PostgreSQL yang memutuskan slot terakhir.
          </p>
          <div className="tutorial-callout">
            <CheckCircle2 size={17} />
            <span><strong>Tips:</strong> siapkan tujuan kegiatan dan jumlah peserta sebelum mulai. Prosesnya bisa selesai dalam dua menit.</span>
          </div>
        </div>

        <div className="tutorial-steps">
          {TUTORIAL_STEPS.map((step, index) => {
            const Icon = STEP_ICONS[index] ?? CheckCircle2;
            return (
              <article className="tutorial-step" key={step.number}>
                <div className="tutorial-step-number">{step.number}</div>
                <div className="tutorial-step-icon"><Icon size={18} /></div>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                  <small>{step.tip}</small>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="container tutorial-footer">
        <div>
          <span className="eyebrow">Butuh jawaban cepat?</span>
          <h3>FAQ kami menjawab pertanyaan teknis.</h3>
        </div>
        <div className="tutorial-footer-actions">
          <Link href="/help" className="button button-ghost button-small">Buka FAQ <ArrowRight size={14} /></Link>
          <Link href="/explore" className="button button-small">Cari fasilitas <Search size={14} /></Link>
        </div>
      </div>
    </div>
  );
}
