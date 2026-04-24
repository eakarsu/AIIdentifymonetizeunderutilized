import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FEATURES } from '../config/features';

export default function Layout({ user, onLogout, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const sections = [
    { title: 'Core Operations', keys: ['buildings', 'energy-audits', 'capacity-detection', 'aggregation'] },
    { title: 'Grid & Demand', keys: ['grid-stability', 'demand-response', 'capacity-forecast'] },
    { title: 'Social Equity', keys: ['community-needs', 'equity-scores', 'redistribution'] },
    { title: 'Analytics & Reports', keys: ['impact-reports', 'energy-savings', 'alerts'] },
    { title: 'Management', keys: ['compliance', 'partners'] },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <h1>EnergyGrid Pro</h1>
          <p>Grid Stability & Equity</p>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <button
              className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
              onClick={() => navigate('/')}
            >
              <span className="nav-icon">📊</span>
              Dashboard
            </button>
          </div>

          {sections.map((section) => (
            <div className="nav-section" key={section.title}>
              <div className="nav-section-title">{section.title}</div>
              {section.keys.map((key) => {
                const f = FEATURES[key];
                if (!f) return null;
                return (
                  <button
                    key={key}
                    className={`nav-item ${location.pathname === `/feature/${key}` ? 'active' : ''}`}
                    onClick={() => navigate(`/feature/${key}`)}
                  >
                    <span className="nav-icon">{f.icon}</span>
                    {f.title}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user.name?.charAt(0) || 'U'}</div>
            <div className="user-details">
              <div className="name">{user.name}</div>
              <div className="role">{user.role}</div>
            </div>
            <button className="logout-btn" onClick={onLogout} title="Logout">
              &#x2197;
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
