import { cookies } from "next/headers";
import { defaultLocale, getMessages, LOCALE_COOKIE, locales, translate, type Locale } from "./messages";

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return locales.find((l) => l === value) ?? defaultLocale;
}

export async function getT() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { locale, t: (key: string, vars?: Record<string, string | number>) => translate(messages, key, vars) };
}
