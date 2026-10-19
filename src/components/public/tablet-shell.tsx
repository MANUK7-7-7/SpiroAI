import { Brand } from "@/components/ui/brand";
import { cn } from "@/lib/cn";

/** Single-column tablet adaptation used by reset password and biometric login. */
export function TabletShell({ children, note, padding = "p-16", className }: { children: React.ReactNode; note: string; padding?: string; className?: string }) {
  return (
    <div className={cn("mx-auto flex min-h-screen w-full max-w-[834px] flex-col gap-[30px] rounded-shell bg-surface-sunken", padding, className)}>
      <Brand shape="pill" />
      {children}
      <p className="text-[12px] leading-[1.45] text-ink-muted">{note}</p>
    </div>
  );
}
