import { getFacilities } from "./facilities";
import { addDays, formatDate, nextWeekday, todayInJakarta } from "./time";
import type { FacilityCard, FacilityCategory } from "./types";

export type AssistantQuery = {
  category?: FacilityCategory;
  building?: string;
  minCapacity?: number;
  date?: string;
  start?: string;
  end?: string;
  amenity?: string;
  q?: string;
  labels: string[];
};

export type AssistantResult = {
  answer: string;
  interpretation: string[];
  window: { date: string | null; start: string | null; end: string | null };
  results: FacilityCard[];
  source: "database";
};

const CATEGORY_WORDS: Array<[RegExp, FacilityCategory]> = [
  [/\b(futsal|basket|badminton|sepak bola|olahraga|lapangan)\b/i, "sports"],
  [/\b(auditorium|aula|convention|seminar|wisuda)\b/i, "auditorium"],
  [/\b(rapat|meeting|diskusi|koordinasi)\b/i, "meeting"],
  [/\b(lab|laboratorium|praktikum|riset)\b/i, "lab"],
  [/\b(studio|rekaman|produksi|podcast)\b/i, "studio"],
];

const BUILDING_WORDS: Array<[RegExp, string, string]> = [
  [/\btower\s*1\b|\btw1\b/i, "TW1", "Tower 1"],
  [/\btower\s*2\b|\btw2\b/i, "TW2", "Tower 2"],
  [/\bgedung\s*a\b/i, "GA", "Gedung A"],
  [/\barena\b/i, "ARENA", "Arena Olahraga"],
  [/\blabtek\s*(7|vii)\b/i, "LAB7", "Labtek VII"],
  [/\brobotika\b/i, "ROB", "Gedung Robotika"],
];

const AMENITY_WORDS: Array<[RegExp, string, string]> = [
  [/\bproyektor\b/i, "Proyektor", "proyektor"],
  [/\bsound\s*system\b|\baudio\b/i, "Sound system", "sound system"],
  [/\bwifi\b|\bwi-fi\b/i, "Wi-Fi", "Wi-Fi"],
  [/\bac\b|\bpendingin\b/i, "AC", "AC"],
  [/\bparkir\b/i, "Parkir", "parkir"],
  [/\bpapan\s*tulis\b/i, "Papan tulis", "papan tulis"],
  [/\bgreen\s*screen\b/i, "Green screen", "green screen"],
];

const MONTHS: Record<string, number> = {
  januari: 0,
  februari: 1,
  maret: 2,
  april: 3,
  mei: 4,
  juni: 5,
  juli: 6,
  agustus: 7,
  september: 8,
  oktober: 9,
  november: 10,
  desember: 11,
};

const WEEKDAYS: Record<string, number> = {
  minggu: 0,
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  "jum'at": 5,
  sabtu: 6,
};

function parseDate(text: string, today: string): string | undefined {
  if (/\bhari ini\b/i.test(text)) return today;
  if (/\bbesok\b/i.test(text)) return addDays(today, 1);
  if (/\blusa\b/i.test(text)) return addDays(today, 2);

  const named = text.match(
    /\b(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)(?:\s+(\d{4}))?\b/i,
  );
  if (named) {
    const day = Number(named[1]);
    const month = MONTHS[named[2].toLowerCase()];
    const year = named[3] ? Number(named[3]) : Number(today.slice(0, 4));
    const candidate = new Date(Date.UTC(year, month, day));
    if (!Number.isNaN(candidate.getTime())) return candidate.toISOString().slice(0, 10);
  }

  for (const [word, weekday] of Object.entries(WEEKDAYS)) {
    if (new RegExp(`\\b${word}\\b`, "i").test(text)) {
      return nextWeekday(weekday, today);
    }
  }
  return undefined;
}

function parseTime(text: string): { start: string; end: string } | null {
  const match = text.match(
    /(\d{1,2})[.:](\d{2})\s*(?:-|–|sampai|hingga)\s*(\d{1,2})[.:](\d{2})/i,
  );
  if (!match) return null;
  const start = `${match[1].padStart(2, "0")}:${match[2]}`;
  const end = `${match[3].padStart(2, "0")}:${match[4]}`;
  if (start >= end) return null;
  return { start, end };
}

export function parseAssistantQuery(input: string, today = todayInJakarta()): AssistantQuery {
  const text = input.trim().slice(0, 240);
  const labels: string[] = [];
  const query: AssistantQuery = { labels };

  const capacity = text.match(/(\d{1,4})\s*(?:orang|pax|kursi|peserta|people)/i);
  if (capacity) {
    query.minCapacity = Math.min(5000, Math.max(1, Number(capacity[1])));
    labels.push(`kapasitas ≥ ${query.minCapacity} orang`);
  }

  for (const [pattern, category] of CATEGORY_WORDS) {
    if (pattern.test(text)) {
      query.category = category;
      labels.push(
        category === "sports"
          ? "olahraga"
          : category === "auditorium"
            ? "auditorium"
            : category === "meeting"
              ? "ruang rapat"
              : category === "lab"
                ? "laboratorium"
                : "studio",
      );
      break;
    }
  }

  const specificVenue = text.match(/\b(futsal|basket|badminton|sepak bola|auditorium|convention|studio)\b/i);
  if (specificVenue) query.q = specificVenue[1];

  for (const [pattern, code, label] of BUILDING_WORDS) {
    if (pattern.test(text)) {
      query.building = code;
      labels.push(label);
      break;
    }
  }

  for (const [pattern, amenity, label] of AMENITY_WORDS) {
    if (pattern.test(text)) {
      query.amenity = amenity;
      labels.push(`fasilitas ${label}`);
      break;
    }
  }

  const date = parseDate(text, today);
  const time = parseTime(text);
  if (date) {
    query.date = date;
    labels.push(formatDate(date));
    query.start = time?.start ?? "09:00";
    query.end = time?.end ?? "11:00";
    labels.push(`${query.start}–${query.end} WIB`);
  }

  return query;
}

export async function answerAssistant(input: string): Promise<AssistantResult> {
  const parsed = parseAssistantQuery(input);
  const results = await getFacilities({
    category: parsed.category,
    building: parsed.building,
    minCapacity: parsed.minCapacity,
    amenity: parsed.amenity,
    q: parsed.q,
    date: parsed.date,
    start: parsed.start,
    end: parsed.end,
  });

  const top = results.slice(0, 3);
  let answer: string;
  if (top.length) {
    const first = top[0];
    answer =
      parsed.date && parsed.start
        ? `Saya menemukan ${top.length} ruang yang tersedia pada ${formatDate(parsed.date)}, ${parsed.start}–${parsed.end} WIB. ${first.name} di ${first.buildingName} menjadi pilihan teratas dengan kapasitas ${first.capacity} orang.`
        : `Saya menemukan ${top.length} ruang yang cocok. ${first.name} di ${first.buildingName} memiliki kapasitas ${first.capacity} orang. Pilih ruang untuk melihat slot yang benar-benar tersedia.`;
  } else {
    answer = parsed.date
      ? `Belum ada ruang yang cocok dan kosong pada ${formatDate(parsed.date)}, ${parsed.start}–${parsed.end} WIB. Coba geser jam atau longgarkan filter.`
      : "Belum ada fasilitas yang cocok. Coba sebutkan jumlah peserta, gedung, atau jenis ruangan.";
  }

  return {
    answer,
    interpretation: parsed.labels,
    window: {
      date: parsed.date ?? null,
      start: parsed.start ?? null,
      end: parsed.end ?? null,
    },
    results: top,
    source: "database",
  };
}
