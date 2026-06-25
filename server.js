/**
 * server.js — Baby Node Backend (OSAction Conductor)
 * NEW VERSION WITH UNIVERSAL SEARCH + ACTION ROUTER + MEANING ENGINE
 */

require('./modules/disable-undici');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Legacy router (still mounted, not used by new pipeline)
const webLookupRouter = require('./web-lookup-server.js');

// Modules
const { normalizeSTG } = require('./modules/stg');
const { routeAction } = require('./modules/action-router');
const { process: processMeaning } = require('./modules/meaning-engine');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// -------------------------------------------------------------
// STATIC MODEL FILES FOR ANDROID (CRITICAL FOR BABY NODE BOOT)
// -------------------------------------------------------------
// Serves everything in /model, including:
//  - babynode_phi3.onnx
//  - babynode_phi3.onnx.data
app.use('/model', express.static(path.join(__dirname, 'model')));

// Attach legacy lookup tool routes
app.use(webLookupRouter);

// Continuity index for STG
let continuityIndex = 0;

// -----------------------------
// GET /api/health — Health Check
// -----------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    engine: 'Baby Node Merged Backend',
    modules: ['LLM', 'UniversalSearch', 'ActionRouter', 'STG', 'MeaningEngine'],
    continuityIndex
  });
});

// -----------------------------
// GET /v1/ping — NEW PING ENDPOINT
// -----------------------------
app.get('/v1/ping', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Baby Node backend alive',
    time: new Date().toISOString()
  });
});

// -----------------------------
// POST /v1/chat — OSAction Pipeline
// -----------------------------
app.post('/v1/chat', async (req, res) => {
  const userText = req.body.text || '';
  const trimmed = userText.trim();

  // 1. Meaning Engine → memory-aware OSAction JSON
  const parsed = await processMeaning(trimmed);

  // 2. Route the OSAction (search or normal)
  const finalAction = await routeAction(parsed);

  // 3. STG envelope
  const stg = normalizeSTG({
    mode: 'NEUTRAL',
    torque: 0,
    continuity: 1.0,
    drift: 0.0,
    continuityIndex: continuityIndex++
  });

  res.json({
    reply: finalAction,
    stg
  });
});

// -----------------------------
// Start server
// -----------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `[BABY NODE MERGED BACKEND] Meaning Engine + Universal Search + STG active on port ${PORT}`
  );
});
