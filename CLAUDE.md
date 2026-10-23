# SpiroAI working notes

## Keep the flowchart in sync (standing instruction from the owner)

Whenever a code change is significant for the product flow (a screen, route, step, decision, role or integration is added, removed, renamed or rewired), update the FigJam flowchart in the same piece of work, without asking first. Cosmetic or internal-only changes (styling, refactors, tests, copy tweaks) do not need it.

- Board: https://www.figma.com/board/Diyp4gqhyu2NucjPEk7JXZ (fileKey `Diyp4gqhyu2NucjPEk7JXZ`)
- Two diagrams, both in English and both starting at the landing page:
  - "SpiroAI · Full site flow": 9 ordered sections (Landing, Sign up and log in, Workspace home, Triage in primary care, Patients, Result review, Alerts actions and plan, Recording and analysis, Settings). Repeated blocks are duplicated per section instead of long back-edges.
  - "SpiroAI · Simplified site flow": about 19 steps; triage (PUMA and voice, priority, spirometry booked, hospital result) leads into patients and follow-up.
- Use plain names, never screen codes (no S01, S09...).
- Colour coding, identical in both diagrams, for blocks that repeat:
  - WhatsApp: green `#CDF4D3` / `#66D575`
  - Test result: blue `#C2E5FF` / `#3DADFF`
  - Alerts center: light red `#FFCDC2` / `#FF7556`
  - Audit log: grey `#D9D9D9` / `#B3B3B3`
  - Invite link: orange `#FFE0C2` / `#FF9E42`
  - Log in: yellow `#FFECBD` / `#FFC943`
  - Quality gate, AI model, alert rules: violet `#DCCCFF` / `#874FFF`
  - Dashboard: teal `#C6FAF6` / `#5AD8CC`
  - PDF report: pink `#FFC2EC` / `#F849C1`
- Prefer editing the existing nodes with `use_figma` for small changes (rename, recolour). For structural changes, clear the board and regenerate both diagrams with `generate_diagram`, keeping the order, colours and naming above.

## Conventions

- UI copy has no em dashes and no emoji. Risk is never shown by colour alone.
- Triage (`/triage`, `/hospital`): PUMA weighted score (cut-off 25), a priority for a breathing test (never "risk" or a diagnosis), spirometry booked by default only for high priority, overrides counted, the hospital enters FEV1/FVC without seeing the priority. Priority logic lives in `src/config/triage.ts` and needs clinical sign-off to change.
- Patients never see a risk score. Patient contact happens on WhatsApp, not in-app messaging.
- Remote tests: "Request test now" on the patient profile creates a single-use test link (`kind: "test"`,
  expires after `TEST_LINK_TTL_DAYS`) and opens WhatsApp to the patient's phone. When the result is ready the
  doctor gets a `result_received` notification (or `analysis_failed`), and the result enters the dashboard
  review queue; reviewing it resolves the notification. The WhatsApp message carries only the first name and the link.
- Thresholds, ranges and monitoring frequencies are sample values that need clinical validation; label them as such.
- Demo data lives in memory (`src/data/store.ts`). On Vercel every request can hit a different instance, so
  `src/data/persist.ts` mirrors the store to Upstash Redis when `KV_REST_API_URL`/`KV_REST_API_TOKEN` (or the
  `UPSTASH_REDIS_REST_*` pair) are set: new route handlers are exported through `withStore(...)`, and async server
  pages call `await syncStore()` first. Without the vars it stays in memory, as in local dev.

## AI models (context for future sessions)

The real models live in `services/inference` (FastAPI, `POST /v1/screen`). Read
`services/inference/models/MODEL_CARD.md` before changing anything model-related.

- Recording protocol: `sustained_vowel`, `counting` (1 to 20) and `cough`, in that order. The task list is
  `AUDIO_TASKS` in `src/ai/contracts.ts`; everything else derives from it.
- Two models, two different targets. Voice (vowel + counting) = self-reported chronic lung disease, Coswara.
  Cough = clinically diagnosed COPD, COPD-Cough (CC). The combined `riskIndex` is their mean; the clinician
  sees both in `subScores`. Never call the voice score "COPD".
- Bias checks are part of the work, not optional. Coswara needed controls matched on sex, age and recording
  year (year alone predicted the label, AUC 0.85). In CC the background noise alone predicts COPD (AUC 0.78),
  so cough features are band-limited, denoised, computed on cough events only, and training uses
  background-swap augmentation. Any new dataset gets the same kind of shortcut audit before training.
- The datasets are not in the repo (Coswara ~13 GB on GitHub, CC ~550 MB on Zenodo, RAR5 needs `unrar`).
  Retraining steps: `services/inference/README.md`.
- Pending: access requests sent (or to be sent) for COVID-19 Sounds (Cambridge), SpiroPhonia (UMD) and
  COPDVD (BTH, Sweden) to get confirmed-COPD voice data and more accents. Patients will count in Spanish
  while the voice model learned English counting; validate or retrain before trusting it.
- The model `.joblib` files need scikit-learn 1.9.1 exactly.
