import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  Users, 
  Timer, 
  Moon, 
  Settings, 
  ChevronRight, 
  ArrowLeft, 
  Search 
} from 'lucide-react';
import '../../../styles/components/admin/sleep/SleepQualityDashboard.css';

const HIERARCHY = {
  'Velocidad': ['100m', '200m', '400m', 'Relevos'],
  'Fondos': ['800m', '1500m', '5000m', 'Maratón'],
  'Saltos': ['Salto largo', 'Salto alto', 'Triple salto', 'Pértiga'],
  'Lanzamientos': ['Bala', 'Disco', 'Jabalina', 'Martillo']
};

const PERIODS = {
  'today': 0,
  '7days': 6,
  '30days': 29,
  'quarter': 89,
  'semester': 179,
  'year': 364
};

const today = new Date('2026-07-30T12:00:00Z');
const formatDate = (date) => date.toISOString().split('T')[0];
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const generateMockData = () => {
  let athleteId = 1;
  const names = ['Juan', 'Pedro', 'Carlos', 'Ana', 'María', 'Laura', 'Luis', 'Jorge', 'Elena', 'Diego'];
  const lastNames = ['Pérez', 'Gómez', 'Rodríguez', 'Martínez', 'López', 'González', 'Sánchez', 'Fernández'];

  const athletes = [];
  const records = [];

  Object.keys(HIERARCHY).forEach(area => {
    HIERARCHY[area].forEach(subarea => {
      const numAthletes = Math.floor(Math.random() * 4) + 2;
      for (let i = 0; i < numAthletes; i++) {
        const name = `${names[Math.floor(Math.random() * names.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
        athletes.push({ id: athleteId++, name, area, subarea });
      }
    });
  });

  const startDate = addDays(today, -365);
  athletes.forEach(athlete => {
    const complianceRate = Math.random() > 0.3 ? 0.9 : (Math.random() > 0.5 ? 0.5 : 0.1);
    const baseQuality = (Math.random() * 3) + 6;

    for (let d = new Date(startDate); d <= today; d = addDays(d, 1)) {
      if (Math.random() < complianceRate) {
        const dateStr = formatDate(d);
        let quality = Math.round(baseQuality + (Math.random() * 2 - 1));
        quality = Math.max(1, Math.min(10, quality));
        const registeredBy = Math.random() > 0.2 ? athlete.name : 'Entrenador (Carlos)';

        records.push({
          athleteId: athlete.id,
          date: dateStr,
          quality,
          registeredBy
        });
      }
    }
  });

  return { athletes, records };
};

export default function SleepQualityDashboard() {
  const [db] = useState(() => generateMockData());
  const [view, setView] = useState('dashboard');
  const [period, setPeriod] = useState('30days');
  const [context, setContext] = useState({ level: 'global', name: 'Global', filterValue: null });
  const [filters, setFilters] = useState({ search: '', area: 'all', subarea: 'all', status: 'all' });
  const [selectedAthlete, setSelectedAthlete] = useState(null);

  const lineCanvasRef = useRef(null);
  const donutCanvasRef = useRef(null);

  const periodDates = useMemo(() => {
    const daysToSubtract = PERIODS[period];
    const endStr = formatDate(today);
    const startStr = formatDate(addDays(today, -daysToSubtract));
    return { startStr, endStr, daysCount: daysToSubtract + 1 };
  }, [period]);

  const contextData = useMemo(() => {
    let currentAthletes = db.athletes;
    if (context.level === 'area') {
      currentAthletes = currentAthletes.filter(a => a.area === context.filterValue);
    } else if (context.level === 'subarea') {
      currentAthletes = currentAthletes.filter(a => a.subarea === context.filterValue);
    }

    const athleteIds = new Set(currentAthletes.map(a => a.id));
    const currentRecords = db.records.filter(r => 
      athleteIds.has(r.athleteId) && r.date >= periodDates.startStr && r.date <= periodDates.endStr
    );

    return { currentAthletes, currentRecords };
  }, [db, context, periodDates]);

  const athleteStats = useMemo(() => {
    const { currentAthletes, currentRecords } = contextData;
    const { endStr } = periodDates;

    let filtered = currentAthletes.filter(a => {
      if (filters.search && !a.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (context.level !== 'area' && context.level !== 'subarea' && filters.area !== 'all' && a.area !== filters.area) return false;
      if (context.level !== 'subarea' && filters.subarea !== 'all' && a.subarea !== filters.subarea) return false;
      return true;
    });

    const stats = filtered.map(a => {
      const aRecords = currentRecords.filter(r => r.athleteId === a.id);
      const recordToday = aRecords.find(r => r.date === endStr);
      let avg = aRecords.length > 0 ? aRecords.reduce((s, r) => s + r.quality, 0) / aRecords.length : null;

      return {
        ...a,
        recordsCount: aRecords.length,
        avgQuality: avg,
        status: recordToday ? 'registered' : 'missing',
        lastRecord: recordToday ? recordToday : (aRecords.length > 0 ? aRecords[aRecords.length - 1] : null)
      };
    });

    if (filters.status === 'registered') return stats.filter(s => s.status === 'registered');
    if (filters.status === 'missing') return stats.filter(s => s.status === 'missing');
    return stats;
  }, [contextData, filters, periodDates, context.level]);

  const kpis = useMemo(() => {
    const { currentAthletes, currentRecords } = contextData;
    const { endStr } = periodDates;

    const avg = currentRecords.length > 0 
      ? (currentRecords.reduce((acc, curr) => acc + curr.quality, 0) / currentRecords.length).toFixed(1)
      : '-';

    const latestRecords = currentRecords.filter(r => r.date === endStr);
    const countWith = new Set(latestRecords.map(r => r.athleteId)).size;
    const countWithout = currentAthletes.length - countWith;
    const percent = currentAthletes.length > 0 ? Math.round((countWith / currentAthletes.length) * 100) : 0;

    return { total: currentAthletes.length, avg, countWith, countWithout, percent };
  }, [contextData, periodDates]);

  useEffect(() => {
    if (view !== 'dashboard') return;

    const lineCanvas = lineCanvasRef.current;
    if (lineCanvas) {
      const ctx = lineCanvas.getContext('2d');
      const rect = lineCanvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      lineCanvas.width = rect.width * dpr;
      lineCanvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const { currentRecords } = contextData;
      const { startStr, endStr } = periodDates;

      const dailyAverages = [];
      const labels = [];
      let current = new Date(startStr + 'T12:00:00Z');
      const endD = new Date(endStr + 'T12:00:00Z');

      while (current <= endD) {
        const dStr = formatDate(current);
        const dayRecords = currentRecords.filter(r => r.date === dStr);
        const avg = dayRecords.length > 0 ? dayRecords.reduce((acc, r) => acc + r.quality, 0) / dayRecords.length : null;
        dailyAverages.push(avg);
        labels.push(`${current.getDate().toString().padStart(2, '0')}/${(current.getMonth() + 1).toString().padStart(2, '0')}`);
        current = addDays(current, 1);
      }

      ctx.clearRect(0, 0, rect.width, rect.height);
      const padding = { top: 20, right: 20, bottom: 30, left: 30 };
      const chartW = rect.width - padding.left - padding.right;
      const chartH = rect.height - padding.top - padding.bottom;

      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      [0, 2, 4, 6, 8, 10].forEach(val => {
        const y = padding.top + chartH - ((val / 10) * chartH);
        ctx.moveTo(padding.left, y);
        ctx.lineTo(rect.width - padding.right, y);
        ctx.fillStyle = '#9ca3af';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(val, padding.left - 5, y + 3);
      });
      ctx.stroke();

      const xStep = chartW / Math.max(1, labels.length - 1);
      ctx.beginPath();
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 2.5;
      let firstPoint = true;

      dailyAverages.forEach((val, i) => {
        if (val !== null) {
          const x = padding.left + (i * xStep);
          const y = padding.top + chartH - ((val / 10) * chartH);
          if (firstPoint) { ctx.moveTo(x, y); firstPoint = false; } 
          else { ctx.lineTo(x, y); }
        }
      });
      ctx.stroke();
    }

    const donutCanvas = donutCanvasRef.current;
    if (donutCanvas) {
      const ctx = donutCanvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const size = 180;
      donutCanvas.width = size * dpr;
      donutCanvas.height = size * dpr;
      ctx.scale(dpr, dpr);

      const totalExpected = contextData.currentAthletes.length * periodDates.daysCount;
      const rate = totalExpected > 0 ? (contextData.currentRecords.length / totalExpected) : 0;

      const center = size / 2;
      const radius = (size / 2) - 12;
      ctx.clearRect(0, 0, size, size);

      ctx.beginPath();
      ctx.arc(center, center, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 16;
      ctx.stroke();

      if (rate > 0) {
        ctx.beginPath();
        const endAngle = (-0.5 * Math.PI) + (Math.min(rate, 1) * 2 * Math.PI);
        ctx.arc(center, center, radius, -0.5 * Math.PI, endAngle);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 16;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${Math.round(rate * 100)}%`, center, center - 4);
    }
  }, [view, contextData, periodDates]);

  const handleSetContext = (level, value) => {
    setView('dashboard');
    setContext({ level, name: level === 'global' ? 'Global' : value, filterValue: value });
    setFilters({ search: '', area: 'all', subarea: 'all', status: 'all' });
  };

  const handleOpenDetail = (athlete) => {
    setSelectedAthlete(athlete);
    setView('detail');
  };

  return (
    <div className="sleep-dashboard-layout">
     

      {/* Main Content Area */}
      <main className="sleep-main-content">
        {/* Header Sticky */}
        <header className="sleep-header">
          <div>
            <div className="breadcrumb-container">
              <span className="breadcrumb-link" onClick={() => handleSetContext('global')}>Atletismo (Global)</span>
              {context.level !== 'global' && (
                <>
                  <ChevronRight size={14} />
                  <span className="breadcrumb-link" onClick={() => handleSetContext('area', context.level === 'area' ? context.filterValue : db.athletes.find(a => a.subarea === context.filterValue)?.area)}>
                    {context.level === 'area' ? context.filterValue : db.athletes.find(a => a.subarea === context.filterValue)?.area}
                  </span>
                </>
              )}
              {context.level === 'subarea' && (
                <>
                  <ChevronRight size={14} />
                  <span className="breadcrumb-current">{context.filterValue}</span>
                </>
              )}
              {view === 'detail' && selectedAthlete && (
                <>
                  <ChevronRight size={14} />
                  <span className="breadcrumb-current">{selectedAthlete.name}</span>
                </>
              )}
            </div>
            <h1 className="header-title">Calidad del Sueño</h1>
            <p className="header-subtitle">Seguimiento y análisis de la recuperación de los atletas</p>
          </div>

          <div>
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              className="period-select"
            >
              <option value="today">Hoy</option>
              <option value="7days">Últimos 7 días</option>
              <option value="30days">Últimos 30 días</option>
              <option value="quarter">Trimestre</option>
              <option value="semester">Semestre</option>
              <option value="year">Año</option>
            </select>
          </div>
        </header>

        {/* Dashboard View */}
        {view === 'dashboard' ? (
          <div className="dashboard-wrapper">
            {/* KPIs */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <span className="kpi-title">Atletas en contexto</span>
                <div className="kpi-value">{kpis.total}</div>
                <div className="kpi-subtext">{context.name}</div>
              </div>
              <div className="kpi-card">
                <span className="kpi-title">Calidad Promedio</span>
                <div className="kpi-value">{kpis.avg} <span className="kpi-unit">/ 10</span></div>
                <div className="kpi-subtext">Periodo actual</div>
              </div>
              <div className="kpi-card">
                <span className="kpi-title">Con Registro (Hoy)</span>
                <div className="kpi-value success">{kpis.countWith}</div>
                <div className="kpi-subtext success">{kpis.percent}% cumplimiento</div>
              </div>
              <div className="kpi-card">
                <span className="kpi-title">Sin Registro (Hoy)</span>
                <div className="kpi-value warning">{kpis.countWithout}</div>
                <div className="kpi-subtext">Pendientes de carga</div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="charts-grid">
              <div className="chart-card line-chart-card">
                <div className="chart-header">
                  <h3 className="card-title">Evolución de Calidad Promedio</h3>
                  <span className="badge-period">{period}</span>
                </div>
                <div className="line-canvas-container">
                  <canvas ref={lineCanvasRef} className="canvas-element" />
                </div>
              </div>

              <div className="chart-card donut-chart-card">
                <h3 className="card-title">Estado de Registros</h3>
                <div className="donut-canvas-container">
                  <canvas ref={donutCanvasRef} style={{ width: 180, height: 180 }} />
                </div>
                <div className="chart-legend">
                  <span className="legend-item"><span className="dot emerald"></span> Con Registro</span>
                  <span className="legend-item"><span className="dot gray"></span> Sin Registro</span>
                </div>
              </div>
            </div>

            {/* Data & Table Grid */}
            <div className="data-grid">
              <div className="table-card">
                <h3 className="card-title">Registro Detallado por Atleta</h3>
                
                {/* Filters */}
                <div className="filters-container">
                  <div className="filter-group">
                    <label className="filter-label">Búsqueda</label>
                    <div className="search-input-wrapper">
                      <Search size={14} className="search-icon" />
                      <input 
                        type="text" 
                        placeholder="Buscar atleta..." 
                        value={filters.search}
                        onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                        className="filter-input"
                      />
                    </div>
                  </div>

                  <div className="filter-group">
                    <label className="filter-label">Área</label>
                    <select 
                      disabled={context.level === 'area' || context.level === 'subarea'}
                      value={context.level === 'area' ? context.filterValue : filters.area}
                      onChange={(e) => setFilters(f => ({ ...f, area: e.target.value, subarea: 'all' }))}
                      className="filter-select"
                    >
                      <option value="all">Todas</option>
                      {Object.keys(HIERARCHY).map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>

                  <div className="filter-group">
                    <label className="filter-label">Estado</label>
                    <select 
                      value={filters.status}
                      onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                      className="filter-select"
                    >
                      <option value="all">Todos</option>
                      <option value="registered">Con registro</option>
                      <option value="missing">Sin registro</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Atleta</th>
                        <th>Área / Subárea</th>
                        <th>Calidad Prom.</th>
                        <th>Estado Actual</th>
                        <th>Último Registro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {athleteStats.map((s) => (
                        <tr 
                          key={s.id} 
                          onClick={() => handleOpenDetail(s)}
                          className="table-row-clickable"
                        >
                          <td className="font-medium">{s.name}</td>
                          <td className="text-muted">{s.area} / {s.subarea}</td>
                          <td className="font-bold">{s.avgQuality ? `${s.avgQuality.toFixed(1)} / 10` : '—'}</td>
                          <td>
                            {s.status === 'registered' ? (
                              <span className="status-badge success">Con registro</span>
                            ) : (
                              <span className="status-badge warning">Pendiente hoy</span>
                            )}
                          </td>
                          <td className="text-muted">{s.lastRecord ? s.lastRecord.date : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Missing List */}
              <div className="missing-card">
                <h3 className="card-title text-danger">Atletas sin registro</h3>
                <p className="card-description">Atletas sin ninguna carga registrada durante todo el periodo seleccionado.</p>
                
                <div className="missing-list">
                  {athleteStats.filter(s => s.recordsCount === 0).map(s => (
                    <div 
                      key={s.id} 
                      onClick={() => handleOpenDetail(s)}
                      className="missing-item"
                    >
                      <div className="missing-item-name">{s.name}</div>
                      <div className="missing-item-sub">{s.area} / {s.subarea}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Athlete Detail View */
          <div className="dashboard-wrapper">
            <div className="detail-header">
              <button 
                onClick={() => setView('dashboard')}
                className="btn-back"
              >
                <ArrowLeft size={16} /> Volver al panel
              </button>
              <div className="avatar-circle">
                {selectedAthlete.name.split(' ').map(n=>n[0]).join('').substring(0,2)}
              </div>
              <div>
                <h2 className="detail-title">{selectedAthlete.name}</h2>
                <p className="detail-subtitle">{selectedAthlete.area} / {selectedAthlete.subarea}</p>
              </div>
            </div>

            <div className="detail-card">
              <h3 className="card-title">Historial Reciente</h3>
              <div className="detail-placeholder">
                Aquí se desplegarían las métricas detalladas para {selectedAthlete.name}.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}