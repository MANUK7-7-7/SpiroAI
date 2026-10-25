// `npm run setup:ai`: installs the AI inference service once, in services/inference/.venv.
// After this, `npm run dev` starts the web app already connected to the real models.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const service = join(root, "services", "inference");
const win = process.platform === "win32";
const venvPy = join(service, ".venv", win ? "Scripts\\python.exe" : "bin/python");
const log = (msg) => console.log(`\x1b[35m[spiro]\x1b[0m ${msg}`);

const version = (py) => {
  const r = spawnSync(py, ["-c", "import sys; print(sys.version_info[0] * 100 + sys.version_info[1])"], { encoding: "utf8" });
  return r.status === 0 ? Number(r.stdout.trim()) : 0;
};
const python = (win ? ["py", "python"] : ["python3", "python"]).find((py) => version(py) >= 310);
if (!python) {
  log("Python 3.10 or newer was not found. Install it from https://www.python.org/downloads/ and run this again.");
  process.exit(1);
}

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { cwd: service, stdio: "inherit" });
  if (r.status !== 0) { log(`Failed: ${cmd} ${args.join(" ")}`); process.exit(r.status ?? 1); }
};

if (!existsSync(venvPy)) {
  log("Creating services/inference/.venv ...");
  run(python, ["-m", "venv", ".venv"]);
}
log("Installing the AI service (a few minutes the first time) ...");
run(venvPy, ["-m", "pip", "install", "--upgrade", "pip"]);
run(venvPy, ["-m", "pip", "install", "-r", "requirements.txt"]);
log("Done. Run `npm run dev`: the web app starts connected to the real voice and cough models.");
