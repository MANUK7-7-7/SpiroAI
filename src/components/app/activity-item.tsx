import { AudioLines, CheckCheck, UserCheck } from "lucide-react";

const icons = { test_completed: AudioLines, invite_accepted: UserCheck, plan_updated: CheckCheck } as const;

export function ActivityRow({ type, title, detail }: { type: keyof typeof icons; title: string; detail: string }) {
  const Icon = icons[type];
  return (
    <li className="flex items-start gap-3">
      <Icon size={20} strokeWidth={1.8} className="shrink-0" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-1 leading-[1.45]">
        <p className="text-[13px] font-medium tracking-[-0.01em] text-ink">{title}</p>
        <p className="text-[11px] tracking-[-0.005em] text-ink-muted">{detail}</p>
      </div>
    </li>
  );
}
