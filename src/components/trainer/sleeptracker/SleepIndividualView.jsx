import React, { useState, useMemo, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
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
import { Search, Zap, CheckCircle2, TrendingUp, AlertCircle, CalendarDays, SlidersHorizontal, X } from 'lucide-react';
import UserService from '../../../api/services/Userservice';
import '../../../styles/components/trainer/SleepModuleTheme.css';
import '../../../styles/components/trainer/SleepIndividualView.css';

// Búsqueda de personas: cédula (con o sin V/E, puntos o guiones) o nombre completo en cualquier orden,
// sin importar mayúsculas ni acentos ("moises romero" encuentra "Moisés Arturo Romero").
const normalizarTexto = (valor) => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const coincidePersona = (texto, nombre, cedula) => {
  const buscado = String(texto || '').trim();
  if (!buscado) return true;
  const digitos = buscado.replace(/[\s.\-_]/g, '').replace(/^[vVeE]/, '');
  if (/^\d+$/.test(digitos)) return String(cedula || '').replace(/\D/g, '').includes(digitos);
  const nombreNormalizado = normalizarTexto(nombre);
  return normalizarTexto(buscado).split(/\s+/).every((palabra) => nombreNormalizado.includes(palabra));
};

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
  adminMode = false,
  sleepRecords = [],
  systemDate = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  // En celular los filtros van en el panel del botón flotante "Filtros" (mismo diseño que Reportes).
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [adminCedula, setAdminCedula] = useState('');
  const [adminAthlete, setAdminAthlete] = useState(null);
  const [athleteSearchMessage, setAthleteSearchMessage] = useState('');
  const [dateRangeMessage, setDateRangeMessage] = useState('');
  const [rangeRecords, setRangeRecords] = useState([]);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [rangeLoadError, setRangeLoadError] = useState('');
  const [rangeStart, setRangeStart] = useState(() => (
    systemDate ? `${systemDate.slice(0, 7)}-01` : ''
  ));
  const [rangeEnd, setRangeEnd] = useState(systemDate);
  const [appliedDateRange, setAppliedDateRange] = useState(() => ({
    start: systemDate ? `${systemDate.slice(0, 7)}-01` : '',
    end: systemDate,
  }));

  useEffect(() => {
    if (!adminMode) return undefined;
    if (
      !adminAthlete
      || !appliedDateRange.start
      || !appliedDateRange.end
      || appliedDateRange.start > appliedDateRange.end
    ) {
      setRangeRecords([]);
      setRangeLoading(false);
      return undefined;
    }

    let active = true;
    setRangeRecords([]);
    setRangeLoading(true);
    setRangeLoadError('');

    const loadRecords = async () => {
      const records = [];
      let page = 1;
      let hasNext = true;

      while (hasNext) {
        const response = await UserService.getAdminSleepDashboard({
          athlete_id: adminAthlete.id,
          start_date: appliedDateRange.start,
          end_date: appliedDateRange.end,
          page,
          page_size: 100,
        });
        if (response.status !== 'success' || !response.history?.pagination) {
          throw new Error('No se pudieron consultar los registros de sueño del período.');
        }

        records.push(...(response.history.results || []).map((record) => ({
          id: record.id,
          athleteId: record.athleteId,
          date: record.date,
          quality: Number(record.quality),
          registrarName: record.registrarName || 'Sistema',
        })));
        hasNext = response.history.pagination.has_next;
        page = response.history.pagination.page + 1;
      }

      if (active) setRangeRecords(records);
    };

    loadRecords()
      .catch((error) => {
        if (active) {
          setRangeLoadError(
            error.response?.data?.detail
              || error.response?.data?.message
              || error.message
          );
        }
      })
      .finally(() => {
        if (active) setRangeLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    adminMode,
    adminAthlete?.id,
    appliedDateRange.start,
    appliedDateRange.end,
    sleepRecords,
  ]);

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
      athletes.filter((a) => coincidePersona(searchTerm, a.name, a.cedula)),
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
    const points = stats.linePoints || [];
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

  if (adminMode) {
    const searchAdminAthlete = (event) => {
      event.preventDefault();
      const texto = adminCedula.trim();
      if (!texto) {
        setAdminAthlete(null);
        setAthleteSearchMessage('Ingrese la cédula o el nombre del atleta.');
        return;
      }

      // Cédula (con o sin V) o nombre completo. Una cédula escrita completa gana sobre las parecidas.
      const digitos = texto.replace(/[\s.\-_]/g, '').replace(/^[vVeE]/, '');
      const exacto = /^\d+$/.test(digitos)
        ? athletes.find((candidate) => String(candidate.cedula || '').replace(/\D/g, '') === digitos)
        : null;
      const coincidencias = exacto ? [exacto] : athletes.filter((candidate) => coincidePersona(texto, candidate.name, candidate.cedula));
      if (!coincidencias.length) {
        setAdminAthlete(null);
        setAthleteSearchMessage('No se encontró ningún atleta con esa cédula o nombre.');
        return;
      }
      if (coincidencias.length > 1) {
        setAdminAthlete(null);
        setAthleteSearchMessage(`Hay ${coincidencias.length} atletas que coinciden: escriba el nombre completo o la cédula.`);
        return;
      }
      const athlete = coincidencias[0];

      setAdminAthlete(athlete);
      setAthleteSearchMessage('');
      setDateRangeMessage('');
      setAppliedDateRange({ start: rangeStart, end: rangeEnd });
    };

    const consultDateRange = (event) => {
      event.preventDefault();
      if (!rangeStart || !rangeEnd) {
        setDateRangeMessage('Selecciona las fechas Desde y Hasta para consultar.');
        return;
      }
      if (rangeStart > rangeEnd) {
        setDateRangeMessage('La fecha Desde no puede ser posterior a Hasta.');
        return;
      }
      setDateRangeMessage('');
      setAppliedDateRange({ start: rangeStart, end: rangeEnd });
    };

    const athleteRecords = adminAthlete
      ? rangeRecords
        .filter((record) => (
          record.athleteId === adminAthlete.id
          && record.date >= appliedDateRange.start
          && record.date <= appliedDateRange.end
        ))
        .sort((first, second) => first.date.localeCompare(second.date))
      : [];
    const latestRecord = athleteRecords[athleteRecords.length - 1];
    const qualityAverage = athleteRecords.length
      ? Math.round(
        (athleteRecords.reduce((sum, record) => sum + record.quality, 0) / athleteRecords.length) * 10
      ) / 10
      : null;
    const rangeDays = appliedDateRange.start && appliedDateRange.end
      ? Math.floor(
        (Date.parse(`${appliedDateRange.end}T00:00:00Z`)
          - Date.parse(`${appliedDateRange.start}T00:00:00Z`)) / 86400000
      ) + 1
      : 0;
    const consistency = rangeDays > 0
      ? Math.min(Math.round((new Set(athleteRecords.map((record) => record.date)).size / rangeDays) * 100), 100)
      : 0;
    const todayRecord = adminAthlete && sleepRecords.find(
      (record) => record.athleteId === adminAthlete.id && record.date === systemDate
    );
    const adminChartData = athleteRecords.map((record) => ({
      label: record.date,
      quality: record.quality,
    }));
    const formatDate = (value) => {
      if (!value) return 'No disponible';
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString('es-VE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    };
    const profileSubareas = adminAthlete?.subareas?.length
      ? adminAthlete.subareas.join(', ')
      : 'No disponible';
    const profileArea = adminAthlete?.area || 'No disponible';
    const profileCategory = adminAthlete?.category || 'No disponible';

    return (
      <div className="sleep-individual-view sleep-individual-view--admin">
        <div className="sl-scroll-area">
          <header className="sl-individual-admin__heading">
            <span className="admin-sleep-dashboard__eyebrow">CONSULTA INDIVIDUAL</span>
            <h2>Detalle de sueño del atleta</h2>
            <p>Consulta los registros reales de descanso y su evolución en el tiempo.</p>
          </header>

          <section className="sl-card sl-individual-admin__search-card" aria-labelledby="admin-sleep-athlete-search">
            <div className="sl-individual-admin__section-heading">
              <div className="sl-individual-admin__section-icon"><Search size={18} /></div>
              <div>
                <h3 id="admin-sleep-athlete-search">Buscar atleta</h3>
                <p>Escribe o pega la cédula para consultar su información.</p>
              </div>
            </div>
            <form className="sl-individual-admin__search-form" onSubmit={searchAdminAthlete}>
              <label className="sl-individual-admin__field">
                <span>Cédula o nombre del atleta</span>
                <input
                  type="search"
                  value={adminCedula}
                  onChange={(event) => {
                    setAdminCedula(event.target.value);
                    setAthleteSearchMessage('');
                  }}
                  placeholder="Ej.: 12345678 o Ana Pérez"
                  autoComplete="off"
                />
              </label>
              <button className="sl-btn sl-btn-primary" type="submit">
                <Search size={16} />
                Buscar atleta
              </button>
            </form>
            {athleteSearchMessage && (
              <p className="sl-individual-admin__message sl-individual-admin__message--error" role="alert">
                {athleteSearchMessage}
              </p>
            )}
          </section>

          {adminAthlete && (
            <>
              <section className="sl-card sl-individual-admin__profile" aria-labelledby="admin-sleep-athlete-name">
                <div className="sl-individual-admin__profile-main">
                  <div className="sl-individual-admin__avatar">
                    {adminAthlete.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <span className="sl-individual-admin__eyebrow">DETALLE DE SUEÑO DEL ATLETA</span>
                    <h3 id="admin-sleep-athlete-name">{adminAthlete.name || 'No disponible'}</h3>
                    <span className="sl-individual-admin__cedula">Cédula: {adminAthlete.cedula || 'No disponible'}</span>
                  </div>
                </div>
                <div className="sl-individual-admin__profile-data">
                  <div><span>Área</span><strong>{profileArea}</strong></div>
                  <div><span>Subárea</span><strong>{profileSubareas}</strong></div>
                  <div><span>Categoría</span><strong>{profileCategory}</strong></div>
                </div>
              </section>

              <section className="sl-card sl-individual-admin__range-card" aria-labelledby="admin-sleep-range-heading">
                <div className="sl-individual-admin__section-heading">
                  <div className="sl-individual-admin__section-icon"><CalendarDays size={18} /></div>
                  <div>
                    <h3 id="admin-sleep-range-heading">Rango de fechas</h3>
                    <p>Selecciona el período para actualizar el resumen, el gráfico y el historial.</p>
                  </div>
                </div>
                <form className="sl-individual-admin__range-form" onSubmit={consultDateRange}>
                  <label className="sl-individual-admin__field">
                    <span>Desde</span>
                    <input
                      type="date"
                      value={rangeStart}
                      max={rangeEnd || undefined}
                      onChange={(event) => {
                        setRangeStart(event.target.value);
                        setDateRangeMessage('');
                      }}
                    />
                  </label>
                  <label className="sl-individual-admin__field">
                    <span>Hasta</span>
                    <input
                      type="date"
                      value={rangeEnd}
                      min={rangeStart || undefined}
                      onChange={(event) => {
                        setRangeEnd(event.target.value);
                        setDateRangeMessage('');
                      }}
                    />
                  </label>
                  <button className="sl-btn sl-btn-primary" type="submit">Consultar</button>
                </form>
                {dateRangeMessage && (
                  <p className="sl-individual-admin__message sl-individual-admin__message--error" role="alert">
                    {dateRangeMessage}
                  </p>
                )}
                {rangeLoadError && (
                  <p className="sl-individual-admin__message sl-individual-admin__message--error" role="alert">
                    {rangeLoadError}
                  </p>
                )}
              </section>

              <div className="sl-kpi-grid sl-individual-admin__summary">
                <div className="sl-card">
                  <div className="sl-kpi-title">Promedio de sueño <Zap size={18} /></div>
                  <div className="sl-kpi-value">
                    {qualityAverage === null ? 'Sin registro' : <>{qualityAverage}<span className="sl-kpi-value__unit"> / 10</span></>}
                  </div>
                  <div className="sl-kpi-subtext">Calidad registrada en el período</div>
                </div>
                <div className="sl-card">
                  <div className="sl-kpi-title">Registros realizados <CheckCircle2 size={18} /></div>
                  <div className="sl-kpi-value">{athleteRecords.length}</div>
                  <div className="sl-kpi-subtext">Registros reales en el rango</div>
                </div>
                <div className="sl-card">
                  <div className="sl-kpi-title">Consistencia <TrendingUp size={18} /></div>
                  <div className="sl-kpi-value">{consistency}%</div>
                  <div className="sl-kpi-subtext">Días registrados del período</div>
                </div>
                <div className={`sl-card ${todayRecord ? 'sl-card--success' : 'sl-card--danger'}`}>
                  <div className={`sl-kpi-title ${todayRecord ? 'sl-kpi-title--success' : 'sl-kpi-title--danger'}`}>
                    Estado actual <AlertCircle size={18} />
                  </div>
                  <div className={`sl-kpi-value sl-kpi-value--sm ${todayRecord ? 'sl-kpi-value--success' : 'sl-kpi-value--danger'}`}>
                    {todayRecord ? 'Registrado' : 'Sin registro'}
                  </div>
                  <div className="sl-kpi-subtext">{formatDate(systemDate)}</div>
                </div>
              </div>

              <section className="sl-card sl-card--padded sl-individual-admin__chart" aria-labelledby="admin-sleep-chart-heading">
                <div className="sl-card-header">
                  <div>
                    <h3 className="sl-card-title" id="admin-sleep-chart-heading">Evolución del sueño</h3>
                    <p className="sl-individual-admin__subtext">{adminAthlete.name} · {formatDate(appliedDateRange.start)} – {formatDate(appliedDateRange.end)}</p>
                  </div>
                </div>
                {rangeLoading ? (
                  <div className="sl-individual-admin__empty" role="status">Consultando registros de sueño...</div>
                ) : rangeLoadError ? (
                  <div className="sl-individual-admin__empty sl-individual-admin__message--error" role="alert">
                    No se pudo cargar la evolución para este período.
                  </div>
                ) : adminChartData.length ? (
                  <div className="sl-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={adminChartData} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="adminSleepQualityGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--func-primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--func-primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" />
                        <XAxis dataKey="label" tickFormatter={formatDate} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                        <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="quality" stroke="var(--func-primary)" strokeWidth={3} fill="url(#adminSleepQualityGradient)" activeDot={{ r: 5 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="sl-individual-admin__empty">Sin registros de sueño en el período seleccionado.</div>
                )}
              </section>

              <section className="sl-card sl-card--padded sl-individual-admin__latest" aria-labelledby="admin-sleep-latest-heading">
                <div className="sl-card-header">
                  <div>
                    <h3 className="sl-card-title" id="admin-sleep-latest-heading">Detalle del último registro</h3>
                    <p className="sl-individual-admin__subtext">Información disponible en el registro más reciente del período.</p>
                  </div>
                </div>
                <div className="sl-individual-admin__detail-grid">
                  <div><span>Fecha</span><strong>{formatDate(latestRecord?.date)}</strong></div>
                  <div><span>Hora de descanso</span><strong>No disponible</strong></div>
                  <div><span>Hora de despertar</span><strong>No disponible</strong></div>
                  <div><span>Duración</span><strong>No disponible</strong></div>
                  <div><span>Calidad del sueño</span><strong>{latestRecord ? `${latestRecord.quality}/10` : 'No disponible'}</strong></div>
                  <div><span>Observaciones</span><strong>No disponible</strong></div>
                </div>
              </section>

              <section className="sl-card sl-card--padded sl-individual-admin__history" aria-labelledby="admin-sleep-history-heading">
                <div className="sl-card-header">
                  <div>
                    <h3 className="sl-card-title" id="admin-sleep-history-heading">Historial de registros</h3>
                    <p className="sl-individual-admin__subtext">{athleteRecords.length} registros en el rango seleccionado</p>
                  </div>
                </div>
                <div className="sl-individual-admin__table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Hora de descanso</th>
                        <th>Hora de despertar</th>
                        <th>Duración</th>
                        <th>Calidad</th>
                        <th>Observaciones</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rangeLoading ? (
                        <tr><td colSpan="7" className="sl-individual-admin__table-empty">Consultando registros de sueño...</td></tr>
                      ) : rangeLoadError ? (
                        <tr><td colSpan="7" className="sl-individual-admin__table-empty">No se pudo cargar el historial para este período.</td></tr>
                      ) : athleteRecords.length ? athleteRecords.slice().reverse().map((record) => (
                        <tr key={record.id}>
                          <td>{formatDate(record.date)}</td>
                          <td>No disponible</td>
                          <td>No disponible</td>
                          <td>No disponible</td>
                          <td><span className="sl-individual-admin__quality">{record.quality}/10</span></td>
                          <td>No disponible</td>
                          <td>—</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="7" className="sl-individual-admin__table-empty">
                            Sin registros de sueño en el período seleccionado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    );
  }

  // Filtros: se pintan en la barra (monitores) y en el panel "Filtros" (celular).
  const controlesFiltro1 = (
    <>
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
                placeholder="Filtrar por cédula o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
    </>
  );

  return (
    <div className="sleep-individual-view">
      <div className="sl-scroll-area">
        {/* Toolbar unificada: atleta + filtros + búsqueda + botón */}
        <div className="sl-card sl-card--compact">
          <div className="sl-selector-row">
            <button type="button" className="filtros-fab" onClick={() => setFiltrosAbiertos(true)}>
              <SlidersHorizontal size={18} aria-hidden="true" />Filtros
            </button>
            {filtrosAbiertos && createPortal(
              <div className="filtros-sheet" role="dialog" aria-modal="true" aria-label="Filtros">
                <header className="filtros-sheet__header">
                  <h2>Filtros</h2>
                  <button type="button" className="filtros-sheet__cerrar" onClick={() => setFiltrosAbiertos(false)} aria-label="Cerrar filtros">
                    <X size={18} />
                  </button>
                </header>
                <div className="filtros-sheet__body">
                  {controlesFiltro1}
                </div>
                <footer className="filtros-sheet__footer">
                  <button type="button" className="filtros-sheet__btn" onClick={() => setFiltrosAbiertos(false)}>Cerrar</button>
                  <button type="button" className="filtros-sheet__btn filtros-sheet__btn--primario" onClick={() => setFiltrosAbiertos(false)}>Aplicar filtros</button>
                </footer>
              </div>,
              document.body,
            )}
            <div className="filtros-escritorio">{controlesFiltro1}</div>

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