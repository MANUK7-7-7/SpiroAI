import { cn } from "@/lib/cn";

/** Selected chips are ink pills with white text; default chips are soft. */
export function FilterChip({ label, selected, onClick, className }: { label: string; selected?: boolean; onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn("rounded-full px-[13px] py-2 text-[12px] font-medium leading-[1.45] tracking-[0.06em]", selected ? "bg-ink text-on-accent" : "bg-surface-soft text-ink-muted", className)}
    >
      {label}
    </button>
  );
}
