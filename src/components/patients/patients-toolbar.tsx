"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";
import { DropdownChip } from "@/components/ui/dropdown-chip";
import { FilterChip } from "@/components/ui/filter-chip";
import { useT } from "@/lib/i18n/client";

const SORTS = ["risk", "last", "name", "adherence"] as const;

/** Filters live in the URL, so they are kept when returning from a patient profile. */
export function PatientsToolbar() {
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const set = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    next.delete("page");
    start(() => router.replace(`${pathname}?${next.toString()}`));
  };
  const sort = (params.get("sort") as (typeof SORTS)[number]) ?? "risk";

  return (
    <>
      <div className="flex items-start gap-5">
        <form role="search" className="flex min-w-0 flex-1 items-start gap-3 rounded-input p-[14px] shadow-[inset_0_0_0_1px_var(--line)]" onSubmit={(e) => { e.preventDefault(); set({ q: input.current?.value.trim() || undefined }); }}>
          <Search size={18} strokeWidth={1.8} className="shrink-0 text-ink-muted" aria-hidden />
          <input ref={input} defaultValue={params.get("q") ?? ""} aria-label={t("patients.search")} placeholder={t("patients.search")} className="min-w-0 flex-1 bg-transparent text-[13px] leading-[1.45] outline-none placeholder:text-ink-muted" onBlur={() => set({ q: input.current?.value.trim() || undefined })} />
        </form>
        <DropdownChip
          label={t("patients.sort", { by: t(`patients.sortBy.${sort}`) })}
          display={t("patients.sort", { by: t(`patients.sortBy.${sort}`) })}
          solid
          value={sort}
          options={SORTS.map((s) => ({ value: s, label: t(`patients.sortBy.${s}`) }))}
          onChange={(v) => set({ sort: v && v !== "risk" ? v : undefined })}
        />
      </div>
      <div className="flex flex-wrap items-start gap-2">
        <DropdownChip label={`${t("patients.filters.risk")}`} value={params.get("risk") ?? undefined} onChange={(v) => set({ risk: v })} options={(["low", "moderate", "high"] as const).map((b) => ({ value: b, label: t(`risk.${b}`) }))} />
        <DropdownChip label={t("patients.filters.status")} value={params.get("status") ?? undefined} onChange={(v) => set({ status: v })} options={[{ value: "diagnosed", label: t("patients.options.diagnosed") }, { value: "at_risk", label: t("patients.options.at_risk") }]} />
        <DropdownChip label={t("patients.filters.gold")} value={params.get("gold") ?? undefined} onChange={(v) => set({ gold: v })} options={[1, 2, 3, 4].map((n) => ({ value: String(n), label: t("patients.options.goldN", { n }) }))} />
        <DropdownChip label={t("patients.filters.last")} value={params.get("last") ?? undefined} onChange={(v) => set({ last: v })} options={[{ value: "7d", label: t("patients.options.last7") }, { value: "30d", label: t("patients.options.last30") }]} />
        <FilterChip label={t("patients.filters.invite")} selected={params.get("invite") === "1"} onClick={() => set({ invite: params.get("invite") === "1" ? undefined : "1" })} className="font-normal tracking-normal" />
      </div>
    </>
  );
}
