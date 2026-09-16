import React from 'react';
import '../../../styles/components/admin/dashboard/ChartCard.css';

export const ChartCard = ({
  title,
  size = 'sm',
  actions = null,
  children
}) => {
  const isLarge = size === 'lg';

  return (
    <div
      className={`dashboard-chart-card ${
        isLarge ? 'chart-card-lg' : 'chart-card-sm'
      }`}
    >
      <div className="dashboard-chart-card-header">
        <h3>{title}</h3>

        {actions && (
          <div className="chart-actions">
            {actions}
          </div>
        )}
      </div>

      <div
        className={
          isLarge
            ? 'chart-container'
            : 'chart-container-sm'
        }
      >
        {children}
      </div>
    </div>
  );
};

export default ChartCard;