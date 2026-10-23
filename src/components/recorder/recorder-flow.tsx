"use client";

import { AlertTriangle, CheckCircle2, Mic as MicIcon, MicOff, RotateCcw, Square } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AudioTaskId } from "@/ai/contracts";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectField } from "@/components/ui/field";
import { MIC_CHECK_SECONDS, MIC_STORAGE_KEY, taskLimits, triageTaskLimits, type RecordingProtocol } from "@/config/recording";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";
import { analyseCheck, deviceMeta, encodeWav, MicFailure, openMic, startCapture, supportsRecording, toDb, type Capture, type CheckResult, type Mic } from "@/lib/recorder/capture";
import { uploadTask } from "@/lib/recorder/upload";

type Props =
  | { mode: "patient"; token: string; firstName: string; consentGiven: boolean }
  | {
      mode: "assisted"; patientId: string; patientName: string; patientCode: string; consent: "active" | "pending" | "revoked";
      /** "triage" records about 10 seconds (vowel plus one sentence) and hands control back with onUploaded. */
      protocol?: RecordingProtocol; onUploaded?: (recordingId: string) => void;
    };

type Step = "consent" | "setup" | "check" | "vowel" | "reading" | "send" | "done";
type Take = { blob: Blob; url: string; seconds: number };
const tasks = ["vowel", "reading"] as const;
const taskId = { vowel: "sustained_vowel", reading: "reading_passage" } as const satisfies Record<string, AudioTaskId>;

const store = {
  get: () => { try { return localStorage.getItem(MIC_STORAGE_KEY) ?? undefined; } catch { return undefined; } },
  set: (v: string) => { try { localStorage.setItem(MIC_STORAGE_KEY, v); } catch { /* private window */ } },
};

function useLevel() {
  const ref = useRef(0);
  const [level, setLevel] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => { setLevel((l) => (Math.abs(l - ref.current) > 0.01 ? ref.current : l)); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  // Map -60..0 dBFS to 0..1 for display.
  return [level, (rms: number) => { ref.current = Math.max(0, Math.min(1, (toDb(rms) + 60) / 60)); }] as const;
}

function Meter({ level, label }: { level: number; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] text-ink-muted">{label}</p>
      <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level * 100)} className="h-2 w-full overflow-hidden rounded-full bg-surface-soft">
        <div className="h-full rounded-full bg-cobalt transition-[width] duration-75" style={{ width: `${level * 100}%` }} />
      </div>
    </div>
  );
}

