import Link from "next/link";
import { Card } from "@/components/ui/card";
import { store } from "@/data/store";
import { formatDateTime } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { syncStore } from "@/data/persist";

export default async function AuditPage() {
  await syncStore();
  const { t, locale } = await getT();
  const rows = store.audit;
  return (
    <Card className="gap-4 p-6">
      <div className="leading-[1.45]"><h2 className="text-[20px] font-medium tracking-[-0.015em]">{t("settings.security.fullTitle")}</h2><p className="text-[12px] text-ink-muted">{t("settings.security.fullSub", { n: rows.length })}</p></div>
      {rows.length === 0 ? <p className="text-[12px] text-ink-muted">{t("settings.security.auditEmpty")}</p> : (
        <table className="w-full border-collapse text-left font-mono text-[12px]">
          <thead><tr className="text-ink-muted"><th className="py-2 pr-4 font-normal">{t("settings.security.cols.time")}</th><th className="py-2 pr-4 font-normal">{t("settings.security.cols.actor")}</th><th className="py-2 pr-4 font-normal">{t("settings.security.cols.action")}</th><th className="py-2 font-normal">{t("settings.security.cols.subject")}</th></tr></thead>
          <tbody>{rows.map((a) => <tr key={a.id} className="border-t border-line"><td className="py-2 pr-4">{formatDateTime(a.at, locale)}</td><td className="py-2 pr-4">{a.actor}</td><td className="py-2 pr-4">{a.action}</td><td className="py-2">{a.subject}</td></tr>)}</tbody>
        </table>
      )}
      <div><Link href="/settings/security" className="text-[13px] font-medium text-cobalt underline">{t("settings.security.back")}</Link></div>
    </Card>
  );
}
