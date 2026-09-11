import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Icon } from './Icon';
import '../../../styles/components/trainer/SleepGeneralView.css';

// Tooltip flotante estilizado
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '8px 12px',
        borderRadius: '8px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
      }}>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
          {label || 'Fecha'}
        </p>
        <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#38bdf8', fontSize: '1rem' }}>
          Calidad: {payload[0].value} <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>/ 10</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function SleepGeneralView({
  timeRange,
  setTimeRange,
  dashboardStats = {},
  chartData = [] // Estructura recibida: [{ label: '03 Ago', quality: 8.5 }, ...]
}) {
  const timeOptions = [
    { key: 'day', label: 'Día' },
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' },
    { key: 'quarter', label: 'Trimestre' },
    { key: 'semester', label: 'Semestral' },
    { key: 'year', label: 'Anual' },
  ];

  // Datos para el Donut Chart de Estado de Registros
  const registeredPct = dashboardStats.registeredPct ?? 0;
  const pieData = [
    { name: 'Completado', value: registeredPct, color: '#16a34a' },
    { name: 'Pendiente', value: Math.max(0, 100 - registeredPct), color: 'rgba(226, 232, 240, 0.3)' }
  ];

  return (
    <div className="sl-scroll-area">
      {/* Filtro Temporal */}
      <div className="sl-time-filter-bar">
        {timeOptions.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={`sl-time-btn ${timeRange === opt.key ? 'active' : ''}`}
            onClick={() => setTimeRange && setTimeRange(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="sl-kpi-grid">
        <div className="sl-card">
          <div className="sl-kpi-title">
            Universo Actual
            <Icon>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </Icon>
          </div>
          <div className="sl-kpi-value">{dashboardStats.totalAthletes ?? 0}</div>
          <div className="sl-kpi-subtext">Atletas en el grupo seleccionado</div>
        </div>

        <div className="sl-card">
          <div className="sl-kpi-title">
            Calidad Promedio
            <Icon>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </Icon>
          </div>
          <div className="sl-kpi-value">
            {dashboardStats.avgQualityToday ?? 0}{' '}
            <span style={{ fontSize: '1rem', color: 'var(--sl-text-muted)' }}>/10</span>
          </div>
          <div className="sl-kpi-subtext">Promedio en el periodo seleccionado</div>
        </div>

        <div className="sl-card">
          <div className="sl-kpi-title">
            Cumplimiento Hoy
            <Icon size={20}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </Icon>
          </div>
          <div className="sl-kpi-value">
            {dashboardStats.registeredToday ?? 0}{' '}
            <span style={{ fontSize: '1rem', color: 'var(--sl-success)', fontWeight: 600 }}>
              ({dashboardStats.registeredPct ?? 0}%)
            </span>
          </div>
          <div className="sl-kpi-subtext">Atletas con registro para hoy</div>
        </div>

        <div className="sl-card" style={{ borderLeft: '4px solid var(--sl-danger)' }}>
          <div className="sl-kpi-title" style={{ color: 'var(--sl-danger)' }}>
            Faltan por registrar
            <Icon size={20}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </Icon>
          </div>
          <div className="sl-kpi-value" style={{ color: 'var(--sl-danger)' }}>
            {dashboardStats.pendingToday ?? 0}
          </div>
          <div className="sl-kpi-subtext">Requieren seguimiento hoy</div>
        </div>
      </div>

      {/* Gráficos Recharts */}
      <div className="sl-charts-grid">
        {/* Gráfico de Evolución Temporal */}
        <div className="sl-card" style={{ padding: '1.25rem' }}>
          <div className="sl-card-header" style={{ marginBottom: '1rem' }}>
            <div className="sl-card-title">Evolución de la calidad del sueño</div>
          </div>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="sleepQualityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.4)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="quality"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#sleepQualityGradient)"
                  activeDot={{ r: 6, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart de Estado */}
        <div className="sl-card" style={{ padding: '1.25rem' }}>
          <div className="sl-card-header" style={{ marginBottom: '1rem' }}>
            <div className="sl-card-title">Estado de Registros (Hoy)</div>
          </div>
          <div style={{ width: '100%', height: 250, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none'
              }}
            >
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--sl-text-primary, #0f172a)' }}>
                {registeredPct}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Completado</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}