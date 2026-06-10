#!/bin/bash
set -e

echo "🧪 Starting Baby Node backend locally…"
echo "Using PORT=3000"

export PORT=3000

# If you want to use your real OpenAI key locally, uncomment the next line
# export OPENAI_API_KEY="YOUR_KEY_HERE"

node web-lookup-server.js
