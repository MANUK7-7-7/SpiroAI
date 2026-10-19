import en from "@/messages/en.json";
import es from "@/messages/es.json";

export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];
/** Flip to "es" to make Spanish (es-AR) the default; the Figma file is authored in English. */
export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "spiro_locale";

export type Messages = typeof en;
const all: Record<Locale, Messages> = { en, es: es as Messages };

export const getMessages = (locale: Locale): Messages => all[locale];

export function translate(messages: Messages, key: string, vars?: Record<string, string | number>): string {
  const value = key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], messages);
  if (typeof value !== "string") return key;
  return vars ? value.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : value;
}
