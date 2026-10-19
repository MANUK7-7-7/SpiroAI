import { cn } from "@/lib/cn";

export function Step({ index, label, state }: { index: number; label: string; state: "current" | "default" | "done" }) {
  const current = state === "current";
  return (
    <li aria-current={current ? "step" : undefined} className={cn("flex items-start gap-[14px] rounded-[18px] p-4 text-[14px] leading-[1.45]", current ? "bg-cobalt-tint font-medium tracking-[-0.01em]" : "bg-surface-sunken tracking-[-0.005em]")}>
      <span className="w-6 shrink-0 font-medium text-cobalt">{state === "done" ? "✓" : index}</span>
      <span className={cn("min-w-0 flex-1 text-ink", current && "font-medium")}>{label}</span>
    </li>
  );
}
