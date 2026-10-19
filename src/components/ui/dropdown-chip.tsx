"use client";

import * as DM from "@radix-ui/react-dropdown-menu";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

type Option = { value: string; label: string };

/** Filter chip that opens a menu. Selected values turn the chip into an ink pill. */
export function DropdownChip({ label, display, options, value, onChange, solid }: { label: string; display?: string; options: Option[]; value?: string; onChange: (v: string | undefined) => void; solid?: boolean }) {
  const selected = options.find((o) => o.value === value);
  return (
    <DM.Root>
      <DM.Trigger className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-[13px] py-2 text-[12px] leading-[1.45]", selected || solid ? "bg-ink font-medium text-on-accent" : "bg-surface-soft text-ink")}>
        {display ?? (selected ? selected.label : label)}
        <ChevronDown size={12} strokeWidth={2} aria-hidden />
      </DM.Trigger>
      <DM.Portal>
        <DM.Content align="start" sideOffset={6} className="z-50 min-w-[180px] rounded-[18px] bg-surface p-1.5 shadow-[0_8px_30px_rgb(14_16_20/0.12),inset_0_0_0_1px_var(--line)]">
          {options.map((o) => (
            <DM.Item key={o.value} onSelect={() => onChange(o.value === value ? undefined : o.value)} className={cn("cursor-pointer rounded-input px-3 py-2 text-[13px] outline-none data-[highlighted]:bg-surface-soft", o.value === value && "font-medium text-cobalt")}>
              {o.label}
            </DM.Item>
          ))}
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  );
}
