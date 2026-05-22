const express = require('express');

const router = express.Router();

function simulate(input = {}) {
  const assets = input.assets || [
    { building: 'North Tower', asset: 'after-hours parking', monthly_revenue: 4200, tenant_share_pct: 25, community_reinvestment_pct: 10 },
    { building: 'Warehouse 4', asset: 'roof solar demand response', monthly_revenue: 6800, tenant_share_pct: 15, community_reinvestment_pct: 20 },
  ];
  return {
    assets: assets.map((a) => ({
      ...a,
      tenant_distribution: Math.round(Number(a.monthly_revenue) * Number(a.tenant_share_pct) / 100),
      reinvestment_pool: Math.round(Number(a.monthly_revenue) * Number(a.community_reinvestment_pct) / 100),
      owner_net: Math.round(Number(a.monthly_revenue) * (100 - Number(a.tenant_share_pct) - Number(a.community_reinvestment_pct)) / 100),
    })),
  };
}

router.get('/', (req, res) => res.json(simulate()));
router.post('/simulate', (req, res) => res.json(simulate(req.body || {})));

module.exports = router;
