// Agentic utilization scout continuously scanning building data for
// monetization opportunities.
// Audit: batch_04.md / AIIdentifymonetizeunderutilized / Custom Feature Suggestions #1
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { queryAI } = require('../openrouter');
const pool = require('../db');

const router = express.Router();
router.use(authenticateToken);

function parseJSON(t) { try { const m = t.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (_) {} return { notes: t }; }

// POST /api/agentic-utilization-scout/scan { focus?, min_idle_hours? }
router.post('/scan', async (req, res) => {
  try {
    const { focus = 'all', min_idle_hours = 4 } = req.body || {};

    let buildings = { rows: [] }, capacity = { rows: [] }, bookings = { rows: [] };
    try { buildings = await pool.query(`SELECT * FROM buildings LIMIT 50`); } catch (_) {}
    try { capacity = await pool.query(`SELECT * FROM capacity_detection ORDER BY recorded_at DESC LIMIT 100`); } catch (_) {}
    try { bookings = await pool.query(`SELECT * FROM bookings ORDER BY start_at DESC LIMIT 100`); } catch (_) {}

    const prompt = `You are an agentic utilization scout. Identify underutilized spaces and recommend
monetization paths (event rental, coworking, popups, storage, EV charging, urban farming). Return STRICT JSON only.

Focus: ${focus}
Minimum idle hours threshold: ${min_idle_hours}
Buildings: ${JSON.stringify(buildings.rows.slice(0, 20))}
Capacity readings (recent): ${JSON.stringify(capacity.rows.slice(0, 40))}
Bookings (recent): ${JSON.stringify(bookings.rows.slice(0, 30))}

Return JSON:
{
  "summary": "...",
  "opportunities": [
    { "building_id": 0, "space": "string", "idle_hours_per_week": 0, "recommended_use": "event_rental|coworking|popup|storage|ev_charging|urban_farming", "estimated_monthly_revenue_usd": 0, "capex_required_usd": 0, "payback_months": 0, "rationale": "string" }
  ],
  "quick_wins": ["..."],
  "policy_or_zoning_flags": ["..."],
  "next_steps": ["..."],
  "disclaimer": "Heuristic; verify zoning + insurance before activation."
}`;

    const aiResp = await queryAI(prompt);
    const raw = typeof aiResp === 'string' ? aiResp : (aiResp?.content || '');
    res.json({ focus, scan: parseJSON(raw) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/buildings', async (_req, res) => {
  try {
    const r = await pool.query(`SELECT id, name, type, area_sqft FROM buildings LIMIT 100`)
      .catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
