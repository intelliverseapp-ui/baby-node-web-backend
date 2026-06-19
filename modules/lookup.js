// modules/lookup.js
// Web Lookup Tool Wrapper for Baby Node

const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function callLookupTool(query) {
  try {
    const response = await fetch('http://127.0.0.1:3000/v1/tools/web-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const data = await response.json();

    // The lookup tool always returns { answer: "..." }
    if (data && typeof data.answer === "string") {
      return data.answer.trim();
    }

    return null;
  } catch (err) {
    console.error("Lookup tool error:", err);
    return null;
  }
}

module.exports = {
  callLookupTool
};
