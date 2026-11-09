"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";

type Mode = "login" | "register";

export function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "login"
          ? { email, password }
          : { name, email, password, organization: organization || undefined };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Terjadi kesalahan.");
      router.push(next || (data.user?.role === "admin" ? "/admin" : "/dashboard"));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  function useDemo(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
  }

  return (
    <div className="auth-form-wrap">
      <form className="auth-form" onSubmit={submit}>
        {mode === "register" && (
          <label className="field">
            <span>Nama lengkap</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              placeholder="Nama sesuai identitas kampus"
              required
              minLength={2}
            />
          </label>
        )}
        <label className="field">
          <span>Email kampus</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="nama@its-space.id"
            required
          />
        </label>
        {mode === "register" && (
          <label className="field">
            <span>Organisasi <small>opsional</small></span>
            <input
              value={organization}
              onChange={(event) => setOrganization(event.target.value)}
              placeholder="Himpunan, UKM, atau unit kerja"
              maxLength={120}
            />
          </label>
        )}
        <label className="field">
          <span>Kata sandi</span>
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder={mode === "login" ? "Kata sandi akun" : "Minimal 8 karakter, huruf dan angka"}
              required
              minLength={mode === "register" ? 8 : 1}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="button button-block" disabled={loading}>
          {loading ? <LoaderCircle size={17} className="spin" /> : <ArrowRight size={17} />}
          {loading
            ? "Memproses"
            : mode === "login"
              ? "Masuk ke ITS Space"
              : "Buat akun mahasiswa"}
        </button>
        {mode === "login" && (
          <div className="demo-logins">
            <span>Akun demo</span>
            <button
              type="button"
              onClick={() => useDemo("mahasiswa@its-space.id", "Mahasiswa#2026")}
            >
              Mahasiswa
            </button>
            <button
              type="button"
              onClick={() => useDemo("admin@its-space.id", "Admin#2026")}
            >
              Admin
            </button>
          </div>
        )}
      </form>
      <p className="auth-switch">
        {mode === "login" ? (
          <>
            Belum punya akun? <Link href="/register">Daftar sebagai mahasiswa</Link>
          </>
        ) : (
          <>
            Sudah punya akun? <Link href="/login">Masuk di sini</Link>
          </>
        )}
      </p>
    </div>
  );
}
