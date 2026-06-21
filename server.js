// server.js — Baby Node Backend (OSAction Conductor)

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Routers
const webLookupRouter = require('./web-lookup-server.js');

// Modules
const { callLocalLLM } = require('./modules/llm');
const { callLookupTool } = require('./modules/lookup');
const { normalizeSTG } = require('./modules/stg');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Attach lookup tool routes
app.use(webLookupRouter);

// Continuity index for STG
let continuityIndex = 0;

// -----------------------------
// POST /v1/chat — OSAction Pipeline
// -----------------------------
app.post('/v1/chat', async (req, res) => {
  const userText = req.body.text || '';
  const trimmed = userText.trim();

  let reply = null;

  // 1. Lookup Tool (first priority)
  if (trimmed !== '') {
    const lookup = await callLookupTool(trimmed);
    if (lookup && lookup.answer) {
      reply = lookup.answer;
    }
  }

  // 2. Local LLM (fallback → OSAction JSON)
  if (!reply && trimmed !== '') {
    const llmAnswer = await callLocalLLM(trimmed);

    if (llmAnswer) {
      try {
        // MUST be valid JSON OSAction
        const parsed = JSON.parse(llmAnswer);
        reply = parsed;
      } catch (err) {
        // If LLM ever fails JSON (rare), fallback to plain text
        reply = {
          action: "none",
          appName: null,
          url: null,
          number: null,
          message: null,
          level: null,
          delta: null,
          speech: "Mmhm — not sure what you want there."
        };
      }
    }
  }

  // 3. Echo fallback
  if (!reply) {
    reply = {
      action: "none",
      appName: null,
      url: null,
      number: null,
      message: null,
      level: null,
      delta: null,
      speech: trimmed === '' 
        ? "Mmhm — I didn’t catch anything there."
        : "Mmhm — not sure what you want there."
    };
  }

  // 4. STG envelope
  const stg = normalizeSTG({
    mode: "NEUTRAL",
    torque: 0,
    continuity: 1.0,
    drift: 0.0,
    continuityIndex: continuityIndex++
  });

  res.json({
    reply,
    stg
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[BABY NODE BACKEND] Server running at http://0.0.0.0:${PORT}`);
});
