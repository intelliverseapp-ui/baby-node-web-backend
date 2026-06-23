/**
 * LONG-TERM MEMORY (LTM)
 * ----------------------
 * Persistent preferences and facts across Baby Node sessions.
 * Backed by a JSON file on disk.
 */

const fs = require('fs');
const path = require('path');

const MEMORY_PATH = path.join(__dirname, 'longTermMemory.json');

let memory = {};

/**
 * Load memory from disk (called on startup).
 */
function loadMemory() {
  try {
    if (fs.existsSync(MEMORY_PATH)) {
      const raw = fs.readFileSync(MEMORY_PATH, 'utf8');
      memory = JSON.parse(raw || '{}');
    } else {
      memory = {};
    }
  } catch (err) {
    console.error('LTM: failed to load memory:', err);
    memory = {};
  }
}

/**
 * Save memory to disk.
 */
function saveMemory() {
  try {
    fs.writeFileSync(MEMORY_PATH, JSON.stringify(memory, null, 2), 'utf8');
  } catch (err) {
    console.error('LTM: failed to save memory:', err);
  }
}

/**
 * Get a value by key.
 */
function get(key, defaultValue = null) {
  if (Object.prototype.hasOwnProperty.call(memory, key)) {
    return memory[key];
  }
  return defaultValue;
}

/**
 * Set a value by key and persist.
 */
function set(key, value) {
  memory[key] = value;
  saveMemory();
}

/**
 * Convenience helpers for navigation preference, etc.
 */

function getDefaultNavigationProvider() {
  return get('defaultNavigationProvider', 'google_maps'); // default
}

function setDefaultNavigationProvider(provider) {
  set('defaultNavigationProvider', provider); // "google_maps" | "waze"
}

module.exports = {
  loadMemory,
  saveMemory,
  get,
  set,
  getDefaultNavigationProvider,
  setDefaultNavigationProvider
};
