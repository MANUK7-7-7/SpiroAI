import { PageHeading } from "@/components/app/page-heading";
import { TriageFlow } from "@/components/triage/triage-flow";
import { loadAiConfig } from "@/ai/config";
import { CENTRES } from "@/data/fixtures/triage";
import { getT } from "@/lib/i18n/server";

export default async function NewTriage() {
  const { t } = await getT();
  return (
    <>
      <PageHeading eyebrow={t("triage.nav").toUpperCase()} title={t("triage.new")} />
      <TriageFlow centres={[...CENTRES]} voiceEnabled={loadAiConfig().enabled} />
    </>
  );
}
