// `npm run dev`: starts the AI inference service and the web app together, already connected.
// If the AI service is not installed (run `npm run setup:ai` once), the app starts with the
// labelled Demo model instead, as before. `npm run dev:web` starts the web app alone.
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const service = join(root, "services", "inference");
const win = process.platform === "win32";
const AI_PORT = process.env.AI_PORT ?? "8000";
const endpoint = `http://localhost:${AI_PORT}`;
const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
const args = process.argv.slice(2);
// The AI service downloads the recordings from the web app, so it must know the app's exact address.
const portFlag = args.findIndex((a) => a === "-p" || a === "--port");
const WEB_PORT = portFlag >= 0 ? args[portFlag + 1] : process.env.PORT ?? "3000";
if (portFlag < 0) args.push("-p", WEB_PORT);
const appOrigin = process.env.APP_ORIGIN ?? `http://localhost:${WEB_PORT}`;

const log = (msg) => console.log(`\x1b[35m[spiro]\x1b[0m ${msg}`);

function aiPython() {
  const venv = join(service, ".venv", win ? "Scripts\\python.exe" : "bin/python");
  const candidates = [venv, ...(win ? ["python", "py"] : ["python3", "python"])];
  return candidates.find((py) => (py === venv ? existsSync(py) : true) &&
    spawnSync(py, ["-c", "import fastapi, uvicorn, librosa, sklearn, httpx"], { stdio: "ignore" }).status === 0);
}

async function healthy() {
  try {
    const r = await fetch(`${endpoint}/healthz`, { signal: AbortSignal.timeout(1500) });
    return r.ok && (await r.json()).model === "spiroai-voice-cough";
  } catch {
    return false;
  }
}

function startWeb(env) {
  const web = spawn(process.execPath, [nextBin, "dev", ...args], { cwd: root, stdio: "inherit", env: { ...process.env, ...env } });
  web.on("exit", (code) => { ai?.kill(); process.exit(code ?? 0); });
  return web;
}

let ai;
const stop = () => { ai?.kill(); process.exit(0); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

if (process.env.AI_ENDPOINT || process.env.AI_PROVIDER === "mock" || process.env.AI_ENABLED === "false") {
  log("Using the AI settings from your environment.");
  startWeb({});
} else if (await healthy()) {
  log(`AI service already running at ${endpoint}. Connecting the web app to it.`);
  startWeb({ AI_ENDPOINT: endpoint, APP_ORIGIN: appOrigin });
} else {
  const py = aiPython();
  if (!py) {
    log("AI service not installed, so results will come from the Demo model.");
    log("Run `npm run setup:ai` once to install it (needs Python 3.10 or newer), then `npm run dev` again.");
    startWeb({});
  } else {
    log(`Starting the AI service at ${endpoint} (the first start takes about 20 seconds)...`);
    ai = spawn(py, ["-m", "uvicorn", "app:app", "--port", AI_PORT, "--log-level", "warning"], { cwd: service, stdio: "inherit" });
    ai.on("exit", (code) => { if (code) log(`AI service stopped (code ${code}). New results will show "analysis unavailable" until it runs again.`); });
    // The web app starts right away; results wait for the service through the normal retry path.
    startWeb({ AI_ENDPOINT: endpoint, APP_ORIGIN: appOrigin });
    for (let i = 0; i < 90 && !(await healthy()); i++) await new Promise((r) => setTimeout(r, 1000));
    log((await healthy()) ? "AI service ready. The web app uses the real voice and cough models." : "AI service did not answer yet; check the messages above.");
  }
}
