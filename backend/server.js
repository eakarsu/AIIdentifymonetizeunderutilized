const express = require('express');
const cors = require('cors');
const path = require('path');
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`⚡ Energy Grid Backend running on port ${PORT}`);
});
