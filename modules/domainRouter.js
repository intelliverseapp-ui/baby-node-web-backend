/**
 * DOMAIN ROUTER
 * --------------
 * Decides WHICH search provider to use based on:
 *   - domainHint  ("video", "web", "maps", "waze", etc.)
 *   - providerHint ("youtube", "google", "waze", etc.)
 *   - query.text
 *
 * Meaning Engine → LLM → Action JSON → universalSearch → domainRouter
 */

const youtubeProvider = require('./providers/youtube');
const webProvider = require('./providers/web');
const mapsProvider = require('./providers/maps');   // NEW

async function routeSearch(query) {
  const { text, domainHint, providerHint } = query;

  // Normalize hints
  const provider = providerHint ? providerHint.toLowerCase() : null;
  const domain = domainHint ? domainHint.toLowerCase() : null;

  // -----------------------------
  // PRIORITY 1: Explicit provider
  // -----------------------------
  if (provider) {
    switch (provider) {
      case 'youtube':
        return {
          provider: 'youtube',
          results: await youtubeProvider.search(text, query)
        };

      case 'web':
      case 'google':
        return {
          provider: 'web',
          results: await webProvider.search(text, query)
        };

      case 'maps':
      case 'googlemaps':
        return {
          provider: 'maps',
          results: await mapsProvider.search(text, { ...query, providerHint: 'maps' })
        };

      case 'waze':
        return {
          provider: 'maps',
          results: await mapsProvider.search(text, { ...query, providerHint: 'waze' })
        };

      default:
        break; // fallback to domainHint or default
    }
  }

  // -----------------------------
  // PRIORITY 2: Domain hint
  // -----------------------------
  if (domain) {
    switch (domain) {
      case 'video':
        return {
          provider: 'youtube',
          results: await youtubeProvider.search(text, query)
        };

      case 'web':
      case 'info':
      case 'general':
        return {
          provider: 'web',
          results: await webProvider.search(text, query)
        };

      case 'maps':
        return {
          provider: 'maps',
          results: await mapsProvider.search(text, { ...query, providerHint: 'maps' })
        };

      case 'waze':
        return {
          provider: 'maps',
          results: await mapsProvider.search(text, { ...query, providerHint: 'waze' })
        };

      default:
        break;
    }
  }

  // -----------------------------
  // PRIORITY 3: Fallback
  // -----------------------------
  // Try web search first
  try {
    const webResults = await webProvider.search(text, query);
    if (webResults.length > 0) {
      return {
        provider: 'web',
        results: webResults
      };
    }
  } catch (err) {
    console.error("Fallback web provider failed:", err);
  }

  // Final fallback → YouTube
  const ytFallback = await youtubeProvider.search(text, query);

  return {
    provider: 'youtube',
    results: ytFallback
  };
}

module.exports = {
  routeSearch
};
