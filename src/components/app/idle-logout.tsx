"use client";

import { useEffect } from "react";

/** Shared clinic computers: log out after inactivity. */
export function IdleLogout({ minutes }: { minutes: number }) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const logout = async () => {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      window.location.href = "/login?reason=timeout";
    };
    const reset = () => { clearTimeout(timer); timer = setTimeout(logout, minutes * 60_000); };
    const events = ["pointerdown", "keydown", "scroll", "visibilitychange"] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => { clearTimeout(timer); events.forEach((e) => window.removeEventListener(e, reset)); };
  }, [minutes]);
  return null;
}
