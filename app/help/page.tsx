import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CircleHelp, LifeBuoy, MessageCircle, PhoneCall } from "lucide-react";
import { FAQ_GROUPS } from "@/lib/support";

export const metadata: Metadata = {
  title: "Pusat bantuan",
  description: "Jawaban seputar booking, pembayaran, check-in, dan keamanan akun ITS Space.",
};

export default function HelpPage() {
  return (
    <div className="support-page">
      <section className="page-hero support-hero">
        <div className="container page-hero-inner">
          <div>
            <div className="breadcrumb">
              <Link href="/">Beranda</Link><span>/</span><span>Bantuan</span>
            </div>
            <span className="eyebrow">Pusat bantuan</span>
            <h1>Ada yang bisa kami <em>bantu?</em></h1>
            <p>Cari jawaban cepat, ikuti tutorial, atau hubungi tim kampus saat Anda membutuhkan manusia.</p>
          </div>
          <CircleHelp size={70} strokeWidth={1} className="support-hero-icon" />
        </div>
      </section>

      <div className="container support-layout">
        <aside className="support-side">
          <span className="eyebrow">Mulai dari sini</span>
          <Link href="/tutorial" className="support-side-link">
            <BookOpen size={16} /><span><strong>Tutorial booking</strong><small>Lima langkah dari cari ruang sampai check-in.</small></span>
          </Link>
          <Link href="/emergency" className="support-side-link support-side-emergency">
            <PhoneCall size={16} /><span><strong>Emergency call</strong><small>Nomor penting dan langkah darurat.</small></span>
          </Link>
          <Link href="/locations" className="support-side-link">
            <LifeBuoy size={16} /><span><strong>Lokasi kampus</strong><small>Temukan gedung dan fasilitas terdekat.</small></span>
          </Link>
          <div className="support-side-note">
            <MessageCircle size={16} />
            <p>Belum menemukan jawaban? Email <a href="mailto:space@its.ac.id">space@its.ac.id</a> dengan referensi booking Anda.</p>
          </div>
        </aside>

        <main className="support-main">
          <div className="support-main-head">
            <div>
              <span className="eyebrow">FAQ</span>
              <h2>Pertanyaan yang sering muncul.</h2>
            </div>
            <Link href="/tutorial" className="section-link">Buka tutorial <ArrowRight size={14} /></Link>
          </div>
          {FAQ_GROUPS.map((group) => (
            <section className="faq-group" key={group.title}>
              <div className="faq-group-head">
                <h3>{group.title}</h3>
                <p>{group.intro}</p>
              </div>
              <div className="faq-list">
                {group.items.map((item) => (
                  <details className="faq-item" key={item.question}>
                    <summary>{item.question}<span>+</span></summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
          <div className="support-cta">
            <div>
              <span className="eyebrow">Masih butuh bantuan?</span>
              <h3>Tim fasilitas siap membantu.</h3>
              <p>Hubungi operator kampus pada jam kerja, atau gunakan emergency call untuk situasi mendesak.</p>
            </div>
            <Link href="/emergency" className="button button-small">Nomor darurat <PhoneCall size={14} /></Link>
          </div>
        </main>
      </div>
    </div>
  );
}
