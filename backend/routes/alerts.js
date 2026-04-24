const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryAI } = require('../openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM alerts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM alerts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, alert_type, severity, source, description, region, acknowledged, resolved_at, status } = req.body;
    const result = await pool.query(
      `INSERT INTO alerts (title, alert_type, severity, source, description, region, acknowledged, resolved_at, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [title, alert_type, severity, source, description, region, acknowledged || false, resolved_at, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, alert_type, severity, source, description, region, acknowledged, resolved_at, status } = req.body;
    const result = await pool.query(
      `UPDATE alerts SET title=$1, alert_type=$2, severity=$3, source=$4, description=$5, region=$6, acknowledged=$7, resolved_at=$8, status=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [title, alert_type, severity, source, description, region, acknowledged, resolved_at, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM alerts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-analyze', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM alerts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const alert = result.rows[0];
    const aiResult = await queryAI(
      'You are a grid operations alert analyst. Assess alerts and provide actionable response recommendations.',
      `Analyze this alert:\nTitle: ${alert.title}\nType: ${alert.alert_type}\nSeverity: ${alert.severity}\nSource: ${alert.source}\nDescription: ${alert.description}\nRegion: ${alert.region}\nAcknowledged: ${alert.acknowledged}\n\nProvide: 1) Root cause analysis 2) Immediate response steps 3) Prevention measures 4) Impact on grid stability and communities`
    );
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
