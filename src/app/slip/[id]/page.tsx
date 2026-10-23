import { notFound } from "next/navigation";
import { Brand } from "@/components/ui/brand";
import { getTriage } from "@/data/repositories/triage";
import { formatLongDate, formatTime } from "@/lib/format";
import { getT } from "@/lib/i18n/server";
import { PrintButton } from "./print-button";
import { syncStore } from "@/data/persist";

/** Printed slip for people without a phone. Date and place only: it never names the condition. */
export default async function Slip({ params }: { params: Promise<{ id: string }> }) {
  await syncStore();
  const { t, locale } = await getT();
  const x = getTriage((await params).id);
  if (!x?.referral) notFound();
  return (
    <main className="mx-auto flex max-w-[560px] flex-col gap-5 bg-surface p-10 print:p-0">
      <Brand shape="pill" />
      <h1 className="font-display text-[26px] font-medium tracking-[-0.03em]">{t("triage.slipTitle")}</h1>
      <p className="text-[18px] font-medium">{x.patientName}</p>
      <p className="text-[16px]">{formatLongDate(x.referral.at, locale)}, {formatTime(x.referral.at, locale)}</p>
      <p className="text-[16px]">{x.referral.place}</p>
      <p className="text-[13px] leading-[1.5] text-ink-muted">{t("triage.slipBody")}</p>
      <p className="font-mono text-[12px] text-ink-muted">{x.code} · {x.centre}</p>
      <PrintButton label={t("triage.printSlip")} />
    </main>
  );
}
