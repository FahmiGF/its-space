import Link from "next/link";
import {
  ArrowUpRight,
  CircleHelp,
  LayoutDashboard,
  MapPin,
  Menu,
  PhoneCall,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "./logo";
import { LogoutButton } from "./logout-button";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo />
        <nav className="desktop-nav" aria-label="Navigasi utama">
          <Link href="/explore">Jelajahi</Link>
          <Link href="/locations">Lokasi</Link>
          <Link href="/help">Bantuan</Link>
          <Link href="/status">Status</Link>
          {user && <Link href="/dashboard">Booking saya</Link>}
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              {user.role === "admin" && (
                <Link href="/admin" className="header-admin">
                  <ShieldCheck size={16} />
                  Admin
                </Link>
              )}
              <Link href="/settings" className="header-settings" aria-label="Pengaturan profil">
                <Settings size={17} />
              </Link>
              <Link href="/dashboard" className="user-chip" aria-label="Buka dashboard">
                <span className="avatar">{initials(user.name)}</span>
                <span className="user-chip-copy">
                  <strong>{user.name.split(" ")[0]}</strong>
                  <small>{user.role === "admin" ? "Administrator" : "Mahasiswa"}</small>
                </span>
              </Link>
              <span className="logout-form">
                <LogoutButton />
              </span>
            </>
          ) : (
            <>
              <Link href="/login" className="text-button">
                Masuk
              </Link>
              <Link href="/register" className="button button-small">
                Mulai booking
                <ArrowUpRight size={15} />
              </Link>
            </>
          )}
          <details className="mobile-menu">
            <summary className="icon-button" aria-label="Buka menu">
              <Menu size={21} />
            </summary>
            <div className="mobile-menu-panel">
              <Link href="/explore">Jelajahi fasilitas</Link>
              <Link href="/locations"><MapPin size={16} /> Lokasi kampus</Link>
              <Link href="/#cara-kerja">Cara kerja</Link>
              <Link href="/status">Status sistem</Link>
              <Link href="/help"><CircleHelp size={16} /> Bantuan & FAQ</Link>
              <Link href="/emergency"><PhoneCall size={16} /> Emergency call</Link>
              {user ? (
                <>
                  <Link href="/dashboard">
                    <LayoutDashboard size={16} /> Booking saya
                  </Link>
                  <Link href="/settings">
                    <Settings size={16} /> Pengaturan profil
                  </Link>
                  {user.role === "admin" && (
                    <Link href="/admin">
                      <ShieldCheck size={16} /> Admin
                    </Link>
                  )}
                  <LogoutButton withLabel className="mobile-menu-action" />
                </>
              ) : (
                <Link href="/login">
                  <UserRound size={16} /> Masuk
                </Link>
              )}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
