// modules/intent-detector.js
// Baby Node — Lightweight User Intent Detector

function detectUserIntent(text) {
  if (!text || typeof text !== "string") return "neutral";

  const lower = text.toLowerCase();

  // Curiosity-driven questions
  if (
    lower.startsWith("why ") ||
    lower.includes("why does") ||
    lower.includes("why is") ||
    lower.includes("how come")
  ) {
    return "curious";
  }

  // Confusion or clarity-seeking
  if (
    lower.includes("i don't understand") ||
    lower.includes("i dont understand") ||
    lower.includes("confused") ||
    lower.includes("explain") ||
    lower.includes("simpler") ||
    lower.includes("what do you mean")
  ) {
    return "confused";
  }

  // Help-seeking
  if (
    lower.includes("help me") ||
    lower.includes("can you help") ||
    lower.includes("i need help") ||
    lower.includes("what should i do")
  ) {
    return "help-seeking";
  }

  // Challenging or testing the system
  if (
    lower.includes("prove") ||
    lower.includes("are you sure") ||
    lower.includes("really true") ||
    lower.includes("i doubt") ||
    lower.includes("that can't be right")
  ) {
    return "challenging";
  }

  // Personal/emotional intent
  if (
    lower.includes("i feel") ||
    lower.includes("i'm feeling") ||
    lower.includes("i am feeling") ||
    lower.includes("i'm scared") ||
    lower.includes("i'm worried")
  ) {
    return "emotional";
  }

  return "neutral";
}

module.exports = {
  detectUserIntent
};
