// server.js — Modular Baby Node Backend (Conductor Only)

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Routers
const webLookupRouter = require('./web-lookup-server.js');

// Modules (Baby Node Brain Components)
const { callLocalLLM } = require('./modules/llm');
const { callLookupTool } = require('./modules/lookup');
const { applyPersonality } = require('./modules/personality');
const { applyToneShaping } = require('./modules/tone-shaping');
const { classifyTopic } = require('./modules/topic-classifier');
const { detectUserIntent } = require('./modules/intent-detector');
const { normalizeSTG } = require('./modules/stg');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Attach lookup tool routes
app.use(webLookupRouter);

// Continuity index for STG
let continuityIndex = 0;

// -----------------------------
// POST /v1/chat — Modular Pipeline
// -----------------------------
app.post('/v1/chat', async (req, res) => {
  const userText = req.body.text || '';
  const trimmed = userText.trim();

  let reply = null;

  // 1. Topic + Intent
  const topicType = classifyTopic(trimmed);
  const userIntent = detectUserIntent(trimmed);

  // 2. Lookup Tool
  if (trimmed !== '') {
    const lookup = await callLookupTool(trimmed);
    if (lookup && lookup.answer) {
      reply = lookup.answer;
    }
  }

  // 3. Local LLM (fallback)
  if (!reply && trimmed !== '') {
    const llmAnswer = await callLocalLLM(trimmed);
    if (llmAnswer) {
      // 4. Tone shaping
      const toned = applyToneShaping(llmAnswer, trimmed, { mode: "NEUTRAL", torque: 0 });

      // 5. Personality
      reply = applyPersonality(toned);
    }
  }

  // 6. Echo fallback
  if (!reply) {
    reply = trimmed === '' ? "I didn't receive any text." : trimmed;
  }

  // 7. STG envelope
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
  console.log(`[BABY NODE BACKEND] Modular server running at http://0.0.0.0:${PORT}`);
});
