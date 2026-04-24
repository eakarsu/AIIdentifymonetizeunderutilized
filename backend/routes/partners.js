const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryAI } = require('../openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM partners ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM partners WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { partner_name, partner_type, contact_person, contact_email, phone, region, services_offered, buildings_managed, partnership_since, status } = req.body;
    const result = await pool.query(
      `INSERT INTO partners (partner_name, partner_type, contact_person, contact_email, phone, region, services_offered, buildings_managed, partnership_since, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [partner_name, partner_type, contact_person, contact_email, phone, region, services_offered, buildings_managed, partnership_since, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { partner_name, partner_type, contact_person, contact_email, phone, region, services_offered, buildings_managed, partnership_since, status } = req.body;
    const result = await pool.query(
      `UPDATE partners SET partner_name=$1, partner_type=$2, contact_person=$3, contact_email=$4, phone=$5, region=$6, services_offered=$7, buildings_managed=$8, partnership_since=$9, status=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [partner_name, partner_type, contact_person, contact_email, phone, region, services_offered, buildings_managed, partnership_since, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM partners WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-analyze', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM partners WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const p = result.rows[0];
    const aiResult = await queryAI(
      'You are a strategic partnerships analyst for energy services. Evaluate partner relationships and recommend optimization strategies.',
      `Analyze this partner:\nPartner: ${p.partner_name}\nType: ${p.partner_type}\nRegion: ${p.region}\nServices: ${p.services_offered}\nBuildings Managed: ${p.buildings_managed}\nPartnership Since: ${p.partnership_since}\nStatus: ${p.status}\n\nProvide: 1) Partnership value assessment 2) Collaboration opportunities 3) Performance optimization 4) Growth potential`
    );
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
