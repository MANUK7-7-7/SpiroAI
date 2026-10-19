import { CalendarCheck } from "lucide-react";
import Link from "next/link";

export function FocusCard({ title, line1, line2, body, cta, href }: { title: string; line1: string; line2: string; body: string; cta: string; href: string }) {
  return (
    <div className="flex flex-col gap-[18px] rounded-panel bg-cobalt p-6 text-on-accent">
      <h2 className="text-[18px] font-medium leading-[1.45] tracking-[-0.01em]">{title}</h2>
      <CalendarCheck size={28} strokeWidth={1.6} aria-hidden />
      <p className="font-display text-[26px] font-medium leading-[1.45] tracking-[-0.025em]">{line1}<br />{line2}</p>
      <p className="text-[13px] leading-[1.45] tracking-[-0.005em] opacity-80">{body}</p>
      <div>
        <Link href={href} className="inline-flex h-[34px] items-center rounded-input border border-line bg-surface px-3 text-[12px] font-medium tracking-[-0.01em] text-ink">{cta}</Link>
      </div>
    </div>
  );
}
