import type { Locale } from "@/lib/i18n/messages";

const tag = (l: Locale) => (l === "es" ? "es-AR" : "en-GB");

export function formatSubmitted(iso: string, locale: Locale, at: string) {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat(tag(locale), { day: "numeric", month: "short", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" }).format(d).replace(/\./g, "");
  const time = new Intl.DateTimeFormat(tag(locale), { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Argentina/Buenos_Aires" }).format(d);
  return `${date} ${at} ${time}`;
}
