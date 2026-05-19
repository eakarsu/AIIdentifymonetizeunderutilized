// Custom Views routes — Identify / Monetize Underutilized Assets
// Provides: utilization chart, revenue opportunity heatmap,
// monetization opportunity PDF report, and monetization strategy rules CRUD.

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// In-memory store for monetization strategy rules (asset categories x revenue models)
let rulesStore = [
  {
    id: 1,
    asset_category: 'Office Building',
    revenue_model: 'Co-working Sublease',
    min_idle_pct: 30,
    expected_yield_per_sqft: 4.5,
    notes: 'Lease unused floors as flexible workspace.',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    asset_category: 'Parking Garage',
    revenue_model: 'EV Charging Hub',
    min_idle_pct: 40,
    expected_yield_per_sqft: 2.1,
    notes: 'Install Level 2/3 EV chargers in low-use periods.',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    asset_category: 'Warehouse',
    revenue_model: 'Last-Mile Micro-Fulfillment',
    min_idle_pct: 25,
    expected_yield_per_sqft: 3.2,
    notes: 'Partition unused racking for 3PL clients.',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    asset_category: 'Rooftop',
    revenue_model: 'Solar PPA Lease',
    min_idle_pct: 60,
    expected_yield_per_sqft: 1.6,
    notes: 'Host third-party solar arrays under a PPA.',
    active: true,
    created_at: new Date().toISOString(),
  },
];
let nextRuleId = 5;

// 1. VIZ — Asset utilization: current vs potential
router.get('/utilization-chart', authenticateToken, (req, res) => {
  const assets = [
    { asset: 'HQ Office Tower',        current: 42, potential: 95 },
    { asset: 'Westside Parking',       current: 55, potential: 92 },
    { asset: 'Dock 7 Warehouse',       current: 60, potential: 90 },
    { asset: 'Mainline Rooftop',       current: 12, potential: 85 },
    { asset: 'Conference Center B',    current: 38, potential: 88 },
    { asset: 'Cold Storage Annex',     current: 49, potential: 80 },
  ];
  const totalGapPct = (
    assets.reduce((s, a) => s + (a.potential - a.current), 0) / assets.length
  ).toFixed(1);
  res.json({
    unit: 'percent',
    label_current: 'Current Utilization',
    label_potential: 'Potential Utilization',
    assets,
    summary: {
      avg_gap_pct: Number(totalGapPct),
      asset_count: assets.length,
      generated_at: new Date().toISOString(),
    },
  });
});

// 2. VIZ — Revenue opportunity heatmap: asset x monetization channel ($k / yr)
router.get('/revenue-heatmap', authenticateToken, (req, res) => {
  const assets = [
    'HQ Office Tower',
    'Westside Parking',
    'Dock 7 Warehouse',
    'Mainline Rooftop',
    'Conference Center B',
  ];
  const channels = [
    'Sublease',
    'EV Charging',
    'Solar PPA',
    'Events',
    'Storage',
    'Advertising',
  ];
  // matrix[i][j] = projected $k/year for assets[i] x channels[j]
  const matrix = [
    [180,  20,   0, 110,  35,  60],
    [ 10, 220,   0,   0,   0,  45],
    [ 25,  15,  10,   0, 240,  30],
    [  0,   5, 310,   0,   0,  75],
    [ 60,  10,  15, 195,  25,  40],
  ];
  let max = 0;
  let totalRevenueK = 0;
  matrix.forEach(row => row.forEach(v => { if (v > max) max = v; totalRevenueK += v; }));
  res.json({
    unit: 'usd_thousand_per_year',
    assets,
    channels,
    matrix,
    max_value: max,
    total_revenue_k_usd: totalRevenueK,
    generated_at: new Date().toISOString(),
  });
});

// 3. NON-VIZ — Monetization opportunity report (PDF as text-based stream)
router.get('/opportunity-report.pdf', authenticateToken, (req, res) => {
  const reportLines = [
    'MONETIZATION OPPORTUNITY REPORT',
    'Generated: ' + new Date().toISOString(),
    '',
    '== Executive Summary ==',
    'This report identifies underutilized assets across the portfolio',
    'and quantifies projected revenue from targeted monetization channels.',
    '',
    '== Top Opportunities ==',
    '1. Mainline Rooftop  ->  Solar PPA Lease     ($310k / yr)',
    '2. Dock 7 Warehouse  ->  Storage / Micro-3PL ($240k / yr)',
    '3. Westside Parking  ->  EV Charging Hub     ($220k / yr)',
    '4. Conference Ctr B  ->  Event Hosting       ($195k / yr)',
    '5. HQ Office Tower   ->  Co-working Sublease ($180k / yr)',
    '',
    '== Projected Annual Uplift ==',
    'Combined revenue if all opportunities are activated: ~$1.14M / yr',
    '',
    '== Recommended Next Steps ==',
    '- Validate idle-capacity windows with on-site sensors.',
    '- Prioritize Solar PPA + EV Charging for fastest payback.',
    '- Pilot co-working sublease on floors 3-5 of HQ.',
    '',
    'End of report.',
  ];

  // Minimal valid PDF (single-page, single text stream).
  function escapePdf(s) {
    return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }
  const contentLines = ['BT', '/F1 12 Tf', '50 770 Td', '14 TL'];
  reportLines.forEach((line, idx) => {
    contentLines.push(`(${escapePdf(line)}) Tj`);
    if (idx < reportLines.length - 1) contentLines.push('T*');
  });
  contentLines.push('ET');
  const contentStream = contentLines.join('\n');

  const objects = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  objects.push(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ' +
      '/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n'
  );
  objects.push(
    `4 0 obj\n<< /Length ${Buffer.byteLength(contentStream, 'utf8')} >>\nstream\n${contentStream}\nendstream\nendobj\n`
  );
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach(obj => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    'inline; filename="monetization_opportunity_report.pdf"'
  );
  res.status(200).send(Buffer.from(pdf, 'utf8'));
});

// 4. NON-VIZ — Monetization strategy rules editor (CRUD)
router.get('/rules', authenticateToken, (req, res) => {
  res.json(rulesStore);
});

router.post('/rules', authenticateToken, (req, res) => {
  const {
    asset_category,
    revenue_model,
    min_idle_pct = 0,
    expected_yield_per_sqft = 0,
    notes = '',
    active = true,
  } = req.body || {};
  if (!asset_category || !revenue_model) {
    return res
      .status(400)
      .json({ error: 'asset_category and revenue_model are required' });
  }
  const rule = {
    id: nextRuleId++,
    asset_category,
    revenue_model,
    min_idle_pct: Number(min_idle_pct),
    expected_yield_per_sqft: Number(expected_yield_per_sqft),
    notes,
    active: !!active,
    created_at: new Date().toISOString(),
  };
  rulesStore.push(rule);
  res.status(201).json(rule);
});

router.put('/rules/:id', authenticateToken, (req, res) => {
  const id = Number(req.params.id);
  const idx = rulesStore.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Rule not found' });
  rulesStore[idx] = { ...rulesStore[idx], ...req.body, id };
  res.json(rulesStore[idx]);
});

router.delete('/rules/:id', authenticateToken, (req, res) => {
  const id = Number(req.params.id);
  const before = rulesStore.length;
  rulesStore = rulesStore.filter(r => r.id !== id);
  if (rulesStore.length === before) {
    return res.status(404).json({ error: 'Rule not found' });
  }
  res.json({ deleted: true, id });
});

module.exports = router;
