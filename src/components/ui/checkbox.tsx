"use client";

import * as RC from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { useId } from "react";

export function Checkbox({ label, checked, onCheckedChange, error }: { label: string; checked: boolean; onCheckedChange: (v: boolean) => void; error?: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start gap-[10px]">
        <RC.Root
          id={id}
          checked={checked}
          onCheckedChange={(v) => onCheckedChange(v === true)}
          className="flex size-[18px] shrink-0 items-center justify-center rounded-[6px] border border-line bg-surface data-[state=checked]:border-cobalt data-[state=checked]:bg-cobalt"
        >
          <RC.Indicator><Check size={12} strokeWidth={3} className="text-on-accent" aria-hidden /></RC.Indicator>
        </RC.Root>
        <label htmlFor={id} className="text-[13px] leading-[1.45] tracking-[-0.005em] text-ink">{label}</label>
      </div>
      {error && <p className="pl-7 text-[11px] text-risk-high">{error}</p>}
    </div>
  );
}
