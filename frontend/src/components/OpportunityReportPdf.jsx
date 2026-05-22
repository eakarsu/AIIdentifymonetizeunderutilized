import React, { useState } from 'react';

export default function OpportunityReportPdf() {
  const [status, setStatus] = useState('');

  const handleDownload = async () => {
    setStatus('Generating PDF...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/custom-views/opportunity-report.pdf', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'monetization_opportunity_report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus('PDF downloaded.');
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  return (
    <div data-testid="opportunity-report" style={{ background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h3 style={{ marginTop: 0 }}>Monetization Opportunity Report</h3>
      <p style={{ fontSize: 13, color: '#555' }}>
        Download a portfolio-wide PDF report covering top underutilized assets,
        projected revenue uplift, and recommended next steps.
      </p>
      <button
        onClick={handleDownload}
        style={{
          padding: '8px 14px',
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
        }}
      >
        Download Report (PDF)
      </button>
      {status && <div style={{ marginTop: 8, fontSize: 12 }}>{status}</div>}
    </div>
  );
}
