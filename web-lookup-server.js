// Web-lookup-server.js — Web lookup service with optional phi-3 model fallback
// To store your phi-3 API key locally, create a .env file in this project root:
// PHI3_API_KEY=your_real_api_key_here

require('dotenv').config();

const express = require("express");
const cors = require("cors");
const https = require("https");

const app = express();
app.use(cors());
app.use(express.json());
app.use((req, res, next) => { console.log(new Date().toISOString(), req.method, req.url); next(); });
app.get('/health', (req, res) => res.send('ok'));

app.post("/v1/tools/web-lookup", (req, res) => {
  const { query } = req.body;

  let answer = "I don't know.";

  if (!query) {
    return res.json({ answer: "No query provided." });
  }

  const q = query.toLowerCase();

  // Simple rule-based answers
  if (q.includes("capital") && q.includes("france")) {
    answer = "The capital of France is Paris.";
  } else if (q.includes("capital") && q.includes("germany")) {
    answer = "The capital of Germany is Berlin.";
  } else if (q.includes("lightbulb") || q.includes("light bulb")) {
    answer = "Thomas Edison is commonly credited with inventing the practical incandescent light bulb.";
  } else if (q.includes("tallest") && (q.includes("mountain") || q.includes("mount"))) {
    answer = "Mount Everest is the tallest mountain above sea level.";
  } else {
    // Ask external model (phi-3) when the simple rules don't match
    return askPhi3(query, (modelAnswer) => {
      if (modelAnswer && modelAnswer.length > 0) {
        return res.json({ answer: modelAnswer });
      }
      // final local fallback if model fails
      return res.json({ answer: `I received your query: \"${query}\"` });
    });
  }

  res.json({ answer });
});

app.listen(3000, () => {
  console.log("Web Lookup backend running on http://localhost:3000");
});

// -----------------------------
// Helper: call phi-3 style model
// -----------------------------
function askPhi3(query, cb) {
  // Configure via environment variables (dotenv loads .env into process.env)
  const PHI3_HOST = process.env.PHI3_HOST || "api.phi3.example";
  const PHI3_PATH = process.env.PHI3_PATH || "/v1/generate";
  const PHI3_KEY  = process.env.PHI3_API_KEY || "";

  if (!PHI3_KEY) {
    // No key configured — signal caller to fallback
    return cb(null);
  }

  const payload = JSON.stringify({
    prompt: query,
    max_tokens: 256
  });

  const options = {
    hostname: PHI3_HOST,
    path: PHI3_PATH,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
      "Authorization": `Bearer ${PHI3_KEY}`
    }
  };

  const req = https.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      try {
        const j = JSON.parse(data);
        // Try common response shapes; adapt if your provider differs
        const text =
          (j && j.text) ||
          (j && j.output) ||
          (j && j.result) ||
          (j && j.choices && j.choices[0] && j.choices[0].text) ||
          null;
        cb(text || null);
      } catch (e) {
        console.error("phi-3 parse error:", e && e.message);
        cb(null);
      }
    });
  });

  req.on("error", (err) => {
    console.error("phi-3 request error:", err && err.message);
    cb(null);
  });

  req.write(payload);
  req.end();
}
