import { SecurityForm } from "@/components/settings/security-form";
import { getSettings } from "@/data/repositories/settings";
import { store } from "@/data/store";
import { formatDateTime } from "@/lib/format";
import { getT } from "@/lib/i18n/server";

export default async function Page() {
  const { locale } = await getT();
  const audit = store.audit.slice(0, 4).map((a) => ({ id: a.id, when: formatDateTime(a.at, locale), line: `${a.action} · ${a.subject}` }));
  return <SecurityForm initial={getSettings().security} audit={audit} />;
}
