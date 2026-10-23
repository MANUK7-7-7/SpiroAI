import { cn } from "@/lib/cn";

const tracking = (size: number) => (size >= 40 ? "-0.045em" : size >= 28 ? "-0.035em" : "-0.025em");

/** Display title. The cobalt accent dot is part of the component, never hard-coded in copy. */
export function Title({ children, size = 40, as: Tag = "h1", dot = true, className }: { children: React.ReactNode; size?: number; as?: "h1" | "h2" | "p"; dot?: boolean; className?: string }) {
  return (
    <Tag className={cn("font-display font-medium leading-[1.04] text-ink", className)} style={{ fontSize: size, letterSpacing: tracking(size) }}>
      {children}
      {dot && !(typeof children === "string" && /[?!.]$/.test(children)) && <span className="text-cobalt">.</span>}
    </Tag>
  );
}
