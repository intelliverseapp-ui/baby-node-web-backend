#!/bin/bash
set -e

SERVICE="baby-node-web-backend"
REGION="us-central1"

echo "🚀 Promote Canary Tool"
echo ""

if [ -z "$1" ]; then
  echo "Usage: ./promote-canary.sh <REVISION_NAME>"
  echo ""
  echo "To see revisions and traffic, run:"
  echo "  ./traffic.sh"
  exit 1
fi

REVISION="$1"

echo "✅ Promoting canary revision to 100%: $REVISION"
gcloud run services update-traffic $SERVICE \
  --region $REGION \
  --to-revisions $REVISION=100

echo ""
echo "✨ Promotion complete. $SERVICE now serving 100% from $REVISION."
