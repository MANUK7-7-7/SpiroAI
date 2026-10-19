# SpiroAI doctor workspace

Screening support for respiratory care. **Not a diagnosis**: the doctor keeps final judgment. All data in this repository is fictional, and every threshold, range and model output is an unvalidated sample.

## Run

```bash
npm install --legacy-peer-deps
npm run dev            # http://localhost:3000
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

- **A** registration, verification, login with two-factor, password reset.
- **B** dashboard, patients, profile, results (S09), trends, compare, add patient.
- **C** alerts, clinical action, monitoring plan, report export, messages.
- **D** settings (profile, notifications, alert thresholds, team, security with audit log, help).

Force the designed states on data screens with `?state=loading|empty|error`.

## AI integration

Set `AI_PROVIDER=mock|http`, `AI_ENABLED`, `AI_ENDPOINT`, `AI_API_KEY`, `AI_TIMEOUT_MS`, `AI_MODEL_VERSION_PIN`. Switching provider needs no UI change. Every result keeps model id and version, confidence, quality and the disclaimer. See `src/ai/README.md`.

## Recording

Browser voice processing (echo cancellation, noise suppression, auto gain) is switched off, and what the browser actually applied is read back from the track and stored. Audio is captured as raw PCM through an AudioWorklet, encoded to 16-bit WAV, and uploaded in resumable chunks. The server measures the PCM itself, runs the quality gate, then the screening job in the background. The patient link never shows a score.

## Production notes (not implemented in the demo)

- Hosting provider, a database (Neon Postgres fits) and object storage for audio are open decisions. Audio must live in separate encrypted storage, never in the database. Keep the database fictional-only until a compliance review.
- Set `AUDIO_SIGNING_SECRET`, `APP_ORIGIN`, and replace the mock auth (cookies `spiro_pre`, `spiro_session`) and the demo OTP with real identity and TOTP.
- Email delivery of reports needs a mail service.
- Risk-band logic and any feature that lets the AI act without a clinician require explicit product sign-off.
