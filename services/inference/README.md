# Inference service (placeholder)

FastAPI stub with no model weights. `openapi.json` is generated from `src/ai/contracts.ts`
(`npm run gen:openapi`) and is the contract the Next.js app tests against.

```
pip install -r requirements.txt
uvicorn app:app --port 8000
```

Then run the app with `AI_PROVIDER=http AI_ENDPOINT=http://localhost:8000`. Every recording ends in the designed
"Analysis unavailable, retry" state until `score()` is implemented.
