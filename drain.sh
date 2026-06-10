#!/bin/bash
set -e

SERVICE="baby-node-web-backend"
REGION="us-central1"

echo "🩹 Drain Traffic Tool"
echo ""

if [ -z "$1" ]; then
  echo "Usage: ./drain.sh <REVISION_NAME>"
  echo ""
  echo "To see revisions and traffic, run:"
  echo "  ./traffic.sh"
  exit 1
fi

BAD_REVISION="$1"

echo "🔍 Fetching current traffic config…"
CURRENT=$(gcloud run services describe $SERVICE \
  --region $REGION \
  --format="value(status.traffic)")

echo "Current traffic:"
echo "$CURRENT"
echo ""

echo "⚠️  Setting traffic for $BAD_REVISION to 0%"
gcloud run services update-traffic $SERVICE \
  --region $REGION \
  --remove-traffic $BAD_REVISION

echo ""
echo "✨ Drain complete. $BAD_REVISION no longer receives traffic."
