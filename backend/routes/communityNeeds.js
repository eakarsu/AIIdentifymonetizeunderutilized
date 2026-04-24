const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryAI } = require('../openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM community_needs ORDER BY priority DESC, created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM community_needs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { community_name, location, population, median_income, energy_burden_pct, current_provider, needs_description, priority, status } = req.body;
    const result = await pool.query(
      `INSERT INTO community_needs (community_name, location, population, median_income, energy_burden_pct, current_provider, needs_description, priority, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [community_name, location, population, median_income, energy_burden_pct, current_provider, needs_description, priority || 3, status || 'assessed']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { community_name, location, population, median_income, energy_burden_pct, current_provider, needs_description, priority, status } = req.body;
    const result = await pool.query(
      `UPDATE community_needs SET community_name=$1, location=$2, population=$3, median_income=$4, energy_burden_pct=$5, current_provider=$6, needs_description=$7, priority=$8, status=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [community_name, location, population, median_income, energy_burden_pct, current_provider, needs_description, priority, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM community_needs WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-analyze', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM community_needs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const need = result.rows[0];
    const aiResult = await queryAI(
      'You are a social equity and energy justice analyst. Assess community energy needs and recommend strategies to improve energy access and reduce energy burden for underserved communities.',
      `Analyze this community's energy needs:\nCommunity: ${need.community_name}\nLocation: ${need.location}\nPopulation: ${need.population}\nMedian Income: $${need.median_income}\nEnergy Burden: ${need.energy_burden_pct}%\nDescription: ${need.needs_description}\nPriority: ${need.priority}/5\n\nProvide: 1) Energy equity assessment 2) Priority interventions 3) Funding recommendations 4) Expected community impact`
    );
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
