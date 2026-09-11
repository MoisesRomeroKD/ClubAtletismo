import React from 'react';

export const ChartCard = ({
  title,
  size = 'sm',
  actions = null,
  children
}) => {
  const isLarge = size === 'lg';

  return (
    <div
      className={`card ${
        isLarge ? 'chart-card-lg' : 'chart-card-sm'
      }`}
    >
      <div className="card-header">
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