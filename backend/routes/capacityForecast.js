const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryAI } = require('../openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM capacity_forecasts ORDER BY forecast_date DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM capacity_forecasts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { region, forecast_date, predicted_demand_mw, predicted_supply_mw, predicted_surplus_mw, confidence_pct, weather_factor, season, model_version, status } = req.body;
    const result = await pool.query(
      `INSERT INTO capacity_forecasts (region, forecast_date, predicted_demand_mw, predicted_supply_mw, predicted_surplus_mw, confidence_pct, weather_factor, season, model_version, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [region, forecast_date, predicted_demand_mw, predicted_supply_mw, predicted_surplus_mw, confidence_pct, weather_factor, season, model_version, status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { region, forecast_date, predicted_demand_mw, predicted_supply_mw, predicted_surplus_mw, confidence_pct, weather_factor, season, model_version, status } = req.body;
    const result = await pool.query(
      `UPDATE capacity_forecasts SET region=$1, forecast_date=$2, predicted_demand_mw=$3, predicted_supply_mw=$4, predicted_surplus_mw=$5, confidence_pct=$6, weather_factor=$7, season=$8, model_version=$9, status=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [region, forecast_date, predicted_demand_mw, predicted_supply_mw, predicted_surplus_mw, confidence_pct, weather_factor, season, model_version, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM capacity_forecasts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-analyze', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM capacity_forecasts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const fc = result.rows[0];
    const aiResult = await queryAI(
      'You are an AI energy forecasting specialist. Analyze capacity forecasts and provide insights on predicted energy supply/demand dynamics.',
      `Analyze this capacity forecast:\nRegion: ${fc.region}\nForecast Date: ${fc.forecast_date}\nPredicted Demand: ${fc.predicted_demand_mw} MW\nPredicted Supply: ${fc.predicted_supply_mw} MW\nPredicted Surplus: ${fc.predicted_surplus_mw} MW\nConfidence: ${fc.confidence_pct}%\nWeather Factor: ${fc.weather_factor}\nSeason: ${fc.season}\nModel: ${fc.model_version}\n\nProvide: 1) Forecast reliability assessment 2) Surplus utilization opportunities 3) Risk scenarios 4) Community allocation recommendations`
    );
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
