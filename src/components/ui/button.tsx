import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  variant?: "primary" | "secondary";
  size?: "md" | "sm";
  radius?: "input" | "lg" | "pill";
  href?: string;
  onClick?: React.MouseEventHandler;
  type?: "button" | "submit";
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
};

const radii = { input: "rounded-input", lg: "rounded-[18px]", pill: "rounded-full" } as const;

/** Primary carries the white arrow circle; never also put an arrow in the label. */
export function Button({ variant = "secondary", size = "md", radius = "input", href, children, className, disabled, type = "button", onClick }: Props) {
  const primary = variant === "primary";
  const cls = cn(
    "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors",
    size === "md" ? "h-11 gap-3 text-[14px] tracking-[-0.01em]" : "h-[34px] gap-2 text-[12px] tracking-[-0.01em]",
    radii[radius],
    disabled
      ? "cursor-not-allowed bg-surface-sunken px-5 text-ink-muted"
      : primary
        ? cn("bg-cobalt text-on-accent hover:bg-cobalt-deep", size === "md" ? "pl-5 pr-[5px]" : "pl-4 pr-[3px]")
        : cn("border border-line bg-surface text-ink hover:bg-surface-soft", size === "md" ? "px-[18px]" : "px-3"),
    className,
  );
  const arrow = primary && !disabled && (
    <span className={cn("flex items-center justify-center rounded-full bg-surface text-cobalt", size === "md" ? "size-[34px]" : "size-7")}>
      <ArrowUpRight size={16} strokeWidth={2} aria-hidden />
    </span>
  );
  if (href && !disabled) {
    return (
      <Link href={href} className={cls}>
        {children}
        {arrow}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
      {arrow}
    </button>
  );
}
