import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { TriageFlow } from "@/components/triage/triage-flow";
import { loadAiConfig } from "@/ai/config";
import { AGENT, AGENT_VISITS } from "@/data/fixtures/agent";
import { getT } from "@/lib/i18n/server";
import { syncStore } from "@/data/persist";

/** The same triage as in the centre, done at the person's home. Details from the visit list come filled in. */
export default async function AgentNewTriage({ searchParams }: { searchParams: Promise<{ visit?: string }> }) {
  await syncStore();
  const { t } = await getT();
  const { visit: visitId } = await searchParams;
  const visit = AGENT_VISITS.find((v) => v.id === visitId);
  return (
    <>
      <div className="flex items-center gap-3">
        <Link href="/agent" aria-label={t("triage.back")} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface"><ChevronLeft size={20} aria-hidden /></Link>
        <div className="min-w-0 leading-[1.3]">
          <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-ink-muted">{t("agent.homeVisit")}{visit ? ` · ${visit.address}` : ""}</p>
          <h1 className="font-display text-[24px] font-medium tracking-[-0.03em]">{t("triage.new")}</h1>
        </div>
      </div>
      <TriageFlow centres={[AGENT.centre]} voiceEnabled={loadAiConfig().enabled} basePath="/agent/triage"
        initial={visit ? { name: visit.name, age: visit.age, sex: visit.sex } : undefined} />
    </>
  );
}
