"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { FilterChip } from "@/components/ui/filter-chip";
import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";

export function DemoControls({ labels }: { labels: { check: string; switch: string; switchDesc: string; chips: string[]; tabs: { id: string; label: string }[]; tablist: string } }) {
  const [c, setC] = useState(true);
  const [s, setS] = useState(true);
  const [chip, setChip] = useState(0);
  const [tab, setTab] = useState(labels.tabs[0].id);
  return (
    <div className="flex flex-col gap-4">
      <Checkbox label={labels.check} checked={c} onCheckedChange={setC} />
      <Switch checked={s} onCheckedChange={setS} label={labels.switch} description={labels.switchDesc} />
      <div className="flex flex-wrap gap-2">{labels.chips.map((l, i) => <FilterChip key={l} label={l} selected={i === chip} onClick={() => setChip(i)} />)}</div>
      <Tabs tabs={labels.tabs} value={tab} onChange={setTab} label={labels.tablist} />
    </div>
  );
}
