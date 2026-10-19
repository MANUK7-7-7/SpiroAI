"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, SelectField } from "@/components/ui/field";
import { StateCard } from "@/components/ui/state-card";
import { Switch } from "@/components/ui/switch";
import type { Member, SettingsData } from "@/data/settings-schemas";
import { useT } from "@/lib/i18n/client";
import { Panel } from "./panel";
import { SaveBar, useSection } from "./section";

const initials = (n: string) => n.replace(/^Dr\.\s*/, "").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export function TeamForm({ initial, members }: { initial: SettingsData["team"]; members: Member[] }) {
  const { t } = useT();
  const router = useRouter();
  const { draft, update, save, state } = useSection("team", initial);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("doctor");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const pending = members.filter((m) => m.pending).length;
  const active = members.length - pending;

  async function invite() {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMsg({ kind: "err", text: t("settings.team.errEmail") });
    const res = await fetch("/api/team", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, role }) });
    if (!res.ok) return setMsg({ kind: "err", text: t("settings.save.error") });
    setMsg({ kind: "ok", text: t("settings.team.invited", { email }) });
    setEmail("");
    router.refresh();
  }
  async function act(id: string, op: "resend" | "cancel" | "remove") {
    await fetch(`/api/team/${id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ op }) });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel title={t("settings.nav.team")} sub={t("settings.team.sub", { n: active, p: pending })}>
        <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); invite(); }} noValidate>
          <Field className="min-w-[240px] flex-1" label={t("settings.team.email")} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setMsg(null); }} />
          <SelectField className="w-[160px]" label={t("settings.team.role")} value={role} onChange={(e) => setRole(e.target.value)} options={(["doctor", "nurse", "admin"] as const).map((r) => ({ value: r, label: t(`settings.team.roles.${r}`) }))} />
          <Button variant="primary" type="submit">{t("settings.team.invite")}</Button>
        </form>
        {msg && <Alert state={msg.kind === "ok" ? "success" : "error"} title={msg.text} />}
        {members.length <= 1 ? (
          <StateCard kind="empty" tag={t("states.empty")} message={t("settings.team.empty")} className="min-h-[140px]" />
        ) : null}
        <ul className="flex flex-col gap-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-[16px] bg-surface-soft p-3">
              <Avatar initials={initials(m.name)} />
              <div className="flex min-w-0 flex-1 flex-col leading-[1.45]">
                <p className="truncate text-[14px] font-medium tracking-[-0.01em]">{m.name.replace(/\b\w/g, (c) => c.toUpperCase())}</p>
                <p className="text-[12px] text-ink-muted">{m.role === "owner" ? t("settings.team.owner") : `${t(`settings.team.roles.${m.role}`)} · ${m.pending ? t("settings.team.pending") : t("settings.team.active")}`}</p>
              </div>
              {m.pending && (
                <div className="flex gap-2">
                  <Button size="sm" radius="lg" onClick={() => act(m.id, "resend")}>{t("settings.team.resend")}</Button>
                  <Button size="sm" radius="lg" onClick={() => act(m.id, "cancel")}>{t("settings.team.cancelInvite")}</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
        <Switch checked={draft.shared} onCheckedChange={(v) => update({ shared: v })} label={t("settings.team.shared")} description={t("settings.team.sharedDesc")} />
        <SaveBar label={t("settings.team.save")} state={state} onSave={save} onRetry={save} />
      </Panel>
      <Card className="gap-3 p-6">
        <h2 className="text-[18px] font-medium tracking-[-0.01em]">{t("settings.team.permTitle")}</h2>
        {(["permDoctor", "permNurse", "permAdmin"] as const).map((k) => <p key={k} className="text-[13px] leading-[1.45] text-ink-muted">{t(`settings.team.${k}`)}</p>)}
        <Alert state="info" title={t("settings.team.nurseTitle")}>{t("settings.team.nurseBody")}</Alert>
      </Card>
    </div>
  );
}
