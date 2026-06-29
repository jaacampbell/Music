FROM python:3.11-slim

# System deps: ffmpeg + rubberband for audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    librubberband-dev \
    libsndfile1 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/

# Pre-download Demucs model weights at build time (optional; speeds up first run)
# RUN python -c "import demucs.pretrained; demucs.pretrained.get_model('htdemucs')"

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
