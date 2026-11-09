export const TIME_ZONE = "Asia/Jakarta";
export const TZ_OFFSET = "+07:00";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const longDateFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});

const weekdayFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: TIME_ZONE,
  weekday: "short",
});

const dayFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: TIME_ZONE,
  day: "2-digit",
});

const monthFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: TIME_ZONE,
  month: "short",
});

export function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

export function isTimeString(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function todayInJakarta(): string {
  return dateFormatter.format(new Date());
}

export function addDays(date: string, amount: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

export function jakartaDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00${TZ_OFFSET}`);
}

export function formatDate(date: string | Date): string {
  const value =
    typeof date === "string"
      ? new Date(date.includes("T") ? date : `${date}T00:00:00${TZ_OFFSET}`)
      : date;
  return shortDateFormatter.format(value);
}

export function formatLongDate(date: string | Date): string {
  const value =
    typeof date === "string"
      ? new Date(date.includes("T") ? date : `${date}T00:00:00${TZ_OFFSET}`)
      : date;
  return longDateFormatter.format(value);
}

export function formatTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return timeFormatter.format(date).replace(".", ":");
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${shortDateFormatter.format(date)} · ${formatTime(date)}`;
}

export function formatRange(startsAt: string | Date, endsAt: string | Date): string {
  return `${formatTime(startsAt)}–${formatTime(endsAt)} WIB`;
}

export function weekdayShort(date: string): string {
  return weekdayFormatter.format(new Date(`${date}T00:00:00${TZ_OFFSET}`));
}

export function dayNumber(date: string): string {
  return dayFormatter.format(new Date(`${date}T00:00:00${TZ_OFFSET}`));
}

export function monthShort(date: string): string {
  return monthFormatter.format(new Date(`${date}T00:00:00${TZ_OFFSET}`));
}

export function dateInputValue(value: Date = new Date()): string {
  return value.toISOString().slice(0, 10);
}

export function relativeDay(date: string, today = todayInJakarta()): string {
  if (date === today) return "Hari ini";
  if (date === addDays(today, 1)) return "Besok";
  if (date === addDays(today, -1)) return "Kemarin";
  return formatDate(date);
}

export function minutesFromTime(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function timeFromMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function timeOptions(start: string, end: string, step = 30): string[] {
  const result: string[] = [];
  const startMinutes = minutesFromTime(start);
  const endMinutes = minutesFromTime(end);
  for (let value = startMinutes; value <= endMinutes; value += step) {
    result.push(timeFromMinutes(value));
  }
  return result;
}

export function durationLabel(startsAt: string, endsAt: string): string {
  const minutes = Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000);
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} jam ${rest} menit` : `${hours} jam`;
}

export function nextWeekday(target: number, from = todayInJakarta()): string {
  const current = new Date(`${from}T00:00:00Z`).getUTCDay();
  let delta = (target - current + 7) % 7;
  if (delta === 0) delta = 7;
  return addDays(from, delta);
}

export function bookingWindow(date: string, start: string, end: string) {
  return {
    startsAt: jakartaDateTime(date, start),
    endsAt: jakartaDateTime(date, end),
  };
}
