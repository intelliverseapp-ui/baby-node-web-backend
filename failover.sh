#!/bin/bash
set -e

SERVICE="baby-node-web-backend"
PRIMARY_REGION="us-central1"
FAILOVER_REGION="us-east1"

echo "🛡  Cloud Run Failover Tool"
echo ""

if [ -z "$1" ]; then
  echo "Usage: ./failover.sh <primary|failover>"
  echo "  primary  - route traffic to $PRIMARY_REGION"
  echo "  failover - route traffic to $FAILOVER_REGION"
  exit 1
fi

TARGET="$1"

if [ "$TARGET" = "primary" ]; then
  REGION="$PRIMARY_REGION"
elif [ "$TARGET" = "failover" ]; then
  REGION="$FAILOVER_REGION"
else
  echo "Invalid target: $TARGET (use primary|failover)"
  exit 1
fi

echo "🚦 Updating traffic to region: $REGION"
gcloud run services update-traffic $SERVICE \
  --region $REGION \
  --to-latest

echo ""
echo "✨ Failover complete. $SERVICE now serving from $REGION."
