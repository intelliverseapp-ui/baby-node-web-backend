/**
 * meaning-engine.js
 * ------------------
 * Baby Node Meaning Engine (backend)
 *
 * Responsibilities:
 *  - Read STM + LTM
 *  - Build memory-aware prompt for the LLM
 *  - Call local LLM (phi-3 via lm-studio)
 *  - Parse OSAction JSON
 *  - Normalize + sanitize fields
 *  - Apply navigation/provider preferences
 *  - Update LTM/STM when user expresses preferences
 */

const { callLocalLLM } = require('./llm');
const STM = require('./memory/shortTermMemory');
const LTM = require('./memory/longTermMemory');

/**
 * Build a compact memory context string for the LLM.
 * This is NOT full state dump, just enough to give it continuity.
 */
function buildMemoryContext() {
  const lastQuery = STM.getLastQuery();
  const lastTopic = STM.getLastTopic();
  const lastNav = STM.getLastNavigationProvider();
  const defaultNav = LTM.getDefaultNavigationProvider();

  const parts = [];

  if (lastQuery && lastQuery.text) {
    parts.push(`last_query="${lastQuery.text}"`);
  }
  if (lastTopic) {
    parts.push(`last_topic="${lastTopic}"`);
  }
  if (lastNav) {
    parts.push(`last_navigation_provider="${lastNav}"`);
  }
  if (defaultNav) {
    parts.push(`default_navigation_provider="${defaultNav}"`);
  }

  if (parts.length === 0) {
    return "no_prior_context";
  }

  return parts.join("; ");
}

/**
 * Normalize and sanitize parsed OSAction.
 */
function normalizeParsed(parsed, fallbackSpeech) {
  const base = {
    action: "none",
    appName: null,
    url: null,
    number: null,
    message: null,
    level: null,
    delta: null,
    query: null,
    domainHint: null,
    providerHint: null,
    speech: fallbackSpeech || "Mmhm — not sure what you want there."
  };

  const out = Object.assign({}, base, parsed || {});

  // Normalize strings to lower-case where appropriate
  if (out.domainHint) {
    out.domainHint = String(out.domainHint).toLowerCase();
  }
  if (out.providerHint) {
    out.providerHint = String(out.providerHint).toLowerCase();
  }
  if (out.action) {
    out.action = String(out.action).toLowerCase();
  }

  // Ensure speech is always present and short
  if (!out.speech || typeof out.speech !== 'string') {
    out.speech = fallbackSpeech || "Mmhm — not sure what you want there.";
  }

  return out;
}

/**
 * Apply navigation/provider preferences based on parsed OSAction + user text.
 */
function applyPreferences(parsed, userText) {
  const text = (userText || '').toLowerCase();

  // Normalize providerHint for navigation
  if (parsed.action === 'search_and_navigate') {
    let provider = parsed.providerHint
      ? String(parsed.providerHint).toLowerCase()
      : null;

    // If user explicitly mentions Waze
    if (text.includes('waze')) {
      provider = 'waze';
      parsed.providerHint = 'waze';
      STM.setLastNavigationProvider('waze');

      // If user says "from now on" or "always", persist preference
      if (text.includes('from now on') || text.includes('always')) {
        LTM.setDefaultNavigationProvider('waze');
      }
    }

    // If user explicitly mentions Google Maps / maps
    if (text.includes('google maps') || text.includes('maps')) {
      provider = 'maps';
      parsed.providerHint = 'maps';
      STM.setLastNavigationProvider('google_maps');

      if (text.includes('from now on') || text.includes('always')) {
        LTM.setDefaultNavigationProvider('google_maps');
      }
    }

    // If no providerHint, fall back to LTM default
    if (!provider) {
      const def = LTM.getDefaultNavigationProvider();
      if (def === 'waze') {
        parsed.providerHint = 'waze';
        STM.setLastNavigationProvider('waze');
      } else {
        parsed.providerHint = 'maps';
        STM.setLastNavigationProvider('google_maps');
      }
    }
  }

  // Light topic tracking: if domainHint present, update STM topic
  if (parsed.domainHint) {
    STM.setLastTopic(parsed.domainHint);
  }

  return parsed;
}

/**
 * Meaning Engine main entry point.
 * Takes raw user text, injects memory context, calls LLM, parses JSON,
 * normalizes, applies preferences, and returns a final OSAction object.
 */
async function process(userText) {
  const trimmed = (userText || '').trim();

  // Empty input → direct fallback
  if (trimmed === '') {
    return {
      action: "none",
      appName: null,
      url: null,
      number: null,
      message: null,
      level: null,
      delta: null,
      query: null,
      domainHint: null,
      providerHint: null,
      speech: "Mmhm — I didn’t catch anything there."
    };
  }

  // Build memory-aware prompt
  const memoryContext = buildMemoryContext();
  const llmInput = `CONTEXT:\n${memoryContext}\n\nUSER:\n${trimmed}`;

  // Call local LLM
  let llmAnswer = null;
  try {
    llmAnswer = await callLocalLLM(llmInput);
  } catch (err) {
    console.error("MeaningEngine: LLM call failed:", err);
  }

  // Parse JSON from LLM
  let parsed = null;
  if (llmAnswer) {
    try {
      parsed = JSON.parse(llmAnswer);
    } catch (err) {
      console.error("MeaningEngine: failed to parse LLM JSON:", err);
    }
  }

  // Normalize + fallback
  parsed = normalizeParsed(parsed, "Mmhm — not sure what you want there.");

  // Apply navigation/provider preferences using STM + LTM
  parsed = applyPreferences(parsed, trimmed);

  return parsed;
}

module.exports = {
  process
};
