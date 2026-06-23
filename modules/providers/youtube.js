/**
 * YOUTUBE PROVIDER
 * -----------------
 * This is Baby Node’s first real search provider.
 *
 * It receives a normalized query from the Domain Router and returns
 * a list of SearchResult objects in the UNIVERSAL format:
 *
 * SearchResult = {
 *   id: string,
 *   title: string,
 *   url: string,
 *   provider: "youtube",
 *   score: number,
 *   metadata: any
 * }
 *
 * For now, this provider returns a FAKE result so we can test the
 * Universal Search pipeline end‑to‑end without needing API keys.
 *
 * Later, we will replace this with:
 *   - YouTube Data API v3
 *   - or a local index
 *   - or a scraping layer
 *   - or a hybrid approach
 *
 * This file is the “video cortex” of Baby Node’s search brain.
 */

async function search(text, query) {
  // -------------------------------------------------------------
  // TEMPORARY FAKE RESULT
  // -------------------------------------------------------------
  // This allows us to test the entire Universal Search pipeline:
  // Meaning Engine → LLM → universalSearch → domainRouter → provider
  //
  // Once the pipeline is stable, we replace this with real YouTube search.
  // -------------------------------------------------------------

  const fakeId = 'dQw4w9WgXcQ'; // Rick Astley — the universal test video.

  return [
    {
      id: fakeId,
      title: 'Rick Astley - Never Gonna Give You Up',
      url: `https://www.youtube.com/watch?v=${fakeId}`,
      provider: 'youtube',
      score: 1.0,
      metadata: {
        queryText: text,
        hintUsed: query.providerHint || query.domainHint || null
      }
    }
  ];
}

module.exports = {
  search
};
