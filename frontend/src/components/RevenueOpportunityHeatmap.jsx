import React, { useEffect, useState } from 'react';

export default function RevenueOpportunityHeatmap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/custom-views/revenue-heatmap', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setData)
      .catch(e => setErr(e.message));
  }, []);

  if (err) return <div style={{ color: 'crimson' }}>Error: {err}</div>;
  if (!data) return <div>Loading revenue heatmap...</div>;

  const colorFor = v => {
    if (!v) return '#f8fafc';
    const t = Math.min(1, v / data.max_value);
    const r = Math.round(239 - t * 130);
    const g = Math.round(246 - t * 60);
    const b = Math.round(255 - t * 100);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div data-testid="revenue-heatmap" style={{ background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h3 style={{ marginTop: 0 }}>Revenue Opportunity Heatmap (Asset × Channel, $k/yr)</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 6, borderBottom: '1px solid #e2e8f0' }}>Asset \\ Channel</th>
              {data.channels.map(c => (
                <th key={c} style={{ textAlign: 'right', padding: 6, borderBottom: '1px solid #e2e8f0' }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.assets.map((a, i) => (
              <tr key={a}>
                <td style={{ padding: 6, fontWeight: 600 }}>{a}</td>
                {data.matrix[i].map((v, j) => (
                  <td
                    key={j}
                    style={{
                      padding: 6,
                      textAlign: 'right',
                      background: colorFor(v),
                      color: v > data.max_value * 0.6 ? '#fff' : '#111',
                      border: '1px solid #fff',
                      minWidth: 60,
                    }}
                  >
                    {v ? `$${v}k` : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: '#555' }}>
        Total addressable revenue: <strong>${data.total_revenue_k_usd}k / yr</strong>
      </div>
    </div>
  );
}
