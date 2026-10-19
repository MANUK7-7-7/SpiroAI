import { cn } from "@/lib/cn";

export function Card({ children, className, tint }: { children: React.ReactNode; className?: string; tint?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-[18px] rounded-card border border-line p-6", tint ? "bg-cobalt-tint" : "bg-surface", className)}>
      {children}
    </div>
  );
}

export function CardHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col gap-1 leading-[1.45]">
      <h2 className="text-[18px] font-medium tracking-[-0.01em] text-ink">{title}</h2>
      {description && <p className="text-[12px] tracking-[-0.005em] text-ink-muted">{description}</p>}
    </div>
  );
}
