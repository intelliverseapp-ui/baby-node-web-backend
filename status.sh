#!/bin/bash
set -e

echo "🔍 Checking Baby Node Cloud Run service status…"

gcloud run services describe baby-node-web-backend \
  --region us-central1 \
  --format="table(status.url, status.conditions.type, status.conditions.status, status.conditions.message)"
