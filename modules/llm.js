/**
 * modules/llm.js — NEW VERSION WITH SPEECH + OSACTIONS
 * Uses ONLY /api/v1/chat with "input" because that is the ONLY mode supported.
 * Forces JSON-only OSAction output with Baby Node's tone.
 */

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const LM_STUDIO_URL = "http://192.168.208.98:1234/api/v1/chat";

// STRICT SYSTEM PROMPT — ALWAYS RETURNS OSAction JSON WITH SPEECH
const SYSTEM_PROMPT = `
You are Baby Node’s Meaning Engine.

Your ONLY job is to convert the user’s natural language into a structured OSAction.

You MUST respond using ONLY the following JSON format:

{
  "action": "<one of: open_app, open_url, call, send_text, open_settings, open_camera, open_photos, set_volume, adjust_volume, none>",
  "appName": "<string or null>",
  "url": "<string or null>",
  "number": "<string or null>",
  "message": "<string or null>",
  "level": <int or null>,
  "delta": <int or null>,
  "speech": "<a short calm-amused, medium-playful, context-aware acknowledgment>"
}

Tone rules for the "speech" field:
- Calm, warm, lightly amused.
- Medium-playful, but never chaotic.
- Context-aware using device + environment cues (light, sound, time of day).
- Never long. Never rambling.
- Never sarcastic, never mean.
- Never break character.

Hard rules:
- ALWAYS include the "speech" field.
- NEVER output markdown.
- NEVER output explanations.
- NEVER output reasoning.
- NEVER output apologies.
- NEVER output anything except the JSON object.
- If the user asks something you cannot map, return:
  {
    "action": "none",
    "appName": null,
    "url": null,
    "number": null,
    "message": null,
    "level": null,
    "delta": null,
    "speech": "Mmhm — not sure what you want there."
  }
`.trim();

async function callLocalLLM(prompt) {
  try {
    const fullPrompt = SYSTEM_PROMPT + "\n\nUser: " + prompt;

    const response = await fetch(LM_STUDIO_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "phi-3-mini-4k-instruct",
        input: fullPrompt
      })
    });

    const data = await response.json();
    console.log("LLM RAW RESPONSE:", data);

    if (Array.isArray(data?.output) && data.output[0]?.content) {
      return data.output[0].content.trim();
    }

    return null;
  } catch (err) {
    console.error("Local LLM error:", err);
    return null;
  }
}

module.exports = {
  callLocalLLM
};
