// modules/llm.js
// Local LLM wrapper for Baby Node (Phi-3 via LM Studio)

const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function callLocalLLM(prompt) {
  try {
    const response = await fetch('http://127.0.0.1:1234/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "phi-3-mini-4k-instruct",
        messages: [
          { role: "system", content: "You are Baby Node's reasoning engine." },
          { role: "user", content: prompt }
        ],
        max_tokens: 512,
        temperature: 0.7,
        stream: false
      })
    });

    const data = await response.json();

    if (data?.choices?.[0]?.message?.content) {
      return data.choices[0].message.content.trim();
    }

    return null;
  } catch (err) {
    console.error("Local LLM error:", err);
    return null;
  }
}

module.exports = {
  callLocalLLM
};
