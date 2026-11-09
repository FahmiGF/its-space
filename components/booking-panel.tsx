"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  Users,
} from "lucide-react";
import { BOOKING_STATUS_META } from "@/lib/constants";
import type { AvailabilityBooking, AvailabilityDay, Facility } from "@/lib/types";
import {
  addDays,
  dayNumber,
  formatDate,
  formatTime,
  minutesFromTime,
  monthShort,
  timeFromMinutes,
  timeOptions,
} from "@/lib/time";

type Availability = {
  bookings: AvailabilityBooking[];
  openings: string;
  closings: string;
};

type Success = {
  id: string;
  reference: string;
  status: string;
};

export function BookingPanel({
  facility,
  initialDate,
  initialAvailability,
  week,
  today,
  signedIn,
  loginHref,
}: {
  facility: Facility;
  initialDate: string;
  initialAvailability: Availability;
  week: AvailabilityDay[];
  today: string;
  signedIn: boolean;
  loginHref: string;
}) {
  const [date, setDate] = useState(initialDate);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("11:00");
  const [attendees, setAttendees] = useState(Math.min(10, facility.capacity));
  const [purpose, setPurpose] = useState("");
  const [organization, setOrganization] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [agreement, setAgreement] = useState(false);
  const [availability, setAvailability] = useState(initialAvailability);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<Success | null>(null);

  const startOptions = useMemo(
    () => timeOptions(facility.opensAt, facility.closesAt).slice(0, -1),
    [facility.opensAt, facility.closesAt],
  );
  const endOptions = useMemo(() => timeOptions(facility.opensAt, facility.closesAt), [facility.opensAt, facility.closesAt]);

  useEffect(() => {
    let active = true;
    setLoadingAvailability(true);
    fetch(`/api/facilities/${facility.slug}/availability?date=${date}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Gagal memuat jadwal.");
        if (active) setAvailability(data);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : "Gagal memuat jadwal.");
      })
      .finally(() => {
        if (active) setLoadingAvailability(false);
      });
    return () => {
      active = false;
    };
  }, [date, facility.slug]);

  const blockedSlots = useMemo(() => {
    const open = minutesFromTime(availability.openings);
    const close = minutesFromTime(availability.closings);
    const result: Array<{ time: string; blocked: boolean; status?: string }> = [];
    for (let value = open; value < close; value += 60) {
      const slotStart = new Date(`${date}T${timeFromMinutes(value)}:00+07:00`).getTime();
      const slotEnd = slotStart + 60 * 60000;
      const booking = availability.bookings.find((item) => {
        const bookingStart = new Date(item.startsAt).getTime();
        const bookingEnd = new Date(item.endsAt).getTime();
        return bookingStart < slotEnd && bookingEnd > slotStart;
      });
      result.push({
        time: timeFromMinutes(value),
        blocked: Boolean(booking),
        status: booking?.status,
      });
    }
    return result;
  }, [availability, date]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(null);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facilitySlug: facility.slug,
          date,
          start,
          end,
          attendees,
          purpose,
          organization,
          contactPhone,
          agreement,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.code === "SLOT_CONFLICT"
            ? "Slot ini baru saja diambil orang lain. Jadwal sudah diperbarui—pilih jam lain."
            : data.error ?? "Booking gagal.",
        );
      }
      setSuccess({
        id: data.booking.id,
        reference: data.booking.reference,
        status: data.booking.status,
      });
      setPurpose("");
      setAgreement(false);
      const refreshed = await fetch(`/api/facilities/${facility.slug}/availability?date=${date}`, {
        cache: "no-store",
      }).then((result) => (result.ok ? result.json() : null));
      if (refreshed) setAvailability(refreshed);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Booking gagal.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!signedIn) {
    return (
      <div className="booking-panel booking-locked">
        <span className="panel-icon">
          <LockKeyhole size={20} />
        </span>
        <span className="eyebrow">Booking</span>
        <h3>Masuk untuk memesan ruang ini.</h3>
        <p>
          Cek ketersediaan terbuka untuk semua orang. Untuk membuat booking dan
          menerima tiket QR, masuk dengan akun kampus.
        </p>
        <Link href={loginHref} className="button button-block">
          Masuk dan lanjutkan <ArrowRight size={16} />
        </Link>
        <small>Belum punya akun? <Link href="/register">Daftar gratis</Link></small>
      </div>
    );
  }

  return (
    <div className="booking-panel">
      <div className="booking-panel-head">
        <div>
          <span className="eyebrow">Booking langsung</span>
          <h3>Pilih waktu Anda</h3>
        </div>
        {facility.requiresApproval ? (
          <span className="approval-note">
            <ShieldCheck size={14} /> Perlu persetujuan
          </span>
        ) : (
          <span className="approval-note instant">
            <CheckCircle2 size={14} /> Instan
          </span>
        )}
      </div>

      <div className="week-picker" aria-label="Ketersediaan tujuh hari">
        {week.map((day) => (
          <button
            key={day.date}
            type="button"
            className={day.date === date ? "active" : ""}
            onClick={() => setDate(day.date)}
            disabled={day.isClosed}
          >
            <span>{day.weekday}</span>
            <strong>{dayNumber(day.date)}</strong>
            <small>{day.isClosed ? "Tutup" : `${day.freeSlots} slot`}</small>
          </button>
        ))}
      </div>

      <div className="availability-strip-wrap">
        <div className="availability-title">
          <span>
            <CalendarDays size={14} /> {formatDate(date)}
          </span>
          <span className="availability-legend">
            <i /> Terisi
            <i className="free" /> Kosong
          </span>
        </div>
        <div className="availability-strip">
          {blockedSlots.map((slot) => (
            <span
              key={slot.time}
              className={slot.blocked ? "blocked" : ""}
              title={`${slot.time} ${slot.blocked ? "terisi" : "tersedia"}`}
            >
              {slot.time.slice(0, 2)}
            </span>
          ))}
          {loadingAvailability && <span className="strip-loading">Memuat…</span>}
        </div>
        <div className="availability-meta">
          <span>
            <Clock3 size={13} /> {availability.openings}–{availability.closings} WIB
          </span>
          <span>
            <Users size={13} /> Maks. {facility.capacity} orang
          </span>
          <span>Buffer 15 menit</span>
        </div>
      </div>

      {success ? (
        <div className="booking-success" aria-live="polite">
          <span className="success-icon">
            <CheckCircle2 size={24} />
          </span>
          <div>
            <strong>
              {success.status === "pending" ? "Permintaan terkirim." : "Booking dikonfirmasi."}
            </strong>
            <p>
              Referensi <b>{success.reference}</b>.{" "}
              {success.status === "pending"
                ? "Pengelola fasilitas akan meninjau permintaan Anda."
                : "Tiket dan QR check-in sudah tersedia."}
            </p>
            <div className="success-actions">
              <Link href={`/bookings/${success.id}`} className="button button-small">
                Buka tiket <ArrowRight size={14} />
              </Link>
              <button
                type="button"
                className="text-button"
                onClick={() => setSuccess(null)}
              >
                Booking lagi
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form className="booking-form" onSubmit={submit}>
          <div className="field-row">
            <label className="field">
              <span>Tanggal</span>
              <input
                type="date"
                value={date}
                min={today}
                max={addDays(today, 90)}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Peserta</span>
              <input
                type="number"
                min={1}
                max={facility.capacity}
                value={attendees}
                onChange={(event) => setAttendees(Number(event.target.value))}
                required
              />
            </label>
          </div>
          <div className="field-row">
            <label className="field">
              <span>Mulai</span>
              <select value={start} onChange={(event) => setStart(event.target.value)}>
                {startOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Selesai</span>
              <select value={end} onChange={(event) => setEnd(event.target.value)}>
                {endOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            <span>Tujuan penggunaan</span>
            <textarea
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              placeholder="Jelaskan kegiatan, jumlah peserta, dan kebutuhan teknis."
              minLength={10}
              maxLength={500}
              rows={3}
              required
            />
          </label>
          <div className="field-row">
            <label className="field">
              <span>Organisasi <small>opsional</small></span>
              <input
                value={organization}
                onChange={(event) => setOrganization(event.target.value)}
                placeholder="Nama UKM / unit"
                maxLength={120}
              />
            </label>
            <label className="field">
              <span>WhatsApp <small>opsional</small></span>
              <input
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                placeholder="08xxxxxxxxxx"
                maxLength={30}
              />
            </label>
          </div>
          <label className="check-field">
            <input
              type="checkbox"
              checked={agreement}
              onChange={(event) => setAgreement(event.target.checked)}
              required
            />
            <span>
              Saya menyetujui aturan penggunaan dan bertanggung jawab atas kondisi
              fasilitas setelah digunakan.
            </span>
          </label>
          {error && <p className="form-error">{error}</p>}
          <button
            type="submit"
            className="button button-block"
            disabled={submitting || facility.status !== "active"}
          >
            {submitting ? <LoaderCircle size={17} className="spin" /> : <ArrowRight size={17} />}
            {submitting
              ? "Mengamankan slot"
              : facility.status !== "active"
                ? "Fasilitas sedang tidak tersedia"
                : "Ajukan booking"}
          </button>
          <small className="form-footnote">
            Slot diverifikasi ulang oleh PostgreSQL saat submit. Tidak ada double booking.
          </small>
        </form>
      )}
    </div>
  );
}
