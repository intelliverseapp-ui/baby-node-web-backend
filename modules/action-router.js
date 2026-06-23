/**
 * action-router.js
 * -----------------
 * This is Baby Node’s “motor cortex.”
 *
 * It receives the parsed JSON from the LLM and decides:
 *   - Is this a search action?
 *   - Is this a device OS action?
 *   - Is this a no-op?
 *
 * For search actions, it calls:
 *   universalSearch(query)
 *
 * For OS actions, it simply returns the JSON to Android.
 */

const { universalSearch } = require('./universalSearch');

async function routeAction(llmJson) {
  try {
    if (!llmJson || typeof llmJson !== 'object') {
      return {
        action: "none",
        speech: "Mmhm — not sure what you want there."
      };
    }

    const action = llmJson.action;

    // ---------------------------------------------------------
    // SEARCH ACTIONS
    // ---------------------------------------------------------
    if (
      action === "search_and_play" ||
      action === "search_and_open" ||
      action === "search_and_read" ||
      action === "search_and_navigate"
    ) {
      const query = llmJson.query || null;

      if (!query) {
        return {
          action: "none",
          speech: "Mmhm — not sure what you want there."
        };
      }

      // Call the Universal Search system
      const searchResult = await universalSearch({
        text: query,
        domainHint: llmJson.domainHint || null,
        providerHint: llmJson.providerHint || null
      });

      return {
        action,
        speech: llmJson.speech || "Okay.",
        results: searchResult.results,
        provider: searchResult.provider
      };
    }

    // ---------------------------------------------------------
    // NORMAL OS ACTIONS (open_app, open_url, call, etc.)
    // ---------------------------------------------------------
    return {
      ...llmJson,
      speech: llmJson.speech || "Okay."
    };

  } catch (err) {
    console.error("Action Router Error:", err);

    return {
      action: "none",
      speech: "Mmhm — something felt off there."
    };
  }
}

module.exports = {
  routeAction
};
