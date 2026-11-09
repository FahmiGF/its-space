import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container not-found">
      <div>
        <span className="eyebrow">404 · Ruang tidak ditemukan</span>
        <h1>Nyasar?</h1>
        <p>Halaman atau fasilitas yang Anda cari sudah dipindahkan atau tidak ada.</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" className="button button-ghost"><ArrowLeft size={15} /> Beranda</Link>
          <Link href="/explore" className="button"><Compass size={15} /> Jelajahi fasilitas</Link>
        </div>
      </div>
    </div>
  );
}
