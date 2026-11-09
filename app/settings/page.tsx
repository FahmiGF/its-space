import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, ShieldCheck } from "lucide-react";
import { ProfileForms } from "@/components/profile-forms";
import { requireUser } from "@/lib/auth";
import { getUserProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Pengaturan profil" };

export default async function SettingsPage() {
  const user = await requireUser("/settings");
  const profile = await getUserProfile(user.id);
  if (!profile) notFound();

  return (
    <div className="settings-page">
      <div className="container">
        <div className="breadcrumb">
          <Link href="/dashboard">Dashboard</Link>
          <span>/</span>
          <span>Pengaturan profil</span>
        </div>
        <div className="page-heading-row">
          <div>
            <span className="eyebrow">Akun Anda</span>
            <h1>Profil dan <em>preferensi.</em></h1>
            <p className="page-lead">
              Perbarui identitas, kontak, dan cara kami mengingatkan jadwal Anda.
              Email kampus tetap menjadi identitas utama akun.
            </p>
          </div>
          <Link href="/dashboard" className="section-link">
            <ArrowLeft size={14} /> Kembali ke dashboard
          </Link>
        </div>

        <div className="settings-banner">
          <span className="settings-avatar">
            {profile.name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
          </span>
          <div>
            <strong>{profile.name}</strong>
            <span>{profile.email}</span>
          </div>
          <span className="settings-role">
            <BadgeCheck size={14} /> {profile.role === "admin" ? "Administrator" : profile.role === "staff" ? "Staff" : "Mahasiswa"}
          </span>
          <span className="settings-security-note"><ShieldCheck size={14} /> Sesi terenkripsi</span>
        </div>

        <ProfileForms profile={profile} />
      </div>
    </div>
  );
}
