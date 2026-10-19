"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/client";

export function AlreadyHaveAccount() {
  const { t } = useT();
  return (
    <p className="text-[12px] leading-[1.45] text-ink-muted">
      {t("signup.already")} <Link href="/login" className="font-medium text-cobalt">{t("common.login")}</Link>
    </p>
  );
}
