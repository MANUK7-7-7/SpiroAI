"use client";

import { useCallback, useEffect, useState } from "react";

export type SignupDraft = {
  fullName: string; email: string; password: string;
  license: string; specialty: string; institution: string; country: string; city: string;
};
export const emptyDraft: SignupDraft = { fullName: "", email: "", password: "", license: "", specialty: "", institution: "", country: "", city: "" };
const KEY = "spiro.signup.draft";

/** Progress is saved on this device only; the password is never persisted. */
export function useSignupDraft() {
  const [draft, setDraft] = useState<SignupDraft>(emptyDraft);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setDraft({ ...emptyDraft, ...JSON.parse(raw) });
    } catch {}
    setReady(true);
  }, []);
  const save = useCallback((patch: Partial<SignupDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      try {
        const { password: _omit, ...rest } = next;
        localStorage.setItem(KEY, JSON.stringify(rest));
      } catch {}
      return next;
    });
  }, []);
  const clear = useCallback(() => { try { localStorage.removeItem(KEY); } catch {} }, []);
  return { draft, save, clear, ready };
}
