#!/bin/bash
set -e

SERVICE="baby-node-web-backend"
REGION="us-central1"

echo "🚦 Listing Cloud Run revisions and traffic split for $SERVICE…"
echo ""

gcloud run services describe $SERVICE \
  --region $REGION \
  --format="table(status.traffic.revisionName, status.traffic.percent)"

echo ""
echo "📜 Full revision list:"
gcloud run revisions list \
  --region $REGION \
  --service $SERVICE \
  --format="table(metadata.name, metadata.creationTimestamp, status.conditions[?type='Ready'].status)"

echo ""
echo "⚙️ To shift traffic, use:"
echo "   gcloud run services update-traffic $SERVICE --region $REGION --to-revisions REVISION=100"
echo ""
echo "Example:"
echo "   gcloud run services update-traffic $SERVICE --region $REGION --to-revisions baby-node-web-backend-00012-abc=100"
echo ""
echo "✨ Traffic info displayed."
