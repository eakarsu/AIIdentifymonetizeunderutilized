/*
 * routes/bookings.js — Apply pass 5
 *
 * Mechanical (no-LLM) booking primitive for shared-space utilization.
 * Audit (batch_04 §27) flagged: "No booking/reservation system for shared
 * spaces". This module adds a minimal additive booking table and CRUD
 * endpoints. Schema is created with `IF NOT EXISTS` and never modifies the
 * existing `buildings` table.
 *
 * - GET    /api/bookings          — list (filterable by building_id, from, to)
 * - POST   /api/bookings          — create (with availability check)
 * - DELETE /api/bookings/:id      — cancel (soft-cancel via status)
 *
 * Conflict detection is deterministic: any overlap on the same building_id
 * (and same room_id if provided) within the requested time window blocks
 * creation with 409.
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

let schemaInit = null;
function ensureSchema() {
  if (schemaInit) return schemaInit;
  schemaInit = pool.query(`
    CREATE TABLE IF NOT EXISTS shared_space_bookings (
      id SERIAL PRIMARY KEY,
      building_id INTEGER NOT NULL,
      room_id INTEGER,
      booked_by INTEGER,
      partner_id INTEGER,
      starts_at TIMESTAMP NOT NULL,
      ends_at TIMESTAMP NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      price_cents INTEGER,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_ssb_building ON shared_space_bookings(building_id);
    CREATE INDEX IF NOT EXISTS idx_ssb_window ON shared_space_bookings(starts_at, ends_at);
  `).catch(() => {});
  return schemaInit;
}

// List
router.get('/', authenticateToken, async (req, res) => {
  await ensureSchema();
  try {
    const { building_id, from, to, status } = req.query;
    const filters = [];
    const params = [];
    if (building_id) { params.push(parseInt(building_id, 10)); filters.push(`building_id = $${params.length}`); }
    if (from)        { params.push(from); filters.push(`ends_at   >= $${params.length}`); }
    if (to)          { params.push(to);   filters.push(`starts_at <= $${params.length}`); }
    if (status)      { params.push(status); filters.push(`status   = $${params.length}`); }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT * FROM shared_space_bookings ${where} ORDER BY starts_at ASC LIMIT 200`,
      params,
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create
router.post('/', authenticateToken, async (req, res) => {
  await ensureSchema();
  const { building_id, room_id, partner_id, starts_at, ends_at, price_cents, notes } = req.body || {};
  if (!building_id || !starts_at || !ends_at) {
    return res.status(400).json({ error: 'building_id, starts_at, ends_at required' });
  }
  try {
    const overlap = await pool.query(
      `SELECT id FROM shared_space_bookings
       WHERE building_id = $1
         AND status = 'confirmed'
         AND ($4::int IS NULL OR room_id = $4)
         AND starts_at < $3
         AND ends_at   > $2
       LIMIT 1`,
      [building_id, starts_at, ends_at, room_id || null],
    );
    if (overlap.rows.length) {
      return res.status(409).json({ error: 'overlap', conflicts_with: overlap.rows[0].id });
    }
    const result = await pool.query(
      `INSERT INTO shared_space_bookings (building_id, room_id, booked_by, partner_id, starts_at, ends_at, price_cents, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [building_id, room_id || null, req.user?.id || null, partner_id || null, starts_at, ends_at, price_cents || null, notes || null],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel (soft)
router.delete('/:id', authenticateToken, async (req, res) => {
  await ensureSchema();
  try {
    const result = await pool.query(
      `UPDATE shared_space_bookings SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [parseInt(req.params.id, 10)],
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'not_found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
