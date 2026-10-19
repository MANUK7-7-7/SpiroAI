"use client";

import { CirclePause, CirclePlay } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";

type Props = { label: string; recordingId: string; task: "sustained_vowel" | "reading_passage"; durationSec: number; src: string; waveform: number[] };

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Waveform bars: played part in cobalt, the rest in cobalt-tint-strong. The signed URL is refreshed if it expired. */
export function AudioPlayer({ label, recordingId, task, durationSec, src, waveform }: Props) {
  const { t } = useT();
  const audio = useRef<HTMLAudioElement | null>(null);
  const url = useRef(src);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => () => audio.current?.pause(), []);

  async function toggle() {
    setError(false);
    if (!audio.current) {
      audio.current = new Audio(url.current);
      audio.current.addEventListener("timeupdate", () => setTime(audio.current?.currentTime ?? 0));
      audio.current.addEventListener("ended", () => { setPlaying(false); setTime(0); });
      audio.current.addEventListener("error", async () => {
        // Signed URLs are short-lived: mint a new one once, then retry.
        const res = await fetch("/api/audio/sign", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ recordingId, task }) });
        if (!res.ok) return setError(true);
        url.current = (await res.json()).url;
        audio.current = null;
        setPlaying(false);
        setError(true);
      });
    }
    if (playing) { audio.current.pause(); setPlaying(false); return; }
    try { await audio.current.play(); setPlaying(true); } catch { setError(true); }
  }

  const done = Math.round((time / durationSec) * waveform.length);
  const Icon = playing ? CirclePause : CirclePlay;
  return (
    <div className="flex flex-col gap-3 rounded-[18px] bg-surface-soft p-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={toggle} aria-label={`${playing ? t("result.pause") : t("result.play")}: ${label}`} className="text-cobalt"><Icon size={28} strokeWidth={1.6} /></button>
        <p className="min-w-0 flex-1 text-[13px] font-medium leading-[1.45] tracking-[-0.01em]">{label}</p>
        <p className="whitespace-nowrap font-mono text-[11px]">{mmss(time)} / {mmss(durationSec)}</p>
      </div>
      <div className="flex h-9 items-center gap-1" aria-hidden>
        {waveform.map((h, i) => <span key={i} className={cn("min-w-px flex-1 rounded-[2px]", i < done ? "bg-cobalt" : i < 12 && time === 0 ? "bg-cobalt" : "bg-cobalt-tint-strong")} style={{ height: h }} />)}
      </div>
      {error && <p role="alert" className="text-[11px] text-risk-high">{t("result.audioError")}</p>}
    </div>
  );
}
