# Inference service

FastAPI service behind `POST /v1/screen`. It downloads the three takes through their signed URLs,
extracts acoustic features and returns the combined risk index plus a voice/cough breakdown.
`openapi.json` is generated from `src/ai/contracts.ts` (`npm run gen:openapi`) and is the contract the
Next.js app tests against. Model details and limits: [`models/MODEL_CARD.md`](models/MODEL_CARD.md).

```
python -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app:app --port 8000          # first start takes ~20 s while librosa compiles
```

From the repository root, `npm run setup:ai` (once) and `npm run dev` do all of this for you and connect the app.
To run it by hand, start the service as above and the app with `AI_ENDPOINT=http://localhost:8000 npm run dev:web`.
To deploy it, see "Deployed (always connected)" in the root README (`Dockerfile`, `../../render.yaml`).
Set the same `AI_API_KEY` on both sides outside local development: the app sends it to the service, and
the service sends it back when it downloads audio.

| Task | Model | Required |
|---|---|---|
| `sustained_vowel` + `counting` | voice: chronic lung disease patterns | yes |
| `cough` | cough: COPD patterns | no |

## Layout

```
app.py              endpoint, audio download, scoring, combination rules
spiro/features.py   voice features (shared with training)
spiro/cough.py      cough features with background removal (shared with training)
models/             trained models, metrics and MODEL_CARD.md
training/           scripts that produced the models
```

## Retraining

The datasets are not stored in the repository.

**Voice (Coswara, ~13 GB):**

```
git clone https://github.com/iiscleap/Coswara-Data coswara
python training/build_cohort.py   --metadata coswara/combined_data.csv --out data/cohort.csv
python training/extract_audio.py  --coswara coswara --cohort data/cohort.csv --out data/audio
python training/build_features.py --cohort data/cohort.csv --audio data/audio --out data/features.csv
python training/train.py          --features data/features.csv --metadata coswara/combined_data.csv --out models
```

**Cough (COPD-Cough, ~550 MB, RAR5: extract with `unrar`, not 7-Zip or unar):**

```
curl -L -o cc.rar "https://zenodo.org/api/records/14881818/files/Cough-COPD(CC).rar/content"
unrar x cc.rar data/
python training/audit_cough.py --cc "data/Cough-COPD(CC)" --out data/cc_audit_features.csv
python training/train_cough.py --cc "data/Cough-COPD(CC)" --cache data/cc_table.csv --out models
```
