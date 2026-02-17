const express = require('express');
const router = express.Router();
const LogClient = require('../api/logClient');

router.post('/connect', async (req, res) => {
  const { origin, apiKey, apiSecret, customHeaders } = req.body;

  if (!origin || !apiKey || !apiSecret) {
    return res.json({ success: false, error: 'Missing required fields: origin, apiKey, apiSecret' });
  }

  try {
    const client = new LogClient({ origin, apiKey, apiSecret, customHeaders: customHeaders || {} });
    await client.testConnection();
    res.json({ success: true });
  } catch (e) {
    const status = e.statusCode || 0;
    let error = 'Connection failed';
    if (status === 401) error = 'Invalid API key or secret (401 Unauthorized)';
    else if (status === 403) error = 'Access denied (403 Forbidden)';
    else if (status === 404) error = 'Endpoint not found - check tenant URL';
    else if (e.error) error = e.error;
    else if (e.data) error = JSON.stringify(e.data);
    res.json({ success: false, error });
  }
});

module.exports = router;
