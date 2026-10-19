import { Card } from "@/components/ui/card";

export function Panel({ title, sub, children, action }: { title: string; sub?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card className="gap-5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 leading-[1.45]">
          <h2 className="text-[20px] font-medium tracking-[-0.015em] text-ink">{title}</h2>
          {sub && <p className="text-[12px] tracking-[-0.005em] text-ink-muted">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}