export function RecorderFlow(props: Props) {
  const { t } = useT();
  const assisted = props.mode === "assisted";
  const initialConsent = assisted ? props.consent === "active" : props.consentGiven;
  const [step, setStep] = useState<Step>(initialConsent ? "setup" : "consent");
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [mic, setMic] = useState<Mic | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [check, setCheck] = useState<{ state: "idle" | "running" | "done"; seconds: number; result?: CheckResult }>({ state: "idle", seconds: 0 });
  const [takes, setTakes] = useState<Partial<Record<(typeof tasks)[number], Take>>>({});
  const [level, pushLevel] = useLevel();
  const micRef = useRef<Mic | null>(null);
  micRef.current = mic;
  useEffect(() => () => micRef.current?.close(), []);

  const revoked = assisted && props.consent === "revoked";
  const stepNumber = { consent: 1, setup: 1, check: 2, vowel: 3, reading: 4, send: 5, done: 5 }[step];
  const total = 5;

  async function allow(id?: string) {
    setMicError(null);
    mic?.close();
    try {
      const m = await openMic(id ?? deviceId ?? store.get());
      setMic(m);
      const list = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "audioinput");
      setDevices(list);
      const current = m.applied.deviceId;
      setDeviceId(current);
      if (current) store.set(current);
      setStep("check");
      setCheck({ state: "idle", seconds: 0 });
    } catch (e) {
      // A remembered device that is no longer plugged in must not block the patient.
      if (e instanceof MicFailure && e.kind === "none" && (id ?? deviceId ?? store.get())) { setDeviceId(undefined); try { localStorage.removeItem(MIC_STORAGE_KEY); } catch { /* ignore */ } return allow(undefined); }
      setMicError(e instanceof MicFailure ? e.kind : "error");
    }
  }

  function runCheck() {
    if (!mic) return;
    setCheck({ state: "running", seconds: MIC_CHECK_SECONDS });
    const cap = startCapture(mic, (f) => pushLevel(f.rms));
    let left = MIC_CHECK_SECONDS;
    const timer = setInterval(() => {
      left -= 1;
      if (left > 0) return setCheck({ state: "running", seconds: left });
      clearInterval(timer);
      pushLevel(0);
      setCheck({ state: "done", seconds: 0, result: analyseCheck(cap.stop(), mic.applied.sampleRate) });
    }, 1000);
  }

  const record = (name: (typeof tasks)[number], take: Take) => setTakes((p) => ({ ...p, [name]: take }));
  const drop = (name: (typeof tasks)[number]) => setTakes((p) => { if (p[name]) URL.revokeObjectURL(p[name]!.url); const n = { ...p }; delete n[name]; return n; });

  const header = (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-ink-muted">{t("rec.step", { n: stepNumber, total })}</p>
      <h1 className="font-display text-[28px] font-medium leading-[1.2] tracking-[-0.035em]">{assisted ? t("rec.assistedTitle") : t("rec.patientTitle")}</h1>
      {assisted ? <p className="text-[13px] text-ink-muted">{t("rec.assisted.patient")}: {props.patientName} · {props.patientCode}</p> : <p className="text-[13px] text-ink-muted">{t("rec.hello", { name: props.firstName })}</p>}
    </div>
  );

  if (!supportsRecording() && typeof window !== "undefined") {
    return <Shell>{header}<Alert state="warning" title={t("rec.unsupported.title")}>{t("rec.unsupported.body")}</Alert></Shell>;
  }

  if (revoked) return <Shell>{header}<Alert state="error" title={t("rec.consent.revoked")} /></Shell>;

  return (
    <Shell>
      {header}
      <ol className="flex gap-1" aria-hidden>{Array.from({ length: total }, (_, i) => <li key={i} className={cn("h-1 flex-1 rounded-full", i < stepNumber ? "bg-cobalt" : "bg-surface-soft")} />)}</ol>

      {step === "consent" && (
        <>
          <Card className="gap-4 p-6">
            <h2 className="text-[18px] font-medium tracking-[-0.01em]">{assisted ? t("rec.assisted.consentTitle") : t("rec.consent.title")}</h2>
            {!assisted && <p className="text-[13px] leading-[1.5] text-ink-muted">{t("rec.consent.body")}</p>}
            <Checkbox label={assisted ? t("rec.consent.assisted") : t("rec.consent.check")} checked={consent} onCheckedChange={(v) => { setConsent(v); setConsentError(false); }} error={consentError ? t("rec.consent.required") : undefined} />
            {assisted && <p className="text-[11px] text-ink-muted">{t("rec.consent.assistedNote")}</p>}
          </Card>
          {!assisted && <p className="text-[13px] leading-[1.5] text-ink-muted">{t("rec.intro")}</p>}
          <Tips />
          <div>
            <Button variant="primary" onClick={async () => {
              if (!consent) return setConsentError(true);
              if (!assisted) { const r = await fetch(`/api/invites/${props.token}/consent`, { method: "POST" }); if (!r.ok) return setConsentError(true); }
              setStep("setup");
            }}>{t("rec.consent.continue")}</Button>
          </div>
        </>
      )}

      {step === "setup" && (
        <>
          {!assisted && <p className="text-[13px] leading-[1.5] text-ink-muted">{t("rec.intro")}</p>}
          <Tips />
          <Card className="gap-4 p-6">
            <h2 className="text-[18px] font-medium tracking-[-0.01em]">{t("rec.perm.title")}</h2>
            <p className="text-[13px] leading-[1.5] text-ink-muted">{t("rec.perm.body")}</p>
            {micError && <MicProblem kind={micError} />}
            <div className="flex flex-wrap gap-[10px]">
              <Button variant="primary" onClick={() => allow()}><MicIcon size={16} aria-hidden />{micError ? t("rec.perm.deniedAction") : t("rec.perm.allow")}</Button>
            </div>
          </Card>
        </>
      )}

      {step === "check" && mic && (
        <Card className="gap-4 p-6">
          <h2 className="text-[18px] font-medium tracking-[-0.01em]">{t("rec.check.title")}</h2>
          {devices.length > 1 && (
            <SelectField label={t("rec.perm.mic")} value={deviceId ?? ""} onChange={(e) => { setDeviceId(e.target.value); void allow(e.target.value); }} options={devices.map((d, i) => ({ value: d.deviceId, label: d.label || `${t("rec.perm.mic")} ${i + 1}` }))} />
          )}
          <p className="text-[13px] leading-[1.5] text-ink-muted">{t("rec.check.body")}</p>
          <Meter level={level} label={t("rec.check.level")} />
          <dl className="grid grid-cols-3 gap-3 text-[11px] text-ink-muted max-lg:grid-cols-1" aria-label={t("rec.check.settings")}>
            {([["echo", mic.applied.echoCancellation], ["noiseSup", mic.applied.noiseSuppression], ["agc", mic.applied.autoGainControl]] as const).map(([k, on]) => (
              <div key={k}><dt>{t(`rec.check.${k}`)}</dt><dd className="font-medium text-ink">{on ? t("rec.check.on") : t("rec.check.off")}</dd></div>
            ))}
          </dl>
          {check.state === "running" && <p role="status" className="text-[13px] font-medium text-cobalt">{t("rec.check.measuring", { s: check.seconds })}</p>}
          {check.state === "done" && check.result && <CheckOutcome r={check.result} />}
          <div className="flex flex-wrap gap-[10px]">
            {check.state !== "running" && <Button variant={check.state === "done" && check.result?.verdict === "good" ? "secondary" : "primary"} onClick={runCheck}>{check.state === "done" ? t("rec.check.again") : t("rec.check.start")}</Button>}
            {check.state === "done" && check.result?.verdict === "good" && <Button variant="primary" onClick={() => setStep("vowel")}>{t("rec.check.continue")}</Button>}
          </div>
        </Card>
      )}

      {(step === "vowel" || step === "reading") && mic && (
        <TaskStep key={step} name={step} mic={mic} take={takes[step]} level={level} pushLevel={pushLevel} triage={assisted && props.protocol === "triage"}
          onTake={(tk) => record(step, tk)} onRedo={() => drop(step)}
          onNext={() => setStep(step === "vowel" ? "reading" : "send")} last={step === "reading"} assisted={assisted} />
      )}

      {step === "send" && mic && takes.vowel && takes.reading && (
        <SendStep props={props} mic={mic} check={check.result} takes={{ vowel: takes.vowel, reading: takes.reading }} onDone={(id) => { mic.close(); if (assisted && props.onUploaded) props.onUploaded(id); else setStep("done"); }} />
      )}

      {step === "done" && <DoneStep props={props} onRepeat={() => { setTakes({}); setMic(null); setStep("setup"); }} />}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">{children}</div>;
}

