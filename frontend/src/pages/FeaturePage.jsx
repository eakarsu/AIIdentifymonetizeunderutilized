import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { FEATURES } from '../config/features';

function formatValue(value, format) {
  if (value === null || value === undefined) return '—';
  if (format === 'number') return Number(value).toLocaleString();
  if (format === 'percent') return `${value}%`;
  if (format === 'currency') return `$${Number(value).toLocaleString()}`;
  if (format === 'status') {
    const cls = `status-${String(value).toLowerCase().replace(/\s+/g, '-')}`;
    return <span className={`status-badge ${cls}`}>{value}</span>;
  }
  return String(value);
}

function formatAIContent(content) {
  if (!content) return null;
  const sections = content.split(/(?=\d+[\.\)]\s)/).filter(Boolean);

  if (sections.length > 1) {
    return sections.map((section, i) => {
      const lines = section.trim().split('\n');
      const title = lines[0]?.replace(/^\d+[\.\)]\s*/, '').replace(/\*\*/g, '');
      const body = lines.slice(1).join('\n').replace(/\*\*/g, '').replace(/[-•]\s/g, '').trim();
      return (
        <div className="ai-section" key={i}>
          <h5>{title}</h5>
          <p>{body || title}</p>
        </div>
      );
    });
  }

  const paragraphs = content.split('\n\n').filter(Boolean);
  if (paragraphs.length > 1) {
    return paragraphs.map((p, i) => {
      const cleaned = p.replace(/\*\*/g, '').trim();
      if (cleaned.startsWith('-') || cleaned.startsWith('•')) {
        const items = cleaned.split(/\n/).map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean);
        return (
          <div className="ai-section" key={i}>
            {items.map((item, j) => <p key={j}>{item}</p>)}
          </div>
        );
      }
      return <div className="ai-section" key={i}><p>{cleaned}</p></div>;
    });
  }

  return <div className="ai-section"><p>{content.replace(/\*\*/g, '')}</p></div>;
}

export default function FeaturePage() {
  const { featureKey } = useParams();
  const feature = FEATURES[featureKey];

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [showConfirm, setShowConfirm] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadItems = useCallback(async () => {
    if (!feature) return;
    setLoading(true);
    try {
      const data = await api.getAll(feature.apiPath);
      setItems(data);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  }, [feature]);

  useEffect(() => {
    setSelectedItem(null);
    setShowModal(false);
    setAiResult(null);
    loadItems();
  }, [featureKey, loadItems]);

  if (!feature) return <div className="loading-container"><p>Feature not found</p></div>;

  const handleRowClick = async (item) => {
    try {
      const detail = await api.getOne(feature.apiPath, item.id);
      setSelectedItem(detail);
      setAiResult(null);
    } catch (err) {
      setSelectedItem(item);
    }
  };

  const handleNewItem = () => {
    const initial = {};
    feature.fields.forEach((f) => { initial[f.key] = ''; });
    setFormData(initial);
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEditItem = (item) => {
    const data = {};
    feature.fields.forEach((f) => {
      let val = item[f.key];
      if (f.type === 'date' && val) {
        val = val.substring(0, 10);
      }
      data[f.key] = val !== null && val !== undefined ? String(val) : '';
    });
    setFormData(data);
    setEditingItem(item);
    setShowModal(true);
    setSelectedItem(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const submitData = { ...formData };
      feature.fields.forEach((f) => {
        if (f.type === 'number' && submitData[f.key]) {
          submitData[f.key] = Number(submitData[f.key]);
        }
        if (f.key === 'verified' || f.key === 'acknowledged') {
          submitData[f.key] = submitData[f.key] === 'true';
        }
      });

      if (editingItem) {
        await api.update(feature.apiPath, editingItem.id, submitData);
      } else {
        await api.create(feature.apiPath, submitData);
      }
      setShowModal(false);
      await loadItems();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    try {
      await api.delete(feature.apiPath, item.id);
      setShowConfirm(null);
      setSelectedItem(null);
      await loadItems();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleAiAnalyze = async (item) => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const result = await api.aiAnalyze(feature.apiPath, item.id);
      setAiResult(result);
    } catch (err) {
      setAiResult({ error: err.message, content: 'Failed to get AI analysis.' });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{feature.icon} {feature.title}</h2>
          <p>{feature.description}</p>
        </div>
        <button className="btn btn-primary" onClick={handleNewItem}>
          + New {feature.title.replace(/s$/, '')}
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner-lg"></div>
          <p>Loading {feature.title.toLowerCase()}...</p>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                {feature.columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={feature.columns.length} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No items found. Click "New" to create one.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} onClick={() => handleRowClick(item)}>
                    {feature.columns.map((col) => (
                      <td key={col.key}>{formatValue(item[col.key], col.format)}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Panel */}
      {selectedItem && (
        <div className="detail-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedItem(null); }}>
          <div className="detail-panel">
            <div className="detail-header">
              <h3>{selectedItem[feature.detailFields[0]?.key] || 'Details'}</h3>
              <button className="detail-close" onClick={() => setSelectedItem(null)}>&times;</button>
            </div>

            <div className="detail-actions">
              <button className="btn btn-primary btn-sm" onClick={() => handleEditItem(selectedItem)}>
                Edit
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowConfirm(selectedItem)}>
                Delete
              </button>
              <button className="btn btn-ai btn-sm" onClick={() => handleAiAnalyze(selectedItem)}>
                AI Analyze
              </button>
            </div>

            <div className="detail-fields">
              {feature.detailFields.map((df) => (
                <div key={df.key} className={`detail-field ${df.fullWidth ? 'full-width' : ''}`}>
                  <div className="field-label">{df.label}</div>
                  <div className="field-value">
                    {df.key === 'status' || df.key === 'risk_level' || df.key === 'severity'
                      ? formatValue(selectedItem[df.key], 'status')
                      : String(selectedItem[df.key] ?? '—')}
                  </div>
                </div>
              ))}
            </div>

            {/* AI Response */}
            {aiLoading && (
              <div className="ai-response">
                <div className="ai-loading">
                  <div className="spinner"></div>
                  <span>AI is analyzing this data...</span>
                </div>
              </div>
            )}

            {aiResult && !aiLoading && (
              <div className="ai-response">
                <div className="ai-response-header">
                  <div className="ai-icon">AI</div>
                  <h4>AI Analysis</h4>
                  {aiResult.model && <span className="ai-model">{aiResult.model}</span>}
                  {aiResult.fallback && <span className="ai-model">Fallback Mode</span>}
                </div>
                <div className="ai-response-content">
                  {formatAIContent(aiResult.content)}
                </div>
                {aiResult.usage && (
                  <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-dim)', display: 'flex', gap: '16px' }}>
                    <span>Tokens: {aiResult.usage.total_tokens}</span>
                    <span>Prompt: {aiResult.usage.prompt_tokens}</span>
                    <span>Response: {aiResult.usage.completion_tokens}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <h3>{editingItem ? 'Edit' : 'New'} {feature.title.replace(/s$/, '')}</h3>
            <div>
              {feature.fields.map((field) => (
                <div className="form-group" key={field.key}>
                  <label>{field.label}{field.required ? ' *' : ''}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      required={field.required}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    >
                      <option value="">Select...</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      required={field.required}
                      step={field.type === 'number' ? 'any' : undefined}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editingItem ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <h4>Confirm Delete</h4>
            <p>Are you sure you want to delete this item? This action cannot be undone.</p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setShowConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(showConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
