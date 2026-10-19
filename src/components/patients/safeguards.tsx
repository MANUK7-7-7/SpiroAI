import { CircleCheck, Lock, UserPlus } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";

type T = (key: string, vars?: Record<string, string | number>) => string;

/** First-use, duplicate-check and consent safeguards from the Flow B state boards. */
export function FirstPatientCard({ t }: { t: T }) {
  return (
    <Card className="rounded-panel">
      <CardHeading title={t("states.flowB.firstTitle")} />
      <UserPlus size={28} strokeWidth={1.4} className="text-cobalt" aria-hidden />
      <p className="text-[18px] font-medium tracking-[-0.01em]">{t("states.flowB.firstHeading")}</p>
      <div className="text-[12px] leading-[1.45]"><p>{t("states.flowB.first1")}</p><p>{t("states.flowB.first2")}</p><p>{t("states.flowB.first3")}</p></div>
      <div className="flex flex-col items-start gap-[18px]"><Button variant="primary" href="/patients/new">{t("states.flowB.tour")}</Button><Button href="/patients/new">{t("states.flowB.addPatient")}</Button></div>
    </Card>
  );
}

export function DuplicateCard({ t }: { t: T }) {
  return (
    <Card className="rounded-panel">
      <CardHeading title={t("states.flowB.dupTitle")} />
      <div className="flex items-center gap-3"><Avatar initials="SP" className="size-[30px] text-[10px]" /><div className="text-[12px] leading-[1.45]"><p>{t("states.flowB.dupLine1")}</p><p>{t("states.flowB.dupLine2")}</p></div></div>
      <div className="flex flex-col items-start gap-[18px]"><Button variant="primary" href="/patients/p-007">{t("states.flowB.openExisting")}</Button><Button>{t("states.flowB.createSeparate")}</Button></div>
      <Alert state="warning" title={t("states.flowB.discardTitle")}>{t("states.flowB.discardBody")}</Alert>
      <div className="flex gap-2"><Button size="sm" variant="primary">{t("states.flowB.saveDraft")}</Button><Button size="sm">{t("states.flowB.discard")}</Button></div>
    </Card>
  );
}

export function InactiveRevokedCard({ t }: { t: T }) {
  return (
    <Card className="rounded-panel">
      <CardHeading title={t("states.flowB.inactiveTitle")} />
      <Alert state="warning" title={t("states.flowB.inactiveAlert")}>{t("states.flowB.inactiveBody")}</Alert>
      <div><Button size="sm">{t("states.flowB.messagePatient")}</Button></div>
      <Alert state="error" title={t("states.flowB.revokedAlert")}>{t("states.flowB.revokedBody")}</Alert>
      <Lock size={18} strokeWidth={1.6} className="text-ink-muted" aria-hidden />
      <p className="text-[11px] leading-[1.45] text-ink-muted">{t("states.flowB.historyLine")}</p>
      <div><Button size="sm">{t("states.flowB.readOnly")}</Button></div>
    </Card>
  );
}

export function ConnectedBanner({ t }: { t: T }) {
  return (
    <div className="flex items-start gap-3 rounded-[24px] bg-cobalt-tint p-5">
      <CircleCheck size={18} strokeWidth={1.6} className="mt-0.5 text-cobalt" aria-hidden />
      <div className="leading-[1.45]"><p className="text-[13px] font-medium text-cobalt">{t("states.flowB.connectedTitle")}</p><p className="text-[11px] text-ink-muted">{t("states.flowB.connectedBody")}</p></div>
    </div>
  );
}

export function InvitePendingCard({ t }: { t: T }) {
  return (
    <Card className="rounded-panel">
      <CardHeading title={t("states.flowB.pendingTitle")} />
      <p className="text-[13px] leading-[1.45]">{t("states.flowB.pendingBody")}</p>
      <div><Button size="sm">{t("states.flowB.resend")}</Button></div>
    </Card>
  );
}
