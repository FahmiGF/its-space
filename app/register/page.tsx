import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, Sparkles } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Buat akun" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/dashboard");

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <img
          src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1400&q=85"
          alt="Gedung kampus dengan area terbuka"
        />
        <div className="auth-visual-content">
          <span className="auth-visual-top"><Sparkles size={14} /> Mulai dalam 30 detik</span>
          <div>
            <h2>Ruang terbaik dimulai dari <em>akses yang mudah.</em></h2>
            <div className="auth-proof">
              <div><strong>01</strong><span>Daftar akun</span></div>
              <div><strong>02</strong><span>Pilih ruang</span></div>
              <div><strong>03</strong><span>Datang & check-in</span></div>
            </div>
          </div>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-box">
          <div className="auth-head">
            <span className="eyebrow">Akun mahasiswa</span>
            <h1>Buat akun ITS Space.</h1>
            <p>
              Gunakan email aktif. Akun baru otomatis mendapat role mahasiswa dan
              dapat mengajukan booking seluruh fasilitas publik.
            </p>
          </div>
          <AuthForm mode="register" />
          <div className="auth-head" style={{ marginTop: 30, marginBottom: 0 }}>
            <p style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
              <CheckCircle2 size={14} style={{ flex: "0 0 auto", marginTop: 2 }} />
              Data akun hanya dipakai untuk operasional peminjaman fasilitas kampus.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
