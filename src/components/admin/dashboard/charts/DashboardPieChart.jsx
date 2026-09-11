import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

const CustomTooltip = ({
  active,
  payload
}) => {
  if (
    !active ||
    !payload ||
    !payload.length
  ) {
    return null;
  }

  const item = payload[0]?.payload;

  if (!item) {
    return null;
  }

  return (
    <div
      style={{
        background: '#13151a',
        border: '1px solid #2b303b',
        borderRadius: '8px',
        padding: '10px 12px',
        boxShadow:
          '0 8px 24px rgba(0, 0, 0, 0.35)',
        color: '#f8fafc',
        fontSize: '12px'
      }}
    >
      <div
        style={{
          fontWeight: 600,
          marginBottom: '5px'
        }}
      >
        {item.name}
      </div>

      <div>
        Atletas:{' '}
        <strong>
          {item.value}
        </strong>
      </div>

      <div
        style={{
          color: '#94a3b8',
          marginTop: '3px'
        }}
      >
        Porcentaje:{' '}
        <strong>
          {item.percentage.toFixed(1)}%
        </strong>
      </div>
    </div>
  );
};

const CustomLegend = ({
  payload
}) => {
  if (!payload) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '9px',
        paddingLeft: '10px'
      }}
    >
      {payload.map(
        (entry, index) => {
          const item =
            entry.payload;

          return (
            <div
              key={`legend-${index}`}
              style={{
                display: 'flex',
                alignItems:
                  'center',
                gap: '8px',
                fontSize: '11px'
              }}
            >
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '3px',
                  background:
                    entry.color,
                  display: 'inline-block',
                  flexShrink: 0
                }}
              />

              <div>
                <div
                  style={{
                    color: '#f8fafc'
                  }}
                >
                  {item.name}
                </div>

                <div
                  style={{
                    color: '#64748b',
                    marginTop: '2px'
                  }}
                >
                  {item.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          );
        }
      )}
    </div>
  );
};

export const DashboardPieChart = ({
  labels = [],
  data = [],
  colors = []
}) => {
  const total = data.reduce(
    (sum, value) =>
      sum + (Number(value) || 0),
    0
  );

  const chartData = labels.map(
    (label, index) => {
      const value =
        Number(data[index]) || 0;

      return {
        name: label,
        value,
        percentage:
          total > 0
            ? (value / total) * 100
            : 0,
        color:
          colors[index] ||
          '#8b5cf6'
      };
    }
  );

  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
    >
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="38%"
          cy="50%"
          innerRadius="55%"
          outerRadius="78%"
          paddingAngle={2}
          stroke="#13151a"
          strokeWidth={2}
          animationDuration={700}
        >
          {chartData.map(
            (entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
              />
            )
          )}
        </Pie>

        <Tooltip
          content={
            <CustomTooltip />
          }
        />

        <Legend
          verticalAlign="middle"
          align="right"
          layout="vertical"
          content={
            <CustomLegend />
          }
        />

        {/* Centro del donut */}
        <text
          x="38%"
          y="47%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#f8fafc"
          fontSize={24}
          fontWeight={700}
        >
          {total}
        </text>

        <text
          x="38%"
          y="57%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#64748b"
          fontSize={10}
        >
          Atletas
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
};

export default DashboardPieChart;