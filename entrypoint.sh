#!/bin/bash
set -e

echo "⏳ Waiting for PostgreSQL to be ready..."
# The docker-compose healthcheck handles this, but belt-and-suspenders
sleep 2

echo "📦 Running database migrations..."
alembic upgrade head

echo "🚀 Starting ExamBuddy API server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
