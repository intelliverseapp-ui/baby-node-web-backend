#!/bin/bash
set -e

SERVICE="baby-node-web-backend"
REGION="us-central1"

echo "📈 Current Cloud Run scaling settings for $SERVICE…"
gcloud run services describe $SERVICE \
  --region $REGION \
  --format="table(spec.template.spec.containerConcurrency, spec.template.scaling.minInstanceCount, spec.template.scaling.maxInstanceCount)"

echo ""
echo "⚙️ To update scaling, use:"
echo "   gcloud run services update $SERVICE --region $REGION --min-instances N --max-instances M"
echo ""
echo "Examples:"
echo "   Set min=0, max=1:"
echo "     gcloud run services update $SERVICE --region $REGION --min-instances 0 --max-instances 1"
echo ""
echo "   Set min=1, max=3:"
echo "     gcloud run services update $SERVICE --region $REGION --min-instances 1 --max-instances 3"
echo ""
echo "✨ Scaling info displayed."
