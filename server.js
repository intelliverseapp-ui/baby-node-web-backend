// server.js — World backend with graceful shutdown, structured logging, and aggressive retry
'use strict';

const express = require('express');
const cors = require('cors');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json());

// -----------------------------
// Configuration
// -----------------------------
const PORT = process.env.PORT || 9000;
const LOOKUP_URL = process.env.LOOKUP_URL || 'http://localhost:3000/v1/tools/web-lookup';
const RETRY_ATTEMPTS = Number(process.env.RETRY_ATTEMPTS || 6);
const BASE_DELAY_MS = Number(process.env.BASE_DELAY_MS || 300);
const SHUTDOWN_TIMEOUT_MS = Number(process.env.SHUTDOWN_TIMEOUT_MS || 10000);

// -----------------------------
// Structured logging helper
// -----------------------------
function log(level, msg, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    msg,
    ...meta
  };
  // Use console.log for structured logs so they are easy to capture
  console.log(JSON.stringify(entry));
}

// -----------------------------
// Fetch compatibility (global fetch or node-fetch fallback)
// -----------------------------
let fetchFn = global.fetch;
if (!fetchFn) {
  try {
    // node-fetch v3 is ESM; require may work in some setups if installed as CommonJS bridge.
    // If this fails, install node-fetch or run on Node 18+.
    fetchFn = require('node-fetch');
    log('info', 'Using node-fetch fallback');
  } catch (e) {
    log('warn', 'No global fetch and node-fetch not available. Install node-fetch or use Node 18+.', { error: e && e.message });
  }
}

// -----------------------------
// Retry helper with exponential backoff and jitter
// -----------------------------
async function fetchWithRetry(url, options = {}, attempts = RETRY_ATTEMPTS, baseDelayMs = BASE_DELAY_MS) {
  if (!fetchFn) throw new Error('No fetch implementation available');
  for (let i = 0; i < attempts; i++) {
    const attempt = i + 1;
    const start = Date.now();
    try {
      const res = await fetchFn(url, options);
      const duration = Date.now() - start;
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`status ${res.status} ${text}`);
      }
      const json = await res.json().catch(() => null);
      log('info', 'fetchWithRetry success', { url, attempt, duration });
      return json;
    } catch (err) {
      const duration = Date.now() - start;
      log('warn', 'fetchWithRetry attempt failed', { url, attempt, duration, error: err && err.message });
      if (i === attempts - 1) {
        log('error', 'fetchWithRetry exhausted attempts', { url, attempts });
        throw err;
      }
      // Exponential backoff with jitter
      const exp = Math.pow(2, i);
      const jitter = Math.floor(Math.random() * baseDelayMs);
      const delay = Math.min(baseDelayMs * exp + jitter, 5000);
      log('info', 'fetchWithRetry sleeping before retry', { url, nextAttempt: attempt + 1, delayMs: delay });
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// -----------------------------
// Request logging middleware
// -----------------------------
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    log('info', 'http_request', { method: req.method, path: req.originalUrl, status: res.statusCode, durationMs: duration });
  });
  next();
});

// Health endpoint
app.get('/health', (req, res) => res.send('ok'));

// Main route: /tool/mini-ai
app.post('/tool/mini-ai', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    log('warn', 'missing prompt in request');
    return res.status(400).json({ error: 'Missing prompt in request body' });
  }

  // Try local lookup service with retries
  try {
    const lookupResp = await fetchWithRetry(
      LOOKUP_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: prompt })
      },
      RETRY_ATTEMPTS,
      BASE_DELAY_MS
    );

    if (lookupResp && (lookupResp.answer || lookupResp.result || lookupResp.text)) {
      const answer = lookupResp.answer || lookupResp.result || lookupResp.text;
      log('info', 'served answer from lookup', { prompt });
      return res.json({ result: answer });
    }

    if (lookupResp) {
      log('info', 'lookup returned nonstandard payload', { prompt });
      return res.json({ result: lookupResp });
    }
  } catch (err) {
    log('warn', 'Local web-lookup error, falling back to local response', { error: err && err.message });
  }

  // Deterministic local fallback
  const fallback = `MiniAI echo: ${prompt}`;
  log('info', 'served fallback response', { prompt });
  res.json({ result: fallback });
});

// -----------------------------
// Create HTTP server and track connections for graceful shutdown
// -----------------------------
const server = http.createServer(app);

// Track open connections so we can close them on shutdown
const connections = new Set();
server.on('connection', (socket) => {
  connections.add(socket);
  socket.on('close', () => connections.delete(socket));
});

server.listen(PORT, () => {
  log('info', 'World backend running', { url: `http://localhost:${PORT}` });
});

// -----------------------------
// Graceful shutdown
// -----------------------------
let shuttingDown = false;
function startShutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  log('info', 'shutdown initiated', { signal });

  // Stop accepting new connections
  server.close((err) => {
    if (err) {
      log('error', 'error closing server', { error: err && err.message });
    } else {
      log('info', 'server closed gracefully');
    }
  });

  // Give existing connections some time to finish
  const forceTimer = setTimeout(() => {
    log('warn', 'forcing shutdown, destroying open connections', { openConnections: connections.size });
    for (const socket of connections) {
      try { socket.destroy(); } catch (e) { /* ignore */ }
    }
    process.exit(0);
  }, SHUTDOWN_TIMEOUT_MS);

  // If all connections close before timeout, clear the timer and exit
  if (connections.size === 0) {
    clearTimeout(forceTimer);
    process.exit(0);
  } else {
    // When last connection closes, exit
    const checkInterval = setInterval(() => {
      if (connections.size === 0) {
        clearInterval(checkInterval);
        clearTimeout(forceTimer);
        log('info', 'all connections closed, exiting');
        process.exit(0);
      }
    }, 200);
  }
}

process.on('SIGINT', () => startShutdown('SIGINT'));
process.on('SIGTERM', () => startShutdown('SIGTERM'));

// Handle unexpected errors
process.on('uncaughtException', (err) => {
  log('error', 'uncaughtException', { error: err && err.stack || err && err.message });
  // attempt graceful shutdown then exit
  startShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  log('error', 'unhandledRejection', { reason: reason && (reason.stack || reason) });
  // do not necessarily exit immediately; log for visibility
});
