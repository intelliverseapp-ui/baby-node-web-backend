#!/bin/bash
set -e

SERVICE="baby-node-web-backend"
REGIONS=("us-central1" "us-east1" "us-west1")

echo "🌍 Multi-Region Deploy Tool"
echo ""

if [ -z "$1" ]; then
  echo "Usage: ./multi-region-deploy.sh <IMAGE_URL>"
  echo "Example: ./multi-region-deploy.sh gcr.io/babynode-prod/backend:v42"
  exit 1
fi

IMAGE="$1"

for REGION in "${REGIONS[@]}"; do
  echo "🚀 Deploying $SERVICE to region: $REGION"
  gcloud run deploy $SERVICE \
    --image $IMAGE \
    --region $REGION \
    --platform managed \
    --quiet
  echo ""
done

echo "✨ Multi-region deployment complete."
