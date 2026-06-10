#!/bin/bash
set -e

echo "📡 Tailing Cloud Run logs for Baby Node…"
echo "Press CTRL+C to stop."

gcloud logs tail projects/babynode-prod/logs/run.googleapis.com%2Fstdout \
  --region=us-central1 \
  --service=baby-node-web-backend \
  --format="value(textPayload)"
