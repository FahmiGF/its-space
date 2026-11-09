import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/fraunces";
import "./globals.css";
import "./components.css";
import "./pages.css";
import "./responsive.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileDock } from "@/components/mobile-dock";

export const metadata: Metadata = {
  title: {
    default: "ITS Space — Integrated Facility Booking",
    template: "%s · ITS Space",
  },
  description:
    "Platform terintegrasi untuk mencari, memesan, dan mengelola ruang serta fasilitas kampus ITS. Ketersediaan langsung, approval terpusat, dan anti double-booking.",
  applicationName: "ITS Space",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "ITS Space — Find your space.",
    description:
      "Satu platform untuk seluruh ruang dan fasilitas kampus. Cari, pesan, kelola.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#10201b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <a href="#main" className="skip-link">
          Lewati ke konten
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <MobileDock />
      </body>
    </html>
  );
}
