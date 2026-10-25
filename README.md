# SpiroAI doctor workspace

Screening support for respiratory care. **Not a diagnosis**: the doctor keeps final judgment. All data in this repository is fictional, and every threshold, range and model output is an unvalidated sample.

## Run

```bash
npm install --legacy-peer-deps
npm run setup:ai       # once: installs the AI service (needs Python 3.10+)
npm run dev            # http://localhost:3000, web app + AI service, already connected
npm run dev:web        # web app alone, with the labelled Demo model
npm test               # unit tests (AI contracts, quality gate, pipeline, WAV measurement)
npm run test:e2e       # Playwright (uses a fake microphone; set PW_CHROMIUM for a custom browser)
npm run gen:openapi    # regenerates services/inference/openapi.json from the Zod contracts
```

Demo access: any email, a password of 8+ characters, one-time code `482916`.
Patient recording link to try without creating a record: `/r/demo-invite`.

## Structure

| Path | What it is |
| --- | --- |
| `src/styles/tokens.css`, `tailwind.config.ts` | Token layer. No hex values in components. |
| `src/components/ui` | Primitives. Reference at `/design`; per-flow state libraries at `/design/states/*`. |
| `src/messages/{es,en}.json`, `src/lib/i18n` | es-AR primary, EN secondary. Cookie `spiro_locale`. |
| `src/data` | Fixtures, in-memory store and repositories. Swap for Postgres behind the same functions. |
| `src/ai` | Isolated AI slot: contracts, providers (mock, http), quality gate, pipeline, post-processing. |
| `services/inference` | FastAPI placeholder and generated `openapi.json`. |
| `src/components/recorder`, `src/lib/recorder` | Desktop recording (patient link and assisted). |
| `src/lib/report` | One report model, used by the live preview and the server PDF. |

## Flows

- **Triage** (primary care): consent script, eligibility, the seven PUMA items (weighted score, cut-off 25), about 10 s of voice, a priority for a breathing test (never a diagnosis), booking a spirometry with WhatsApp or a printed slip, a hospital panel where the technician enters FEV1/FVC without seeing the priority, and an accuracy report (cases per 100 spirometries). A confirmed case moves into follow-up.
- **A** registration, verification, login with two-factor, password reset.
- **B** dashboard, patients, profile, results (S09), trends, compare, add patient.
- **C** alerts, clinical action, monitoring plan by patient type, report export. Patient contact opens WhatsApp (no in-app messaging).
- **D** settings (profile, notifications, alert thresholds, team, security with audit log, help).

Force the designed states on data screens with `?state=loading|empty|error`.

## AI integration

The real models (voice: vowel + counting, cough) run in `services/inference`, a separate Python service.
Setting `AI_ENDPOINT` is enough to connect the app to it (`AI_PROVIDER` defaults to `http` when an endpoint is set,
`mock` otherwise). Other variables: `AI_API_KEY`, `AI_TIMEOUT_MS` (default 60000), `AI_ENABLED`, `AI_MODEL_VERSION_PIN`.
Every result keeps model id and version, confidence, quality and the disclaimer; the UI labels mock results "Demo model".
See `src/ai/README.md`.

**Locally:** `npm run setup:ai` once, then `npm run dev` starts both and connects them. If the AI service is not
installed, `npm run dev` says so and falls back to the Demo model.

**Deployed (always connected):**

1. Deploy the AI service: Render dashboard, New, Blueprint, pick this repository. `render.yaml` builds
   `services/inference/Dockerfile` and generates an `AI_API_KEY`. Any Docker host works the same way.
2. In Vercel, Settings, Environment Variables, set:
   - `AI_ENDPOINT`: the service URL, e.g. `https://spiroai-inference.onrender.com`
   - `AI_API_KEY`: the same value as on Render
   - `APP_ORIGIN`: the public URL of the web app (the service downloads the recordings from it)
3. Redeploy. Results now come from the real models; if the service is down, results show "analysis unavailable"
   with a retry, never an invented score.

`render.yaml` uses Render's free plan, so no payment details are asked. It sleeps after 15 minutes idle; the first
test after that waits about a minute, which fits inside the 60 s timeout. The service peaks at about 400 MB, inside
the free 512 MB. For an always-on service, change `plan: free` to `plan: starter` (paid).

What each model learned, how well it does and its known biases: `services/inference/models/MODEL_CARD.md`.

## Recording

Browser voice processing (echo cancellation, noise suppression, auto gain) is switched off, and what the browser actually applied is read back from the track and stored. Audio is captured as raw PCM through an AudioWorklet, encoded to 16-bit WAV, and uploaded in resumable chunks. The server measures the PCM itself, runs the quality gate, then the screening job in the background. The patient link never shows a score.

## Production notes (not implemented in the demo)

- Hosting provider, a database (Neon Postgres fits) and object storage for audio are open decisions. Audio must live in separate encrypted storage, never in the database. Keep the database fictional-only until a compliance review.
- Set `AUDIO_SIGNING_SECRET`, `APP_ORIGIN`, and replace the mock auth (cookies `spiro_pre`, `spiro_session`) and the demo OTP with real identity and TOTP.
- Email delivery of reports needs a mail service.
- Risk-band logic and any feature that lets the AI act without a clinician require explicit product sign-off.
