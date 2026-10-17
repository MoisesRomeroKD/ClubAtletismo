import React from 'react';
import '../../../styles/components/admin/dashboard/DashboardTabs.css';

// Las pestañas salen de las áreas registradas en la BD, más la vista global.
export const DashboardTabs = ({ areas = [], activeGroup, onTabChange }) => {
  const tabs = [{ id: 'all', label: 'Global / Todos' }, ...areas.map((area) => ({ id: String(area.id), label: area.nombre }))];

  return (
    <nav className="dashboard-tabs-container">
      {tabs.map((tab) => (
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
