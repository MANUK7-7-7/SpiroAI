const CHUNK = 256 * 1024;

/** Chunked, resumable: the server reports how many chunks it holds, and we continue from there. */
export async function uploadTask(recordingId: string, secret: string | null, task: string, wav: Blob, onProgress: (fraction: number) => void) {
  const headers: Record<string, string> = secret ? { "x-recording-secret": secret } : {};
  const base = `/api/recordings/${recordingId}/audio/${task}`;
  const state = await fetch(base, { headers });
  if (!state.ok) throw new Error("UPLOAD_STATE");
  let index = (await state.json()).received as number;
  const total = Math.max(1, Math.ceil(wav.size / CHUNK));
  while (index < total) {
    const body = await wav.slice(index * CHUNK, (index + 1) * CHUNK).arrayBuffer();
    let ok = false;
    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
      const res = await fetch(`${base}?index=${index}`, { method: "PUT", headers, body }).catch(() => null);
      if (res?.ok) ok = true;
      else if (res && res.status < 500) throw new Error(`UPLOAD_${res.status}`);
      else await new Promise((r) => setTimeout(r, 400 * 2 ** attempt));
    }
    if (!ok) throw new Error("UPLOAD_NETWORK");
    index++;
    onProgress(index / total);
  }
}
