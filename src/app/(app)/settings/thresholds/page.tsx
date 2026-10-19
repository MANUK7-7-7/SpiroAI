import { ThresholdsForm } from "@/components/settings/thresholds-form";
import { getSettings } from "@/data/repositories/settings";

export default function Page() {
  return <ThresholdsForm initial={getSettings().thresholds} />;
}
