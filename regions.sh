#!/bin/bash
set -e

echo "🌎 Listing all Cloud Run regions…"
echo ""

gcloud run regions list \
  --format="table(locationId, displayName, supportsP4SA, supportsTrafficSplitting)"

echo ""
echo "✨ Region list complete."
