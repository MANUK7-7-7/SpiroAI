import { NotificationsForm } from "@/components/settings/notifications-form";
import { getSettings } from "@/data/repositories/settings";

export default function Page() {
  return <NotificationsForm initial={getSettings().notifications} />;
}
