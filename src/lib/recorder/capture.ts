import type { DeviceMeta } from "@/ai/contracts";

export type MicError = "denied" | "none" | "busy" | "unsupported" | "error";
export class MicFailure extends Error {
  constructor(public kind: MicError) { super(kind); }
}

export type AppliedSettings = { echoCancellation: boolean; noiseSuppression: boolean; autoGainControl: boolean; sampleRate: number; channelCount: number; deviceId?: string; label: string };
export type Mic = { stream: MediaStream; ctx: AudioContext; node: AudioWorkletNode; applied: AppliedSettings; close: () => void };

export const supportsRecording = () => typeof window !== "undefined" && window.isSecureContext && !!navigator.mediaDevices?.getUserMedia && typeof AudioContext !== "undefined" && typeof AudioWorkletNode !== "undefined";

/**
 * Browser voice processing is OFF (screening features need the raw voice) and what the browser
 * actually applied is read back from the track, then stored with the recording.
 */
export async function openMic(deviceId?: string): Promise<Mic> {
  if (!supportsRecording()) throw new MicFailure("unsupported");
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: deviceId ? { exact: deviceId } : undefined, echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
    });
  } catch (e) {
    const name = (e as DOMException).name;
    throw new MicFailure(name === "NotAllowedError" || name === "SecurityError" ? "denied" : name === "NotFoundError" || name === "OverconstrainedError" ? "none" : name === "NotReadableError" || name === "AbortError" ? "busy" : "error");
  }
  const track = stream.getAudioTracks()[0];
  const s = track.getSettings() as MediaTrackSettings & { echoCancellation?: boolean; noiseSuppression?: boolean; autoGainControl?: boolean };
  const ctx = new AudioContext({ latencyHint: "interactive" });
  try {
    await ctx.audioWorklet.addModule("/worklets/pcm-capture.js");
  } catch {
    stream.getTracks().forEach((t) => t.stop());
    await ctx.close();
    throw new MicFailure("error");
  }
  const node = new AudioWorkletNode(ctx, "pcm-capture", { numberOfInputs: 1, numberOfOutputs: 0, channelCount: 1 });
  ctx.createMediaStreamSource(stream).connect(node);
  const applied: AppliedSettings = {
    echoCancellation: s.echoCancellation ?? false, noiseSuppression: s.noiseSuppression ?? false, autoGainControl: s.autoGainControl ?? false,
    sampleRate: ctx.sampleRate, channelCount: s.channelCount ?? 1, deviceId: s.deviceId, label: track.label,
  };
  let closed = false;
  const close = () => { if (closed) return; closed = true; node.disconnect(); stream.getTracks().forEach((t) => t.stop()); void ctx.close(); };
  return { stream, ctx, node, applied, close };
}

export type Frame = { rms: number; peak: number };
export type Capture = { stop: () => Float32Array };

/** Collects raw samples until stop(). `onFrame` drives the level meter. */
export function startCapture(mic: Mic, onFrame?: (f: Frame) => void): Capture {
  const chunks: Float32Array[] = [];
  let total = 0;
  mic.node.port.onmessage = (e: MessageEvent<Float32Array>) => {
    chunks.push(e.data);
    total += e.data.length;
    if (onFrame) {
      let sum = 0, peak = 0;
      for (const v of e.data) { sum += v * v; peak = Math.max(peak, Math.abs(v)); }
      onFrame({ rms: Math.sqrt(sum / e.data.length), peak });
    }
  };
  return {
    stop() {
      mic.node.port.onmessage = null;
      const out = new Float32Array(total);
      let o = 0;
      for (const c of chunks) { out.set(c, o); o += c.length; }
      return out;
    },
  };
}

export const toDb = (x: number) => 20 * Math.log10(Math.max(x, 1e-9));

export type CheckResult = { noiseDb: number; peak: number; verdict: "good" | "noisy" | "clip" | "quiet" };
/** Mic check: noise floor = 10th percentile of 50 ms frame levels over the silent window. Sample thresholds, unvalidated. */
export const MIC_CHECK_LIMITS = { maxNoiseDb: -42, clipPeak: 0.98, minPeak: 0.00005 } as const;

export function analyseCheck(samples: Float32Array, sampleRate: number): CheckResult {
  const frame = Math.round(sampleRate * 0.05);
  const levels: number[] = [];
  let peak = 0;
  for (let i = 0; i + frame <= samples.length; i += frame) {
    let sum = 0;
    for (let j = i; j < i + frame; j++) { const v = samples[j]; sum += v * v; peak = Math.max(peak, Math.abs(v)); }
    levels.push(Math.sqrt(sum / frame));
  }
  levels.sort((a, b) => a - b);
  const noiseDb = Math.round(toDb(levels[Math.floor(levels.length * 0.1)] ?? 0));
  const verdict = peak >= MIC_CHECK_LIMITS.clipPeak ? "clip" : peak < MIC_CHECK_LIMITS.minPeak ? "quiet" : noiseDb > MIC_CHECK_LIMITS.maxNoiseDb ? "noisy" : "good";
  return { noiseDb, peak, verdict };
}

/** 16-bit PCM WAV. Uncompressed: lossy audio is never used. */
export function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF"); v.setUint32(4, 36 + samples.length * 2, true); str(8, "WAVE"); str(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, "data"); v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) v.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), true);
  return new Blob([buf], { type: "audio/wav" });
}

export function deviceMeta(applied: AppliedSettings, kind: "patient" | "assisted"): DeviceMeta {
  const ua = navigator.userAgent;
  const os = /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : /CrOS/.test(ua) ? "ChromeOS" : "Unknown";
  const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Unknown";
  const label = applied.label.toLowerCase();
  const microphoneKind = /built-in|internal|macbook|integrated|array/.test(label) ? "built_in" : /usb|headset|bluetooth|external|wired|line/.test(label) ? "external" : "unknown";
  return {
    deviceType: /iPad|Tablet/.test(ua) ? "tablet" : /Mobi|Android|iPhone/.test(ua) ? "phone" : kind === "assisted" ? "desktop" : "laptop",
    os, browser, microphoneLabel: applied.label.slice(0, 128) || undefined, microphoneKind,
    sampleRate: Math.round(applied.sampleRate), channelCount: applied.channelCount,
    processing: { echoCancellation: applied.echoCancellation, noiseSuppression: applied.noiseSuppression, autoGainControl: applied.autoGainControl },
  };
}
