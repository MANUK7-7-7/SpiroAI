"""SpiroAI inference service.

Two research models behind one endpoint:
  * voice  (sustained_vowel + counting): patterns linked to self-reported chronic lung disease,
    trained on Coswara with sex, age and recording-year matched controls;
  * cough  (cough): patterns linked to clinically diagnosed COPD, trained on COPD-Cough (CC) with
    background removal and background-swap augmentation.
Neither is clinically validated. See models/MODEL_CARD.md.

Run:  uvicorn app:app --port 8000
Spec: openapi.json (generated from src/ai/contracts.ts, do not edit by hand)

Environment:
  AI_API_KEY        bearer token the Next.js app sends; also sent back when fetching audio URLs
  AUDIO_FETCH_TIMEOUT_S  per-file download timeout (default 10)
"""
from __future__ import annotations

import math
import os
import tempfile
import time
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from spiro.cough import extract_cough
from spiro.features import SR, extract, load_audio, participant_vector

MODELS = Path(__file__).parent / "models"
MODEL_ID = "spiroai-voice-cough"
MODEL_VERSION = "0.1.0"
EXTRACTOR_VERSION = "spiro-librosa-0.1.0"
API_KEY = os.environ.get("AI_API_KEY")
FETCH_TIMEOUT_S = float(os.environ.get("AUDIO_FETCH_TIMEOUT_S", "10"))
WARNINGS = ["NOT_CLINICALLY_VALIDATED", "VOICE_MODEL_SELF_REPORTED_LABELS", "COUGH_MODEL_SINGLE_COHORT"]

voice_bundle = joblib.load(MODELS / "copd_voice_model.joblib")
cough_bundle = joblib.load(MODELS / "copd_cough_model.joblib")


class ServiceError(Exception):
    def __init__(self, status: int, code: str, message: str, reasons: list[str] | None = None):
        super().__init__(message)
        self.status, self.code, self.message, self.reasons = status, code, message, reasons or []


@asynccontextmanager
async def lifespan(_: FastAPI):
    # librosa compiles its numba kernels on first use (10-20 s). Do it now, not on the first patient.
    t = np.arange(SR * 3) / SR
    vowel = (0.3 * np.sin(2 * np.pi * 140 * t)).astype(np.float32)
    extract(vowel)
    rng = np.random.default_rng(0)
    bursts = (rng.standard_normal(SR * 3) * np.exp(-((t % 1) * 10))).astype(np.float32) * 0.3
    try:
        extract_cough(bursts)
    except ValueError:
        pass
    yield


app = FastAPI(title="SpiroAI inference service", version=MODEL_VERSION, lifespan=lifespan)


class Task(BaseModel):
    task: str
    url: str
    durationSec: float
    sampleRate: int


class ScreenRequest(BaseModel):
    recordingId: str
    tasks: list[Task]
    source: str
    device: dict
    patientContext: dict | None = None
    baselineSnapshot: dict | None = None


def fetch_audio(url: str) -> np.ndarray:
    headers = {"authorization": f"Bearer {API_KEY}"} if API_KEY else {}
    try:
        r = httpx.get(url, headers=headers, timeout=FETCH_TIMEOUT_S, follow_redirects=False)
    except httpx.HTTPError as e:
        raise ServiceError(503, "MODEL_UNAVAILABLE", f"Could not download audio: {e.__class__.__name__}")
    if r.status_code != 200:
        raise ServiceError(400, "INVALID_INPUT", f"Audio URL answered {r.status_code}")
    with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
        tmp.write(r.content)
        tmp.flush()
        return load_audio(tmp.name)


def _finite(v) -> float:
    v = float(v)
    if not math.isfinite(v):
        raise ValueError("not finite")
    return v


