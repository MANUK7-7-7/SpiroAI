"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { settingsSchemas, type SettingsData, type SettingsSection } from "@/data/settings-schemas";
import { useT } from "@/lib/i18n/client";

type Guard = { dirty: boolean; setDirty: (v: boolean) => void; register: (save: () => Promise<boolean>) => void; request: (go: () => void) => void };
const Ctx = createContext<Guard | null>(null);

/** Holds the unsaved-changes state of the visible section and asks before leaving it. */
export function SettingsGuard({ children, section }: { children: (request: Guard["request"]) => React.ReactNode; section: string }) {
  const { t } = useT();
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const saver = useRef<() => Promise<boolean>>(async () => true);
  const register = useCallback((fn: () => Promise<boolean>) => { saver.current = fn; }, []);
  const request = useCallback((go: () => void) => { if (dirty) setPending(() => go); else go(); }, [dirty]);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);
  const value: Guard = { dirty, setDirty, register, request };
  const close = () => setPending(null);
  return (
    <Ctx.Provider value={value}>
      {children(request)}
      <Dialog.Root open={!!pending} onOpenChange={(o) => !o && close()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-scrim" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex w-[560px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-shell bg-surface-sunken p-6 outline-none">
            <Card className="rounded-panel p-6">
              <Dialog.Title className="text-[20px] font-medium tracking-[-0.01em]">{t("settings.unsaved.alert")}</Dialog.Title>
              <Dialog.Description className="text-[12px] text-ink-muted">{t("settings.unsaved.body", { section })}</Dialog.Description>
              <div className="flex flex-wrap justify-end gap-[10px]">
                <Button size="sm" radius="lg" onClick={() => { const go = pending; setDirty(false); close(); go?.(); }}>{t("settings.unsaved.discard")}</Button>
                <Button size="sm" variant="primary" radius="lg" onClick={async () => { const ok = await saver.current(); if (ok) { const go = pending; close(); go?.(); } else close(); }}>{t("settings.unsaved.save")}</Button>
              </div>
            </Card>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Ctx.Provider>
  );
}

export type SaveState = "idle" | "saving" | "saved" | "error";

/** Draft state for one section: tracks changes, validates with the shared Zod schema, saves via the API. */
export function useSection<K extends SettingsSection>(section: K, initial: SettingsData[K]) {
  const guard = useContext(Ctx);
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [state, setState] = useState<SaveState>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => { guard?.setDirty(dirty); }, [dirty, guard]);
  useEffect(() => () => guard?.setDirty(false), [guard]);

  const update = (patch: Partial<SettingsData[K]> | ((d: SettingsData[K]) => SettingsData[K])) => {
    setState("idle");
    setDraft((d) => (typeof patch === "function" ? patch(d) : { ...d, ...patch }));
  };

  const save = useCallback(async (): Promise<boolean> => {
    const parsed = settingsSchemas[section].safeParse(draftRef.current);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path.join(".") || section, i.message])));
      return false;
    }
    setErrors({});
    setState("saving");
    const res = await fetch(`/api/settings/${section}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(parsed.data) }).catch(() => null);
    if (!res?.ok) { setState("error"); return false; }
    setSaved(parsed.data as SettingsData[K]);
    setState("saved");
    router.refresh();
    return true;
  }, [section, router]);
  useEffect(() => { guard?.register(save); }, [guard, save]);

  return { draft, update, save, state, errors, dirty };
}

export function SaveBar({ label, state, onSave, onRetry, savedLabel, children }: { label: string; state: SaveState; onSave: () => void; onRetry: () => void; savedLabel?: string; children?: React.ReactNode }) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-3">
      {state === "error" && <Alert state="error" title={t("settings.save.error")}><button type="button" onClick={onRetry} className="font-medium text-cobalt underline">{t("settings.save.retry")}</button></Alert>}
      {state === "saved" && <Alert state="success" title={savedLabel ?? t("settings.save.changed")} />}
      <div className="flex flex-wrap items-center gap-[10px]">
        <Button variant="primary" onClick={onSave} disabled={state === "saving"}>{label}</Button>
        {children}
      </div>
    </div>
  );
}
