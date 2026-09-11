import React, { useState, useMemo, memo } from 'react';
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
import '../../../styles/components/trainer/SleepIndividualView.css';

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
          {label || 'Registro'}
        </p>
        <p style={{ margin: '4px 0 0 0', fontWeight: 700, color: '#38bdf8', fontSize: '1rem' }}>
          Calidad: {payload[0].value} <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>/ 10</span>
        </p>
      </div>
    );
  }
  return null;
};

const SleepIndividualView = ({
  athletes = [],
  selectedAthleteId,
  setSelectedAthleteId,
  timeRange = 'week',
  setTimeRange,
  getIndividualStats,
  onOpenPanel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const timeOptions = [
    { key: 'day', label: 'Día' },
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' },
    { key: 'quarter', label: 'Trimestre' },
    { key: 'semester', label: 'Semestral' },
    { key: 'year', label: 'Anual' },
  ];

  const filteredAthletes = useMemo(() => {
    return athletes.filter((a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [athletes, searchTerm]);

  const currentAthlete = useMemo(() => {
    return athletes.find((a) => a.id === selectedAthleteId) || athletes[0];
  }, [athletes, selectedAthleteId]);

  const stats = useMemo(() => {
    if (!currentAthlete) return {};
    return getIndividualStats ? getIndividualStats(currentAthlete.id, timeRange) : {};
  }, [currentAthlete, timeRange, getIndividualStats]);

  // Formato para Recharts en el gráfico individual
  const chartData = useMemo(() => {
    const points = stats.linePoints || [7, 8, 6, 9, 7, 8, 8];
    return points.map((val, idx) => ({
      label: `Reg ${idx + 1}`,
      quality: val
    }));
  }, [stats.linePoints]);

  const compliancePct = stats.compliancePct ?? 0;
  const pieData = [
    { name: 'Adherencia', value: compliancePct, color: '#2563eb' },
    { name: 'Faltante', value: Math.max(0, 100 - compliancePct), color: 'rgba(226, 232, 240, 0.3)' }
  ];

  return (
    <div className="sl-scroll-area">
      {/* Selector de Atleta */}
      <div className="sl-card" style={{ marginBottom: '1rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <label style={{ fontSize: '.75rem', color: 'var(--sl-text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              SELECCIONAR ATLETA
            </label>
            <select
              className="sl-select"
              style={{ width: '100%', fontWeight: 600 }}
              value={currentAthlete?.id || ''}
              onChange={(e) => setSelectedAthleteId && setSelectedAthleteId(e.target.value)}
            >
              {filteredAthletes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.area} - {a.subarea})
                </option>
              ))}
            </select>
          </div>

          <div className="sl-search-box" style={{ flex: 1, minWidth: '200px', marginTop: '16px' }}>
            <Icon size={16}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </Icon>
            <input
              className="sl-search-input"
              type="text"
              placeholder="Filtrar lista de atletas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {onOpenPanel && (
            <button
              type="button"
              className="sl-btn sl-btn-primary"
              style={{ marginTop: '16px', whiteSpace: 'nowrap' }}
              onClick={() => currentAthlete && onOpenPanel(currentAthlete)}
              disabled={!currentAthlete}
            >
              Ver panel de detalle
            </button>
          )}
        </div>
      </div>

      {/* Filtros Temporales */}
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
            Promedio Calidad
            <Icon>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </Icon>
          </div>
          <div className="sl-kpi-value">
            {stats.avgQuality ?? 0}{' '}
            <span style={{ fontSize: '1rem', color: 'var(--sl-text-muted)' }}>/10</span>
          </div>
          <div className="sl-kpi-subtext">En el periodo seleccionado</div>
        </div>

        <div className="sl-card">
          <div className="sl-kpi-title">
            Registros Realizados
            <Icon size={20}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </Icon>
          </div>
          <div className="sl-kpi-value">{stats.totalRecords ?? 0}</div>
          <div className="sl-kpi-subtext">Días evaluados</div>
        </div>

        <div className="sl-card">
          <div className="sl-kpi-title">
            Consistencia
            <Icon size={20}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </Icon>
          </div>
          <div className="sl-kpi-value" style={{ color: 'var(--sl-success)' }}>
            {compliancePct}%
          </div>
          <div className="sl-kpi-subtext">Cumplimiento de registro</div>
        </div>

        <div className="sl-card" style={{ borderLeft: stats.registeredToday ? '4px solid var(--sl-success)' : '4px solid var(--sl-danger)' }}>
          <div className="sl-kpi-title" style={{ color: stats.registeredToday ? 'var(--sl-success)' : 'var(--sl-danger)' }}>
            Estado Hoy
            <Icon size={20}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </Icon>
          </div>
          <div className="sl-kpi-value" style={{ fontSize: '1.25rem', color: stats.registeredToday ? 'var(--sl-success)' : 'var(--sl-danger)' }}>
            {stats.registeredToday ? 'Registrado' : 'Sin Registro'}
          </div>
          <div className="sl-kpi-subtext">
            {stats.registeredToday ? `Por: ${stats.todayRegistrar || 'Atleta'}` : 'Requiere atención'}
          </div>
        </div>
      </div>

      {/* Gráficos Recharts */}
      <div className="sl-charts-grid">
        <div className="sl-card" style={{ padding: '1.25rem' }}>
          <div className="sl-card-header" style={{ marginBottom: '1rem' }}>
            <div className="sl-card-title">Evolución de Sueño ({currentAthlete?.name})</div>
          </div>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="indivQualityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.4)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="quality"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#indivQualityGradient)"
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sl-card" style={{ padding: '1.25rem' }}>
          <div className="sl-card-header" style={{ marginBottom: '1rem' }}>
            <div className="sl-card-title">Tasa de Adherencia al Registro</div>
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
                {compliancePct}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Adherencia</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(SleepIndividualView);