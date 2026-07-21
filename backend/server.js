const express = require('express');
const cors = require('cors');
const path = require('path');
// === Batch 04 Gaps & Frontend Mounts ===
const route_gap_no_utilization_opportunity_finder_endpoi = require('./routes/gap-no-utilization-opportunity-finder-endpoi');
const route_gap_no_demand_forecast_ai = require('./routes/gap-no-demand-forecast-ai');
const route_gap_no_pricing_recommender_for_underutilized = require('./routes/gap-no-pricing-recommender-for-underutilized');
const route_gap_no_partner_matching_ai = require('./routes/gap-no-partner-matching-ai');
const route_gap_no_equity_analysis_ai_synthesizing_commu = require('./routes/gap-no-equity-analysis-ai-synthesizing-commu');
const route_gap_limited_landlordtenant_communication_no_ = require('./routes/gap-limited-landlordtenant-communication-no-');
const route_gap_no_file_upload_for_compliance_documentat = require('./routes/gap-no-file-upload-for-compliance-documentat');
const route_gap_no_webhook_surface_for_utility_meter = require('./routes/gap-no-webhook-surface-for-utility-meter');
const route_gap_no_real_time_grid_stability_streaming = require('./routes/gap-no-real-time-grid-stability-streaming');
const route_gap_no_public_marketplace_for_sharing_offere = require('./routes/gap-no-public-marketplace-for-sharing-offere');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/buildings', require('./routes/buildings'));
app.use('/api/energy-audits', require('./routes/energyAudits'));
app.use('/api/capacity-detection', require('./routes/capacityDetection'));
app.use('/api/community-needs', require('./routes/communityNeeds'));
app.use('/api/aggregation', require('./routes/aggregation'));
app.use('/api/grid-stability', require('./routes/gridStability'));
app.use('/api/equity-scores', require('./routes/equityScores'));
app.use('/api/redistribution', require('./routes/redistribution'));
app.use('/api/demand-response', require('./routes/demandResponse'));
app.use('/api/capacity-forecast', require('./routes/capacityForecast'));
app.use('/api/impact-reports', require('./routes/impactReports'));
app.use('/api/energy-savings', require('./routes/energySavings'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/compliance', require('./routes/compliance'));
app.use('/api/partners', require('./routes/partners'));
app.use('/api/ai', require('./routes/ai'));
// Apply pass 5 — additive
app.use('/api/integrations', require('./routes/integrations'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/agentic-utilization-scout', require('./routes/agenticUtilizationScout'));
app.use('/api/dr-monetize', require('./routes/demandResponseMonetize'));
app.use('/api/tenant-revenue-share-simulator', require('./routes/tenantRevenueShareSimulator'));
app.use('/api/governed-assets', require('./middleware/auth').authenticateToken, require('./routes/governedAssets'));

// Custom Views — Identify / Monetize Underutilized Assets (mounted BEFORE 404 fallback)
app.use('/api/custom-views', require('./routes/customViews'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


app.use('/api/gap-no-utilization-opportunity-finder-endpoi', route_gap_no_utilization_opportunity_finder_endpoi);
app.use('/api/gap-no-demand-forecast-ai', route_gap_no_demand_forecast_ai);
app.use('/api/gap-no-pricing-recommender-for-underutilized', route_gap_no_pricing_recommender_for_underutilized);
app.use('/api/gap-no-partner-matching-ai', route_gap_no_partner_matching_ai);
app.use('/api/gap-no-equity-analysis-ai-synthesizing-commu', route_gap_no_equity_analysis_ai_synthesizing_commu);
app.use('/api/gap-limited-landlordtenant-communication-no-', route_gap_limited_landlordtenant_communication_no_);
app.use('/api/gap-no-file-upload-for-compliance-documentat', route_gap_no_file_upload_for_compliance_documentat);
app.use('/api/gap-no-webhook-surface-for-utility-meter', route_gap_no_webhook_surface_for_utility_meter);
app.use('/api/gap-no-real-time-grid-stability-streaming', route_gap_no_real_time_grid_stability_streaming);
app.use('/api/gap-no-public-marketplace-for-sharing-offere', route_gap_no_public_marketplace_for_sharing_offere);

app.listen(PORT, () => {
  console.log(`⚡ Energy Grid Backend running on port ${PORT}`);
});
