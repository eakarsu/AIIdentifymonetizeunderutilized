const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryAI } = require('../openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM aggregation_plans ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM aggregation_plans WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { plan_name, region, buildings_count, total_aggregated_kw, target_community, estimated_savings, start_date, end_date, status } = req.body;
    const result = await pool.query(
      `INSERT INTO aggregation_plans (plan_name, region, buildings_count, total_aggregated_kw, target_community, estimated_savings, start_date, end_date, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [plan_name, region, buildings_count, total_aggregated_kw, target_community, estimated_savings, start_date, end_date, status || 'draft']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { plan_name, region, buildings_count, total_aggregated_kw, target_community, estimated_savings, start_date, end_date, status } = req.body;
    const result = await pool.query(
      `UPDATE aggregation_plans SET plan_name=$1, region=$2, buildings_count=$3, total_aggregated_kw=$4, target_community=$5, estimated_savings=$6, start_date=$7, end_date=$8, status=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [plan_name, region, buildings_count, total_aggregated_kw, target_community, estimated_savings, start_date, end_date, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM aggregation_plans WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-analyze', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM aggregation_plans WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const plan = result.rows[0];
    const aiResult = await queryAI(
      'You are an energy aggregation strategist. Analyze energy aggregation plans and provide insights on optimizing capacity pooling from multiple buildings to serve communities.',
      `Analyze this aggregation plan:\nPlan: ${plan.plan_name}\nRegion: ${plan.region}\nBuildings: ${plan.buildings_count}\nAggregated Capacity: ${plan.total_aggregated_kw} kW\nTarget Community: ${plan.target_community}\nEstimated Savings: $${plan.estimated_savings}\n\nProvide: 1) Optimization strategy 2) Risk assessment 3) Community impact projection 4) Scaling recommendations`
    );
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
