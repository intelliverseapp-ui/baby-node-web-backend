#!/bin/bash
set -e

SERVICE="baby-node-web-backend"
REGION="us-central1"

echo "💰 Estimating Cloud Run cost for $SERVICE…"
echo ""

echo "📊 Recent request count (last 1 hour):"
REQ=$(gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_count" AND resource.label."service_name"="'$SERVICE'"' \
  --format="value(points[0].value.int64Value)" \
  --limit=1)

echo "Requests: $REQ"

echo ""
echo "🔥 CPU utilization sample:"
CPU=$(gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/container/cpu/utilization" AND resource.label."service_name"="'$SERVICE'"' \
  --format="value(points[0].value.doubleValue)" \
  --limit=1)

echo "CPU Utilization: $CPU"

echo ""
echo "💾 Memory utilization sample:"
MEM=$(gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/container/memory/utilization" AND resource.label."service_name"="'$SERVICE'"' \
  --format="value(points[0].value.doubleValue)" \
  --limit=1)

echo "Memory Utilization: $MEM"

echo ""
echo "🧮 Rough cost estimate:"
echo "Cloud Run pricing varies by CPU, memory, and request volume."
echo "Use these samples to plug into the official calculator:"
echo "https://cloud.google.com/products/calculator"
echo ""
echo "✨ Cost estimation complete."
