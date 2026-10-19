import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

const styles = {
  info: { box: "bg-cobalt-tint", title: "text-cobalt", Icon: Info },
  success: { box: "bg-cobalt-tint", title: "text-cobalt", Icon: CircleCheck },
  warning: { box: "bg-cobalt-tint", title: "text-cobalt", Icon: TriangleAlert },
  error: { box: "bg-risk-high-tint", title: "text-risk-high", Icon: CircleAlert },
} as const;

export function Alert({ state = "info", title, children, className }: { state?: keyof typeof styles; title: string; children?: React.ReactNode; className?: string }) {
  const s = styles[state];
  return (
    <div role={state === "error" ? "alert" : "status"} className={cn("flex items-start gap-3 rounded-[16px] p-4", s.box, className)}>
      <s.Icon size={20} strokeWidth={1.8} className={cn("mt-0.5 shrink-0", s.title)} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-1 leading-[1.45]">
        <p className={cn("text-[14px] font-medium tracking-[-0.01em]", s.title)}>{title}</p>
        {children && <div className="text-[12px] tracking-[-0.005em] text-ink-muted">{children}</div>}
      </div>
    </div>
  );
}
