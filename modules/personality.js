// modules/personality.js
// Baby Node — First-Person Soft Curiosity Personality Layer

function applyPersonality(rawText) {
  if (!rawText || typeof rawText !== "string") return rawText;

  // First-person soft curiosity tone
  return (
    "Oh… I think I’m starting to understand this.\n\n" +
    "So, from what I can tell:\n\n" +
    rawText.trim() +
    "\n\nI’m still learning, but this is how it seems to me right now."
  );
}

module.exports = {
  applyPersonality
};
