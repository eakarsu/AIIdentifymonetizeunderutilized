const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryAI } = require('../openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM buildings ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM buildings WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, address, building_type, total_capacity_kw, utilized_capacity_kw, floors, square_footage, year_built, owner, contact_email, status } = req.body;
    const result = await pool.query(
      `INSERT INTO buildings (name, address, building_type, total_capacity_kw, utilized_capacity_kw, floors, square_footage, year_built, owner, contact_email, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, address, building_type, total_capacity_kw, utilized_capacity_kw, floors, square_footage, year_built, owner, contact_email, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, address, building_type, total_capacity_kw, utilized_capacity_kw, floors, square_footage, year_built, owner, contact_email, status } = req.body;
    const result = await pool.query(
      `UPDATE buildings SET name=$1, address=$2, building_type=$3, total_capacity_kw=$4, utilized_capacity_kw=$5, floors=$6, square_footage=$7, year_built=$8, owner=$9, contact_email=$10, status=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [name, address, building_type, total_capacity_kw, utilized_capacity_kw, floors, square_footage, year_built, owner, contact_email, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM buildings WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/ai-analyze', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM buildings WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const building = result.rows[0];
    const utilization = ((building.utilized_capacity_kw / building.total_capacity_kw) * 100).toFixed(1);

    const aiResult = await queryAI(
      'You are an energy efficiency expert analyzing commercial building energy data. Provide actionable insights about energy capacity utilization, optimization opportunities, and recommendations for grid stability improvement.',
      `Analyze this building's energy profile:\nName: ${building.name}\nType: ${building.building_type}\nTotal Capacity: ${building.total_capacity_kw} kW\nUtilized: ${building.utilized_capacity_kw} kW (${utilization}%)\nSquare Footage: ${building.square_footage}\nYear Built: ${building.year_built}\nFloors: ${building.floors}\n\nProvide: 1) Capacity optimization recommendations 2) Grid stability contribution potential 3) Community benefit opportunities 4) Estimated savings`
    );
    res.json(aiResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