def score(req: ScreenRequest, model_version: str | None) -> dict:
    started = time.perf_counter()
    if model_version and model_version != MODEL_VERSION:
        raise ServiceError(400, "INVALID_INPUT", f"Model version {model_version} is not deployed (have {MODEL_VERSION})")
    urls = {t.task: t.url for t in req.tasks}
    unknown = set(urls) - {"sustained_vowel", "counting", "cough"}
    if unknown:
        raise ServiceError(400, "INVALID_INPUT", f"Unknown task(s): {', '.join(sorted(unknown))}")
    # The voice tasks are required: the contract's acoustic features come from the vowel. The cough is optional.
    if not {"sustained_vowel", "counting"} <= set(urls):
        raise ServiceError(400, "INVALID_INPUT", "sustained_vowel and counting are required; cough is optional.")

    reasons: list[str] = []
    sub, probs = {}, []
    try:
        vowel_feats = extract(fetch_audio(urls["sustained_vowel"]))
        counting_feats = extract(fetch_audio(urls["counting"]))
    except ValueError:
        raise ServiceError(422, "QUALITY_REJECTED", "Voice recording too short or silent. Ask the patient to repeat the test.", ["VOICE_TOO_SHORT_OR_SILENT"])
    row = participant_vector({"vowel-a": vowel_feats, "counting-normal": counting_feats})
    X = pd.DataFrame([row]).reindex(columns=voice_bundle["columns"])
    p = float(voice_bundle["model"].predict_proba(X)[0, 1])
    probs.append(p)
    sub["voice"] = {"riskIndex": round(p * 100, 1), "target": "chronic_lung_disease", "tasks": ["sustained_vowel", "counting"]}
    if "cough" in urls:
        try:
            feats = extract_cough(fetch_audio(urls["cough"]))
        except ValueError:
            reasons.append("NO_COUGH_DETECTED")
        else:
            X = pd.DataFrame([{f"r__{k}": v for k, v in feats.items()}]).reindex(columns=cough_bundle["columns"])
            p = float(cough_bundle["model"].predict_proba(X)[0, 1])
            probs.append(p)
            sub["cough"] = {"riskIndex": round(p * 100, 1), "target": "copd", "tasks": ["cough"]}
            if feats["n_coughs"] < 2:
                reasons.append("FEW_COUGHS_DETECTED")
    try:
        features = {
            "f0Hz": round(_finite(vowel_feats["f0_median"]), 1),
            "jitterPct": round(_finite(vowel_feats["jitter_local"]) * 100, 2),
            "shimmerPct": round(_finite(vowel_feats["shimmer_local"]) * 100, 2),
            "hnrDb": round(_finite(vowel_feats["hnr_db"]), 1),
            "mptSec": round(_finite(vowel_feats["longest_segment_seconds"]), 1),
            "mfcc": [round(_finite(vowel_feats[f"mfcc{i}_mean"]), 2) for i in range(1, 14)],
        }
    except (ValueError, KeyError, TypeError):
        raise ServiceError(422, "QUALITY_REJECTED", "No steady voice found in the sustained vowel.", ["NO_VOICE_IN_VOWEL"])

    # Sample combination rules, not clinically validated:
    #  * index = mean of the available model probabilities;
    #  * confidence = how decisive each model is (max(p, 1 - p)), lowered when the two disagree.
    risk = float(np.mean(probs)) * 100
    decisiveness = float(np.mean([max(p, 1 - p) for p in probs]))
    agreement = 1 - 0.5 * abs(probs[0] - probs[1]) if len(probs) == 2 else 1.0
    confidence = round(decisiveness * agreement, 2)

    processing = (req.device or {}).get("processing", {})
    warnings = list(WARNINGS)
    if any(processing.values()):
        warnings.append("BROWSER_PROCESSING_ON")
    level = "fair" if reasons or any(processing.values()) else "good"
    return {
        "riskIndex": round(risk, 1),
        "subScores": sub,
        "confidence": confidence,
        "quality": {"level": level, "reasons": reasons},
        "features": features,
        "modelId": MODEL_ID,
        "modelVersion": MODEL_VERSION,
        "extractorVersion": EXTRACTOR_VERSION,
        "latencyMs": round((time.perf_counter() - started) * 1000),
        "warnings": warnings,
    }


@app.get("/healthz")
def health() -> dict:
    return {"status": "ok", "model": MODEL_ID, "version": MODEL_VERSION}


@app.post("/v1/screen")
def screen(req: ScreenRequest, authorization: str | None = Header(default=None),
           x_model_version: str | None = Header(default=None)):
    if API_KEY and authorization != f"Bearer {API_KEY}":
        return JSONResponse(status_code=401, content={"error": {"code": "INVALID_INPUT", "message": "Missing or wrong API key."}})
    try:
        return score(req, x_model_version)
    except ServiceError as e:
        body = {"code": e.code, "message": e.message}
        if e.reasons:
            body["reasons"] = e.reasons
        return JSONResponse(status_code=e.status, content={"error": body})
