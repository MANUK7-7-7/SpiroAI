import { CircleAlert, CircleCheck, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type StateKind = "loading" | "empty" | "error" | "success";

const look = {
  loading: { box: "bg-surface", tag: "text-ink-muted" },
  empty: { box: "bg-surface", tag: "text-ink-muted" },
  error: { box: "bg-risk-high-tint", tag: "text-risk-high" },
  success: { box: "bg-cobalt-tint", tag: "text-cobalt" },
} as const;

type Props = {
  kind: StateKind;
  tag: string;
  message?: string;
  action?: string;
  onAction?: () => void;
  href?: string;
  note?: string;
  loadingLabel?: string;
  className?: string;
};

/** The shared loading / empty / error / success treatment from the "states and exceptions" boards. */
export function StateCard({ kind, tag, message, action, onAction, href, note, loadingLabel, className }: Props) {
  const { box, tag: tagColor } = look[kind];
  return (
    <section className={cn("flex min-h-[220px] flex-col gap-[14px] rounded-card p-5", box, className)} aria-busy={kind === "loading"} role={kind === "error" ? "alert" : undefined}>
      <p className={cn("text-[11px] font-medium uppercase leading-[1.45] tracking-[0.06em]", tagColor)}>{tag}</p>
      {kind === "loading" ? (
        <>
          <div className="mt-1 flex flex-col gap-3" aria-hidden>
            <div className="h-4 w-[130px] animate-pulse rounded-full bg-surface-soft" />
            <div className="h-12 animate-pulse rounded-input bg-surface-soft" />
            <div className="h-[10px] w-[190px] animate-pulse rounded-full bg-surface-soft" />
          </div>
          <p className="mt-auto text-[11px] text-ink-muted">{loadingLabel}</p>
        </>
      ) : (
        <>
          {kind === "empty" && <Inbox size={20} strokeWidth={1.6} className="text-cobalt" aria-hidden />}
          {kind === "error" && <CircleAlert size={20} strokeWidth={1.6} className="text-risk-high" aria-hidden />}
          {kind === "success" && <CircleCheck size={20} strokeWidth={1.6} className="text-cobalt" aria-hidden />}
          <p className="text-[14px] leading-[1.45] tracking-[-0.005em] text-ink">{message}</p>
          {action && <div><Button size="sm" radius="pill" href={href} onClick={onAction}>{action}</Button></div>}
          {note && <p className="mt-auto text-[11px] leading-[1.45] text-ink-muted">{note}</p>}
        </>
      )}
    </section>
  );
}
