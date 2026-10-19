"""Placeholder inference service for SpiroAI.

No model weights live here. Every request is validated against the contract and answered with
MODEL_UNAVAILABLE until a real model is wired in at `score()`.

Run:  uvicorn app:app --port 8000
Spec: openapi.json (generated from src/ai/contracts.ts, do not edit by hand)
"""
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI(title="SpiroAI inference service (placeholder)", version="1.0.0")


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


def score(req: ScreenRequest, model_version: str | None) -> dict:
    """Replace with the real model call. Return a dict matching ModelOutput in openapi.json."""
    raise NotImplementedError


@app.get("/healthz")
def health() -> dict:
    return {"status": "ok", "model": "none"}


@app.post("/v1/screen")
def screen(req: ScreenRequest, x_model_version: str | None = Header(default=None)):
    try:
        return score(req, x_model_version)
    except NotImplementedError:
        return JSONResponse(
            status_code=503,
            content={"error": {"code": "MODEL_UNAVAILABLE", "message": "No model is deployed in this placeholder service."}},
        )
