const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryAI } = require('../openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM grid_stability ORDER BY recorded_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM grid_stability WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { region, frequency_hz, voltage_kv, load_mw, generation_mw, renewable_pct, stability_index, risk_level, status } = req.body;
    const result = await pool.query(
      `INSERT INTO grid_stability (region, frequency_hz, voltage_kv, load_mw, generation_mw, renewable_pct, stability_index, risk_level, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [region, frequency_hz, voltage_kv, load_mw, generation_mw, renewable_pct, stability_index, risk_level || 'low', status || 'normal']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { region, frequency_hz, voltage_kv, load_mw, generation_mw, renewable_pct, stability_index, risk_level, status } = req.body;
    const result = await pool.query(
      `UPDATE grid_stability SET region=$1, frequency_hz=$2, voltage_kv=$3, load_mw=$4, generation_mw=$5, renewable_pct=$6, stability_index=$7, risk_level=$8, status=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [region, frequency_hz, voltage_kv, load_mw, generation_mw, renewable_pct, stability_index, risk_level, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM grid_stability WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-analyze', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM grid_stability WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const grid = result.rows[0];
    const aiResult = await queryAI(
      'You are a power grid stability expert. Analyze grid metrics and provide insights on maintaining grid reliability while integrating distributed energy resources.',
      `Analyze this grid stability reading:\nRegion: ${grid.region}\nFrequency: ${grid.frequency_hz} Hz\nVoltage: ${grid.voltage_kv} kV\nLoad: ${grid.load_mw} MW\nGeneration: ${grid.generation_mw} MW\nRenewable %: ${grid.renewable_pct}%\nStability Index: ${grid.stability_index}/100\nRisk Level: ${grid.risk_level}\n\nProvide: 1) Stability assessment 2) Risk mitigation strategies 3) Renewable integration recommendations 4) Load balancing opportunities`
    );
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
