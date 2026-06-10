#!/bin/bash
set -e

echo "📊 Fetching Cloud Run metrics for Baby Node…"
echo ""

SERVICE="baby-node-web-backend"
REGION="us-central1"

echo "⏱  Requests per second (last 5 minutes):"
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_count" AND resource.label."service_name"="'$SERVICE'"' \
  --format="table(points[0].value.int64Value, metric.labels.response_code)" \
  --limit=10

echo ""
echo "🔥 CPU utilization (last 5 minutes):"
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/container/cpu/utilization" AND resource.label."service_name"="'$SERVICE'"' \
  --format="table(points[0].value.doubleValue)" \
  --limit=5

echo ""
echo "💾 Memory utilization (last 5 minutes):"
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/container/memory/utilization" AND resource.label."service_name"="'$SERVICE'"' \
  --format="table(points[0].value.doubleValue)" \
  --limit=5

echo ""
echo "🚨 Error counts (last 5 minutes):"
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_count" AND metric.labels.response_code=~"5.." AND resource.label."service_name"="'$SERVICE'"' \
  --format="table(points[0].value.int64Value)" \
  --limit=10

echo ""
echo "✨ Metrics fetch complete."
