// Demand-response monetization automating participation and revenue capture.
// Audit: batch_04.md / AIIdentifymonetizeunderutilized / Custom Feature Suggestions #5
// TODO: configure credentials UTILITY_API_KEY, GRID_OPERATOR_API_KEY
const express = require('express');
const auth = require('../middleware/auth');
const { queryAI } = require('../openrouter');
const pool = require('../db');

const router = express.Router();
router.use(auth);

function parseJSON(t) { try { const m = t.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (_) {} return { notes: t }; }

// POST /api/dr-monetize/plan { building_id?, program?, horizon_days? }
router.post('/plan', async (req, res) => {
  try {
    const { building_id, program = 'capacity', horizon_days = 90 } = req.body || {};

    let building = null;
    let dr = { rows: [] }, savings = { rows: [] }, grid = { rows: [] };
    if (building_id) {
      try {
        const r = await pool.query(`SELECT * FROM buildings WHERE id = $1`, [building_id]);
        building = r.rows[0] || null;
      } catch (_) {}
    }
    try { dr = await pool.query(`SELECT * FROM demand_response ORDER BY event_date DESC LIMIT 30`); } catch (_) {}
    try { savings = await pool.query(`SELECT * FROM energy_savings ORDER BY recorded_at DESC LIMIT 30`); } catch (_) {}
    try { grid = await pool.query(`SELECT * FROM grid_stability ORDER BY recorded_at DESC LIMIT 30`); } catch (_) {}

    const credsStatus = {
      utility_api: !!process.env.UTILITY_API_KEY,
      grid_operator_api: !!process.env.GRID_OPERATOR_API_KEY
    };

    const prompt = `You are a demand-response monetization advisor. Recommend a participation strategy
across capacity, ancillary services, and emergency DR programs, and project revenue. Return STRICT JSON only.

Building: ${JSON.stringify(building)}
Program of interest: ${program} (capacity|ancillary|emergency|peak_shaving)
Horizon (days): ${horizon_days}
Recent DR events: ${JSON.stringify(dr.rows.slice(0, 15))}
Recent energy savings: ${JSON.stringify(savings.rows.slice(0, 15))}
Grid stability snapshot: ${JSON.stringify(grid.rows.slice(0, 10))}
Credentials status: ${JSON.stringify(credsStatus)}

Return JSON:
{
  "summary": "...",
  "program_participation_plan": [{ "program": "string", "registered_kw": 0, "expected_event_count": 0, "estimated_revenue_usd": 0 }],
  "load_curtailment_strategy": [{ "asset": "string", "shed_kw": 0, "automation": "manual|scheduled|api_triggered" }],
  "total_expected_revenue_usd": 0,
  "compliance_notes": ["..."],
  "credentials_status": ${JSON.stringify(credsStatus)},
  "disclaimer": "Estimates based on program tariffs; verify with utility account rep."
}`;

    const aiResp = await queryAI(prompt);
    const raw = typeof aiResp === 'string' ? aiResp : (aiResp?.content || '');
    res.json({ building_id: building_id || null, program, horizon_days, plan: parseJSON(raw) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/status', (_req, res) => {
  res.json({
    utility_api: !!process.env.UTILITY_API_KEY,
    grid_operator_api: !!process.env.GRID_OPERATOR_API_KEY
  });
});

module.exports = router;
