import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** The signature cobalt pin: a circle with a white arrow. */
export function PinArrow({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span aria-hidden className={cn("flex shrink-0 items-center justify-center rounded-full bg-cobalt text-on-accent", className)} style={{ width: size, height: size }}>
      <ArrowUpRight size={Math.round(size / 2)} strokeWidth={2} />
    </span>
  );
}
