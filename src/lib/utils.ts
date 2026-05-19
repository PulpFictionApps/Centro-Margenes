import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Builds a Google Calendar "add event" URL.
 * Works in both browser and Node.js environments (no Date.UTC quirks needed).
 */
export function buildGoogleCalendarUrl(opts: {
  title: string;
  date: string;           // "YYYY-MM-DD"
  time: string;           // "HH:MM" or "HH:MM:SS"
  durationMinutes?: number;
  location?: string;
  details?: string;
}): string {
  const { title, date, time, durationMinutes = 60, location = "", details = "" } = opts;

  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const start = new Date(y, m - 1, d, h, min, 0);
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (dt: Date) =>
    `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
  });

  if (location) params.set("location", location);
  if (details) params.set("details", details);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
