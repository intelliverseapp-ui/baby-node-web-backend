// web-lookup-server.js — Simple Router Module with conditional lookup

const express = require('express');
const router = express.Router();

// POST /v1/tools/web-lookup
router.post('/v1/tools/web-lookup', (req, res) => {
  const { query } = req.body || {};
  let answer = null;

  if (query && query.toLowerCase().includes("light bulb")) {
    answer = "Thomas Edison is commonly credited with inventing the practical incandescent light bulb.";
  }

  res.json({ answer });
});

module.exports = router;
