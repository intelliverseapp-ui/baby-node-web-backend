const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// Root route so GET / returns 200
app.get('/', (req, res) => {
  res.send('<h1>Baby Node Web Backend</h1><p>It works.</p>');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
