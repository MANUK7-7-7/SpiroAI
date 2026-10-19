"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, translate, type Locale, type Messages } from "./messages";

type Ctx = { locale: Locale; messages: Messages };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ locale, messages, children }: Ctx & { children: React.ReactNode }) {
  const value = useMemo(() => ({ locale, messages }), [locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used inside I18nProvider");
  const t = useCallback((key: string, vars?: Record<string, string | number>) => translate(ctx.messages, key, vars), [ctx.messages]);
  return { t, locale: ctx.locale };
}

export function useSetLocale() {
  const router = useRouter();
  return (next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };
}
