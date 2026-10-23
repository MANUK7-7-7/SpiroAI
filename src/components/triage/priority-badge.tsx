import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";
import type { Priority } from "@/config/triage";
import { cn } from "@/lib/cn";

const look = {
  high: { box: "bg-risk-high-tint text-risk-high", Icon: CircleAlert },
  medium: { box: "bg-cobalt-tint text-cobalt", Icon: TriangleAlert },
  low: { box: "bg-surface-sunken text-ink-muted", Icon: CircleCheck },
} as const;

/** Priority for a breathing test. Always icon plus label, never colour alone. */
export function PriorityBadge({ priority, label, large }: { priority: Priority; label: string; large?: boolean }) {
  const { box, Icon } = look[priority];
  return (
    <span className={cn("inline-flex items-center gap-[6px] rounded-full font-medium tracking-[-0.01em]", box, large ? "px-4 py-2 text-[16px]" : "px-[10px] py-[5px] text-[12px]")}>
      <Icon size={large ? 18 : 14} strokeWidth={1.8} aria-hidden />{label}
    </span>
  );
}
