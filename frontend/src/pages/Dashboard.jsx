import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { FEATURES } from '../config/features';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    buildings: 0,
    detections: 0,
    communities: 0,
    alerts: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [buildings, detections, communities, alerts] = await Promise.all([
          api.getAll('buildings'),
          api.getAll('capacity-detection'),
          api.getAll('community-needs'),
          api.getAll('alerts'),
        ]);
        setStats({
          buildings: buildings.length,
          detections: detections.length,
          communities: communities.length,
          alerts: alerts.filter((a) => a.status === 'active').length,
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    };
    loadStats();
  }, []);

  const featureKeys = Object.keys(FEATURES);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Energy Grid Stability & Social Equity Overview</p>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-icon">🏢</span>
          <div className="stat-value">{stats.buildings}</div>
          <div className="stat-label">Buildings Monitored</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🎯</span>
          <div className="stat-value">{stats.detections}</div>
          <div className="stat-label">Capacity Detections</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🏘️</span>
          <div className="stat-value">{stats.communities}</div>
          <div className="stat-label">Communities Assessed</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🚨</span>
          <div className="stat-value">{stats.alerts}</div>
          <div className="stat-label">Active Alerts</div>
        </div>
      </div>

      <div className="feature-grid">
        {featureKeys.map((key) => {
          const feature = FEATURES[key];
          return (
            <div
              key={key}
              className="feature-card"
              onClick={() => navigate(`/feature/${key}`)}
            >
              <span className={`card-badge badge-${feature.badge}`}>
                {feature.badge}
              </span>
              <div className="card-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
