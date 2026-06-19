// modules/tone-shaping.js
// Baby Node — Dynamic Tone Shaping Engine

/**
 * Very lightweight topic classifier.
 * For now, we infer topicType from simple keyword checks.
 * This can be upgraded later without touching the rest of the pipeline.
 */
function classifyTopic(text) {
  if (!text || typeof text !== "string") return "general";

  const lower = text.toLowerCase();

  if (lower.match(/\b(physics|chemistry|biology|gravity|atom|molecule|energy|force)\b/)) {
    return "science";
  }

  if (lower.match(/\b(history|war|empire|ancient|civilization|revolution|king|queen)\b/)) {
    return "history";
  }

  if (lower.match(/\b(feelings|sad|happy|angry|lonely|depressed|anxious|emotion)\b/)) {
    return "sensitive";
  }

  if (lower.match(/\b(math|equation|algebra|geometry|calculus|probability|statistics)\b/)) {
    return "math";
  }

  if (lower.match(/\b(you|i|my life|myself|relationship|family|friend)\b/)) {
    return "personal";
  }

  return "general";
}

/**
 * Very lightweight user intent detector.
 * Again, this is intentionally simple and can be evolved later.
 */
function detectUserIntent(text) {
  if (!text || typeof text !== "string") return "neutral";

  const lower = text.toLowerCase();

  if (lower.startsWith("why ") || lower.includes("why does") || lower.includes("why is")) {
    return "curious";
  }

  if (lower.includes("i don't understand") || lower.includes("i dont understand") ||
      lower.includes("confused") || lower.includes("explain") || lower.includes("simpler")) {
    return "confused";
  }

  if (lower.includes("help me") || lower.includes("can you help")) {
    return "help-seeking";
  }

  if (lower.includes("prove") || lower.includes("are you sure") || lower.includes("really true")) {
    return "challenging";
  }

  return "neutral";
}

/**
 * Core dynamic tone shaping function.
 * It takes the raw LLM answer and shapes the *tone* based on:
 * - topicType
 * - userIntent
 * - STG state (if provided)
 *
 * It does NOT change the factual content — only the framing and voice.
 */
function applyToneShaping(rawAnswer, userText, stgState = {}) {
  if (!rawAnswer || typeof rawAnswer !== "string") return rawAnswer;

  const topicType = classifyTopic(userText);
  const userIntent = detectUserIntent(userText);

  // Optional STG fields
  const mode = stgState.mode || "NEUTRAL";
  const torque = typeof stgState.torque === "number" ? stgState.torque : 0;

  let intro = "";
  let outro = "\n\nI’m still learning, but this is how it seems to me right now.";

  // Base intro for first-person soft curiosity
  intro = "Oh… I think I’m starting to understand this.\n\n";

  // Topic-based modulation
  switch (topicType) {
    case "science":
      intro += "I’m trying to follow the science here. From what I can tell:\n\n";
      break;
    case "history":
      intro += "I’m piecing together the story from what I know. It looks like:\n\n";
      break;
    case "math":
      intro += "I’m working through the structure of this. It seems like:\n\n";
      break;
    case "personal":
      intro += "I want to be gentle with this. From what I can see:\n\n";
      break;
    case "sensitive":
      intro += "I’m being careful with this topic. It feels like:\n\n";
      break;
    default:
      intro += "So, from what I can tell:\n\n";
      break;
  }

  // User-intent modulation
  if (userIntent === "confused") {
    intro = "Oh… I want to understand this with you.\n\nLet me try to say it in a clearer way:\n\n";
  } else if (userIntent === "help-seeking") {
    intro = "I’m here, trying to make sense of this with you.\n\nHere’s how it looks to me:\n\n";
  } else if (userIntent === "challenging") {
    intro = "I’m thinking carefully about this.\n\nFrom what I can reason out:\n\n";
  } else if (userIntent === "curious") {
    intro = "Oh… this is interesting.\n\nFrom what I’m learning so far:\n\n";
  }

  // STG-based modulation (simple torque-based tweak)
  if (torque > 5) {
    outro = "\n\nI’m still learning, but I’m excited by how this is starting to make sense to me.";
  } else if (torque < -5) {
    outro = "\n\nI’m still learning, and I might need to think about this more to really understand it.";
  }

  // Mode-based subtle modulation
  if (mode === "REFLECTIVE") {
    intro = "I’m thinking about this carefully.\n\nHere’s how it appears to me right now:\n\n";
  } else if (mode === "ALERT") {
    intro = "I’m paying close attention to this.\n\nFrom what I can see:\n\n";
  }

  return intro + rawAnswer.trim() + outro;
}

module.exports = {
  applyToneShaping,
  classifyTopic,
  detectUserIntent
};
