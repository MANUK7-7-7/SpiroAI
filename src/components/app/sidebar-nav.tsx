"use client";

import { Bell, LayoutDashboard, MessageSquare, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const icons = { dashboard: LayoutDashboard, patients: Users, alerts: Bell, messages: MessageSquare, settings: Settings } as const;
type Item = { href: string; match?: string; icon: keyof typeof icons; label: string; badge?: number };

export function SidebarNav({ items }: { items: Item[]; alertCount?: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="flex flex-col gap-2">
      {items.map(({ href, match, icon, label, badge }) => {
        const Icon = icons[icon];
        const active = pathname === (match ?? href) || pathname.startsWith(`${match ?? href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn("flex h-11 items-center gap-[10px] rounded-[18px] p-3 text-[13px] leading-[1.45]", active ? "bg-ink font-medium tracking-[-0.01em] text-on-accent" : "text-ink tracking-[-0.005em] hover:bg-surface-soft")}
          >
            <Icon size={18} strokeWidth={1.8} aria-hidden />
            <span className="min-w-0 flex-1">{label}</span>
            {badge ? <span className={cn("text-[11px]", active ? "text-on-accent" : "text-risk-high")}>{badge}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
