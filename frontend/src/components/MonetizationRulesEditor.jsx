import React, { useEffect, useState } from 'react';

const empty = {
  asset_category: '',
  revenue_model: '',
  min_idle_pct: 0,
  expected_yield_per_sqft: 0,
  notes: '',
  active: true,
};

export default function MonetizationRulesEditor() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [err, setErr] = useState('');

  const token = () => localStorage.getItem('token');
  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token()}`,
  });

  const load = () =>
    fetch('/api/custom-views/rules', { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(setRules)
      .catch(e => setErr(e.message));

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      if (editingId) {
        await fetch(`/api/custom-views/rules/${editingId}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(form),
        });
      } else {
        await fetch('/api/custom-views/rules', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(form),
        });
      }
      setForm(empty);
      setEditingId(null);
      load();
    } catch (e) { setErr(e.message); }
  };

  const edit = (r) => {
    setEditingId(r.id);
    setForm({
      asset_category: r.asset_category,
      revenue_model: r.revenue_model,
      min_idle_pct: r.min_idle_pct,
      expected_yield_per_sqft: r.expected_yield_per_sqft,
      notes: r.notes || '',
      active: r.active,
    });
  };

  const remove = async (id) => {
    await fetch(`/api/custom-views/rules/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    load();
  };

  return (
    <div data-testid="rules-editor" style={{ background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h3 style={{ marginTop: 0 }}>Monetization Strategy Rules</h3>
      <p style={{ fontSize: 13, color: '#555' }}>
        Map asset categories to revenue models — drives the recommendation engine
        for underutilized portfolio assets.
      </p>
      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
        <input placeholder="Asset Category" value={form.asset_category}
          onChange={e => setForm({ ...form, asset_category: e.target.value })}
          style={{ padding: 6, border: '1px solid #cbd5e1', borderRadius: 4 }} required />
        <input placeholder="Revenue Model" value={form.revenue_model}
          onChange={e => setForm({ ...form, revenue_model: e.target.value })}
          style={{ padding: 6, border: '1px solid #cbd5e1', borderRadius: 4 }} required />
        <input type="number" placeholder="Min Idle %" value={form.min_idle_pct}
          onChange={e => setForm({ ...form, min_idle_pct: Number(e.target.value) })}
          style={{ padding: 6, border: '1px solid #cbd5e1', borderRadius: 4 }} />
        <input type="number" step="0.1" placeholder="Yield $/sqft" value={form.expected_yield_per_sqft}
          onChange={e => setForm({ ...form, expected_yield_per_sqft: Number(e.target.value) })}
          style={{ padding: 6, border: '1px solid #cbd5e1', borderRadius: 4 }} />
        <input placeholder="Notes" value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          style={{ padding: 6, border: '1px solid #cbd5e1', borderRadius: 4, gridColumn: 'span 2' }} />
        <label style={{ fontSize: 13 }}>
          <input type="checkbox" checked={form.active}
            onChange={e => setForm({ ...form, active: e.target.checked })} /> Active
        </label>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(empty); }}
              style={{ padding: '6px 12px', background: '#e5e7eb', border: 'none', borderRadius: 4 }}>
              Cancel
            </button>
          )}
          <button type="submit"
            style={{ padding: '6px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 4 }}>
            {editingId ? 'Update Rule' : 'Add Rule'}
          </button>
        </div>
      </form>
      {err && <div style={{ color: 'crimson', fontSize: 12, marginBottom: 8 }}>{err}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f1f5f9' }}>
            <th style={{ padding: 6, textAlign: 'left' }}>Category</th>
            <th style={{ padding: 6, textAlign: 'left' }}>Revenue Model</th>
            <th style={{ padding: 6, textAlign: 'right' }}>Min Idle %</th>
            <th style={{ padding: 6, textAlign: 'right' }}>Yield $/sqft</th>
            <th style={{ padding: 6 }}>Active</th>
            <th style={{ padding: 6 }}></th>
          </tr>
        </thead>
        <tbody>
          {rules.map(r => (
            <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: 6 }}>{r.asset_category}</td>
              <td style={{ padding: 6 }}>{r.revenue_model}</td>
              <td style={{ padding: 6, textAlign: 'right' }}>{r.min_idle_pct}</td>
              <td style={{ padding: 6, textAlign: 'right' }}>{r.expected_yield_per_sqft}</td>
              <td style={{ padding: 6, textAlign: 'center' }}>{r.active ? 'Yes' : 'No'}</td>
              <td style={{ padding: 6, textAlign: 'right' }}>
                <button onClick={() => edit(r)}
                  style={{ marginRight: 4, padding: '4px 8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4 }}>
                  Edit
                </button>
                <button onClick={() => remove(r.id)}
                  style={{ padding: '4px 8px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4 }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
