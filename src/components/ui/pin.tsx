import Image from "next/image";
import { cn } from "@/lib/cn";

/** Cobalt circle with a white "+": the signature pin. */
export function PinDot() {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-4 border-surface bg-cobalt">
      <Image src="/assets/s01/plus.svg" alt="" width={16} height={16} />
    </span>
  );
}

export function Pin({ label, side = "right", className }: { label: string; side?: "left" | "right"; className?: string }) {
  const pill = (
    <span className="whitespace-nowrap rounded-full bg-surface px-[18px] py-[11px] text-[15px] font-medium tracking-[-0.02em] text-ink">
      {label}
    </span>
  );
  return (
    <div className={cn("absolute flex items-center gap-[6px]", className)}>
      {side === "right" ? <>{pill}<PinDot /></> : <><PinDot />{pill}</>}
    </div>
  );
}
