import { cn } from "@/lib/cn";

export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { id: T; label: string }[]; value: T; onChange: (id: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-2 border-b border-line pb-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          type="button"
          aria-selected={tab.id === value}
          onClick={() => onChange(tab.id)}
          className={cn("rounded-input px-[15px] py-[10px] text-[13px] font-medium leading-[1.45] tracking-[-0.01em]", tab.id === value ? "bg-ink text-on-accent" : "text-ink-muted hover:text-ink")}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
