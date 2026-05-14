const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryAI } = require('../openrouter');

// POST /api/ai/utilization-opportunity-finder
// Cross-portfolio scan of buildings and capacity to surface monetization opportunities
router.post('/utilization-opportunity-finder', authenticateToken, async (req, res) => {
  try {
    const { min_underutilization_pct } = req.body || {};
    const threshold = Math.max(10, Math.min(95, parseInt(min_underutilization_pct) || 50));

    const buildingsResult = await pool.query('SELECT * FROM buildings ORDER BY id ASC LIMIT 200');
    const buildings = buildingsResult.rows;

    const candidates = buildings.filter(b => {
      const total = parseFloat(b.total_capacity_kw) || 0;
      const used = parseFloat(b.utilized_capacity_kw) || 0;
      if (total <= 0) return false;
      const util = (used / total) * 100;
      return util <= (100 - threshold);
    }).map(b => {
      const total = parseFloat(b.total_capacity_kw) || 0;
      const used = parseFloat(b.utilized_capacity_kw) || 0;
      return {
        id: b.id,
        name: b.name,
        building_type: b.building_type,
        square_footage: b.square_footage,
        utilized_kw: used,
        total_kw: total,
        utilization_pct: total > 0 ? Number(((used / total) * 100).toFixed(1)) : null,
      };
    });

    const aiResult = await queryAI(
      'You are a real-estate and infrastructure utilization analyst. Identify the highest-leverage monetization opportunities for under-used buildings or capacity. For each opportunity, give a concrete revenue model, target users, estimated annual revenue range, regulatory considerations, and implementation effort (S/M/L).',
      `Scan these underutilized assets (utilization <= ${100 - threshold}%):
${JSON.stringify(candidates.slice(0, 60), null, 2)}

Total in scan: ${buildings.length}
Underutilized matches: ${candidates.length}

Return:
1. Top 5 opportunities ranked by expected revenue per effort
2. Per-asset recommendation for the top 10 candidates
3. Cross-portfolio strategies (bundled subletting, demand-response aggregation, off-peak co-working)
4. Risks and quick wins`
    );

    res.json({
      total_buildings: buildings.length,
      underutilized_count: candidates.length,
      threshold_pct: threshold,
      ai: aiResult,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/pricing-recommendation
// Recommend pricing for underutilized space or capacity
router.post('/pricing-recommendation', authenticateToken, async (req, res) => {
  try {
    const { building_id, asset_type, hours_per_week_available, comparable_market_rate } = req.body || {};
    let building = null;
    if (building_id) {
      const r = await pool.query('SELECT * FROM buildings WHERE id = $1', [building_id]);
      if (r.rows.length === 0) return res.status(404).json({ error: 'Building not found' });
      building = r.rows[0];
    }

    const aiResult = await queryAI(
      'You are a pricing strategist for shared / underutilized space and capacity (rooms, meeting space, parking, energy demand-response slots, etc.). Produce a tiered pricing recommendation that maximizes revenue without harming utilization. Always include a rationale tied to demand signals.',
      `Recommend pricing.

Asset type: ${asset_type || (building ? building.building_type : 'unspecified')}
Building: ${building ? `${building.name} (id=${building.id}, sqft=${building.square_footage}, total_kw=${building.total_capacity_kw}, used_kw=${building.utilized_capacity_kw})` : 'no building selected'}
Hours per week available: ${hours_per_week_available || 'unspecified'}
Comparable market rate (if known): ${comparable_market_rate || 'unspecified'}

Return JSON with: { "base_price": number, "currency": "USD", "tiers": [{"name": string, "conditions": string, "price": number}], "introductory_offer": string, "demand_levers": string[], "expected_utilization_lift_pct": number, "monitoring_metrics": string[], "rationale": string }`
    );

    res.json({ building_id: building?.id || null, ai: aiResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/partner-matching
// Match partners seeking space/capacity to available inventory
router.post('/partner-matching', authenticateToken, async (req, res) => {
  try {
    const { partner_id, requested_capacity_kw, requested_sqft, hours_needed, geography } = req.body || {};

    let partner = null;
    if (partner_id) {
      const r = await pool.query('SELECT * FROM partners WHERE id = $1', [partner_id]).catch(() => ({ rows: [] }));
      if (r.rows.length > 0) partner = r.rows[0];
    }

    const buildingsResult = await pool.query('SELECT * FROM buildings ORDER BY id ASC LIMIT 200');
    const partnersResult = await pool.query('SELECT * FROM partners ORDER BY id ASC LIMIT 200').catch(() => ({ rows: [] }));

    const aiResult = await queryAI(
      'You are a real-estate / infrastructure matching engine. Match partner demand to inventory of underutilized buildings or capacity. Score matches 0-100, justify the score, and note any policy or geographic blockers. Always recommend a follow-up step.',
      `Match partner demand to available inventory.

Requesting partner: ${partner ? JSON.stringify(partner) : 'none specified — match generically using request fields below'}
Request:
- requested_capacity_kw: ${requested_capacity_kw || 'unspecified'}
- requested_sqft: ${requested_sqft || 'unspecified'}
- hours_needed_per_week: ${hours_needed || 'unspecified'}
- geography: ${geography || 'unspecified'}

Available buildings (sample): ${JSON.stringify(buildingsResult.rows.slice(0, 60))}

Other partners (for ecosystem awareness): ${JSON.stringify(partnersResult.rows.slice(0, 30))}

Return JSON: { "matches": [{ "building_id": number, "score_0_100": number, "fit_reasons": string[], "blockers": string[], "recommended_terms": string, "next_step": string }], "alternative_options": string[], "summary": string }`
    );

    res.json({
      partner_id: partner?.id || null,
      candidates_scanned: buildingsResult.rows.length,
      ai: aiResult,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/cohort-demand-forecast
// Forecast demand across a cohort of buildings (cross-portfolio)
router.post('/cohort-demand-forecast', authenticateToken, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
      return res.status(503).json({ error: 'OpenRouter API key not configured' });
    }
    const { building_type, region, horizon_months, scenario } = req.body || {};
    let buildings = [];
    try {
      const params = [];
      const where = [];
      if (building_type) { params.push(building_type); where.push(`building_type = $${params.length}`); }
      const sql = `SELECT * FROM buildings ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id ASC LIMIT 200`;
      const result = await pool.query(sql, params);
      buildings = result.rows;
    } catch (_) {}

    const totalCapacity = buildings.reduce((s, b) => s + (parseFloat(b.total_capacity_kw) || 0), 0);
    const totalUsed = buildings.reduce((s, b) => s + (parseFloat(b.utilized_capacity_kw) || 0), 0);

    const aiResult = await queryAI(
      'You are an infrastructure demand forecasting analyst. Produce a forward-looking forecast for a cohort of assets, including base/upside/downside scenarios, confidence intervals, and key drivers. Return strict JSON only.',
      `Forecast demand across this cohort.

Filter: building_type=${building_type || 'any'}, region=${region || 'any'}
Horizon (months): ${horizon_months || 12}
Scenario notes: ${scenario || 'none'}

Cohort size: ${buildings.length}
Total capacity (kW): ${totalCapacity}
Currently utilized (kW): ${totalUsed}
Sample (first 40): ${JSON.stringify(buildings.slice(0, 40))}

Return JSON with:
{ "forecast_horizon_months": number,
  "cohort_size": number,
  "scenarios": { "base": { "expected_utilization_pct": number, "drivers": string[] },
                 "upside": { "expected_utilization_pct": number, "drivers": string[] },
                 "downside": { "expected_utilization_pct": number, "drivers": string[] } },
  "monthly_demand_kw": [{ "month_offset": number, "expected_kw": number, "low_kw": number, "high_kw": number }],
  "key_assumptions": string[],
  "watch_items": string[],
  "summary": string }`
    );

    res.json({
      cohort_size: buildings.length,
      total_capacity_kw: totalCapacity,
      utilized_capacity_kw: totalUsed,
      ai: aiResult,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/real-estate-arbitrage
// Identify arbitrage opportunities (lease vs sublet vs DR vs co-working)
router.post('/real-estate-arbitrage', authenticateToken, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
      return res.status(503).json({ error: 'OpenRouter API key not configured' });
    }
    const { building_id, market_rates, holding_costs, target_irr } = req.body || {};
    let building = null;
    if (building_id) {
      const r = await pool.query('SELECT * FROM buildings WHERE id = $1', [building_id]).catch(() => ({ rows: [] }));
      if (r.rows.length > 0) building = r.rows[0];
    }

    const aiResult = await queryAI(
      'You are a real-estate arbitrage analyst. Compare alternative monetization paths (long-lease, sublet, demand-response participation, co-working, asset-light operator) for an underutilized asset. Always quantify expected NOI and risks. Return strict JSON only.',
      `Analyze arbitrage opportunities.

Building: ${building ? JSON.stringify(building) : 'none provided'}
Market rates (if any): ${market_rates || 'unspecified'}
Holding costs (if any): ${holding_costs || 'unspecified'}
Target IRR: ${target_irr || 'unspecified'}

Return JSON with:
{ "options": [{ "strategy": string, "expected_noi_annual": number, "irr_pct": number,
                "ramp_months": number, "capex_required": number, "risks": string[],
                "best_for": string }],
  "ranked_recommendation": string,
  "downside_protection": string,
  "next_steps": string[],
  "summary": string }`
    );

    res.json({
      building_id: building?.id || null,
      ai: aiResult,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
