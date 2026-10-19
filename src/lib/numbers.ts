import type { Locale } from "@/lib/i18n/messages";

const words: Record<Locale, string[]> = {
  en: ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"],
  es: ["Cero", "Un", "Dos", "Tres", "Cuatro", "Cinco", "Seis", "Siete", "Ocho", "Nueve", "Diez"],
};

/** Small counts are spelled out at the start of a sentence, as in the design ("Two scheduled tests missed"). */
export const countWord = (n: number, locale: Locale) => (n >= 0 && n <= 10 ? words[locale][n] : String(n));
