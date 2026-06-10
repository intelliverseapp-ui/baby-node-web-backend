#!/bin/bash
set -e

echo "🌱 Viewing current Cloud Run environment variables…"

gcloud run services describe baby-node-web-backend \
  --region us-central1 \
  --format="value(spec.template.spec.containers[0].env)"

echo ""
echo "⚙️ To set an environment variable, run:"
echo "   gcloud run services update baby-node-web-backend --region us-central1 --set-env-vars KEY=VALUE"
echo ""
echo "⚙️ To unset an environment variable, run:"
echo "   gcloud run services update baby-node-web-backend --region us-central1 --remove-env-vars KEY"
