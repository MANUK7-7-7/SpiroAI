"use client";

import { StateCard } from "@/components/ui/state-card";
import { useT } from "@/lib/i18n/client";

/** Route-level error panel: the designed "error" state with a retry. */
export function ErrorPanel({ message, reset }: { message: string; reset: () => void }) {
  const { t } = useT();
  return <StateCard kind="error" tag={t("states.error")} message={message} action={t("states.retry")} onAction={reset} />;
}

export function EmptyPanel({ message, action, href }: { message: string; action?: string; href?: string }) {
  const { t } = useT();
  return <StateCard kind="empty" tag={t("states.empty")} message={message} action={action} href={href} />;
}

export function LoadingPanel({ screen }: { screen: string }) {
  const { t } = useT();
  return <StateCard kind="loading" tag={t("states.loading")} loadingLabel={t("states.loadingSecurely", { screen })} />;
}
