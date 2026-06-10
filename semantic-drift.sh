#!/bin/bash
set -e

SERVICE="baby-node-web-backend"
REGION="us-central1"

echo "🧠 Semantic Drift Report for $SERVICE"
echo ""

# Time window (you can tweak these)
WINDOW="1h"

echo "⏱  Time window: last $WINDOW"
echo ""

echo "📊 Counting semantic drift events from logs…"

DRIFT_COUNT=$(gcloud logging read \
  "resource.type=\"cloud_run_revision\" \
   resource.labels.service_name=\"$SERVICE\" \
   jsonPayload.semantic_drift=true \
   timestamp>=\"- $WINDOW\"" \
  --region="$REGION" \
  --format="value(logCount)" \
  --limit=1 2>/dev/null || echo "0")

if [ -z "$DRIFT_COUNT" ]; then
  DRIFT_COUNT=0
fi

echo "Total drift events (last $WINDOW): $DRIFT_COUNT"
echo ""

echo "📈 Drift events by revision (top 10):"
gcloud logging read \
  "resource.type=\"cloud_run_revision\" \
   resource.labels.service_name=\"$SERVICE\" \
   jsonPayload.semantic_drift=true \
   timestamp>=\"- $WINDOW\"" \
  --region="$REGION" \
  --format="table(
    resource.labels.revision_name,
    count(*)
  )" \
  --limit=1000 \
  | sort -k2 -nr | head -n 10

echo ""
echo "💻 Drift events by device_id (top 10):"
gcloud logging read \
  "resource.type=\"cloud_run_revision\" \
   resource.labels.service_name=\"$SERVICE\" \
   jsonPayload.semantic_drift=true \
   timestamp>=\"- $WINDOW\"" \
  --region="$REGION" \
  --format="table(
    jsonPayload.device_id,
    count(*)
  )" \
  --limit=1000 \
  | sort -k2 -nr | head -n 10

echo ""
echo "🧬 Sample drift entries (up to 5):"
gcloud logging read \
  "resource.type=\"cloud_run_revision\" \
   resource.labels.service_name=\"$SERVICE\" \
   jsonPayload.semantic_drift=true \
   timestamp>=\"- $WINDOW\"" \
  --region="$REGION" \
  --format="jsonPayload.input_fingerprint, jsonPayload.state_fingerprint, jsonPayload.outcome_fingerprint, jsonPayload.drift_reason" \
  --limit=5

echo ""
echo "✨ Semantic drift report complete."
echo "Make sure your backend logs drift events with: jsonPayload.semantic_drift=true and the fingerprint fields."
