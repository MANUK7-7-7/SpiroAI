import Link from "next/link";
import { cn } from "@/lib/cn";

export function Pagination({ page, pageCount, hrefFor, labels, summary }: { page: number; pageCount: number; hrefFor: (page: number) => string; labels: { prev: string; next: string }; summary: string }) {
  const pages = Array.from({ length: Math.min(pageCount, 3) }, (_, i) => Math.min(Math.max(page - 1, 1) + i, pageCount)).filter((v, i, a) => a.indexOf(v) === i);
  const btn = "inline-flex h-[34px] items-center rounded-input px-3 text-[12px] font-medium shadow-[inset_0_0_0_1px_var(--line)] bg-surface";
  return (
    <div className="flex items-center justify-between">
      <p className="text-[12px] leading-[1.45] text-ink-muted">{summary}</p>
      <nav aria-label="Pagination" className="flex gap-2">
        {page > 1 ? <Link href={hrefFor(page - 1)} className={btn}>{labels.prev}</Link> : <span className={cn(btn, "opacity-50")}>{labels.prev}</span>}
        {pages.map((n) => (
          <Link key={n} href={hrefFor(n)} aria-current={n === page ? "page" : undefined} className={cn("rounded-full px-[13px] py-2 text-[12px] leading-[1.45]", n === page ? "bg-ink font-medium text-on-accent" : "bg-surface-soft text-ink")}>{n}</Link>
        ))}
        {page < pageCount ? <Link href={hrefFor(page + 1)} className={btn}>{labels.next}</Link> : <span className={cn(btn, "opacity-50")}>{labels.next}</span>}
      </nav>
    </div>
  );
}
