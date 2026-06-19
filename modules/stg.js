// modules/stg.js
// Baby Node — STG (Semantic Transport Geometry) State Helpers

/**
 * Default STG state.
 * This keeps Baby Node stable even if the client sends nothing.
 */
const defaultSTG = {
  mode: "NEUTRAL",   // NEUTRAL | REFLECTIVE | ALERT | CURIOUS | etc.
  torque: 0,         // -10 to +10 recommended range
  continuity: 1.0,   // 0.0–1.0 (how much Baby Node keeps context)
  drift: 0.0         // future use (semantic drift tracking)
};

/**
 * Merge incoming STG state with defaults.
 * Ensures no missing fields and prevents invalid values.
 */
function normalizeSTG(input = {}) {
  const stg = { ...defaultSTG, ...input };

  // Clamp torque to safe range
  if (typeof stg.torque === "number") {
    stg.torque = Math.max(-10, Math.min(10, stg.torque));
  } else {
    stg.torque = 0;
  }

  // Clamp continuity
  if (typeof stg.continuity === "number") {
    stg.continuity = Math.max(0, Math.min(1, stg.continuity));
  } else {
    stg.continuity = 1.0;
  }

  // Drift reserved for future STG primitives
  if (typeof stg.drift !== "number") {
    stg.drift = 0.0;
  }

  // Mode normalization
  const allowedModes = ["NEUTRAL", "REFLECTIVE", "ALERT", "CURIOUS"];
  if (!allowedModes.includes(stg.mode)) {
    stg.mode = "NEUTRAL";
  }

  return stg;
}

/**
 * Simple helper to adjust torque.
 * Useful for future adaptive behavior.
 */
function adjustTorque(stg, delta) {
  const updated = normalizeSTG(stg);
  updated.torque = Math.max(-10, Math.min(10, updated.torque + delta));
  return updated;
}

/**
 * Simple helper to switch mode.
 */
function setMode(stg, mode) {
  const updated = normalizeSTG(stg);
  updated.mode = mode;
  return updated;
}

module.exports = {
  defaultSTG,
  normalizeSTG,
  adjustTorque,
  setMode
};
