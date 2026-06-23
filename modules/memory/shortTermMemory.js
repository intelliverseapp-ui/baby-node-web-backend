/**
 * SHORT-TERM MEMORY (STM)
 * -----------------------
 * Lives in RAM for the current Baby Node session.
 * Remembers recent searches, providers, topics, and navigation prefs.
 */

let state = {
  lastSearch: null,              // { provider, results }
  lastQuery: null,               // { text, domainHint, providerHint, filters }
  lastNavigationProvider: null,  // "google_maps" | "waze"
  lastTopic: null                // "web" | "video" | "maps" | null
};

function setLastSearch(provider, results, query) {
  state.lastSearch = { provider, results };
  state.lastQuery = query || null;
}

function getLastSearch() {
  return state.lastSearch;
}

function getLastQuery() {
  return state.lastQuery;
}

function setLastNavigationProvider(navProvider) {
  state.lastNavigationProvider = navProvider;
}

function getLastNavigationProvider() {
  return state.lastNavigationProvider;
}

function setLastTopic(topic) {
  state.lastTopic = topic;
}

function getLastTopic() {
  return state.lastTopic;
}

function reset() {
  state = {
    lastSearch: null,
    lastQuery: null,
    lastNavigationProvider: null,
    lastTopic: null
  };
}

module.exports = {
  setLastSearch,
  getLastSearch,
  getLastQuery,
  setLastNavigationProvider,
  getLastNavigationProvider,
  setLastTopic,
  getLastTopic,
  reset
};
