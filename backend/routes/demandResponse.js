const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryAI } = require('../openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM demand_response ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM demand_response WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { program_name, program_type, region, enrolled_buildings, capacity_committed_kw, incentive_rate, season, peak_hours, status } = req.body;
    const result = await pool.query(
      `INSERT INTO demand_response (program_name, program_type, region, enrolled_buildings, capacity_committed_kw, incentive_rate, season, peak_hours, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [program_name, program_type, region, enrolled_buildings, capacity_committed_kw, incentive_rate, season, peak_hours, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { program_name, program_type, region, enrolled_buildings, capacity_committed_kw, incentive_rate, season, peak_hours, status } = req.body;
    const result = await pool.query(
      `UPDATE demand_response SET program_name=$1, program_type=$2, region=$3, enrolled_buildings=$4, capacity_committed_kw=$5, incentive_rate=$6, season=$7, peak_hours=$8, status=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [program_name, program_type, region, enrolled_buildings, capacity_committed_kw, incentive_rate, season, peak_hours, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM demand_response WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-analyze', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM demand_response WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const dr = result.rows[0];
    const aiResult = await queryAI(
      'You are a demand response program specialist. Analyze DR programs and optimize their effectiveness for grid stability and community benefit.',
      `Analyze this demand response program:\nProgram: ${dr.program_name}\nType: ${dr.program_type}\nRegion: ${dr.region}\nEnrolled Buildings: ${dr.enrolled_buildings}\nCommitted Capacity: ${dr.capacity_committed_kw} kW\nIncentive Rate: $${dr.incentive_rate}/kWh\nSeason: ${dr.season}\nPeak Hours: ${dr.peak_hours}\n\nProvide: 1) Program effectiveness analysis 2) Enrollment optimization 3) Grid impact assessment 4) Community benefit potential`
    );
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
