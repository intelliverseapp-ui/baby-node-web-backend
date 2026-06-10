#!/bin/bash
set -e

echo "🌐 Fetching Cloud Run domain mappings…"
echo ""

gcloud run domain-mappings list \
  --region us-central1 \
  --format="table(domain, resourceRecords.type, resourceRecords.rrdata)"

echo ""
echo "✨ Domain mapping info displayed."
