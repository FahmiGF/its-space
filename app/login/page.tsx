import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck, Sparkles } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser, safeNextPath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = next ? safeNextPath(next) : "";
  const user = await getCurrentUser();
  if (user) redirect(target || (user.role === "admin" ? "/admin" : "/dashboard"));

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <img
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=85"
          alt="Suasana auditorium kampus"
        />
        <div className="auth-visual-content">
          <span className="auth-visual-top"><Sparkles size={14} /> ITS Space · Campus OS</span>
          <div>
            <h2>Satu akun untuk seluruh ruang di <em>kampus.</em></h2>
            <div className="auth-proof">
              <div><strong>11</strong><span>Fasilitas</span></div>
              <div><strong>6</strong><span>Gedung</span></div>
              <div><strong>99.9%</strong><span>Target uptime</span></div>
            </div>
          </div>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-box">
          <div className="auth-head">
            <span className="eyebrow">Selamat datang kembali</span>
            <h1>Masuk ke ruang Anda.</h1>
            <p>
              Kelola booking, lihat status persetujuan, dan akses tiket QR dari satu
              dashboard.
            </p>
          </div>
          <AuthForm mode="login" next={target || undefined} />
          <div className="auth-head" style={{ marginTop: 30, marginBottom: 0 }}>
            <p style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <ShieldCheck size={14} /> Sesi disimpan dalam cookie HttpOnly dan kata sandi
              di-hash dengan scrypt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
