import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

const chromium = process.env.PW_CHROMIUM ?? ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find(existsSync);
const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1440, height: 1000 },
    permissions: ["microphone"],
    launchOptions: {
      executablePath: chromium,
      // A fake microphone feeds a generated voice-like WAV: no real audio hardware or patient voice is involved.
      args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--use-file-for-fake-audio-capture=tests/e2e/.tmp/voice-loop.wav"],
    },
  },
  globalSetup: "./tests/e2e/global-setup.ts",
  webServer: { command: `npx next dev -p ${PORT}`, url: `http://localhost:${PORT}`, reuseExistingServer: true, timeout: 120_000 },
});
