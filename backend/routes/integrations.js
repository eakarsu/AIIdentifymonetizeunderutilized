/*
 * routes/integrations.js — Apply pass 5
 *
 * 503-on-no-key stubs for booking / payment / utility integrations called
 * out in batch_04 §27 ("missing non-AI features"). All endpoints require JWT
 * via the existing `authenticateToken` middleware.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

function requireEnv(req, res, providerName, vars) {
  const missing = vars.filter((v) => !process.env[v] || String(process.env[v]).startsWith('your_'));
  if (missing.length) {
    res.status(503).json({
      error: 'integration_not_configured',
      provider: providerName,
      missing_env: missing,
      message: `${providerName} not configured. Set ${missing.join(', ')} to enable.`,
    });
    return false;
  }
  return true;
}

// Stripe — billing/payment for shared-space bookings
router.post('/stripe/charge', authenticateToken, (req, res) => {
  if (!requireEnv(req, res, 'Stripe', ['STRIPE_SECRET_KEY'])) return;
  res.json({ status: 'stub_with_creds', note: 'Stripe key present; implement PaymentIntent for booking deposits.' });
});

// Twilio — landlord/tenant SMS communication
router.post('/twilio/sms', authenticateToken, (req, res) => {
  if (!requireEnv(req, res, 'Twilio', ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER'])) return;
  res.json({ status: 'stub_with_creds', note: 'Twilio creds present; templated booking + DR notifications.' });
});

// Utility / grid operator demand-response
router.post('/utility/dr-bid', authenticateToken, (req, res) => {
  if (!requireEnv(req, res, 'Utility-DR', ['UTILITY_API_BASE', 'UTILITY_API_KEY', 'UTILITY_ACCOUNT_ID'])) return;
  res.json({ status: 'stub_with_creds', note: 'Utility DR credentials present; implement OpenADR bid submission.' });
});

module.exports = router;
