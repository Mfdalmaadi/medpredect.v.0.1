#!/usr/bin/env bash
set -e

echo "Starting MedPredict AI Backend..."

echo "==> Running database migrations..."
python -m alembic upgrade head || echo "==> Alembic migration notice: Continuing..."

echo "==> Seeding users if needed..."
python seed_users.py || echo "==> User seeding notice: Continuing..."

echo "==> Starting Uvicorn server on port ${PORT:-8000}..."
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
