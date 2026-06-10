#!/bin/bash
set -e

SERVICE="baby-node-web-backend"
REGION="us-central1"

echo "🚀 Deploying canary revision for $SERVICE…"
echo ""

if [ -z "$1" ]; then
  echo "Usage: ./deploy-canary.sh <IMAGE_URL>"
  echo "Example: ./deploy-canary.sh gcr.io/babynode-prod/backend:v42"
  exit 1
fi

IMAGE="$1"

echo "📦 Deploying new revision with image: $IMAGE"
gcloud run deploy $SERVICE \
  --image $IMAGE \
  --region $REGION \
  --no-traffic

echo ""
echo "🔍 Fetching latest revision name…"
REV=$(gcloud run revisions list \
  --region $REGION \
  --service $SERVICE \
  --sort-by="~metadata.creationTimestamp" \
  --format="value(metadata.name)" \
  --limit=1)

echo "New revision: $REV"

echo ""
echo "🧪 Sending 1% of traffic to canary revision…"
gcloud run services update-traffic $SERVICE \
  --region $REGION \
  --to-revisions $REV=1 \
  --splits-default=99

echo ""
echo "✨ Canary deployment complete."
echo "1% → $REV"
echo "99% → stable"
