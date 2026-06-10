#!/bin/bash
set -e

SERVICE="baby-node-web-backend"
REGION="us-central1"

echo "📜 Listing all Cloud Run revisions for $SERVICE…"
echo ""

gcloud run revisions list \
  --region $REGION \
  --service $SERVICE \
  --format="table(
    metadata.name,
    metadata.creationTimestamp,
    status.conditions[?type='Ready'].status,
    status.conditions[?type='Active'].status
  )"

echo ""
echo "✨ Revision list complete."
