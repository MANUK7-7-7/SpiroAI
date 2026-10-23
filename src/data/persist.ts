import { gunzipSync, gzipSync } from "node:zlib";
import { store } from "./store";

/**
 * Shared state for serverless hosting. On Vercel each request can land on a different instance, each with its
 * own memory, so a result saved by one is "not found" by the next. When an Upstash Redis store is connected
 * (Vercel Marketplace sets the env vars), the demo state is saved there after every change and loaded when
 * another instance has saved something newer. Without those vars everything stays in memory, as in local dev.
 */
const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
export const persistEnabled = Boolean(url && token);

const STATE = "spiro:state";
const VERSION = "spiro:ver";
const AUDIO_TTL = 7 * 24 * 3600;

type Cmd = (string | number)[];
async function redis(cmds: Cmd[]): Promise<unknown[]> {
  const res = await fetch(`${url}/pipeline`, { method: "POST", headers: { authorization: `Bearer ${token}` }, body: JSON.stringify(cmds), cache: "no-store" });
  if (!res.ok) throw new Error(`Redis ${res.status}`);
  const out = (await res.json()) as { result?: unknown; error?: string }[];
  return out.map((r) => {
    if (r.error) throw new Error(r.error);
    return r.result;
  });
}

// Maps become tagged arrays; recording audio is kept out of the snapshot and stored per take.
const replacer = (key: string, value: unknown) => {
  if (key === "chunks" || key === "completed") return {};
  if (value instanceof Map) return { __map: [...value.entries()] };
  return value;
};
const reviver = (_key: string, value: unknown) =>
  value && typeof value === "object" && "__map" in value ? new Map((value as { __map: [unknown, unknown][] }).__map) : value;

const snapshot = () => JSON.stringify(store, replacer);

let loadedVersion = -1;
let lastSaved = "";

/** Loads the shared state if another instance saved a newer one. Call before reading the store. */
export async function syncStore() {
  if (!persistEnabled) return;
  try {
    const [ver] = await redis([["GET", VERSION]]);
    const remote = Number(ver ?? 0);
    if (remote === loadedVersion) return;
    const [data] = await redis([["GET", STATE]]);
    if (typeof data === "string") {
      const loaded = JSON.parse(gunzipSync(Buffer.from(data, "base64")).toString("utf8"), reviver) as typeof store;
      // Audio already held in this instance's memory is kept; everything else follows the shared copy.
      const local = store.recordings;
      Object.assign(store, loaded);
      for (const [id, s] of store.recordings) {
        const mine = local.get(id);
        s.chunks = mine?.chunks ?? {};
        s.completed = mine?.completed ?? {};
      }
      lastSaved = snapshot();
    }
    loadedVersion = remote;
  } catch (e) {
    console.error("syncStore", (e as Error).message);
  }
}

/** Saves the state if it changed. Call after writing to the store. */
export async function persistStore() {
  if (!persistEnabled) return;
  const now = snapshot();
  if (now === lastSaved) return;
  try {
    const [, ver] = await redis([["SET", STATE, gzipSync(now).toString("base64")], ["INCR", VERSION]]);
    lastSaved = now;
    loadedVersion = Number(ver);
  } catch (e) {
    console.error("persistStore", (e as Error).message);
  }
}

/** Upload chunks are stored in Redis too, so a recording can be assembled whichever instance receives the last one. */
export async function saveChunk(recordingId: string, task: string, index: number, bytes: Buffer) {
  if (!persistEnabled) return;
  const key = `spiro:chunk:${recordingId}:${task}`;
  await redis([["HSET", key, String(index), bytes.toString("base64")], ["EXPIRE", key, 3600]]);
}

export async function loadChunks(recordingId: string, task: string): Promise<Buffer[] | undefined> {
  if (!persistEnabled) return undefined;
  const [flat] = await redis([["HGETALL", `spiro:chunk:${recordingId}:${task}`]]);
  if (!Array.isArray(flat) || !flat.length) return undefined;
  const parts: [number, Buffer][] = [];
  for (let i = 0; i < flat.length; i += 2) parts.push([Number(flat[i]), Buffer.from(String(flat[i + 1]), "base64")]);
  return parts.sort((a, b) => a[0] - b[0]).map(([, b]) => b);
}

/** Keeps a finished take for playback, for a week. */
export async function saveAudio(recordingId: string, task: string, wav: Buffer) {
  if (!persistEnabled) return;
  await redis([["SET", `spiro:audio:${recordingId}:${task}`, wav.toString("base64"), "EX", AUDIO_TTL]]);
}

export async function loadAudio(recordingId: string, task: string): Promise<Buffer | undefined> {
  if (!persistEnabled) return undefined;
  const [data] = await redis([["GET", `spiro:audio:${recordingId}:${task}`]]);
  return typeof data === "string" ? Buffer.from(data, "base64") : undefined;
}

/**
 * Wraps a route handler: loads the shared state first and saves it afterwards when the request may have
 * changed it. GET handlers only load, so a read never overwrites a newer save from another instance.
 */
export function withStore<A extends unknown[], R extends Response>(handler: (...args: A) => Promise<R>) {
  return async (...args: A): Promise<R> => {
    await syncStore();
    const res = await handler(...args);
    const req = args[0];
    if (!(req instanceof Request) || req.method !== "GET") await persistStore();
    return res;
  };
}
