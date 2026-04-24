const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryAI } = require('../openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM capacity_detections ORDER BY detected_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM capacity_detections WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { building_name, location, capacity_type, total_capacity_kw, used_capacity_kw, available_capacity_kw, detection_method, confidence_score, status } = req.body;
    const result = await pool.query(
      `INSERT INTO capacity_detections (building_name, location, capacity_type, total_capacity_kw, used_capacity_kw, available_capacity_kw, detection_method, confidence_score, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [building_name, location, capacity_type, total_capacity_kw, used_capacity_kw, available_capacity_kw, detection_method, confidence_score, status || 'detected']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { building_name, location, capacity_type, total_capacity_kw, used_capacity_kw, available_capacity_kw, detection_method, confidence_score, status } = req.body;
    const result = await pool.query(
      `UPDATE capacity_detections SET building_name=$1, location=$2, capacity_type=$3, total_capacity_kw=$4, used_capacity_kw=$5, available_capacity_kw=$6, detection_method=$7, confidence_score=$8, status=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [building_name, location, capacity_type, total_capacity_kw, used_capacity_kw, available_capacity_kw, detection_method, confidence_score, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM capacity_detections WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-analyze', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM capacity_detections WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const detection = result.rows[0];
    const utilPct = ((detection.used_capacity_kw / detection.total_capacity_kw) * 100).toFixed(1);
    const aiResult = await queryAI(
      'You are an AI energy capacity analyst specializing in identifying underutilized energy in commercial buildings. Provide insights on how detected capacity can be aggregated and redirected to benefit communities.',
      `Analyze this capacity detection:\nBuilding: ${detection.building_name}\nLocation: ${detection.location}\nType: ${detection.capacity_type}\nTotal: ${detection.total_capacity_kw} kW\nUsed: ${detection.used_capacity_kw} kW (${utilPct}%)\nAvailable: ${detection.available_capacity_kw} kW\nDetection Method: ${detection.detection_method}\nConfidence: ${detection.confidence_score}%\n\nProvide: 1) Aggregation potential 2) Community redirect opportunities 3) Grid stability impact 4) Revenue potential`
    );
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
