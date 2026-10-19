import { describe, expect, it } from "vitest";
import { demoWav } from "@/lib/demo-audio";
import { measureWav, parseWav } from "@/lib/wav";

describe("wav measurement", () => {
  it("parses 16-bit PCM and measures duration, clipping and voicing", () => {
    const info = parseWav(demoWav("sustained_vowel", 8));
    const m = measureWav(info, "sustained_vowel");
    expect(info.sampleRate).toBe(16000);
    expect(m.durationSec).toBeCloseTo(8, 1);
    expect(m.clippedRatio).toBe(0);
    expect(m.voicedRatio).toBeGreaterThan(0.5);
  });

  it("rejects anything that is not PCM WAV", () => {
    expect(() => parseWav(Buffer.from("not audio at all, definitely not a wav file......"))).toThrow("NOT_WAV");
  });
});
