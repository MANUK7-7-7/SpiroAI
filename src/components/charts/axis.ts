import { CLINIC_TZ } from "@/config/demo";
import type { Locale } from "@/lib/i18n/messages";

const DAY = 86_400_000;

/** Axis labels at each month start inside the range, plus the end date, like "01 Aug · 01 Sep · 01 Oct · 16 Oct". */
export function monthAxis(from: number, to: number, locale: Locale) {
  const f = new Intl.DateTimeFormat(locale === "es" ? "es-AR" : "en-GB", { day: "2-digit", month: "short", timeZone: CLINIC_TZ });
  const label = (t: number) => f.format(new Date(t)).replace(/\./g, "");
  const out: { t: number; label: string }[] = [{ t: from, label: label(from) }];
  const d = new Date(from);
  const cursor = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1, 3);
  for (let t = cursor; t < to - 10 * DAY; t = Date.UTC(new Date(t).getUTCFullYear(), new Date(t).getUTCMonth() + 1, 1, 3)) out.push({ t, label: label(t) });
  out.push({ t: to, label: label(to) });
  return out;
}

export const rangeStart = (now: number, range: "1M" | "3M" | "6M" | "1Y" | "all", first: number) =>
  range === "all" ? first : now - { "1M": 31, "3M": 76, "6M": 183, "1Y": 366 }[range] * DAY;
