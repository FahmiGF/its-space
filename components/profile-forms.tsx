"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, KeyRound, LoaderCircle, Save, UserRound } from "lucide-react";
import type { UserProfile } from "@/lib/types";

export function ProfileForms({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const [name, setName] = useState(profile.name);
  const [organization, setOrganization] = useState(profile.organization ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [notifyBooking, setNotifyBooking] = useState(profile.notifyBooking);
  const [notifyReminders, setNotifyReminders] = useState(profile.notifyReminders);
  const [notifyAnnouncements, setNotifyAnnouncements] = useState(profile.notifyAnnouncements);
  const [profileState, setProfileState] = useState<"idle" | "saving" | "saved">("idle");
  const [profileError, setProfileError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordState, setPasswordState] = useState<"idle" | "saving" | "saved">("idle");
  const [passwordError, setPasswordError] = useState("");

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setProfileState("saving");
    setProfileError("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          organization,
          phone,
          notifyBooking,
          notifyReminders,
          notifyAnnouncements,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Profil gagal disimpan.");
      setProfileState("saved");
      router.refresh();
    } catch (caught) {
      setProfileState("idle");
      setProfileError(caught instanceof Error ? caught.message : "Profil gagal disimpan.");
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordState("saving");
    setPasswordError("");
    try {
      const response = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Kata sandi gagal diubah.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordState("saved");
      router.refresh();
    } catch (caught) {
      setPasswordState("idle");
      setPasswordError(caught instanceof Error ? caught.message : "Kata sandi gagal diubah.");
    }
  }

  return (
    <div className="settings-grid">
      <form className="panel settings-form" onSubmit={saveProfile}>
        <div className="panel-head">
          <div>
            <span className="eyebrow">Identitas</span>
            <h2>Profil dan kontak</h2>
          </div>
          <UserRound size={18} className="muted" />
        </div>
        <div className="field-row">
          <label className="field">
            <span>Nama lengkap</span>
            <input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={100} required />
          </label>
          <label className="field">
            <span>Email kampus</span>
            <input value={profile.email} readOnly aria-readonly="true" />
            <small className="field-hint">Email tidak dapat diubah dari halaman ini.</small>
          </label>
        </div>
        <div className="field-row">
          <label className="field">
            <span>Organisasi / program studi</span>
            <input
              value={organization}
              onChange={(event) => setOrganization(event.target.value)}
              placeholder="Contoh: Teknik Informatika 2024"
              maxLength={120}
            />
          </label>
          <label className="field">
            <span>Nomor WhatsApp</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="08xxxxxxxxxx"
              maxLength={30}
              inputMode="tel"
            />
          </label>
        </div>

        <div className="settings-subhead">
          <span className="eyebrow">Preferensi</span>
          <p>Atur notifikasi in-app yang ingin Anda terima.</p>
        </div>
        <div className="toggle-list">
          <label className="toggle-row">
            <span>
              <strong>Status booking</strong>
              <small>Perubahan persetujuan, pembayaran, dan check-in.</small>
            </span>
            <input type="checkbox" checked={notifyBooking} onChange={(event) => setNotifyBooking(event.target.checked)} />
          </label>
          <label className="toggle-row">
            <span>
              <strong>Pengingat jadwal</strong>
              <small>Pengingat sebelum waktu penggunaan dimulai.</small>
            </span>
            <input type="checkbox" checked={notifyReminders} onChange={(event) => setNotifyReminders(event.target.checked)} />
          </label>
          <label className="toggle-row">
            <span>
              <strong>Info fasilitas</strong>
              <small>Perawatan, fasilitas baru, dan pengumuman kampus.</small>
            </span>
            <input type="checkbox" checked={notifyAnnouncements} onChange={(event) => setNotifyAnnouncements(event.target.checked)} />
          </label>
        </div>
        {profileError && <p className="form-error" role="alert">{profileError}</p>}
        {profileState === "saved" && (
          <p className="form-success" role="status"><CheckCircle2 size={14} /> Profil tersimpan.</p>
        )}
        <button className="button" type="submit" disabled={profileState === "saving"}>
          {profileState === "saving" ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}
          {profileState === "saving" ? "Menyimpan…" : "Simpan profil"}
        </button>
      </form>

      <form className="panel settings-form" onSubmit={savePassword}>
        <div className="panel-head">
          <div>
            <span className="eyebrow">Keamanan</span>
            <h2>Ganti kata sandi</h2>
          </div>
          <KeyRound size={18} className="muted" />
        </div>
        <p className="small muted">
          Gunakan minimal 8 karakter dengan kombinasi huruf dan angka. Semua sesi lain
          akan diakhiri setelah kata sandi berubah.
        </p>
        <label className="field">
          <span>Kata sandi saat ini</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <label className="field">
          <span>Kata sandi baru</span>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label className="field">
          <span>Ulangi kata sandi baru</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        {passwordError && <p className="form-error" role="alert">{passwordError}</p>}
        {passwordState === "saved" && (
          <p className="form-success" role="status"><CheckCircle2 size={14} /> Kata sandi diperbarui dan sesi dirotasi.</p>
        )}
        <button className="button button-dark" type="submit" disabled={passwordState === "saving"}>
          {passwordState === "saving" ? <LoaderCircle size={16} className="spin" /> : <KeyRound size={16} />}
          {passwordState === "saving" ? "Memproses…" : "Perbarui kata sandi"}
        </button>
      </form>
    </div>
  );
}
