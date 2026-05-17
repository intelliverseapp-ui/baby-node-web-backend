// server.js
const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http");
const https = require("https");

const app = express();
const PORT = 9000;

app.use(cors());
app.use(express.json());

// Serve Inspector UI
app.use(express.static(path.join(__dirname, "public")));

// ------------------------------------------------------------
// FIXED SSE PROXY ROUTE (NO HEADER PARSING, RAW STREAM PIPE)
// ------------------------------------------------------------
app.get("/mgi/live", (req, res) => {
  const options = {
    hostname: "127.0.0.1",
    port: 8080,
    path: "/mgi/live",
    method: "GET",
    headers: {
      Accept: "text/event-stream"
    }
  };

  const proxyReq = http.request(options);

  proxyReq.on("response", (proxyRes) => {
    // Send SSE headers to browser
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });

    // Pipe raw SSE bytes directly from Swift → Browser
    proxyRes.on("data", chunk => res.write(chunk));
    proxyRes.on("end", () => res.end());
  });

  proxyReq.on("error", (err) => {
    console.error("SSE proxy error:", err.message);
    res.status(500).send("Swift backend unreachable");
  });

  proxyReq.end();
});

// ------------------------------------------------------------
// PURE HTTP API PROXY (NO FETCH, NO UNDICI)
// ------------------------------------------------------------
app.use("/api", (req, res) => {
  const body =
    req.method === "GET" || req.method === "HEAD"
      ? null
      : JSON.stringify(req.body);

  const options = {
    hostname: "127.0.0.1",
    port: 8080,
    path: req.originalUrl.replace("/api", ""),
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      "Content-Length": body ? Buffer.byteLength(body) : 0
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    let data = "";
    proxyRes.on("data", chunk => (data += chunk));
    proxyRes.on("end", () => {
      res.status(proxyRes.statusCode).send(data);
    });
  });

  proxyReq.on("error", (err) => {
    console.error("API proxy error:", err.message);
    res.status(500).send("Swift backend unreachable");
  });

  if (body) proxyReq.write(body);
  proxyReq.end();
});

// ------------------------------------------------------------
// START WORLD BACKEND
// ------------------------------------------------------------
app.get("/health", (req, res) => { res.type("text/plain").status(200).send("ok"); });
app.listen(PORT, () => {
  console.log(`World backend running on http://localhost:${PORT}`);
});

// ------------------------------------------------------------
// HYBRID MINI-AI ROUTE
// 1) Query local web-lookup on port 3000
// 2) If lookup returns a usable answer, return it
// 3) Otherwise call external model endpoint (placeholder) and return model output
// 4) Final fallback: echo
// ------------------------------------------------------------
app.post("/tool/mini-ai", express.json(), (req, res) => {
  const prompt = req.body && req.body.prompt;
  if (!prompt) return res.json({ result: "no prompt provided" });

  // Helper: final echo fallback
  const echoFallback = () => res.json({ result: "MiniAI echo: " + prompt });

  // 1) Ask local web-lookup
  try {
    const lookupOptions = {
      hostname: "127.0.0.1",
      port: 3000,
      path: "/v1/tools/web-lookup",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    };

    const lookupReq = http.request(lookupOptions, (lookupRes) => {
      let data = "";
      lookupRes.on("data", (chunk) => (data += chunk));
      lookupRes.on("end", async () => {
        let lookupAnswer = null;
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed.answer) lookupAnswer = parsed.answer;
        } catch (e) {
          // parse error -> treat as no lookup answer
        }

        // If web-lookup returned a short factual answer, return it
        if (lookupAnswer && lookupAnswer.length > 0 && lookupAnswer.length < 2000) {
          return res.json({ result: lookupAnswer });
        }

        // 2) Fallback to external model (HTTPS)
        try {
          // Replace host/path and response parsing with your provider specifics
          const externalHost = "api.example.com";
          const externalPath = "/v1/generate";
          const apiKey = process.env.EXTERNAL_MODEL_API_KEY || "";

          if (!apiKey) {
            // No API key configured; return echo fallback
            return echoFallback();
          }

          const payload = JSON.stringify({
            prompt: `Context: ${lookupAnswer || ""}\n\nUser prompt: ${prompt}`,
            max_tokens: 512
          });

          const extOptions = {
            hostname: externalHost,
            path: externalPath,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(payload),
              "Authorization": `Bearer ${apiKey}`
            }
          };

          const extReq = https.request(extOptions, (extRes) => {
            let extData = "";
            extRes.on("data", (chunk) => (extData += chunk));
            extRes.on("end", () => {
              try {
                const extJson = JSON.parse(extData);
                // Adjust extraction depending on provider response shape
                const modelText = extJson && (extJson.text || extJson.output || extJson.result || (extJson.choices && extJson.choices[0] && extJson.choices[0].text)) || null;
                if (modelText) {
                  return res.json({ result: modelText });
                } else {
                  return echoFallback();
                }
              } catch (e) {
                return echoFallback();
              }
            });
          });

          extReq.on("error", (err) => {
            console.error("External model request error:", err && err.message);
            return echoFallback();
          });

          extReq.write(payload);
          extReq.end();
        } catch (err) {
          console.error("External model fallback error:", err && err.message);
          return echoFallback();
        }
      });
    });

    lookupReq.on("error", (err) => {
      console.error("Local web-lookup error:", err && err.message);
      // If lookup fails, fallback to echo (or external model if you prefer)
      return echoFallback();
    });

    lookupReq.write(JSON.stringify({ query: prompt }));
    lookupReq.end();
  } catch (err) {
    console.error("mini-ai route error:", err && err.message);
    return echoFallback();
  }
});
