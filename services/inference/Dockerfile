# Inference service image (Render, Railway, Fly.io, Cloud Run...). Build from this folder.
FROM python:3.12-slim

# No system packages needed: the soundfile wheel bundles libsndfile, and the app always sends WAV.
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

# Keep the numba cache inside the image's writable layer.
ENV NUMBA_CACHE_DIR=/tmp/numba PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]
