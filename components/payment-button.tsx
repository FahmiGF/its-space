"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, LoaderCircle, ShieldCheck } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import type { PaymentStatus } from "@/lib/types";

export function PaymentButton({
  bookingId,
  amountDue,
  status,
  configured = true,
}: {
  bookingId: string;
  amountDue: number;
  status: PaymentStatus;
  configured?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (amountDue <= 0) return null;
  if (status === "paid") {
    return (
      <div className="payment-paid">
        <ShieldCheck size={16} /> Pembayaran lunas · {formatRupiah(amountDue)}
      </div>
    );
  }
  if (!configured) {
    return (
      <div className="payment-box">
        <div>
          <span className="eyebrow">Pembayaran</span>
          <strong>{formatRupiah(amountDue)}</strong>
          <small>Pembayaran online belum diaktifkan. Hubungi pengelola untuk menyelesaikan pembayaran.</small>
        </div>
      </div>
    );
  }

  async function pay() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/payments/${bookingId}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Pembayaran belum dapat dibuat.");
      if (data.paid) {
        router.refresh();
        return;
      }
      if (data.redirectUrl) {
        window.location.assign(data.redirectUrl);
        return;
      }
      throw new Error("Tautan pembayaran tidak tersedia.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Pembayaran belum dapat dibuat.");
      setLoading(false);
    }
  }

  return (
    <div className="payment-box">
      <div>
        <span className="eyebrow">Pembayaran</span>
        <strong>{formatRupiah(amountDue)}</strong>
        <small>
          {status === "expired" || status === "failed"
            ? "Transaksi sebelumnya tidak selesai. Silakan coba lagi."
            : "Selesaikan pembayaran sebelum check-in. Midtrans mendukung QRIS, VA, dan kartu."}
        </small>
      </div>
      <button className="button button-small" type="button" onClick={pay} disabled={loading}>
        {loading ? <LoaderCircle size={14} className="spin" /> : <CreditCard size={14} />}
        {loading ? "Membuka pembayaran…" : "Bayar sekarang"}
      </button>
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}
