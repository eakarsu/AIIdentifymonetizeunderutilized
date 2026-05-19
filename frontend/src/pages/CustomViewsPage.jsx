import React from 'react';
import AssetUtilizationChart from '../components/AssetUtilizationChart';
import RevenueOpportunityHeatmap from '../components/RevenueOpportunityHeatmap';
import OpportunityReportPdf from '../components/OpportunityReportPdf';
import MonetizationRulesEditor from '../components/MonetizationRulesEditor';

export default function CustomViewsPage() {
  return (
    <div data-testid="custom-views-page" style={{ padding: 24, background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Monetize Views</h1>
        <p style={{ color: '#555', marginTop: 4 }}>
          Identify and monetize underutilized assets across your portfolio.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 16 }}>
        <AssetUtilizationChart />
        <RevenueOpportunityHeatmap />
        <OpportunityReportPdf />
        <MonetizationRulesEditor />
      </div>
    </div>
  );
}
