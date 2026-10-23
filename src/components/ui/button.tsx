import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  variant?: "primary" | "secondary";
  size?: "md" | "sm";
  radius?: "input" | "lg" | "pill";
  href?: string;
  /** Open the link in a new tab, so the app stays open (WhatsApp, external sites). */
  newTab?: boolean;
  onClick?: React.MouseEventHandler;
  type?: "button" | "submit";
  disabled?: boolean;
  /** Arrow circle on primary buttons. Default: on for md, off for the compact sm size (as designed). */
  arrow?: boolean;
  children: React.ReactNode;
  className?: string;
};

const radii = { input: "rounded-input", lg: "rounded-[18px]", pill: "rounded-full" } as const;

/** Primary carries the white arrow circle; never also put an arrow in the label. */
export function Button({ variant = "secondary", size = "md", radius = "input", href, newTab, children, className, disabled, type = "button", onClick, arrow }: Props) {
  const primary = variant === "primary";
  const showArrow = primary && (arrow ?? size === "md");
  const cls = cn(
    "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors",
    size === "md" ? "h-11 gap-3 text-[14px] tracking-[-0.01em]" : "h-[34px] gap-2 text-[12px] tracking-[-0.01em]",
    radii[radius],
    disabled
      ? "cursor-not-allowed bg-surface-sunken px-5 text-ink-muted"
      : primary
        ? cn("bg-cobalt text-on-accent hover:bg-cobalt-deep", size === "md" ? "pl-5 pr-[5px]" : showArrow ? "pl-3 pr-[3px]" : "px-3")
        : cn("border border-line bg-surface text-ink hover:bg-surface-soft", size === "md" ? "px-[18px]" : "px-3"),
    className,
  );
  const arrowEl = showArrow && !disabled && (
    <span className={cn("flex items-center justify-center rounded-full bg-surface text-cobalt", size === "md" ? "size-[34px]" : "size-7")}>
      <ArrowUpRight size={16} strokeWidth={2} aria-hidden />
    </span>
  );
  if (href && !disabled) {
    return (
      <Link href={href} className={cls} {...(newTab && { target: "_blank", rel: "noopener noreferrer" })}>
        {children}
        {arrowEl}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
      {arrowEl}
    </button>
  );
}
