import React, { useEffect, useState } from 'react';

export default function AssetUtilizationChart() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/custom-views/utilization-chart', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setData)
      .catch(e => setErr(e.message));
  }, []);

  if (err) return <div style={{ color: 'crimson' }}>Error: {err}</div>;
  if (!data) return <div>Loading utilization chart...</div>;

  const max = 100;
  return (
    <div data-testid="utilization-chart" style={{ background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h3 style={{ marginTop: 0 }}>Asset Utilization: Current vs Potential</h3>
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#555', marginBottom: 8 }}>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#3b82f6', marginRight: 4 }}></span>{data.label_current}</span>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#10b981', marginRight: 4 }}></span>{data.label_potential}</span>
      </div>
      {data.assets.map(a => (
        <div key={a.asset} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 13, marginBottom: 4 }}>{a.asset}</div>
          <div style={{ position: 'relative', height: 18, background: '#f1f5f9', borderRadius: 4 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, height: 18, width: `${(a.potential / max) * 100}%`, background: '#10b981', opacity: 0.55, borderRadius: 4 }} />
            <div style={{ position: 'absolute', top: 0, left: 0, height: 18, width: `${(a.current / max) * 100}%`, background: '#3b82f6', borderRadius: 4 }} />
            <div style={{ position: 'absolute', top: 0, right: 8, fontSize: 11, lineHeight: '18px', color: '#111' }}>
              {a.current}% / {a.potential}%
            </div>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 12, fontSize: 12, color: '#555' }}>
        Average untapped gap: <strong>{data.summary.avg_gap_pct}%</strong> across {data.summary.asset_count} assets
      </div>
    </div>
  );
}
