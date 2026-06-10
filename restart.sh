#!/bin/bash
set -e

echo "🔄 Forcing a new Cloud Run revision for Baby Node…"

gcloud run services update baby-node-web-backend \
  --region us-central1 \
  --force

echo "✨ Restart complete — new revision triggered."
