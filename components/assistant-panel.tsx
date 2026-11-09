"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Database, LoaderCircle, Sparkles } from "lucide-react";
import type { AssistantResult } from "@/lib/assistant";
import { CATEGORY_META } from "@/lib/constants";

const EXAMPLES = [
  "Ruang rapat di Tower 2 untuk 20 orang",
  "Auditorium dengan proyektor besok 09.00-11.00",
  "Lapangan futsal hari Sabtu",
  "Lab untuk 40 orang",
];

export function AssistantPanel({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AssistantResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(value: string) {
    const text = value.trim();
    if (!text) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Pencarian gagal.");
      setResult(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Pencarian gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`assistant ${compact ? "assistant-compact" : ""}`}>
      <div className="assistant-head">
        <span className="assistant-orb">
          <Sparkles size={18} />
        </span>
        <div>
          <span className="eyebrow">Space Assist</span>
          <h3>Tanya ruangan, dapat jawaban dari data.</h3>
        </div>
        <span className="live-data-badge">
          <Database size={13} /> Live DB
        </span>
      </div>
      <form
        className="assistant-form"
        onSubmit={(event) => {
          event.preventDefault();
          void ask(query);
        }}
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Contoh: ruang rapat Tower 2 untuk 20 orang besok"
          aria-label="Pertanyaan fasilitas"
          maxLength={240}
        />
        <button type="submit" className="button button-dark" disabled={loading}>
          {loading ? <LoaderCircle size={17} className="spin" /> : <ArrowRight size={17} />}
          {loading ? "Mencari" : "Cari"}
        </button>
      </form>
      <div className="assistant-examples">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => {
              setQuery(example);
              void ask(example);
            }}
          >
            {example}
          </button>
        ))}
      </div>
      {error && <p className="form-error">{error}</p>}
      {result && (
        <div className="assistant-result" aria-live="polite">
          <p>{result.answer}</p>
          {result.interpretation.length > 0 && (
            <div className="interpretation">
              {result.interpretation.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          )}
          {result.results.length > 0 && (
            <div className="assistant-results">
              {result.results.map((facility) => (
                <Link key={facility.id} href={`/facilities/${facility.slug}`}>
                  <div>
                    <strong>{facility.name}</strong>
                    <small>
                      {facility.buildingName} · {facility.capacity} orang ·{" "}
                      {CATEGORY_META[facility.category].label}
                    </small>
                  </div>
                  <ArrowRight size={15} />
                </Link>
              ))}
            </div>
          )}
          <small className="assistant-source">
            <Database size={12} /> Ketersediaan diverifikasi dari database, bukan dibuat oleh model.
          </small>
        </div>
      )}
    </div>
  );
}
