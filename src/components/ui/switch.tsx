"use client";

import * as RS from "@radix-ui/react-switch";
import { useId } from "react";
import { cn } from "@/lib/cn";

export function Switch({ checked, onCheckedChange, label, description, disabled, className }: { checked: boolean; onCheckedChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean; className?: string }) {
  const id = useId();
  return (
    <div className={cn("flex items-center justify-between gap-4 rounded-[16px] bg-surface-soft p-4", className)}>
      <div className="flex min-w-0 flex-col gap-0.5 leading-[1.45]">
        <label htmlFor={id} className="text-[14px] font-medium tracking-[-0.01em] text-ink">{label}</label>
        {description && <p id={`${id}-d`} className="text-[12px] text-ink-muted">{description}</p>}
      </div>
      <RS.Root id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} aria-describedby={description ? `${id}-d` : undefined}
        className="relative h-6 w-[42px] shrink-0 rounded-full bg-line outline-offset-2 transition-colors data-[state=checked]:bg-cobalt disabled:opacity-50">
        <RS.Thumb className="block size-[18px] translate-x-[3px] rounded-full bg-surface transition-transform data-[state=checked]:translate-x-[21px]" />
      </RS.Root>
    </div>
  );
}
