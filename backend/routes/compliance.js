const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryAI } = require('../openrouter');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM compliance_reports ORDER BY due_date ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM compliance_reports WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { report_name, regulation, jurisdiction, due_date, submitted_date, compliance_score, findings, corrective_actions, auditor, status } = req.body;
    const result = await pool.query(
      `INSERT INTO compliance_reports (report_name, regulation, jurisdiction, due_date, submitted_date, compliance_score, findings, corrective_actions, auditor, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [report_name, regulation, jurisdiction, due_date, submitted_date, compliance_score, findings, corrective_actions, auditor, status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { report_name, regulation, jurisdiction, due_date, submitted_date, compliance_score, findings, corrective_actions, auditor, status } = req.body;
    const result = await pool.query(
      `UPDATE compliance_reports SET report_name=$1, regulation=$2, jurisdiction=$3, due_date=$4, submitted_date=$5, compliance_score=$6, findings=$7, corrective_actions=$8, auditor=$9, status=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [report_name, regulation, jurisdiction, due_date, submitted_date, compliance_score, findings, corrective_actions, auditor, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM compliance_reports WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ai-analyze', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM compliance_reports WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const cr = result.rows[0];
    const aiResult = await queryAI(
      'You are a regulatory compliance expert for energy utilities. Analyze compliance reports and provide guidance on meeting regulatory requirements.',
      `Analyze this compliance report:\nReport: ${cr.report_name}\nRegulation: ${cr.regulation}\nJurisdiction: ${cr.jurisdiction}\nDue Date: ${cr.due_date}\nCompliance Score: ${cr.compliance_score}%\nFindings: ${cr.findings}\nCorrective Actions: ${cr.corrective_actions}\nAuditor: ${cr.auditor}\n\nProvide: 1) Compliance gap analysis 2) Risk assessment 3) Remediation priority 4) Best practice recommendations`
    );
    res.json(aiResult);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
