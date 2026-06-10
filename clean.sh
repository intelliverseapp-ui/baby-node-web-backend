#!/bin/bash
set -e

echo "🧹 Cleaning Docker build cache…"
docker builder prune -af

echo "🗑  Removing dangling images…"
docker image prune -f

echo "♻️  Removing unused containers, networks, and volumes…"
docker system prune -f

echo "✨ Docker cleanup complete. Your next build will be fully fresh."
