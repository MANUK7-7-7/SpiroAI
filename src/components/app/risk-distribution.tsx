import { RiskBadge } from "@/components/ui/risk-badge";
import { cn } from "@/lib/cn";

type Counts = { low: number; moderate: number; high: number };
const fill = { low: "bg-cobalt-tint-strong", moderate: "bg-cobalt", high: "bg-risk-high" } as const;

/** Bars scale to the largest band; each is paired with a labelled badge so risk never relies on colour alone. */
export function RiskDistribution({ counts, labels }: { counts: Counts; labels: Record<keyof Counts, string> }) {
  const max = Math.max(...Object.values(counts), 1);
  return (
    <>
      <div role="img" aria-label={(Object.keys(counts) as (keyof Counts)[]).map((k) => `${labels[k]} ${counts[k]}`).join(", ")} className="flex h-40 items-end gap-[18px]">
        {(Object.keys(counts) as (keyof Counts)[]).map((band) => (
          <div key={band} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className="font-mono text-[20px] font-medium leading-[1.45]">{counts[band]}</span>
            <div className={cn("w-full rounded-input", fill[band])} style={{ height: Math.round(22 + (counts[band] / max) * 98) }} />
          </div>
        ))}
      </div>
      <div className="flex gap-[5px]">
        {(Object.keys(counts) as (keyof Counts)[]).map((band) => <RiskBadge key={band} band={band} label={labels[band]} />)}
      </div>
    </>
  );
}
