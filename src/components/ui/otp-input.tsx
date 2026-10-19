"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

export function OtpInput({ value, onChange, label, invalid }: { value: string; onChange: (v: string) => void; label: string; invalid?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");
  const set = (next: string) => onChange(next.replace(/\D/g, "").slice(0, 6));

  return (
    <div role="group" aria-label={label} className="flex gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          aria-label={`${label} ${i + 1}`}
          aria-invalid={invalid}
          onChange={(e) => {
            const ch = e.target.value.replace(/\D/g, "").slice(-1);
            const arr = digits.slice();
            arr[i] = ch;
            set(arr.join(""));
            if (ch && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => { if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus(); }}
          onPaste={(e) => { e.preventDefault(); set(e.clipboardData.getData("text")); refs.current[Math.min(e.clipboardData.getData("text").replace(/\D/g, "").length, 5)]?.focus(); }}
          className={cn("h-14 min-w-0 flex-1 rounded-input border bg-surface-soft text-center font-mono text-[25px] text-ink outline-none focus:border-cobalt", invalid ? "border-risk-high" : "border-line")}
        />
      ))}
    </div>
  );
}
