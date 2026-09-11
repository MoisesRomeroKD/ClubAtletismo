import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip
} from 'recharts';

const normalizeValue = (
  val,
  min,
  max,
  isInverted = false
) => {
  let normalized = 0;

  if (isInverted) {
    normalized =
      ((min - val) / (min - max)) * 100;
  } else {
    normalized =
      ((val - min) / (max - min)) * 100;
  }

  return Math.max(
    0,
    Math.min(100, normalized)
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) {
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
        {item.label}
      </div>

      <div
        style={{
          color: '#06b6d4'
        }}
      >
        Rendimiento: {item.score.toFixed(1)}%
      </div>

      <div
        style={{
          color: '#94a3b8',
          marginTop: '3px'
        }}
      >
        Valor: {item.rawValue} {item.unit}
      </div>
    </div>
  );
};

export const DashboardRadarChart = ({
  metrics = []
}) => {
  const data = metrics.map((item) => ({
    ...item,
    score: normalizeValue(
      item.rawValue,
      item.min,
      item.max,
      item.isInverted
    )
  }));

  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
    >
      <RadarChart
        data={data}
        outerRadius="72%"
      >
        <PolarGrid
          stroke="#222631"
        />

        <PolarAngleAxis
          dataKey="label"
          tick={{
            fill: '#f8fafc',
            fontSize: 10
          }}
        />

        <PolarRadiusAxis
          domain={[0, 100]}
          tick={{
            fill: '#64748b',
            fontSize: 9
          }}
          tickFormatter={(value) =>
            `${value}%`
          }
          axisLine={false}
        />

        <Radar
          name="Rendimiento"
          dataKey="score"
          stroke="#06b6d4"
          fill="#06b6d4"
          fillOpacity={0.25}
          strokeWidth={2}
          dot={{
            r: 3,
            fill: '#06b6d4'
          }}
        />

        <Tooltip
          content={<CustomTooltip />}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default DashboardRadarChart;