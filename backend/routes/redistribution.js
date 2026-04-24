const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryAI } = require('../openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM redistribution_plans ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM redistribution_plans WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { plan_name, source_buildings, target_community, capacity_kw, estimated_beneficiaries, cost_estimate, timeline_months, priority, status } = req.body;
    const result = await pool.query(
      `INSERT INTO redistribution_plans (plan_name, source_buildings, target_community, capacity_kw, estimated_beneficiaries, cost_estimate, timeline_months, priority, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [plan_name, source_buildings, target_community, capacity_kw, estimated_beneficiaries, cost_estimate, timeline_months, priority || 3, status || 'proposed']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { plan_name, source_buildings, target_community, capacity_kw, estimated_beneficiaries, cost_estimate, timeline_months, priority, status } = req.body;
    const result = await pool.query(
      `UPDATE redistribution_plans SET plan_name=$1, source_buildings=$2, target_community=$3, capacity_kw=$4, estimated_beneficiaries=$5, cost_estimate=$6, timeline_months=$7, priority=$8, status=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [plan_name, source_buildings, target_community, capacity_kw, estimated_beneficiaries, cost_estimate, timeline_months, priority, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM redistribution_plans WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-analyze', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM redistribution_plans WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const plan = result.rows[0];
    const aiResult = await queryAI(
      'You are an energy redistribution planner focused on social equity. Analyze plans to redirect underutilized energy capacity to underserved communities.',
      `Analyze this redistribution plan:\nPlan: ${plan.plan_name}\nSource: ${plan.source_buildings}\nTarget Community: ${plan.target_community}\nCapacity: ${plan.capacity_kw} kW\nBeneficiaries: ${plan.estimated_beneficiaries}\nCost: $${plan.cost_estimate}\nTimeline: ${plan.timeline_months} months\nPriority: ${plan.priority}/5\n\nProvide: 1) Feasibility assessment 2) Social impact analysis 3) Cost optimization 4) Implementation roadmap`
    );
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
