import { createHmac, timingSafeEqual } from "node:crypto";

// Audio is health data: URLs are short-lived and signed. Set AUDIO_SIGNING_SECRET in production.
const secret = () => process.env.AUDIO_SIGNING_SECRET ?? "dev-only-secret-change-me";
export const AUDIO_URL_TTL_S = 300;

const sig = (path: string, exp: number) => createHmac("sha256", secret()).update(`${path}.${exp}`).digest("hex");

export function signPath(path: string, ttlS = AUDIO_URL_TTL_S, now = Date.now()) {
  const exp = Math.floor(now / 1000) + ttlS;
  return `${path}?exp=${exp}&sig=${sig(path, exp)}`;
}

export function verifyPath(path: string, exp: string | null, signature: string | null, now = Date.now()) {
  if (!exp || !signature) return false;
  const e = Number(exp);
  if (!Number.isFinite(e) || e * 1000 < now) return false;
  const expected = Buffer.from(sig(path, e));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
