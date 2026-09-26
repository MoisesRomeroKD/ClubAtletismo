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
  Cell,
} from 'recharts';
import { Search, Zap, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import '../../../styles/components/trainer/SleepIndividualView.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="sl-tooltip">
      <p className="sl-tooltip__label">{label || 'Registro'}</p>
      <p className="sl-tooltip__value">
        Calidad: {payload[0].value}{' '}
        <span className="sl-tooltip__unit">/ 10</span>
      </p>
    </div>
  );
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

  const filteredAthletes = useMemo(
    () =>
      athletes.filter((a) =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [athletes, searchTerm]
  );

  const currentAthlete = useMemo(
    () => athletes.find((a) => a.id === selectedAthleteId) || athletes[0],
    [athletes, selectedAthleteId]
  );

  const stats = useMemo(() => {
    if (!currentAthlete) return {};
    return getIndividualStats
      ? getIndividualStats(currentAthlete.id, timeRange)
      : {};
  }, [currentAthlete, timeRange, getIndividualStats]);

  const chartData = useMemo(() => {
    const points = stats.linePoints || [7, 8, 6, 9, 7, 8, 8];
    return points.map((val, idx) => ({
      label: `Reg ${idx + 1}`,
      quality: val,
    }));
  }, [stats.linePoints]);

  const compliancePct = stats.compliancePct ?? 0;
  const pieData = [
    { name: 'Adherencia', value: compliancePct, color: 'var(--func-primary)' },
    {
      name: 'Faltante',
      value: Math.max(0, 100 - compliancePct),
      color: 'var(--bg-surface)',
    },
  ];

  return (
    <div className="sleep-individual-view">
      <div className="sl-scroll-area">
        {/* Toolbar unificada: atleta + filtros + búsqueda + botón */}
        <div className="sl-card sl-card--compact">
          <div className="sl-selector-row">
            <div className="sl-selector-row__select">
              <label className="sl-selector-row__label">SELECCIONAR ATLETA</label>
              <select
                className="sl-select sl-select--strong"
                value={currentAthlete?.id || ''}
                onChange={(e) =>
                  setSelectedAthleteId && setSelectedAthleteId(e.target.value)
                }
              >
                {filteredAthletes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.area} - {a.subarea})
                  </option>
                ))}
              </select>
            </div>

            <div className="sl-selector-row__filters">
              <label className="sl-selector-row__label">PERIODO</label>
              <div className="sl-time-filter-bar sl-time-filter-bar--inline">
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
            </div>

            <div className="sl-search-box sl-selector-row__search">
              <Search size={16} />
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
                className="sl-btn sl-btn-primary sl-selector-row__btn"
                onClick={() => currentAthlete && onOpenPanel(currentAthlete)}
                disabled={!currentAthlete}
              >
                Ver panel de detalle
              </button>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="sl-kpi-grid">
          <div className="sl-card">
            <div className="sl-kpi-title">
              Promedio Calidad
              <Zap size={20} />
            </div>
            <div className="sl-kpi-value">
              {stats.avgQuality ?? 0}{' '}
              <span className="sl-kpi-value__unit">/10</span>
            </div>
            <div className="sl-kpi-subtext">En el periodo seleccionado</div>
          </div>

          <div className="sl-card">
            <div className="sl-kpi-title">
              Registros Realizados
              <CheckCircle2 size={20} />
            </div>
            <div className="sl-kpi-value">{stats.totalRecords ?? 0}</div>
            <div className="sl-kpi-subtext">Días evaluados</div>
          </div>

          <div className="sl-card">
            <div className="sl-kpi-title">
              Consistencia
              <TrendingUp size={20} />
            </div>
            <div className="sl-kpi-value sl-kpi-value--success">
              {compliancePct}%
            </div>
            <div className="sl-kpi-subtext">Cumplimiento de registro</div>
          </div>

          <div
            className={`sl-card ${
              stats.registeredToday ? 'sl-card--success' : 'sl-card--danger'
            }`}
          >
            <div
              className={`sl-kpi-title ${
                stats.registeredToday
                  ? 'sl-kpi-title--success'
                  : 'sl-kpi-title--danger'
              }`}
            >
              Estado Hoy
              <AlertCircle size={20} />
            </div>
            <div
              className={`sl-kpi-value sl-kpi-value--sm ${
                stats.registeredToday
                  ? 'sl-kpi-value--success'
                  : 'sl-kpi-value--danger'
              }`}
            >
              {stats.registeredToday ? 'Registrado' : 'Sin Registro'}
            </div>
            <div className="sl-kpi-subtext">
              {stats.registeredToday
                ? `Por: ${stats.todayRegistrar || 'Atleta'}`
                : 'Requiere atención'}
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="sl-charts-grid">
          <div className="sl-card sl-card--padded">
            <div className="sl-card-header">
              <div className="sl-card-title">
                Evolución de Sueño ({currentAthlete?.name})
              </div>
            </div>
            <div className="sl-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="indivQualityGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--clr-verde-500)"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--clr-verde-500)"
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
                    stroke="var(--clr-verde-500)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#indivQualityGradient)"
                    activeDot={{
                      r: 6,
                      fill: 'var(--clr-verde-500)',
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
              <div className="sl-card-title">Tasa de Adherencia al Registro</div>
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
                <div className="sl-donut-center__value">{compliancePct}%</div>
                <div className="sl-donut-center__label">Adherencia</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(SleepIndividualView);