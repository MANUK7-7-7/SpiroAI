import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

type Props = {
  href: string;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
  className?: string;
};

/** Primary carries the white arrow circle; never also put an arrow in the label. */
export function Button({ href, variant = "secondary", children, className }: Props) {
  const primary = variant === "primary";
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-3 whitespace-nowrap rounded-input text-[14px] font-medium tracking-[-0.01em] transition-colors",
        primary
          ? "bg-cobalt pl-5 pr-[5px] text-on-accent hover:bg-cobalt-deep"
          : "border border-line bg-surface px-[18px] text-ink hover:bg-surface-soft",
        className,
      )}
    >
      {children}
      {primary && (
        <span className="flex size-[34px] items-center justify-center rounded-full bg-surface">
          <Image src="/assets/s01/arrow-up-right.svg" alt="" width={16} height={16} />
        </span>
      )}
    </Link>
  );
}
