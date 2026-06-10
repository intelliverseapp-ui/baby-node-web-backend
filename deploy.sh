#!/bin/bash
set -e

echo "🚀 Building amd64 image for Baby Node…"
docker buildx build --platform linux/amd64 -t babynode-backend-amd64 --load .

echo "🏷  Tagging image for Artifact Registry…"
docker tag babynode-backend-amd64 us-central1-docker.pkg.dev/babynode-prod/babynode/babynode-backend

echo "📤 Pushing image to Artifact Registry…"
docker push us-central1-docker.pkg.dev/babynode-prod/babynode/babynode-backend

echo "🌐 Deploying to Cloud Run…"
gcloud run deploy baby-node-web-backend \
  --image us-central1-docker.pkg.dev/babynode-prod/babynode/babynode-backend \
  --region us-central1 \
  --allow-unauthenticated

echo "🎉 Deployment complete!"
