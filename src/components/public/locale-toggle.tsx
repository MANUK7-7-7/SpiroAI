"use client";

import { useSetLocale, useT } from "@/lib/i18n/client";
import { FilterChip } from "@/components/ui/filter-chip";

export function LocaleToggle() {
  const { locale } = useT();
  const setLocale = useSetLocale();
  return <FilterChip selected label="ES / EN" onClick={() => setLocale(locale === "en" ? "es" : "en")} />;
}
