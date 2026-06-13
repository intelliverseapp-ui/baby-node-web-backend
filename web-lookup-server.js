'use strict';

const express = require('express');
const https = require('https');
const fs = require('fs');

const PORT = process.env.PORT || 3000;

// ⭐ Bind to ALL interfaces so Android can reach it
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
app.use(express.json());

// Load HTTPS certificate + key
const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
};

// -----------------------------
// Structured logger
// -----------------------------
function log(level, msg, meta = {}) {
  const entry = { timestamp: new Date().toISOString(), level, msg, ...meta };
  console.log(JSON.stringify(entry));
}

// -----------------------------
// Health endpoint
// -----------------------------
app.get('/health', (req, res) => res.send('ok'));

// -----------------------------
// ⭐ NEW: Baby NODE chat endpoint
// -----------------------------
app.post('/v1/chat', (req, res) => {
  const { text } = req.body || {};
  const reply = text
    ? `You said: ${text}`
    : "I didn't hear anything.";
  res.json({ response: reply });
});

// -----------------------------
// Example lookup route
// -----------------------------
app.post('/v1/tools/web-lookup', (req, res) => {
  const { query } = req.body || {};
  const answer = query
    ? `Thomas Edison is commonly credited with inventing the practical incandescent light bulb.`
    : null;
  res.json({ answer });
});

// -----------------------------
// Server creation and graceful shutdown
// -----------------------------
let server;
let connections = new Set();

function startServer() {
  return new Promise((resolve, reject) => {
    server = https.createServer(options, app);

    server.on('connection', (socket) => {
      connections.add(socket);
      socket.on('close', () => connections.delete(socket));
    });

    // ⭐ FIXED: Bind to HOST instead of localhost
    server.listen(PORT, HOST, () => {
      log('info', 'Web Lookup backend running', {
        url: `https://${HOST}:${PORT}`
      });
      resolve();
    });

    server.on('error', (err) => {
      log('error', 'Server error on listen', { error: err && err.message });
      reject(err);
    });
  });
}

async function shutdown(signal) {
  log('info', 'shutdown initiated', { signal });
  if (!server) {
    process.exit(0);
  }
  server.close((err) => {
    if (err) log('error', 'error closing server', { error: err && err.message });
    else log('info', 'server closed gracefully');
  });

  const FORCE_TIMEOUT = Number(process.env.SHUTDOWN_TIMEOUT_MS || 5000);
  const forceTimer = setTimeout(() => {
    log('warn', 'forcing shutdown, destroying open connections', {
      openConnections: connections.size
    });
    for (const s of connections) {
      try { s.destroy(); } catch (e) {}
    }
    process.exit(0);
  }, FORCE_TIMEOUT);

  if (connections.size === 0) {
    clearTimeout(forceTimer);
    process.exit(0);
  } else {
    const check = setInterval(() => {
      if (connections.size === 0) {
        clearInterval(check);
        clearTimeout(forceTimer);
        log('info', 'all connections closed, exiting');
        process.exit(0);
      }
    }, 200);
  }
}

// -----------------------------
// Top-level startup wrapper
// -----------------------------
(async function main() {
  try {
    await startServer();
  } catch (err) {
    console.error('startup error', err);
    process.exit(1);
  }
})();

// -----------------------------
// Signals and error handlers
// -----------------------------
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  log('error', 'uncaughtException', { error: err && (err.stack || err.message) });
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  log('error', 'unhandledRejection', { reason: reason && (reason.stack || reason) });
});
