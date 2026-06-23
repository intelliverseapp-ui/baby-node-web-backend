/**
 * Web Search Provider (DuckDuckGo HTML Scraper)
 *
 * Baby Node → Meaning Engine → universalSearch → domainRouter → web.js
 *
 * Returns:
 *   id: URL
 *   title: Page title
 *   url: Direct link
 *   provider: "web"
 *   score: ranking score
 */

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const cheerio = require("cheerio");

module.exports = {
  name: "web",

  /**
   * Perform a web search using DuckDuckGo HTML results.
   */
  search: async function (queryText, hints = {}) {
    try {
      const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(
        queryText
      )}`;

      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 BabyNode-WebSearch"
        }
      });

      const html = await res.text();
      const $ = cheerio.load(html);

      const results = [];

      $(".result").each((i, el) => {
        const title = $(el).find(".result__title").text().trim();
        const link = $(el).find(".result__a").attr("href");
        const snippet = $(el).find(".result__snippet").text().trim();

        if (!title || !link) return;

        results.push({
          id: link,
          title,
          url: link,
          provider: "web",
          score: 1 - i * 0.05, // simple ranking
          metadata: {
            snippet,
            queryText,
            hintUsed: hints.domainHint || hints.providerHint || null
          }
        });
      });

      return results.slice(0, 5); // return top 5

    } catch (err) {
      console.error("Web provider error:", err);
      return [];
    }
  }
};
