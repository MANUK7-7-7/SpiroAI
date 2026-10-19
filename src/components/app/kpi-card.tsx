import Link from "next/link";
import { PinArrow } from "@/components/ui/pin-link";

export function KpiCard({ label, value, link, href }: { label: string; value: number; link: string; href: string }) {
  return (
    <Link href={href} className="flex min-w-0 flex-1 flex-col gap-3 rounded-card bg-surface p-6 transition-shadow hover:shadow-[0_0_0_1px_var(--line)]">
      <div className="flex items-center justify-between">
        <span className="min-w-0 flex-1 text-[12px] leading-[1.45] tracking-[-0.005em] text-ink-muted">{label}</span>
        <PinArrow />
      </div>
      <p className="font-display text-[44px] font-medium leading-[1.45] tracking-[-0.05em]">{value}</p>
      <p className="text-[11px] leading-[1.45] text-cobalt">{link}</p>
    </Link>
  );
}
