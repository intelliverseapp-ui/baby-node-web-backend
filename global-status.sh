#!/bin/bash
set -e

SERVICE="baby-node-web-backend"
REGIONS=("us-central1" "us-east1" "us-west1")

echo "🌐 Global Status for $SERVICE"
echo ""

for REGION in "${REGIONS[@]}"; do
  echo "📍 Region: $REGION"
  gcloud run services describe $SERVICE \
    --region $REGION \
    --format="table(
      metadata.name,
      status.url,
      status.latestReadyRevisionName,
      status.traffic.revisionName,
      status.traffic.percent
    )"
  echo ""
done

echo "✨ Global status complete."
