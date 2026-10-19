"use client";

import { ErrorPanel } from "@/components/app/data-state";
import { useT } from "@/lib/i18n/client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const { t } = useT();
  return <ErrorPanel message={t("dashboard.queue.error")} reset={reset} />;
}
