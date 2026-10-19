import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { RiskBadge } from "@/components/ui/risk-badge";
import type { RiskBand } from "@/config/risk-bands";
import { cn } from "@/lib/cn";

type Props = { href: string; initials: string; name: string; reason: string; meta: string; band: RiskBand; badge: string };

export function PriorityQueueItem({ href, initials, name, reason, meta, band, badge }: Props) {
  return (
    <Link href={href} className={cn("flex items-center gap-[14px] rounded-[18px] p-4", band === "high" ? "bg-risk-high-tint" : "bg-surface-soft")}>
      <Avatar initials={initials} />
      <div className="flex min-w-0 flex-1 flex-col gap-[5px] leading-[1.45]">
        <p className="text-[14px] font-medium tracking-[-0.01em] text-ink">{name}</p>
        <p className="text-[12px] tracking-[-0.005em] text-ink-muted">{reason}</p>
        <p className="text-[10px] tracking-[-0.005em] text-ink-muted">{meta}</p>
      </div>
      <RiskBadge band={band} label={badge} />
      <ArrowUpRight size={20} strokeWidth={1.8} className="shrink-0 text-ink" aria-hidden />
    </Link>
  );
}
