/**
 * MAPS / PLACES SEARCH PROVIDER
 * ------------------------------
 * Baby Node → Meaning Engine → universalSearch → domainRouter → maps.js
 *
 * Uses DuckDuckGo's "local" search endpoint (no API key required).
 * Supports BOTH Google Maps and Waze deep links.
 *
 * Returns:
 *   id: place ID (URL)
 *   title: place name
 *   url: Navigation link (Google Maps or Waze)
 *   provider: "maps"
 *   score: ranking score
 *   metadata: { address, lat, lon, navProvider }
 */

// Dynamic import shim for node-fetch (ESM-only)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

module.exports = {
  name: "maps",

  /**
   * Search for places using DuckDuckGo's local search API.
   */
  search: async function (queryText, hints = {}) {
    try {
      const url = `https://duckduckgo.com/local.js?q=${encodeURIComponent(
        queryText
      )}&o=json`;

      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 BabyNode-Maps"
        }
      });

      const json = await res.json();

      if (!json || !json.results) {
        return [];
      }

      const useWaze =
        (hints.providerHint &&
          hints.providerHint.toLowerCase() === "waze") ||
        (hints.domainHint && hints.domainHint.toLowerCase() === "waze");

      const results = json.results.map((place, index) => {
        const title = place.title || place.name || "Unknown place";
        const address = place.address || "";
        const lat = place.latitude;
        const lon = place.longitude;

        let navUrl;

        if (useWaze) {
          // Waze deep link
          navUrl = `waze://?q=${encodeURIComponent(
            title + " " + address
          )}&navigate=yes`;
        } else {
          // Google Maps link
          navUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            title + " " + address
          )}${lat && lon ? `&query_place_id=${lat},${lon}` : ""}`;
        }

        return {
          id: navUrl,
          title,
          url: navUrl,
          provider: "maps",
          score: 1 - index * 0.05,
          metadata: {
            address,
            lat,
            lon,
            navProvider: useWaze ? "waze" : "google_maps",
            queryText,
            hintUsed: hints.domainHint || hints.providerHint || null
          }
        };
      });

      return results.slice(0, 5); // top 5 places

    } catch (err) {
      console.error("Maps provider error:", err);
      return [];
    }
  }
};
