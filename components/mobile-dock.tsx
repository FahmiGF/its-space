import Link from "next/link";
import { CalendarCheck2, Compass, House, UserRound } from "lucide-react";

export function MobileDock() {
  return (
    <nav className="mobile-dock" aria-label="Navigasi seluler">
      <Link href="/">
        <House size={20} />
        <span>Beranda</span>
      </Link>
      <Link href="/explore">
        <Compass size={20} />
        <span>Jelajahi</span>
      </Link>
      <Link href="/dashboard">
        <CalendarCheck2 size={20} />
        <span>Booking</span>
      </Link>
      <Link href="/login">
        <UserRound size={20} />
        <span>Akun</span>
      </Link>
    </nav>
  );
}
