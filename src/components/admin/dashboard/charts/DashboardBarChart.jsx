import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LabelList
} from 'recharts';

const CustomTooltip = ({
  active,
  payload,
  label
}) => {
  if (
    !active ||
    !payload ||
    !payload.length
  ) {
    return null;
  }

  const value = payload[0]?.value ?? 0;

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
        {label}
      </div>

      <div
        style={{
          color: '#a78bfa',
          fontWeight: 600
        }}
      >
        Asistencia: {value}%
      </div>
    </div>
  );
};

const PercentageLabel = ({
  x,
  y,
  width,
  value
}) => {
  if (
    x === undefined ||
    y === undefined ||
    width === undefined
  ) {
    return null;
  }

  return (
    <text
      x={x + width / 2}
      y={y - 7}
      textAnchor="middle"
      fill="#e2e8f0"
      fontSize={10}
      fontWeight={700}
    >
      {value}%
    </text>
  );
};

export const DashboardBarChart = ({
  labels = [],
  data = []
}) => {
  const chartData = labels.map(
    (label, index) => ({
      name: label,
      value: Number(data[index]) || 0
    })
  );

  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
    >
      <BarChart
        data={chartData}
        margin={{
          top: 25,
          right: 10,
          left: 0,
          bottom: 5
        }}
        barCategoryGap="25%"
      >
        <CartesianGrid
          stroke="#222631"
          vertical={false}
        />

        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{
            fill: '#94a3b8',
            fontSize: 10
          }}
        />

        <YAxis
          domain={[0, 100]}
          ticks={[
            0,
            25,
            50,
            75,
            100
          ]}
          axisLine={false}
          tickLine={false}
          tick={{
            fill: '#94a3b8',
            fontSize: 10
          }}
          tickFormatter={(value) =>
            `${value}%`
          }
        />

        <Tooltip
          cursor={{
            fill: 'rgba(139, 92, 246, 0.08)'
          }}
          content={
            <CustomTooltip />
          }
        />

        <Bar
          dataKey="value"
          fill="#8b5cf6"
          radius={[
            4,
            4,
            0,
            0
          ]}
          animationDuration={700}
        >
          <LabelList
            dataKey="value"
            content={
              <PercentageLabel />
            }
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DashboardBarChart;