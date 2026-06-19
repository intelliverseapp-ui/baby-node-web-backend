// modules/topic-classifier.js
// Baby Node — Lightweight Topic Classifier

function classifyTopic(text) {
  if (!text || typeof text !== "string") return "general";

  const lower = text.toLowerCase();

  // Science-related keywords
  if (lower.match(/\b(physics|chemistry|biology|gravity|atom|molecule|energy|force|quantum)\b/)) {
    return "science";
  }

  // Math-related keywords
  if (lower.match(/\b(math|equation|algebra|geometry|calculus|probability|statistics|solve)\b/)) {
    return "math";
  }

  // History-related keywords
  if (lower.match(/\b(history|war|empire|ancient|civilization|revolution|king|queen|dynasty)\b/)) {
    return "history";
  }

  // Sensitive/emotional topics
  if (lower.match(/\b(feelings|sad|happy|angry|lonely|depressed|anxious|emotion|hurt)\b/)) {
    return "sensitive";
  }

  // Personal topics
  if (lower.match(/\b(you|i|my|relationship|family|friend|life|myself)\b/)) {
    return "personal";
  }

  return "general";
}

module.exports = {
  classifyTopic
};
