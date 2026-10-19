"use client";

import { useEffect } from "react";
import { IDLE_TIMEOUT_MS } from "@/lib/session";

/** Shared clinic computers: log out after inactivity. */
export function IdleLogout() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const logout = async () => {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      window.location.href = "/login?reason=timeout";
    };
    const reset = () => { clearTimeout(timer); timer = setTimeout(logout, IDLE_TIMEOUT_MS); };
    const events = ["pointerdown", "keydown", "scroll", "visibilitychange"] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => { clearTimeout(timer); events.forEach((e) => window.removeEventListener(e, reset)); };
  }, []);
  return null;
}
