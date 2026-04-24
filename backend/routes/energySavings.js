const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryAI } = require('../openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM energy_savings ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM energy_savings WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { building_name, period, baseline_kwh, actual_kwh, saved_kwh, savings_pct, cost_saved, method, verified, status } = req.body;
    const result = await pool.query(
      `INSERT INTO energy_savings (building_name, period, baseline_kwh, actual_kwh, saved_kwh, savings_pct, cost_saved, method, verified, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [building_name, period, baseline_kwh, actual_kwh, saved_kwh, savings_pct, cost_saved, method, verified || false, status || 'recorded']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { building_name, period, baseline_kwh, actual_kwh, saved_kwh, savings_pct, cost_saved, method, verified, status } = req.body;
    const result = await pool.query(
      `UPDATE energy_savings SET building_name=$1, period=$2, baseline_kwh=$3, actual_kwh=$4, saved_kwh=$5, savings_pct=$6, cost_saved=$7, method=$8, verified=$9, status=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [building_name, period, baseline_kwh, actual_kwh, saved_kwh, savings_pct, cost_saved, method, verified, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM energy_savings WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-analyze', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM energy_savings WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const sv = result.rows[0];
    const aiResult = await queryAI(
      'You are an energy savings analyst. Evaluate energy savings data and provide optimization recommendations.',
      `Analyze this energy savings record:\nBuilding: ${sv.building_name}\nPeriod: ${sv.period}\nBaseline: ${sv.baseline_kwh} kWh\nActual: ${sv.actual_kwh} kWh\nSaved: ${sv.saved_kwh} kWh (${sv.savings_pct}%)\nCost Saved: $${sv.cost_saved}\nMethod: ${sv.method}\nVerified: ${sv.verified}\n\nProvide: 1) Savings validation 2) Additional optimization opportunities 3) Best practices comparison 4) Projected annual impact`
    );
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
