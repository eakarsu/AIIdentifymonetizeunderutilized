import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import AdvancedAITools from './pages/AdvancedAITools';
import CustomViewsPage from './pages/CustomViewsPage';
import TenantRevenueShareSimulator from './pages/TenantRevenueShareSimulator';
import Layout from './components/Layout';

// === Batch 04 Gaps & Frontend Mounts ===
import CfAgenticUtilizationScoutContinuouslyS from './pages/CfAgenticUtilizationScoutContinuouslyS';
import CfDemandForecastingDynamicPricingForS from './pages/CfDemandForecastingDynamicPricingForS';
import CfCommunityImpactModelingQuantifyingJo from './pages/CfCommunityImpactModelingQuantifyingJo';
import CfRealEstateArbitrageAdvisorRecommendi from './pages/CfRealEstateArbitrageAdvisorRecommendi';
import CfDemandResponseMonetizationAutomating from './pages/CfDemandResponseMonetizationAutomating';
import CfEquityDrivenRedistributionRecommendin from './pages/CfEquityDrivenRedistributionRecommendin';
import GapNoUtilizationOpportunityFinderEndpoi from './pages/GapNoUtilizationOpportunityFinderEndpoi';
import GapNoDemandForecastAi from './pages/GapNoDemandForecastAi';
import GapNoPricingRecommenderForUnderutilized from './pages/GapNoPricingRecommenderForUnderutilized';
import GapNoPartnerMatchingAi from './pages/GapNoPartnerMatchingAi';
import GapNoEquityAnalysisAiSynthesizingCommu from './pages/GapNoEquityAnalysisAiSynthesizingCommu';
import GapLimitedLandlordtenantCommunicationNo from './pages/GapLimitedLandlordtenantCommunicationNo';
import GapNoFileUploadForComplianceDocumentat from './pages/GapNoFileUploadForComplianceDocumentat';
import GapNoWebhookSurfaceForUtilityMeter from './pages/GapNoWebhookSurfaceForUtilityMeter';
import GapNoRealTimeGridStabilityStreaming from './pages/GapNoRealTimeGridStabilityStreaming';
import GapNoPublicMarketplaceForSharingOffere from './pages/GapNoPublicMarketplaceForSharingOffere';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/insights/timeline" element={<TimelineView />} />
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/"
          element={user ? <Layout user={user} onLogout={handleLogout}><Dashboard /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/feature/:featureKey"
          element={user ? <Layout user={user} onLogout={handleLogout}><FeaturePage /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/advanced-ai"
          element={user ? <Layout user={user} onLogout={handleLogout}><AdvancedAITools /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/custom-views"
          element={user ? <Layout user={user} onLogout={handleLogout}><CustomViewsPage /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/tenant-revenue-share-simulator"
          element={user ? <Layout user={user} onLogout={handleLogout}><TenantRevenueShareSimulator /></Layout> : <Navigate to="/login" />}
        />
      
          {/* // === Batch 04 Gaps & Frontend Mounts === */}
          <Route path="/cf-agentic-utilization-scout-continuously-s" element={<CfAgenticUtilizationScoutContinuouslyS />} />
          <Route path="/cf-demand-forecasting-dynamic-pricing-for-s" element={<CfDemandForecastingDynamicPricingForS />} />
          <Route path="/cf-community-impact-modeling-quantifying-jo" element={<CfCommunityImpactModelingQuantifyingJo />} />
          <Route path="/cf-real-estate-arbitrage-advisor-recommendi" element={<CfRealEstateArbitrageAdvisorRecommendi />} />
          <Route path="/cf-demand-response-monetization-automating-" element={<CfDemandResponseMonetizationAutomating />} />
          <Route path="/cf-equity-driven-redistribution-recommendin" element={<CfEquityDrivenRedistributionRecommendin />} />
          <Route path="/gap-no-utilization-opportunity-finder-endpoi" element={<GapNoUtilizationOpportunityFinderEndpoi />} />
          <Route path="/gap-no-demand-forecast-ai" element={<GapNoDemandForecastAi />} />
          <Route path="/gap-no-pricing-recommender-for-underutilized" element={<GapNoPricingRecommenderForUnderutilized />} />
          <Route path="/gap-no-partner-matching-ai" element={<GapNoPartnerMatchingAi />} />
          <Route path="/gap-no-equity-analysis-ai-synthesizing-commu" element={<GapNoEquityAnalysisAiSynthesizingCommu />} />
          <Route path="/gap-limited-landlordtenant-communication-no-" element={<GapLimitedLandlordtenantCommunicationNo />} />
          <Route path="/gap-no-file-upload-for-compliance-documentat" element={<GapNoFileUploadForComplianceDocumentat />} />
          <Route path="/gap-no-webhook-surface-for-utility-meter" element={<GapNoWebhookSurfaceForUtilityMeter />} />
          <Route path="/gap-no-real-time-grid-stability-streaming" element={<GapNoRealTimeGridStabilityStreaming />} />
          <Route path="/gap-no-public-marketplace-for-sharing-offere" element={<GapNoPublicMarketplaceForSharingOffere />} />
</Routes>
    </BrowserRouter>
  );
}
