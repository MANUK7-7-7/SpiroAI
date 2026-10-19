import type { RecordingMeasurement } from "@/ai/quality/gate";
import type { AudioTaskId } from "@/ai/contracts";

export type WavInfo = { sampleRate: number; channels: number; bits: number; samples: Int16Array };

/** Parses 16-bit PCM WAV. Throws on anything else: lossy or float audio is never accepted. */
export function parseWav(buf: Buffer): WavInfo {
  if (buf.length < 44 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") throw new Error("NOT_WAV");
  let off = 12, fmt: { fmtTag: number; channels: number; rate: number; bits: number } | undefined, data: Buffer | undefined;
  while (off + 8 <= buf.length) {
    const id = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    const body = buf.subarray(off + 8, Math.min(off + 8 + size, buf.length));
    if (id === "fmt ") fmt = { fmtTag: body.readUInt16LE(0), channels: body.readUInt16LE(2), rate: body.readUInt32LE(4), bits: body.readUInt16LE(14) };
    if (id === "data") data = body;
    off += 8 + size + (size % 2);
  }
  if (!fmt || !data) throw new Error("NOT_WAV");
  if (fmt.fmtTag !== 1 || fmt.bits !== 16) throw new Error("NOT_PCM16");
  const n = Math.floor(data.length / 2);
  const samples = new Int16Array(n);
  for (let i = 0; i < n; i++) samples[i] = data.readInt16LE(i * 2);
  return { sampleRate: fmt.rate, channels: fmt.channels, bits: fmt.bits, samples };
}

const db = (x: number) => 20 * Math.log10(Math.max(x, 1e-9));

/** Measured on the server from the uploaded PCM, never taken on trust from the browser. */
export function measureWav(info: WavInfo, task: AudioTaskId): RecordingMeasurement {
  const { samples, sampleRate, channels } = info;
  const mono = channels > 1 ? samples.filter((_, i) => i % channels === 0) : samples;
  const frame = Math.max(1, Math.round(sampleRate * 0.05));
  const rms: number[] = [];
  let peak = 0, clipped = 0;
  for (let i = 0; i < mono.length; i += frame) {
    let sum = 0, n = 0;
    for (let j = i; j < Math.min(i + frame, mono.length); j++) {
      const v = Math.abs(mono[j]) / 32768;
      sum += v * v; n++;
      if (v > peak) peak = v;
      if (v >= 0.999) clipped++;
    }
    rms.push(Math.sqrt(sum / n));
  }
  const sorted = [...rms].sort((a, b) => a - b);
  const floor = sorted[Math.floor(sorted.length * 0.1)] ?? 0;
  const noiseFloorDb = db(floor);
  const voiced = rms.filter((r) => db(r) > noiseFloorDb + 10).length;
  return { task, durationSec: mono.length / sampleRate, noiseFloorDb: Math.round(noiseFloorDb * 10) / 10, peakDb: Math.round(db(peak) * 10) / 10, clippedRatio: clipped / Math.max(1, mono.length), voicedRatio: voiced / Math.max(1, rms.length) };
}

/** 56 peak levels for the waveform display on S09. */
export function waveformOf(info: WavInfo): number[] {
  const { samples } = info;
  const bins = 56, size = Math.max(1, Math.floor(samples.length / bins));
  return Array.from({ length: bins }, (_, b) => {
    let p = 0;
    for (let i = b * size; i < Math.min((b + 1) * size, samples.length); i++) p = Math.max(p, Math.abs(samples[i]));
    return Math.round((p / 32768) * 100) / 100;
  });
}
