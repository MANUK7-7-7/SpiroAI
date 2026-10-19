import { HelpForm } from "@/components/settings/help-form";
import { getSettings } from "@/data/repositories/settings";

export default function Page() {
  return <HelpForm initial={getSettings().help} />;
}
