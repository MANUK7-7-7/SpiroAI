"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function GlobalSearch({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); ref.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <form role="search" className="flex w-[220px] items-center gap-[10px]" onSubmit={(e) => { e.preventDefault(); const q = ref.current?.value.trim(); router.push(q ? `/patients?q=${encodeURIComponent(q)}` : "/patients"); }}>
      <Search size={18} strokeWidth={1.8} className="shrink-0 text-ink-muted" aria-hidden />
      <input ref={ref} aria-label={placeholder} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-[13px] leading-[1.45] tracking-[-0.005em] outline-none placeholder:text-ink-muted" />
      <kbd className="whitespace-nowrap font-sans text-[11px] text-ink-muted">⌘ K</kbd>
    </form>
  );
}
