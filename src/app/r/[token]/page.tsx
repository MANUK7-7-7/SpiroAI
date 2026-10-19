import { PublicShell } from "@/components/public/public-shell";
import { RecorderFlow } from "@/components/recorder/recorder-flow";
import { StateCard } from "@/components/ui/state-card";
import { getInvite } from "@/data/repositories/recordings";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/** Channel 2: the patient records on a computer from the invitation link. No account, no score shown. */
export default async function PatientRecording({ params }: { params: Promise<{ token: string }> }) {
  const { t } = await getT();
  const invite = getInvite((await params).token);
  return (
    <PublicShell>
      <div className="py-6">
        {invite ? (
          <RecorderFlow mode="patient" token={invite.token} firstName={invite.patient.firstName} consentGiven={invite.consentGiven} />
        ) : (
          <div className="mx-auto max-w-[720px]"><StateCard kind="error" tag={t("states.error")} message={`${t("rec.invalid.title")}. ${t("rec.invalid.body")}`} action={t("rec.invalid.home")} href="/" /></div>
        )}
      </div>
    </PublicShell>
  );
}
