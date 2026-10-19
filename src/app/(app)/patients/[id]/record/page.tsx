import { notFound } from "next/navigation";
import { RecorderFlow } from "@/components/recorder/recorder-flow";
import { getPatient } from "@/data/repositories/patients";

export const dynamic = "force-dynamic";

/** Channel 3: assisted recording in the clinic. The clinician confirms the patient's consent. */
export default async function AssistedRecording({ params }: { params: Promise<{ id: string }> }) {
  const patient = await getPatient((await params).id);
  if (!patient) notFound();
  return (
    <div className="rounded-card bg-surface p-8 shadow-[inset_0_0_0_1px_var(--line)] max-lg:p-5">
      <RecorderFlow mode="assisted" patientId={patient.id} patientName={patient.name} patientCode={patient.code} consent={patient.consent} />
    </div>
  );
}
