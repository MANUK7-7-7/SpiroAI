"use client";

import { Bell, LayoutDashboard, MessageSquare, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const icons = { dashboard: LayoutDashboard, patients: Users, alerts: Bell, messages: MessageSquare, settings: Settings } as const;

export function TabletTabs({ items }: { items: { href: string; match: string[]; label: string; icon: keyof typeof icons }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="sticky bottom-4 z-30 flex justify-around rounded-card bg-surface px-2 py-4 shadow-[0_8px_30px_rgb(14_16_20/0.06)] lg:hidden">
      {items.map(({ href, match, label, icon }) => {
        const Icon = icons[icon];
        const active = match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex min-w-16 flex-col items-center gap-1 text-[11px]", active ? "text-cobalt" : "text-ink-muted")}>
            <Icon size={20} strokeWidth={1.6} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
