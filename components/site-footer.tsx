import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { SITE } from "@/lib/constants";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <Logo light />
          <p>
            Satu platform untuk menemukan, memesan, dan mengelola seluruh ruang
            serta fasilitas kampus.
          </p>
          <span className="footer-kicker">Dibangun untuk kampus yang bergerak cepat.</span>
        </div>
        <div>
          <h3>Jelajahi</h3>
          <Link href="/explore">Semua fasilitas</Link>
          <Link href="/explore?category=sports">Olahraga</Link>
          <Link href="/explore?category=auditorium">Auditorium</Link>
          <Link href="/explore?category=meeting">Ruang rapat</Link>
        </div>
        <div>
          <h3>Layanan</h3>
          <Link href="/dashboard">Booking saya</Link>
          <Link href="/settings">Pengaturan profil</Link>
          <Link href="/locations">Lokasi kampus</Link>
          <Link href="/help">Pusat bantuan</Link>
          <Link href="/tutorial">Tutorial booking</Link>
          <Link href="/emergency" className="footer-emergency">Emergency call</Link>
          <Link href="/status">Status sistem</Link>
        </div>
        <div>
          <h3>Kontak</h3>
          <a href={`mailto:${SITE.email}`}>
            <Mail size={15} /> {SITE.email}
          </a>
          <a href={`tel:${SITE.phone.replace(/\s/g, "")}`}>
            <Phone size={15} /> {SITE.phone}
          </a>
          <span>
            <MapPin size={15} /> {SITE.address}
          </span>
          <Link href="/admin" className="footer-admin">
            Portal pengelola <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} ITS Space. Prototype terintegrasi.</span>
        <span>{SITE.institution}</span>
        <span className="footer-live">
          <i /> Sistem beroperasi
        </span>
      </div>
    </footer>
  );
}
