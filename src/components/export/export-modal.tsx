"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectField } from "@/components/ui/field";
import { StateCard } from "@/components/ui/state-card";
import { Tabs } from "@/components/ui/tabs";
import type { ReportModel } from "@/lib/report/model";
import { useT } from "@/lib/i18n/client";
import { ReportPreview } from "./report-preview";

const SECTIONS = ["summary", "trend", "tests", "alerts", "notes"] as const;
const patientFrom = (path: string) => path.match(/^\/patients\/(p-\d+)/)?.[1] ?? path.match(/^\/results\/r-(p-\d+)-/)?.[1];

/** S14: report export over the profile. Opens with ?modal=export. */
export function ExportModalHost() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const patientId = params.get("patient") ?? patientFrom(pathname);
  const close = () => { const n = new URLSearchParams(params.toString()); ["modal", "patient"].forEach((k) => n.delete(k)); router.replace(n.size ? `${pathname}?${n}` : pathname); };
  if (params.get("modal") !== "export" || !patientId) return null;
  return <ExportModal patientId={patientId} close={close} />;
}

function ExportModal({ patientId, close }: { patientId: string; close: () => void }) {
  const { t, locale } = useT();
  const [period, setPeriod] = useState<"full" | "30d" | "6m">("full");
  const [sections, setSections] = useState<Record<(typeof SECTIONS)[number], boolean>>({ summary: true, trend: true, tests: true, alerts: true, notes: true });
  const [audience, setAudience] = useState<"clinical" | "patient">("clinical");
  const [model, setModel] = useState<ReportModel>();
  const [state, setState] = useState<"idle" | "generating" | "ready" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState(false);

  const query = useCallback(() => {
    const q = new URLSearchParams({ sections: SECTIONS.filter((s) => sections[s]).join(","), audience, lang: locale });
    if (period === "30d") { q.set("from", "2026-09-16"); q.set("to", "2026-10-16"); }
    if (period === "6m") { q.set("from", "2026-04-16"); q.set("to", "2026-10-16"); }
    return q;
  }, [sections, audience, locale, period]);

  useEffect(() => {
    let live = true;
    fetch(`/api/patients/${patientId}/report?${query()}`).then((r) => r.json()).then((m) => live && setModel(m)).catch(() => live && setState("error"));
    return () => { live = false; };
  }, [patientId, query]);

  async function download(inline = false) {
    setState("generating"); setProgress(12);
    const tick = setInterval(() => setProgress((p) => Math.min(92, p + 11)), 180);
    try {
      const q = query(); q.set("format", "pdf"); if (inline) q.set("inline", "1");
      const res = await fetch(`/api/patients/${patientId}/report?${q}`);
      clearInterval(tick);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setProgress(100); setState("ready");
      if (inline) window.open(url, "_blank");
      else { const a = document.createElement("a"); a.href = url; a.download = `spiroai-report-${patientId}.pdf`; a.click(); }
    } catch { clearInterval(tick); setState("error"); }
  }

  const periodLabels = { full: t("export.periods.full", { from: "01 Aug", to: "16 Oct 2026" }), "30d": t("export.periods.30d"), "6m": t("export.periods.6m") };

  return (
    <Dialog.Root open onOpenChange={(o) => !o && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100vh-32px)] w-[1120px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-shell bg-surface p-8 outline-none">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <Dialog.Title className="font-display text-[26px] font-medium leading-[1.2] tracking-[-0.03em]">{t("export.title")}</Dialog.Title>
              <Dialog.Description className="text-[12px] text-ink-muted">{t("export.sub", { name: model ? model.meta1.split(" · ")[0] : "…", code: model ? model.meta1.split(" · ")[1] : "" })}</Dialog.Description>
            </div>
            <Dialog.Close aria-label={t("export.close")} className="rounded-full p-2 text-ink-muted hover:bg-surface-soft"><X size={18} /></Dialog.Close>
          </div>
          <div className="grid grid-cols-[330px_1fr] gap-7">
            <div className="flex flex-col gap-5">
              <SelectField label={t("export.period")} value={period} onChange={(e) => setPeriod(e.target.value as typeof period)} options={(["full", "30d", "6m"] as const).map((k) => ({ value: k, label: periodLabels[k] }))} />
              <p className="text-[12px] font-medium uppercase tracking-[0.06em]">{t("export.sections")}</p>
              {SECTIONS.map((s) => <Checkbox key={s} label={t(`export.sec.${s}`)} checked={sections[s]} onCheckedChange={(v) => setSections({ ...sections, [s]: v })} />)}
              <p className="text-[12px] font-medium uppercase tracking-[0.06em]">{t("export.audience")}</p>
              <Tabs label={t("export.audience")} value={audience} onChange={setAudience} tabs={[{ id: "clinical", label: t("export.clinical") }, { id: "patient", label: t("export.patient") }]} />
              <p className="text-[12px] leading-[1.45] text-ink-muted">{t("export.audienceNote1")}<br />{t("export.audienceNote2")}</p>
              {state === "generating" && <GeneratingCard t={t} progress={progress} />}
              {state === "ready" && <Alert state="success" title={t("export.ready")} />}
              {state === "error" && <StateCard kind="error" tag={t("states.error")} message={t("export.failed")} action={t("export.retry")} onAction={() => download()} className="min-h-0" />}
              {model?.empty && state === "idle" && <Alert state="warning" title={t("export.emptyPeriod")} />}
              <div className="flex flex-wrap gap-[10px]">
                <Button variant="primary" onClick={() => download()} disabled={state === "generating" || !!model?.empty}>{state === "generating" ? t("export.generatingBtn") : t("export.download")}</Button>
                <Button onClick={() => setNote(!note)}>{t("export.email")}</Button>
                <Button onClick={() => download(true)} disabled={state === "generating" || !!model?.empty}>{t("export.print")}</Button>
              </div>
              {note && <Alert title={t("export.email")}>{t("export.emailNote")}</Alert>}
              <p className="text-[11px] leading-[1.45] text-ink-muted">{t("export.audit")}</p>
            </div>
            <div>{model ? <ReportPreview model={model} t={t} /> : <StateCard kind="loading" tag={t("states.loading")} loadingLabel={t("states.loadingSecurely", { screen: "S14" })} />}</div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function GeneratingCard({ t, progress }: { t: (k: string, v?: Record<string, string | number>) => string; progress: number }) {
  return (
    <div className="flex flex-col gap-3 rounded-[20px] bg-surface-soft p-4" role="status" aria-live="polite">
      <p className="font-display text-[28px] font-medium tracking-[-0.03em]">{progress}%</p>
      <div className="h-[6px] w-full overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-cobalt transition-[width]" style={{ width: `${progress}%` }} /></div>
      <p className="text-[12px] text-ink-muted">{t("export.preparing")}</p>
      <p className="text-[11px] text-cobalt">{t("export.footerDisclaimer")}</p>
    </div>
  );
}
