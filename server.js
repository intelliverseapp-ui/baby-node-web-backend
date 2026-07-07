/**
 * server.js — Baby Node Backend (OSAction Conductor)
 * LIVE MODE: routes Baby Node requests to Intelliverse Semantic OS
 *
 * Behavior:
 *  - Accepts large base64 PCM payloads (body-parser limit increased)
 *  - Sends text to Intelliverse_Final semantic-server.js
 *  - Receives semantic meaning + STG + TTS from semantic OS
 *  - Returns structured Baby Node response to Android
 */

require('./modules/disable-undici');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch'); // ensure fetch is available

const webLookupRouter = require('./web-lookup-server.js');
const { normalizeSTG } = require('./modules/stg');

const app = express();
app.use(cors());

// Allow large JSON bodies so Android can send base64 PCM during tests
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Serve static model files for Android boot if needed
app.use('/model', express.static(path.join(__dirname, 'model')));

// Attach legacy lookup tool routes
app.use(webLookupRouter);

// Continuity index for STG
let continuityIndex = 0;

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    engine: 'Baby Node Backend (Semantic OS Mode)',
    modules: ['SemanticServer (remote)', 'STG Envelope'],
    continuityIndex
  });
});

// Ping
app.get('/v1/ping', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Baby Node backend alive (Semantic OS Mode)',
    time: new Date().toISOString()
  });
});

// Helper: small safe JSON truncator for logs
function shortJson(obj, max = 1000) {
  try {
    return JSON.stringify(obj).slice(0, max);
  } catch (e) {
    return String(obj).slice(0, max);
  }
}

// POST /v1/chat — main Baby Node pipeline
app.post('/v1/chat', async (req, res) => {
  const userText =
    (req.body && (req.body.text || req.body.transcript || '')) || '';
  const trimmed = String(userText).trim();

  const clientPcmBase64 = req.body && req.body.pcm ? String(req.body.pcm) : '';

  // 1) Send text to Intelliverse Semantic OS
  let semanticResult = null;

  try {
    const response = await fetch('http://localhost:8000/semantic/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed })
    });

    semanticResult = await response.json();
    console.log('[BABY NODE] semanticResult:', shortJson(semanticResult));
  } catch (e) {
    console.error('[BABY NODE] Semantic OS call failed:', e);

    // fallback response if semantic server is down
    semanticResult = {
      reply: {
        action: 'none',
        speech: `Echo (fallback): ${trimmed}`,
        provider: 'fallback_stub',
        metadata: { stub: true }
      },
      stg: normalizeSTG({
        mode: 'NEUTRAL',
        torque: 0,
        continuity: 1.0,
        drift: 0.0,
        continuityIndex: continuityIndex++
      }),
      ttsPcm: ''
    };
  }

  // 2) Return structured response to Android
  res.json({
    reply: semanticResult.reply,
    stg: semanticResult.stg,
    ttsPcm: semanticResult.ttsPcm || '',
    received: {
      pcmProvided: !!clientPcmBase64,
      clientPcmSize: clientPcmBase64 ? clientPcmBase64.length : 0
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[BABY NODE BACKEND] Semantic OS Mode active on port ${PORT}`);
  console.log('[BABY NODE] Connected to Intelliverse Semantic Server at http://localhost:8000/semantic/process');
});
