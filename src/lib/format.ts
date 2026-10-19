import { CLINIC_TZ } from "@/config/demo";
import type { Locale } from "@/lib/i18n/messages";

const tag = (l: Locale) => (l === "es" ? "es-AR" : "en-GB");
const fmt = (l: Locale, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(tag(l), { timeZone: CLINIC_TZ, ...o });

export function formatSubmitted(iso: string, locale: Locale, at: string) {
  const d = new Date(iso);
  const date = fmt(locale, { day: "numeric", month: "short", year: "numeric" }).format(d).replace(/\./g, "");
  const time = fmt(locale, { hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
  return `${date} ${at} ${time}`;
}

export const formatTime = (iso: string, locale: Locale) => fmt(locale, { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
export const formatShortDate = (iso: string, locale: Locale) => fmt(locale, { day: "numeric", month: "short" }).format(new Date(iso)).replace(/\./g, "");
export const formatLongDate = (iso: string, locale: Locale) => fmt(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

const dayKey = (iso: string) => fmt("en", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

/** "Today · 08:10", "Yesterday · 16:35", "16 Oct · 08:42" */
export function relativeDayTime(iso: string, now: string, locale: Locale, labels: { today: string; yesterday: string }) {
  const time = formatTime(iso, locale);
  if (dayKey(iso) === dayKey(now)) return `${labels.today} · ${time}`;
  const yesterday = new Date(new Date(now).getTime() - 86_400_000).toISOString();
  if (dayKey(iso) === dayKey(yesterday)) return `${labels.yesterday} · ${time}`;
  return `${formatShortDate(iso, locale)} · ${time}`;
}
