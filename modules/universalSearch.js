/**
 * UNIVERSAL SEARCH MODULE
 * ------------------------
 * This is the single entry point for ALL search operations inside Baby Node.
 *
 * Baby Node’s Meaning Engine → LLM → Action JSON → universalSearch(query)
 *
 * The Universal Search API:
 *  - Normalizes all search requests
 *  - Delegates routing to the Domain Router
 *  - Ensures consistent SearchResult shape
 *  - Future‑proofs the system for multiple providers
 *
 * This is the “eyes” of Baby Node.
 */

const domainRouter = require('./domainRouter');
const STM = require('./memory/shortTermMemory');   // NEW

/**
 * Validate and normalize the incoming query.
 */
function normalizeQuery(query) {
  if (!query || typeof query !== 'object') {
    throw new Error('universalSearch: query must be an object');
  }

  if (!query.text || typeof query.text !== 'string' || !query.text.trim()) {
    throw new Error('universalSearch: query.text is required');
  }

  return {
    text: query.text.trim(),
    domainHint: query.domainHint ? String(query.domainHint).toLowerCase() : null,
    providerHint: query.providerHint ? String(query.providerHint).toLowerCase() : null,
    filters: query.filters || {}
  };
}

/**
 * Main entry point for Baby Node search.
 */
async function universalSearch(query) {
  const normalized = normalizeQuery(query);

  // Delegate to the domain router (the “switchboard”)
  const response = await domainRouter.routeSearch(normalized);

  // -----------------------------
  // SHORT‑TERM MEMORY INTEGRATION
  // -----------------------------
  // Save last search results + query
  STM.setLastSearch(response.provider, response.results, normalized);

  // Save last topic (domain or provider)
  STM.setLastTopic(normalized.domainHint || response.provider);

  // Guarantee consistent shape
  return {
    provider: response.provider || 'unknown',
    results: Array.isArray(response.results) ? response.results : []
  };
}

module.exports = {
  universalSearch
};
