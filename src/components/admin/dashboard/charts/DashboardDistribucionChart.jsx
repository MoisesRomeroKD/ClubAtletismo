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

// Cantidad de atletas por área (o por subárea dentro de un área), en barras.
const TooltipDistribucion = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-main)',
        borderRadius: '8px',
        padding: '10px 12px',
        boxShadow: 'var(--shadow-card)',
        color: 'var(--text-main)',
        fontSize: '12px'
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: '5px' }}>{label}</div>
      <div style={{ color: 'var(--func-primary)', fontWeight: 600 }}>
        {value} atleta{value === 1 ? '' : 's'}
      </div>
    </div>
  );
};

export const DashboardDistribucionChart = ({ labels = [], data = [] }) => {
  const chartData = labels.map((label, index) => ({
    name: label,
    value: Number(data[index]) || 0
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 25, right: 10, left: 0, bottom: 5 }} barCategoryGap="25%">
        <CartesianGrid stroke="var(--border-main)" vertical={false} />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          interval={0}
          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
        />
        <Tooltip content={<TooltipDistribucion />} cursor={{ fill: 'var(--bg-surface)' }} />
        <Bar dataKey="value" fill="var(--func-primary)" radius={[4, 4, 0, 0]} maxBarSize={48}>
          <LabelList dataKey="value" position="top" fill="var(--text-main)" fontSize={10} fontWeight={700} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DashboardDistribucionChart;
