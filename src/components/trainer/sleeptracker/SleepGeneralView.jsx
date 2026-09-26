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
  Cell,
} from 'recharts';
import { Users, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import '../../../styles/components/trainer/SleepGeneralView.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="sl-tooltip">
      <p className="sl-tooltip__label">{label || 'Fecha'}</p>
      <p className="sl-tooltip__value">
        Calidad: {payload[0].value}{' '}
        <span className="sl-tooltip__unit">/ 10</span>
      </p>
    </div>
  );
};

export default function SleepGeneralView({
  timeRange,
  setTimeRange,
  dashboardStats = {},
  chartData = [],
}) {
  const timeOptions = [
    { key: 'day', label: 'Día' },
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' },
    { key: 'quarter', label: 'Trimestre' },
    { key: 'semester', label: 'Semestral' },
    { key: 'year', label: 'Anual' },
  ];

  const registeredPct = dashboardStats.registeredPct ?? 0;
  const pieData = [
    { name: 'Completado', value: registeredPct, color: 'var(--clr-verde-500)' },
    {
      name: 'Pendiente',
      value: Math.max(0, 100 - registeredPct),
      color: 'var(--bg-surface)',
    },
  ];

  return (
    <div className="sleep-general-view">
      <div className="sl-scroll-area">
        {/* Filtro temporal */}
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

        {/* KPIs */}
        <div className="sl-kpi-grid">
          <div className="sl-card">
            <div className="sl-kpi-title">
              Universo Actual
              <Users size={20} />
            </div>
            <div className="sl-kpi-value">{dashboardStats.totalAthletes ?? 0}</div>
            <div className="sl-kpi-subtext">Atletas en el grupo seleccionado</div>
          </div>

          <div className="sl-card">
            <div className="sl-kpi-title">
              Calidad Promedio
              <Zap size={20} />
            </div>
            <div className="sl-kpi-value">
              {dashboardStats.avgQualityToday ?? 0}{' '}
              <span className="sl-kpi-value__unit">/10</span>
            </div>
            <div className="sl-kpi-subtext">Promedio en el periodo seleccionado</div>
          </div>

          <div className="sl-card">
            <div className="sl-kpi-title">
              Cumplimiento Hoy
              <CheckCircle2 size={20} />
            </div>
            <div className="sl-kpi-value">
              {dashboardStats.registeredToday ?? 0}{' '}
              <span className="sl-kpi-value__pct">
                ({dashboardStats.registeredPct ?? 0}%)
              </span>
            </div>
            <div className="sl-kpi-subtext">Atletas con registro para hoy</div>
          </div>

          <div className="sl-card sl-card--danger">
            <div className="sl-kpi-title sl-kpi-title--danger">
              Faltan por registrar
              <AlertCircle size={20} />
            </div>
            <div className="sl-kpi-value sl-kpi-value--danger">
              {dashboardStats.pendingToday ?? 0}
            </div>
            <div className="sl-kpi-subtext">Requieren seguimiento hoy</div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="sl-charts-grid">
          <div className="sl-card sl-card--padded">
            <div className="sl-card-header">
              <div className="sl-card-title">Evolución de la calidad del sueño</div>
            </div>
            <div className="sl-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="sleepQualityGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--clr-azul-base)"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--clr-azul-base)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border-main)"
                  />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    ticks={[0, 2, 4, 6, 8, 10]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="quality"
                    stroke="var(--clr-azul-base)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#sleepQualityGradient)"
                    activeDot={{
                      r: 6,
                      fill: 'var(--clr-azul-base)',
                      stroke: 'var(--clr-blanco-pura)',
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="sl-card sl-card--padded">
            <div className="sl-card-header">
              <div className="sl-card-title">Estado de Registros (Hoy)</div>
            </div>
            <div className="sl-chart-container sl-chart-container--relative">
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
              <div className="sl-donut-center">
                <div className="sl-donut-center__value">{registeredPct}%</div>
                <div className="sl-donut-center__label">Completado</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}