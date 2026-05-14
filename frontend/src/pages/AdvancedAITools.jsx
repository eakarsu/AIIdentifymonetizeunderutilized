import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

const TOOLS = [
  {
    id: 'utilization-opportunity-finder',
    title: 'Utilization Opportunity Finder',
    icon: '🎯',
    endpoint: '/ai/utilization-opportunity-finder',
    desc: 'Scan the building portfolio for monetization opportunities — per-asset and cross-portfolio strategies.',
    fields: [
      { name: 'underutilization_threshold', label: 'Underutilization Threshold (%)', type: 'number', placeholder: '40' },
      { name: 'max_buildings', label: 'Max Buildings to Scan', type: 'number', placeholder: '50' },
      { name: 'context', label: 'Notes / Constraints', type: 'textarea', placeholder: 'Optional context (e.g., region focus, regulatory limits, partner preferences)' },
    ],
  },
  {
    id: 'pricing-recommendation',
    title: 'Pricing Recommendation',
    icon: '💵',
    endpoint: '/ai/pricing-recommendation',
    desc: 'Tiered pricing recommendation with demand levers and expected utilization lift.',
    fields: [
      { name: 'building_id', label: 'Building (optional)', type: 'building' },
      { name: 'asset_description', label: 'Asset Description', type: 'textarea', placeholder: 'Describe the asset if no building selected' },
      { name: 'target_utilization_pct', label: 'Target Utilization (%)', type: 'number', placeholder: '75' },
      { name: 'market', label: 'Market / Region', type: 'text' },
    ],
  },
  {
    id: 'partner-matching',
    title: 'Partner Matching',
    icon: '🤝',
    endpoint: '/ai/partner-matching',
    desc: 'Score building candidates against partner demand parameters; lists blockers and recommended terms.',
    fields: [
      { name: 'partner_demand_kw', label: 'Partner Demand (kW)', type: 'number', placeholder: '500' },
      { name: 'partner_type', label: 'Partner Type', type: 'select', options: ['Technology', 'Consulting', 'Non-Profit', 'Contractor', 'Financial', 'Utility', 'Engineering', 'Cooperative'] },
      { name: 'region', label: 'Region', type: 'text' },
      { name: 'requirements', label: 'Requirements', type: 'textarea', placeholder: 'e.g., 24/7 access, dedicated metering, ESG reporting' },
    ],
  },
  {
    id: 'cohort-demand-forecast',
    title: 'Cohort Demand Forecast',
    icon: '📈',
    endpoint: '/ai/cohort-demand-forecast',
    desc: 'Cross-portfolio demand forecast (base/upside/downside) for a building cohort.',
    fields: [
      { name: 'building_type', label: 'Building Type (filter)', type: 'text', placeholder: 'e.g., Office, Warehouse' },
      { name: 'region', label: 'Region', type: 'text' },
      { name: 'horizon_months', label: 'Horizon (months)', type: 'number', placeholder: '12' },
      { name: 'scenario', label: 'Scenario Notes', type: 'textarea', placeholder: 'Macroeconomic context, policy changes, etc.' },
    ],
  },
  {
    id: 'real-estate-arbitrage',
    title: 'Real-Estate Arbitrage',
    icon: '🏢',
    endpoint: '/ai/real-estate-arbitrage',
    desc: 'Compare lease, sublet, demand-response and co-working monetization paths for an asset.',
    fields: [
      { name: 'building_id', label: 'Building (optional)', type: 'building' },
      { name: 'market_rates', label: 'Market Rates ($/sqft/yr)', type: 'text' },
      { name: 'holding_costs', label: 'Holding Costs (annual)', type: 'text' },
      { name: 'target_irr', label: 'Target IRR (%)', type: 'number', placeholder: '12' },
    ],
  },
];

function postAI(endpoint, body) {
  const token = localStorage.getItem('token');
  return fetch(`/api${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body || {}),
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`);
    return data;
  });
}

export default function AdvancedAITools() {
  const [tab, setTab] = useState(TOOLS[0].id);
  const [forms, setForms] = useState({});
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getAll('buildings').then(setBuildings).catch(() => setBuildings([]));
  }, []);

  const tool = TOOLS.find((t) => t.id === tab);
  const formData = forms[tab] || {};

  const setField = (name, value) => {
    setForms((prev) => ({ ...prev, [tab]: { ...(prev[tab] || {}), [name]: value } }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const body = {};
      tool.fields.forEach((f) => {
        const v = formData[f.name];
        if (v === undefined || v === '' || v === null) return;
        if (f.type === 'number' || f.type === 'building') body[f.name] = Number(v);
        else body[f.name] = v;
      });
      const data = await postAI(tool.endpoint, body);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Request failed');
    }
    setLoading(false);
  };

  const switchTab = (id) => {
    setTab(id);
    setError(null);
    setResult(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>🤖 Advanced AI Tools</h2>
          <p>Cross-portfolio AI tools: utilization opportunities, pricing, and partner matching.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`nav-item ${tab === t.id ? 'active' : ''}`}
            style={{
              padding: '10px 16px', borderRadius: 8,
              border: '1px solid var(--border, #e5e7eb)',
              background: tab === t.id ? '#0f766e' : 'white',
              color: tab === t.id ? 'white' : '#0f172a',
              cursor: 'pointer', fontWeight: 600,
            }}
            onClick={() => switchTab(t.id)}
          >
            <span style={{ marginRight: 6 }}>{t.icon}</span>{t.title}
          </button>
        ))}
      </div>

      <div className="card" style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <h3 style={{ marginTop: 0 }}>{tool.icon} {tool.title}</h3>
        <p style={{ color: '#64748b' }}>{tool.desc}</p>

        <form onSubmit={submit}>
          {tool.fields.map((f) => (
            <div key={f.name} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{f.label}</label>
              {f.type === 'building' ? (
                <select
                  value={formData[f.name] || ''}
                  onChange={(e) => setField(f.name, e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }}
                >
                  <option value="">-- Optional --</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} (#{b.id})</option>
                  ))}
                </select>
              ) : f.type === 'select' ? (
                <select
                  value={formData[f.name] || ''}
                  onChange={(e) => setField(f.name, e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }}
                >
                  <option value="">-- Select --</option>
                  {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea
                  rows={4}
                  value={formData[f.name] || ''}
                  placeholder={f.placeholder || ''}
                  onChange={(e) => setField(f.name, e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', fontFamily: 'inherit' }}
                />
              ) : (
                <input
                  type={f.type || 'text'}
                  value={formData[f.name] || ''}
                  placeholder={f.placeholder || ''}
                  onChange={(e) => setField(f.name, e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #0f766e, #14b8a6)',
              color: 'white', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Generating...' : 'Run Analysis'}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: 16, padding: 12, background: '#fef2f2', color: '#991b1b', borderRadius: 8, border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{ marginTop: 16, padding: 18, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <h4 style={{ marginTop: 0 }}>Result</h4>
            <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: 14, borderRadius: 8, overflow: 'auto', fontSize: 12, maxHeight: 500 }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
