#!/bin/bash
set -e

SERVICE="baby-node-web-backend"
REGION="us-central1"

echo "⏪ Cloud Run Rollback Tool"
echo ""

if [ -z "$1" ]; then
  echo "Usage: ./rollback.sh <REVISION_NAME>"
  echo ""
  echo "To list revisions, run:"
  echo "  ./revisions.sh"
  exit 1
fi

REVISION="$1"

echo "⚠️  Rolling back $SERVICE to revision: $REVISION"
echo ""

gcloud run services update-traffic $SERVICE \
  --region $REGION \
  --to-revisions $REVISION=100

echo ""
echo "✨ Rollback complete. $SERVICE is now serving 100% traffic from $REVISION."
