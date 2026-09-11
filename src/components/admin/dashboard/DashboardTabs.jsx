import React from 'react';

const TABS = [
  { id: 'all', label: 'Global / Todos' },
  { id: 'velocidad', label: 'Velocidad' },
  { id: 'resistencia', label: 'Resistencia' },
  { id: 'salto', label: 'Salto' },
  { id: 'lanzamiento', label: 'Lanzamiento' }
];

export const DashboardTabs = ({ activeGroup, onTabChange }) => {
  return (
    <nav className="dashboard-tabs-container">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`tab-button ${activeGroup === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
};

export default DashboardTabs;