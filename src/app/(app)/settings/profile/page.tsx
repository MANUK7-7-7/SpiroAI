import { ProfileForm } from "@/components/settings/profile-form";
import { getCurrentClinician } from "@/data/repositories/clinician";
import { getSettings } from "@/data/repositories/settings";
import { syncStore } from "@/data/persist";

export default async function Page() {
  await syncStore();
  const me = await getCurrentClinician();
  return <ProfileForm initial={getSettings().profile} initials={me.initials} />;
}