function Tips() {
  const { t } = useT();
  return (
    <Card tint className="gap-2 p-5">
      <h2 className="text-[14px] font-medium text-cobalt">{t("rec.tips.title")}</h2>
      <ul className="list-disc pl-5 text-[13px] leading-[1.6] text-ink-muted">{(["room", "distance", "mic", "noaudio"] as const).map((k) => <li key={k}>{t(`rec.tips.${k}`)}</li>)}</ul>
    </Card>
  );
}

function MicProblem({ kind }: { kind: string }) {
  const { t } = useT();
  const k = kind === "denied" ? "denied" : kind === "none" ? "none" : kind === "busy" ? "busy" : "error";
  return <Alert state="error" title={t(`rec.perm.${k}`)}><span className="flex items-start gap-2"><MicOff size={14} className="mt-0.5 shrink-0" aria-hidden />{t(`rec.perm.${k}Body`)}</span></Alert>;
}

function CheckOutcome({ r }: { r: CheckResult }) {
  const { t } = useT();
  const key = r.verdict === "good" ? "good" : r.verdict === "noisy" ? "noisy" : r.verdict === "clip" ? "clip" : "quiet";
  return (
    <div className="flex flex-col gap-2">
      <Alert state={r.verdict === "good" ? "success" : "warning"} title={t(`rec.check.${key}`)}>{t(`rec.check.${key}Body`)}</Alert>
      <p className="text-[11px] text-ink-muted">{t("rec.check.noise", { db: r.noiseDb })}</p>
    </div>
  );
}

