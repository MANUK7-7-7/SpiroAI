import { CircleCheck, CircleAlert, TriangleAlert } from "lucide-react";
import type { RiskBand } from "@/config/risk-bands";
import { cn } from "@/lib/cn";


const look = {
  low: { box: "bg-surface-sunken text-ink-muted", Icon: CircleCheck },
  moderate: { box: "bg-risk-moderate-tint text-risk-moderate", Icon: TriangleAlert },
  high: { box: "bg-risk-high-tint text-risk-high", Icon: CircleAlert },
} as const;

/** Risk is never colour alone: always an icon plus a label. */
export function RiskBadge({ band, label }: { band: RiskBand; label: string }) {
  const { box, Icon } = look[band];
  return (
    <span className={cn("inline-flex items-center gap-[6px] rounded-full px-[10px] py-[5px] text-[12px] font-medium leading-[1.45] tracking-[-0.01em]", box)}>
      <Icon size={14} strokeWidth={1.8} aria-hidden />
      {label}
    </span>
  );
}
