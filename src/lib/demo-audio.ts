// Synthetic placeholder audio for fictional recordings. It is NOT a patient voice.
const RATE = 16000;

function wav(samples: Int16Array) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(RATE, 24); buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(samples.length * 2, 40);
  Buffer.from(samples.buffer).copy(buf, 44);
  return buf;
}

export function demoWav(task: "sustained_vowel" | "reading_passage", seconds: number, f0 = 130) {
  const n = seconds * RATE;
  const out = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const env = task === "sustained_vowel" ? Math.min(1, t * 4, (seconds - t) * 4) : 0.5 + 0.5 * Math.sin(2 * Math.PI * 2.2 * t) ** 2;
    const f = task === "sustained_vowel" ? f0 : f0 * (1 + 0.15 * Math.sin(2 * Math.PI * 0.6 * t));
    const v = Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(2 * Math.PI * 2 * f * t) + 0.25 * Math.sin(2 * Math.PI * 3 * f * t);
    out[i] = Math.round(v * env * 0.22 * 32767);
  }
  return wav(out);
}
