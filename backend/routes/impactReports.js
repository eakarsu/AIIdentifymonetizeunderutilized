const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryAI } = require('../openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM impact_reports ORDER BY report_date DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM impact_reports WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { report_title, community_name, report_date, households_served, energy_saved_kwh, cost_savings, carbon_reduction_tons, jobs_created, satisfaction_score, status } = req.body;
    const result = await pool.query(
      `INSERT INTO impact_reports (report_title, community_name, report_date, households_served, energy_saved_kwh, cost_savings, carbon_reduction_tons, jobs_created, satisfaction_score, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [report_title, community_name, report_date, households_served, energy_saved_kwh, cost_savings, carbon_reduction_tons, jobs_created, satisfaction_score, status || 'published']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { report_title, community_name, report_date, households_served, energy_saved_kwh, cost_savings, carbon_reduction_tons, jobs_created, satisfaction_score, status } = req.body;
    const result = await pool.query(
      `UPDATE impact_reports SET report_title=$1, community_name=$2, report_date=$3, households_served=$4, energy_saved_kwh=$5, cost_savings=$6, carbon_reduction_tons=$7, jobs_created=$8, satisfaction_score=$9, status=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [report_title, community_name, report_date, households_served, energy_saved_kwh, cost_savings, carbon_reduction_tons, jobs_created, satisfaction_score, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM impact_reports WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-analyze', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM impact_reports WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const rpt = result.rows[0];
    const aiResult = await queryAI(
      'You are a community impact analyst. Evaluate the social and environmental impact of energy redistribution programs.',
      `Analyze this impact report:\nTitle: ${rpt.report_title}\nCommunity: ${rpt.community_name}\nDate: ${rpt.report_date}\nHouseholds Served: ${rpt.households_served}\nEnergy Saved: ${rpt.energy_saved_kwh} kWh\nCost Savings: $${rpt.cost_savings}\nCarbon Reduction: ${rpt.carbon_reduction_tons} tons\nJobs Created: ${rpt.jobs_created}\nSatisfaction: ${rpt.satisfaction_score}/10\n\nProvide: 1) Impact effectiveness rating 2) Scalability assessment 3) Improvement opportunities 4) Stakeholder recommendations`
    );
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
