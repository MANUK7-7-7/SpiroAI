import { cn } from "@/lib/cn";

export function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span aria-hidden className={cn("flex size-[34px] shrink-0 items-center justify-center rounded-full bg-cobalt-tint text-[11px] font-medium leading-[1.45] tracking-[0.06em] text-cobalt", className)}>
      {initials}
    </span>
  );
}
