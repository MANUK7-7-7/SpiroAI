import { Button } from "@/components/ui/button";
import { Title } from "@/components/ui/title";

export function PageHeading({ eyebrow, title, size = 30, action }: { eyebrow?: React.ReactNode; title: string; size?: number; action?: { label: string; href: string; icon?: React.ReactNode } }) {
  return (
    <div className="flex items-center gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
        {eyebrow && <p className="text-[12px] leading-[1.45] tracking-[-0.005em] text-ink-muted">{eyebrow}</p>}
        <Title size={size}>{title}</Title>
      </div>
      {action && <Button variant="primary" href={action.href}>{action.icon}{action.label}</Button>}
    </div>
  );
}
