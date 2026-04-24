const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryAI } = require('../openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM equity_scores ORDER BY score DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM equity_scores WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { community_name, region, score, energy_access_score, affordability_score, reliability_score, environmental_score, health_impact_score, assessment_date, status } = req.body;
    const result = await pool.query(
      `INSERT INTO equity_scores (community_name, region, score, energy_access_score, affordability_score, reliability_score, environmental_score, health_impact_score, assessment_date, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [community_name, region, score, energy_access_score, affordability_score, reliability_score, environmental_score, health_impact_score, assessment_date, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { community_name, region, score, energy_access_score, affordability_score, reliability_score, environmental_score, health_impact_score, assessment_date, status } = req.body;
    const result = await pool.query(
      `UPDATE equity_scores SET community_name=$1, region=$2, score=$3, energy_access_score=$4, affordability_score=$5, reliability_score=$6, environmental_score=$7, health_impact_score=$8, assessment_date=$9, status=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [community_name, region, score, energy_access_score, affordability_score, reliability_score, environmental_score, health_impact_score, assessment_date, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM equity_scores WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-analyze', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM equity_scores WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const eq = result.rows[0];
    const aiResult = await queryAI(
      'You are a social equity and energy justice analyst. Evaluate equity scores and recommend strategies to improve energy equity across communities.',
      `Analyze this equity score:\nCommunity: ${eq.community_name}\nRegion: ${eq.region}\nOverall Score: ${eq.score}/100\nEnergy Access: ${eq.energy_access_score}/100\nAffordability: ${eq.affordability_score}/100\nReliability: ${eq.reliability_score}/100\nEnvironmental: ${eq.environmental_score}/100\nHealth Impact: ${eq.health_impact_score}/100\n\nProvide: 1) Equity gap analysis 2) Priority improvement areas 3) Policy recommendations 4) Community engagement strategies`
    );
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
