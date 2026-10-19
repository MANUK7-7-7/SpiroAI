import { mkdirSync, writeFileSync } from "node:fs";

/** 60 s loop, 16 kHz mono PCM: each 2 s period has 0.4 s of near-silence (noise floor) then a harmonic tone (a stand-in for a voice). */
export default function setup() {
  const R = 16000, seconds = 60;
  const n = R * seconds;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write("WAVEfmt ", 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(R, 24); buf.writeUInt32LE(R * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(n * 2, 40);
  let seed = 1;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296) * 2 - 1;
  for (let i = 0; i < n; i++) {
    const t = (i / R) % 2;
    const f = 130 * (1 + 0.03 * Math.sin(2 * Math.PI * 0.5 * t));
    const v = t < 0.4 ? rnd() * 0.0003 : (Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(4 * Math.PI * f * t) + 0.25 * Math.sin(6 * Math.PI * f * t)) * 0.2;
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2);
  }
  mkdirSync("tests/e2e/.tmp", { recursive: true });
  writeFileSync("tests/e2e/.tmp/voice-loop.wav", buf);
}
