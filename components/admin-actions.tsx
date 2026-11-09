"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  LoaderCircle,
  QrCode,
  ShieldAlert,
  X,
} from "lucide-react";
import type { Booking, FacilityStatus } from "@/lib/types";
import { formatDate, formatRange } from "@/lib/time";
import { BookingBadge } from "./status-badge";

export function AdminQueue({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  async function act(id: string, action: "approve" | "reject") {
    setBusy(id);
    setError("");
    try {
      const response = await fetch(`/api/admin/bookings/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: action === "reject" ? JSON.stringify({ reason }) : undefined,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Aksi gagal.");
      setRejecting(null);
      setReason("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Aksi gagal.");
    } finally {
      setBusy(null);
    }
  }

  if (!bookings.length) {
    return (
      <div className="empty-inline">
        <CheckCircle2 size={22} />
        <div>
          <strong>Tidak ada antrean.</strong>
          <p>Semua permintaan booking sudah diproses.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-queue">
      {error && <p className="form-error">{error}</p>}
      {bookings.map((booking) => (
        <article key={booking.id} className="queue-item">
          <div className="queue-date">
            <span>{formatDate(booking.startsAt).split(" ")[1]?.replace(".", "")}</span>
            <strong>{new Date(booking.startsAt).getDate()}</strong>
            <small>{new Date(booking.startsAt).toLocaleDateString("id-ID", { month: "short" })}</small>
          </div>
          <div className="queue-main">
            <div className="queue-top">
              <span>{booking.facility.name}</span>
              <BookingBadge status={booking.status} />
            </div>
            <h4>{booking.purpose}</h4>
            <p>
              {booking.user?.name} · {booking.organization || booking.user?.organization || "Pribadi"}
            </p>
            <div className="queue-meta">
              <span>{formatRange(booking.startsAt, booking.endsAt)}</span>
              <span>{booking.attendees} peserta</span>
              <span>{booking.reference}</span>
            </div>
            {rejecting === booking.id && (
              <div className="reject-box">
                <input
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Alasan penolakan untuk pemohon"
                  maxLength={300}
                />
                <button
                  type="button"
                  className="button button-danger button-small"
                  disabled={reason.trim().length < 5 || busy === booking.id}
                  onClick={() => void act(booking.id, "reject")}
                >
                  Kirim penolakan
                </button>
              </div>
            )}
          </div>
          <div className="queue-actions">
            <button
              type="button"
              className="button button-small"
              disabled={busy === booking.id}
              onClick={() => void act(booking.id, "approve")}
            >
              {busy === booking.id ? <LoaderCircle size={15} className="spin" /> : <Check size={15} />}
              Setujui
            </button>
            <button
              type="button"
              className="icon-button subtle"
              aria-label="Tolak booking"
              onClick={() => setRejecting(rejecting === booking.id ? null : booking.id)}
            >
              <X size={17} />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

export function AdminCheckin({ initialToken = "" }: { initialToken?: string }) {
  const router = useRouter();
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Booking | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Check-in gagal.");
      setResult(data.booking);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Check-in gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="checkin-card">
      <div className="checkin-head">
        <span className="panel-icon">
          <QrCode size={19} />
        </span>
        <div>
          <span className="eyebrow">Security desk</span>
          <h3>Check-in tiket</h3>
        </div>
      </div>
      <p>Pindai QR dari halaman tiket, atau tempel token yang tertera di URL QR.</p>
      <form onSubmit={submit}>
        <textarea
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Tempel token QR di sini"
          rows={2}
          required
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="button button-dark button-block" disabled={loading}>
          {loading ? <LoaderCircle size={16} className="spin" /> : <QrCode size={16} />}
          {loading ? "Memverifikasi" : "Verifikasi check-in"}
        </button>
      </form>
      {result && (
        <div className="checkin-success">
          <CheckCircle2 size={20} />
          <div>
            <strong>{result.user?.name ?? "Pemesan"}</strong>
            <p>
              {result.facility.name} · {formatRange(result.startsAt, result.endsAt)}
            </p>
            <small>{result.reference} · {result.status}</small>
          </div>
        </div>
      )}
    </div>
  );
}

export function FacilityStatusControl({
  facility,
}: {
  facility: { id: string; name: string; status: FacilityStatus; buildingName: string };
}) {
  const router = useRouter();
  const [status, setStatus] = useState<FacilityStatus>(facility.status);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/facilities/${facility.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Gagal menyimpan.");
      setMessage("Tersimpan");
      router.refresh();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Gagal menyimpan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="facility-status-row">
      <div>
        <strong>{facility.name}</strong>
        <small>{facility.buildingName}</small>
      </div>
      <select value={status} onChange={(event) => setStatus(event.target.value as FacilityStatus)}>
        <option value="active">Aktif</option>
        <option value="maintenance">Pemeliharaan</option>
        <option value="closed">Ditutup</option>
      </select>
      <button
        type="button"
        className="button button-ghost button-small"
        onClick={save}
        disabled={loading || status === facility.status}
      >
        {loading ? <LoaderCircle size={14} className="spin" /> : <ShieldAlert size={14} />}
        Simpan
      </button>
      {message && <small className="save-message">{message}</small>}
    </div>
  );
}

export function CancelBooking({ id, compact = false }: { id: string; compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function cancel() {
    if (!window.confirm("Batalkan booking ini? Slot akan dibuka kembali untuk pengguna lain.")) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Gagal membatalkan.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal membatalkan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="cancel-wrap">
      <button
        type="button"
        className={compact ? "text-button danger-text" : "button button-ghost button-small"}
        onClick={cancel}
        disabled={loading}
      >
        {loading ? "Membatalkan…" : "Batalkan"}
      </button>
      {error && <small className="inline-error">{error}</small>}
    </span>
  );
}

export function MarkNotificationsRead({ unread }: { unread: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  if (!unread) return null;

  return (
    <button
      type="button"
      className="text-button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await fetch("/api/notifications/read", { method: "POST" });
        router.refresh();
        setLoading(false);
      }}
    >
      {loading ? "Menandai…" : `Tandai ${unread} dibaca`}
    </button>
  );
}