function TaskStep({ name, mic, take, level, pushLevel, onTake, onRedo, onNext, last, assisted, triage }: {
  name: "vowel" | "reading"; mic: Mic; take?: Take; level: number; pushLevel: (rms: number) => void; onTake: (t: Take) => void; onRedo: () => void; onNext: () => void; last: boolean; assisted: boolean; triage?: boolean;
}) {
  const { t } = useT();
  const limits = (triage ? triageTaskLimits : taskLimits)[taskId[name]];
  // The triage protocol replaces the reading passage with one short sentence.
  const k = triage && name === "reading" ? "sentence" : name;
  const [state, setState] = useState<"idle" | "recording">("idle");
  const [seconds, setSeconds] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const cap = useRef<Capture | null>(null);
  const started = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  const stop = useCallback((auto = false) => {
    clearInterval(timer.current);
    const samples = cap.current?.stop();
    cap.current = null;
    pushLevel(0);
    setState("idle");
    if (!samples) return;
    const secs = samples.length / mic.applied.sampleRate;
    if (secs < limits.min) { setMsg(t("rec.task.tooShort", { min: limits.min })); return; }
    setMsg(auto ? t("rec.task.auto") : null);
    const blob = encodeWav(samples, mic.applied.sampleRate);
    onTake({ blob, url: URL.createObjectURL(blob), seconds: Math.round(secs * 10) / 10 });
  }, [limits.min, mic.applied.sampleRate, onTake, pushLevel, t]);

  useEffect(() => () => { clearInterval(timer.current); cap.current?.stop(); }, []);
  // The stream can end if the microphone is unplugged mid-take.
  useEffect(() => {
    const track = mic.stream.getAudioTracks()[0];
    const ended = () => { clearInterval(timer.current); cap.current?.stop(); cap.current = null; setState("idle"); setMsg(t("rec.task.interrupted")); };
    track.addEventListener("ended", ended);
    return () => track.removeEventListener("ended", ended);
  }, [mic, t]);

  function start() {
    setMsg(null);
    cap.current = startCapture(mic, (f) => pushLevel(f.rms));
    started.current = performance.now();
    setSeconds(0);
    setState("recording");
    timer.current = setInterval(() => {
      const s = (performance.now() - started.current) / 1000;
      setSeconds(Math.floor(s));
      if (s >= limits.max) stop(true);
    }, 250);
  }

  const canStop = seconds >= limits.min;
  return (
    <Card className="gap-4 p-6">
      <h2 className="text-[18px] font-medium tracking-[-0.01em]">{t(`rec.task.${k}.name`)}</h2>
      <p className="text-[13px] leading-[1.5] text-ink-muted">{t(`rec.task.${k}.body`)}</p>
      {name === "reading" && <blockquote className="rounded-[16px] bg-surface-soft p-4 text-[16px] leading-[1.6]">{t(`rec.task.${k}.text`)}</blockquote>}
      <p className="text-[12px] text-ink-muted">{t(`rec.task.${k}.hint`, { min: limits.min })}</p>
      {!take && <Meter level={level} label={t("rec.check.level")} />}
      {msg && <Alert state="warning" title={msg} />}
      {!take ? (
        <div className="flex items-center gap-3">
          {state === "idle" ? <Button variant="primary" onClick={start}><MicIcon size={16} aria-hidden />{t("rec.task.start")}</Button> : (
            <>
              <Button variant="primary" onClick={() => stop()} disabled={!canStop}><Square size={14} aria-hidden />{t("rec.task.stop")}</Button>
              <p role="status" className="text-[13px] font-medium text-cobalt"><span className="mr-2 inline-block size-2 animate-pulse rounded-full bg-cobalt align-middle" aria-hidden />{t("rec.task.recording", { s: seconds })}</p>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <h3 className="text-[14px] font-medium">{t("rec.review.title")}</h3>
          <p className="text-[12px] text-ink-muted">{t("rec.review.body")} · {t("rec.review.length", { s: take.seconds })}</p>
          <audio controls src={take.url} className="w-full" aria-label={t(`rec.task.${k}.name`)} />
          <div className="flex flex-wrap gap-[10px]">
            <Button onClick={onRedo}><RotateCcw size={14} aria-hidden />{t("rec.review.again")}</Button>
            <Button variant="primary" onClick={onNext}>{last ? (assisted ? t("rec.review.allAssisted") : t("rec.review.all")) : t("rec.review.next")}</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function SendStep({ props, mic, check, takes, onDone }: { props: Props; mic: Mic; check?: CheckResult; takes: { vowel: Take; reading: Take }; onDone: (recordingId: string) => void }) {
  const { t } = useT();
  const [pct, setPct] = useState(0);
  const [failed, setFailed] = useState(false);
  const session = useRef<{ id: string; secret: string } | null>(null);
  const running = useRef(false);

  const send = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setFailed(false);
    try {
      if (!session.current) {
        const body = props.mode === "patient"
          ? { mode: "patient", token: props.token, device: deviceMeta(mic.applied, "patient"), micCheck: check ? "passed" : "skipped" }
          : { mode: "assisted", patientId: props.patientId, consentConfirmed: true, device: deviceMeta(mic.applied, "assisted"), micCheck: check ? "passed" : "skipped", protocol: props.protocol ?? "monitoring" };
        const res = await fetch("/api/recordings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error("SESSION");
        const created = (await res.json()) as { id: string; secret: string };
        session.current = created;
        sessionStorage.setItem("spiro_rec", JSON.stringify(created));
      }
      const { id, secret } = session.current!;
      const s = props.mode === "patient" ? secret : null;
      await uploadTask(id, s, "sustained_vowel", takes.vowel.blob, (f) => setPct(Math.round(f * 50)));
      await uploadTask(id, s, "reading_passage", takes.reading.blob, (f) => setPct(50 + Math.round(f * 50)));
      const done = await fetch(`/api/recordings/${id}/complete`, { method: "POST", headers: s ? { "x-recording-secret": s } : {} });
      if (!done.ok) throw new Error("COMPLETE");
      onDone(id);
    } catch {
      setFailed(true);
    } finally {
      running.current = false;
    }
  }, [props, mic, check, takes, onDone]);

  useEffect(() => { void send(); }, [send]);

  return (
    <Card className="gap-4 p-6">
      <h2 className="text-[18px] font-medium tracking-[-0.01em]">{t("rec.upload.title")}</h2>
      {failed ? (
        <>
          <Alert state="error" title={t("rec.upload.retry")} />
          <div><Button variant="primary" onClick={send}>{t("rec.upload.retryAction")}</Button></div>
        </>
      ) : (
        <div className="flex flex-col gap-2" aria-busy>
          <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-2 overflow-hidden rounded-full bg-surface-soft"><div className="h-full bg-cobalt transition-[width]" style={{ width: `${pct}%` }} /></div>
          <p role="status" className="text-[12px] text-ink-muted">{t("rec.upload.sending", { pct })}</p>
        </div>
      )}
    </Card>
  );
}

type Poll = { outcome: string; resultId?: string; reasons?: string[]; retryable?: boolean; unavailable?: boolean };

function DoneStep({ props, onRepeat }: { props: Props; onRepeat: () => void }) {
  const { t } = useT();
  const [poll, setPoll] = useState<Poll>({ outcome: "processing" });
  const [tick, setTick] = useState(0);
  const assisted = props.mode === "assisted";

  useEffect(() => {
    let stop = false;
    let tries = 0;
    const run = async () => {
      const s = JSON.parse(sessionStorage.getItem("spiro_rec") ?? "null") as { id: string; secret: string } | null;
      if (!s) return;
      while (!stop && tries++ < 40) {
        const res = await fetch(`/api/recordings/${s.id}`, { headers: assisted ? {} : { "x-recording-secret": s.secret } }).catch(() => null);
        if (res?.ok) { const j = (await res.json()) as Poll; setPoll(j); if (!["processing", "uploading"].includes(j.outcome)) return; }
        await new Promise((r) => setTimeout(r, 1500));
      }
    };
    void run();
    return () => { stop = true; };
  }, [assisted, tick]);

  if (!assisted) {
    return (
      <Card className="gap-4 p-6">
        {poll.outcome === "repeat" ? (
          <>
            <AlertTriangle size={24} className="text-cobalt" aria-hidden />
            <h2 className="text-[20px] font-medium tracking-[-0.015em]">{t("rec.done.repeatTitle")}</h2>
            <p className="text-[13px] leading-[1.5] text-ink-muted">{t("rec.done.repeatBody")}</p>
            <div><Button variant="primary" onClick={onRepeat}>{t("rec.done.repeatAction")}</Button></div>
          </>
        ) : (
          <>
            <CheckCircle2 size={24} className="text-cobalt" aria-hidden />
            <h2 className="text-[20px] font-medium tracking-[-0.015em]">{t("rec.done.title")}</h2>
            <p className="text-[13px] leading-[1.5] text-ink-muted">{poll.outcome === "failed" ? t("rec.done.failedBody") : t("rec.done.body")}</p>
            <p className="text-[12px] text-ink-muted">{t("rec.done.close")}</p>
          </>
        )}
        <p className="text-[11px] text-ink-muted">{t("rec.done.disclaimer")}</p>
      </Card>
    );
  }

  const a = props as Extract<Props, { mode: "assisted" }>;
  const reasons = (poll.reasons ?? []).map((r) => { const k = `rec.assisted.reasonLabels.${r}`; const v = t(k); return v === k ? r : v; }).join(", ");
  return (
    <Card className="gap-4 p-6" >
      <div aria-live="polite" className="flex flex-col gap-3">
        {poll.outcome === "processing" || poll.outcome === "uploading" ? (
          <><h2 className="text-[20px] font-medium tracking-[-0.015em]">{t("rec.assisted.uploaded")}</h2><p className="text-[13px] text-ink-muted">{t("rec.assisted.processing")}</p></>
        ) : poll.outcome === "repeat" ? (
          <Alert state="warning" title={t("rec.assisted.repeatTitle")}>{t("rec.assisted.repeatBody", { reasons })}</Alert>
        ) : poll.outcome === "failed" ? (
          <Alert state="error" title={t("rec.assisted.failedTitle")}>{t("rec.assisted.failedBody")}</Alert>
        ) : poll.unavailable ? (
          <Alert state="info" title={t("rec.assisted.unavailable")}>{t("rec.assisted.unavailableBody")}</Alert>
        ) : (
          <><CheckCircle2 size={24} className="text-cobalt" aria-hidden /><h2 className="text-[20px] font-medium tracking-[-0.015em]">{t("rec.assisted.ready")}</h2></>
        )}
      </div>
      <div className="flex flex-wrap gap-[10px]">
        {poll.resultId && poll.outcome === "received" && !poll.unavailable && <Button variant="primary" href={`/results/${poll.resultId}`}>{t("rec.assisted.openResult")}</Button>}
        {poll.outcome === "failed" && poll.retryable && <Button variant="primary" onClick={async () => { const s = JSON.parse(sessionStorage.getItem("spiro_rec") ?? "{}"); await fetch(`/api/recordings/${s.id}/retry`, { method: "POST" }); setPoll({ outcome: "processing" }); setTick((n) => n + 1); }}>{t("rec.assisted.retry")}</Button>}
        {poll.outcome === "repeat" && <Button variant="primary" onClick={onRepeat}>{t("rec.assisted.another")}</Button>}
        <Link href={`/patients/${a.patientId}`} className="inline-flex h-11 items-center rounded-input border border-line bg-surface px-[18px] text-[14px] font-medium tracking-[-0.01em] hover:bg-surface-soft">{t("rec.assisted.back")}</Link>
      </div>
      <p className="text-[11px] text-ink-muted">{t("rec.done.disclaimer")}</p>
    </Card>
  );
}
