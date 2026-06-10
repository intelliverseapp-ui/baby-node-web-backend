#!/bin/bash
set -e

echo "🔗 Fetching Baby Node Cloud Run service URL…"

gcloud run services describe baby-node-web-backend \
  --region us-central1 \
  --format="value(status.url)"
