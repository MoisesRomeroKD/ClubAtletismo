/*
 * TODO (futuro): migrar navegación interna a URLs reales.
 *
 * Estado actual: `currentView` + `selectedAthlete` viven en useState, así
 * que al recargar la página se pierde el contexto (vuelve a la vista global).
 *
 * Plan:
 *   - Los filtros (rango de fechas, area, subarea, categoria) → query params.
 *   - El atleta seleccionado → también query param (más simple que rutas
 *     anidadas: `?area=Velocidad&sub=200m&cat=U20&atleta=25123456`).
 *   - La URL como fuente de verdad (leer de useSearchParams, no de useState
 *     + useEffect espejo), para que refresh / atrás / links compartidos
 *     funcionen sin lógica extra.
 *
 * Ejemplos:
 *   /admin/asistencias
 *   /admin/asistencias?area=Velocidad&sub=200m
 *   /admin/asistencias?area=Velocidad&sub=200m&atleta=25123456
 *
 * La selección del atleta permanece como estado interno de la vista; el botón
 * "Volver a Asistencia" regresa a la vista global del módulo.
 */
import React, { useState, useMemo, useEffect } from 'react';
import UserService from '../../../api/services/Userservice';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import {
  Search, Calendar, Filter, ChevronRight, ArrowLeft, User,
  CheckCircle, XCircle, AlertCircle, Clock, MapPin, Target, Layers,
  AlertTriangle, Info
} from 'lucide-react';
import '../../../styles/components/admin/asistencia/AsistenciaAdminView.css';

// Colores de estado: referencian las variables del theme (definidas en
// AsistenciaAdminView.css), no valores fijos. Así los charts respetan
// automáticamente el modo claro/oscuro sin lógica adicional en JS.
const COLORS = {
  ASISTENCIA: 'var(--status-green)',
  INASISTENCIA: 'var(--status-red)',
  JUSTIFICADA: 'var(--status-blue)',
};

const TOOLTIP_CONTENT_STYLE = {
  borderRadius: 'var(--border-radius-md)',
  border: 'none',
  boxShadow: 'var(--shadow-md)',
  backgroundColor: 'var(--bg-card)',
  color: 'var(--text-primary)',
};

const TOOLTIP_LABEL_STYLE = {
  color: 'var(--text-secondary)',
};

const AREAS_ESTRUCTURA = {
  'Velocidad': ['100 m', '200 m', '400 m'],
  'Saltos': ['Salto largo', 'Salto alto'],
  'Lanzamientos': ['Bala', 'Disco', 'Jabalina', 'Martillo'],
  'Fondos': ['800 m', '1500 m', '5000 m']
};

const CATEGORIAS = ['U16', 'U18', 'U20', 'Senior'];

// Mapeo inverso para búsqueda rápida de Subárea -> Área
const SUBAREA_TO_AREA = Object.entries(AREAS_ESTRUCTURA).reduce((acc, [area, subareas]) => {
  subareas.forEach(sub => acc[sub] = area);
  return acc;
}, {});

const ATHLETES = [
  { id: '25123456', name: 'Carlos Pérez', category: 'U20', subareas: ['100 m', '200 m', 'Salto largo'] },
  { id: '26234567', name: 'María González', category: 'U18', subareas: ['400 m', '800 m'] },
  { id: '24345678', name: 'Luis Rodríguez', category: 'U20', subareas: ['Bala', 'Disco'] },
  { id: '27456789', name: 'Ana Martínez', category: 'U16', subareas: ['100 m', 'Salto alto'] },
  { id: '19876543', name: 'Pedro Sánchez', category: 'Senior', subareas: ['1500 m', '5000 m'] },
  { id: '28111222', name: 'Laura Gómez', category: 'U16', subareas: ['Salto largo', '100 m'] },
  { id: '22333444', name: 'Diego López', category: 'Senior', subareas: ['Jabalina', 'Martillo'] },
  { id: '25666777', name: 'Sofía Díaz', category: 'U20', subareas: ['200 m', '400 m', 'Salto largo'] },
  { id: '21222333', name: 'Miguel Torres', category: 'Senior', subareas: ['100 m', '200 m'] },
  { id: '29888999', name: 'Valentina Ruiz', category: 'U16', subareas: ['Bala'] },
];

const generateSessions = () => {
  const sessions = [];
  const startDate = new Date(2026, 6, 1);
  const endDate = new Date(2026, 7, 31);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0) continue; 
    
    const dateStr = d.toISOString().split('T')[0];
    
    ATHLETES.forEach(athlete => {
      if (Math.random() > 0.6) return; 

      athlete.subareas.forEach(subarea => {
        const rand = Math.random();
        let status = 'ASISTENCIA';
        if (rand > 0.85 && rand <= 0.95) status = 'JUSTIFICADA';
        else if (rand > 0.95) status = 'INASISTENCIA';

        sessions.push({
          id: Math.random().toString(36).substr(2, 9),
          date: dateStr,
          athleteId: athlete.id,
          subarea: subarea,
          area: SUBAREA_TO_AREA[subarea],
          status: status,
          category: athlete.category
        });
      });
    });
  }
  return sessions;
};

const ALL_SESSIONS = generateSessions();

const getMonthBounds = (month) => {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return {
    start: `${month}-01`,
    end: `${month}-${String(lastDay).padStart(2, '0')}`,
  };
};

const latestSessionMonth = ALL_SESSIONS
  .map(session => session.date.slice(0, 7))
  .sort()
  .at(-1) || new Date().toISOString().slice(0, 7);
const initialDateBounds = getMonthBounds(latestSessionMonth);

export default function AsistenciaAdminView() {
  const [currentView, setCurrentView] = useState('global');
  const [selectedAthlete, setSelectedAthlete] = useState(null);

  const [startDate, setStartDate] = useState(initialDateBounds.start);
  const [endDate, setEndDate] = useState(initialDateBounds.end);
  const [areaFilter, setAreaFilter] = useState('Todas');
  const [subareaFilter, setSubareaFilter] = useState('Todas');
  const [categoriaFilter, setCategoriaFilter] = useState('Todas');

  const [searchValue, setSearchValue] = useState('');
  const [searchState, setSearchState] = useState('idle');
  const [searchError, setSearchError] = useState('');

  const sesionesPeriodo = useMemo(() => {
    return ALL_SESSIONS.filter(session => (
      session.date >= startDate && session.date <= endDate
    ));
  }, [startDate, endDate]);

  const sesionesContexto = useMemo(() => {
    return sesionesPeriodo.filter(s => {
      const matchArea = areaFilter === 'Todas' || s.area === areaFilter;
      const matchSubarea = subareaFilter === 'Todas' || s.subarea === subareaFilter;
      const matchCategoria = categoriaFilter === 'Todas' || s.category === categoriaFilter;
      return matchArea && matchSubarea && matchCategoria;
    });
  }, [sesionesPeriodo, areaFilter, subareaFilter, categoriaFilter]);

  const sesionesAtleta = useMemo(() => {
    if (!selectedAthlete) return [];
    return sesionesContexto.filter(s => s.athleteId === selectedAthlete.id);
  }, [sesionesContexto, selectedAthlete]);

  const availableSubareas = useMemo(() => {
    if (areaFilter === 'Todas') return Object.values(AREAS_ESTRUCTURA).flat();
    return AREAS_ESTRUCTURA[areaFilter] || [];
  }, [areaFilter]);

  useEffect(() => {
    if (areaFilter !== 'Todas' && !AREAS_ESTRUCTURA[areaFilter].includes(subareaFilter)) {
      setSubareaFilter('Todas');
    }
  }, [areaFilter, subareaFilter]);

  const handleSearchSelect = async (e) => {
    e.preventDefault();
    const val = searchValue.trim();
    if (!val) {
      setSearchState('error');
      setSearchError('Ingrese la cédula del atleta para realizar la búsqueda.');
      return;
    }

    setSearchState('searching');
    setSearchError('');

    try {
      const result = await UserService.getAttendanceHistoryByCedula(val);
      setSelectedAthlete({
        ...result.atleta,
        isDatabaseAthlete: true,
        attendances: result.asistencias,
      });
      setCurrentView('athlete');
      setSearchState('idle');
    } catch (error) {
      const statusCode = error.response?.status;
      setSearchState(statusCode === 404 ? 'not_found' : 'error');
      setSearchError(
        error.response?.data?.error
        || error.response?.data?.detail
        || 'No se pudo consultar el historial de asistencia.'
      );
    }
  };

  const globalKPIs = useMemo(() => {
    const total = sesionesContexto.length;
    const asistencias = sesionesContexto.filter(s => s.status === 'ASISTENCIA').length;
    const inasistencias = sesionesContexto.filter(s => s.status === 'INASISTENCIA').length;
    const justificadas = sesionesContexto.filter(s => s.status === 'JUSTIFICADA').length;
    
    const sorted = [...sesionesContexto].sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastAsist = sorted.find(s => s.status === 'ASISTENCIA')?.date || '-';
    const lastInasist = sorted.find(s => s.status === 'INASISTENCIA')?.date || '-';

    return {
      total,
      asistencias,
      inasistencias,
      justificadas,
      percAsistencia: total > 0 ? ((asistencias / total) * 100).toFixed(1) : '0.0',
      percInasistencia: total > 0 ? ((inasistencias / total) * 100).toFixed(1) : '0.0',
      lastAsist,
      lastInasist
    };
  }, [sesionesContexto]);

  const chartDataAreas = useMemo(() => {
    const areasToProcess = areaFilter === 'Todas' ? Object.keys(AREAS_ESTRUCTURA) : [areaFilter];
    return areasToProcess.map(area => {
      const sesArea = sesionesContexto.filter(s => s.area === area);
      const total = sesArea.length;
      const asist = sesArea.filter(s => s.status === 'ASISTENCIA').length;
      return {
        name: area,
        asistencia: total > 0 ? Math.round((asist / total) * 100) : 0,
        total: total
      };
    });
  }, [sesionesContexto, areaFilter]);

  const chartDataSubareas = useMemo(() => {
    const subareasToProcess = subareaFilter === 'Todas' ? availableSubareas : [subareaFilter];
    return subareasToProcess.map(sub => {
      const sesSub = sesionesContexto.filter(s => s.subarea === sub);
      const total = sesSub.length;
      const asist = sesSub.filter(s => s.status === 'ASISTENCIA').length;
      return {
        name: sub,
        asistencia: total > 0 ? Math.round((asist / total) * 100) : 0,
        total: total
      };
    }).sort((a, b) => b.asistencia - a.asistencia);
  }, [sesionesContexto, availableSubareas, subareaFilter]);

  const chartDataEvolution = useMemo(() => {
    const weeks = { 'Sem 1': {t:0, a:0}, 'Sem 2': {t:0, a:0}, 'Sem 3': {t:0, a:0}, 'Sem 4': {t:0, a:0}, 'Sem 5': {t:0, a:0} };
    
    sesionesContexto.forEach(s => {
      const day = parseInt(s.date.split('-')[2]);
      const weekNum = Math.ceil(day / 7);
      const weekKey = `Sem ${weekNum}`;
      if(weeks[weekKey]) {
        weeks[weekKey].t++;
        if(s.status === 'ASISTENCIA') weeks[weekKey].a++;
      }
    });

    return Object.keys(weeks).map(w => ({
      name: w,
      'Asistencia %': weeks[w].t > 0 ? Math.round((weeks[w].a / weeks[w].t) * 100) : 0
    })).filter(d => d['Asistencia %'] > 0);
  }, [sesionesContexto]);

  const tableData = useMemo(() => {
    return ATHLETES.map(athlete => {
      const aSessions = sesionesContexto.filter(s => s.athleteId === athlete.id);
      if (aSessions.length === 0 && (areaFilter !== 'Todas' || subareaFilter !== 'Todas')) return null;

      const total = aSessions.length;
      const asist = aSessions.filter(s => s.status === 'ASISTENCIA').length;
      const inasist = aSessions.filter(s => s.status === 'INASISTENCIA').length;
      const justif = aSessions.filter(s => s.status === 'JUSTIFICADA').length;
      
      const sorted = [...aSessions].sort((a, b) => new Date(b.date) - new Date(a.date));
      const lastAsist = sorted.find(s => s.status === 'ASISTENCIA')?.date || '-';
      const lastInasist = sorted.find(s => s.status === 'INASISTENCIA')?.date || '-';

      return {
        ...athlete,
        total,
        asist,
        inasist,
        justif,
        perc: total > 0 ? ((asist / total) * 100).toFixed(1) : 0,
        lastAsist,
        lastInasist
      };
    }).filter(Boolean).sort((a, b) => a.id.localeCompare(b.id));
  }, [sesionesContexto, areaFilter, subareaFilter]);

  const handleAthleteSelect = (athlete) => {
    setSelectedAthlete(athlete);
    setCurrentView('athlete');
  };

  const handleStartDateChange = (value) => {
    setStartDate(value);
    if (value > endDate) setEndDate(value);
  };

  const handleEndDateChange = (value) => {
    setEndDate(value);
    if (value < startDate) setStartDate(value);
  };

  const Card = ({ children, className = '' }) => (
    <div className={`card ${className}`}>
      {children}
    </div>
  );

  const StatusIcon = ({ status, size = 16 }) => {
    if (status === 'ASISTENCIA') return <CheckCircle size={size} color={COLORS.ASISTENCIA} />;
    if (status === 'INASISTENCIA') return <XCircle size={size} color={COLORS.INASISTENCIA} />;
    if (status === 'JUSTIFICADA') return <AlertCircle size={size} color={COLORS.JUSTIFICADA} />;
    return null;
  };

  return (
    <div className="admin-container">

      {/* FILTROS + BUSCADOR */}
      <div className="filters-bar">
        <div className="filters-container">

          <div className="filter-label">
            <Filter size={16} /> Filtros:
          </div>

          <div className="date-range-filter">
            <label className="date-range-filter__field">
              <span>Desde</span>
              <input
                type="date"
                className="filter-select"
                value={startDate}
                required
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
            </label>
            <label className="date-range-filter__field">
              <span>Hasta</span>
              <input
                type="date"
                className="filter-select"
                value={endDate}
                required
                onChange={(e) => handleEndDateChange(e.target.value)}
              />
            </label>
          </div>

          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="filter-select"
          >
            <option value="Todas">Todas las Áreas</option>
            {Object.keys(AREAS_ESTRUCTURA).map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select
            value={subareaFilter}
            onChange={(e) => setSubareaFilter(e.target.value)}
            disabled={areaFilter === 'Todas'}
            className="filter-select"
          >
            <option value="Todas">Todas las Subáreas</option>
            {availableSubareas.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
            className="filter-select"
          >
            <option value="Todas">Todas las Categorías</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

        </div>
      </div>

      <main className="main-content">
        
        {/* ESTADOS VACÍOS GENERALES */}
        {currentView === 'global' && (
          <div className="card overflow-hidden">
            <div className="athlete-list-search">
              <label className="athlete-list-search__label" htmlFor="attendance-athlete-search">
                Buscar historial por cédula
              </label>
              <div className="search-wrapper">
                <form onSubmit={handleSearchSelect} className="search-form">
                  <Search className="search-icon" size={18} />
                  <input
                    id="attendance-athlete-search"
                    type="text"
                    placeholder="Ingrese la cédula del atleta"
                    value={searchValue}
                    onChange={(event) => {
                      setSearchValue(event.target.value);
                      setSearchState('idle');
                      setSearchError('');
                    }}
                    className="search-input"
                  />
                  <button
                    className="search-submit"
                    type="submit"
                    disabled={searchState === 'searching'}
                  >
                    {searchState === 'searching' ? 'Buscando...' : 'Buscar'}
                  </button>
                  {searchState !== 'idle' && searchState !== 'found' && (
                    <div className="search-dropdown" role="status">
                      {searchState === 'searching' ? (
                        <span className="search-status-searching">
                          <div className="spinner"></div> Consultando asistencias...
                        </span>
                      ) : (
                        <span className={searchState === 'not_found' ? 'search-status-error' : 'search-status-warning'}>
                          {searchState === 'not_found' && <AlertTriangle size={14} />}
                          {searchError}
                        </span>
                      )}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}

        {currentView === 'global' && sesionesContexto.length === 0 && (
          <div className="empty-state">
            <Calendar className="empty-icon" size={48} />
            <h3 className="empty-title">No hay sesiones registradas</h3>
            <p className="empty-desc">
              No se encontraron datos para el período y filtros seleccionados. Intenta ampliar el rango de fechas o cambiar los filtros.
            </p>
          </div>
        )}

        {sesionesContexto.length > 0 && currentView === 'global' && (
          <div className="global-view-container animate-fade-in">
            
            {/* KPIs */}
            <div className="kpi-grid">
              <Card className="p-5">
                <div className="kpi-title">TOTAL SESIONES</div>
                <div className="kpi-value">{globalKPIs.total}</div>
                <div className="kpi-subtext">
                   En el período seleccionado
                </div>
              </Card>

              <Card className="p-5">
                <div className="kpi-title flex-between">
                  ASISTENCIAS <span className="kpi-dot green"></span>
                </div>
                <div className="kpi-value-row">
                  <div className="kpi-value">{globalKPIs.asistencias}</div>
                  <div className="badge-green">
                    {globalKPIs.percAsistencia}%
                  </div>
                </div>
                <div className="kpi-subtext">
                   Última: {globalKPIs.lastAsist}
                </div>
              </Card>

              <Card className="p-5">
                <div className="kpi-title flex-between">
                  INASISTENCIAS <span className="kpi-dot red"></span>
                </div>
                <div className="kpi-value-row">
                  <div className="kpi-value">{globalKPIs.inasistencias}</div>
                  <div className="badge-red">
                    {globalKPIs.percInasistencia}%
                  </div>
                </div>
                <div className="kpi-subtext">
                   Última: {globalKPIs.lastInasist}
                </div>
              </Card>

              <Card className="p-5">
                <div className="kpi-title flex-between">
                  JUSTIFICADAS <span className="kpi-dot blue"></span>
                </div>
                <div className="kpi-value">{globalKPIs.justificadas}</div>
                <div className="kpi-subtext-blue">
                   <Info size={12}/> No cuentan como asistencia real
                </div>
              </Card>
            </div>

            {/* CHARTS SECTION */}
            <div className="charts-grid">
              
              {/* Barras por Área */}
              <Card className="p-5">
                <h3 className="section-title">
                  <Target size={18} className="title-icon"/> % Asistencia por Área
                </h3>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataAreas} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-main)" />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} width={100} />
                      <RechartsTooltip 
                        cursor={{fill: 'var(--module-row-hover)'}}
                        contentStyle={TOOLTIP_CONTENT_STYLE}
                        labelStyle={TOOLTIP_LABEL_STYLE}
                        formatter={(value, name, props) => [`${value}%`, 'Asistencia', `(Total sesiones: ${props.payload.total})`]}
                      />
                      <Bar dataKey="asistencia" radius={[0, 4, 4, 0]}>
                        {chartDataAreas.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS.ASISTENCIA} fillOpacity={0.8 + (entry.asistencia/100)*0.2} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Barras por Subárea */}
              <Card className="p-5">
                <h3 className="section-title">
                  <Layers size={18} className="title-icon"/> % Asistencia por Subárea {areaFilter !== 'Todas' ? `(${areaFilter})` : ''}
                </h3>
                <div className="chart-container">
                  {chartDataSubareas.length > 0 ? (
                     <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataSubareas} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-main)" />
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} width={90} />
                        <RechartsTooltip 
                          cursor={{fill: 'var(--module-row-hover)'}}
                          contentStyle={TOOLTIP_CONTENT_STYLE}
                          labelStyle={TOOLTIP_LABEL_STYLE}
                          formatter={(value) => [`${value}%`, 'Asistencia']}
                        />
                        <Bar dataKey="asistencia" fill={COLORS.ASISTENCIA} radius={[0, 4, 4, 0]} opacity={0.7} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-chart">Sin datos para la subárea seleccionada</div>
                  )}
                </div>
              </Card>
            </div>

            {/* Evolución Temporal */}
            <Card className="p-5">
              <h3 className="section-title">
                <Clock size={18} className="title-icon"/> Evolución Temporal
              </h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDataEvolution} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-main)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12, dy: 10}} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} tickFormatter={(val) => `${val}%`} />
                    <RechartsTooltip 
                        contentStyle={TOOLTIP_CONTENT_STYLE}
                        labelStyle={TOOLTIP_LABEL_STYLE}
                        formatter={(value) => [`${value}%`, 'Asistencia']}
                    />
                    <Line type="monotone" dataKey="Asistencia %" stroke={COLORS.ASISTENCIA} strokeWidth={3} dot={{r: 4, fill: COLORS.ASISTENCIA, strokeWidth: 2, stroke: 'var(--bg-card)'}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* TABLA DE ATLETAS */}
            <Card className="overflow-hidden">
              <div className="table-header">
                <h3 className="section-title border-none mb-0">
                  <User size={18} className="title-icon"/> Detalle de Atletas
                </h3>
                <span className="table-badge">
                  Mostrando {tableData.length} registros
                </span>
              </div>
              <div className="admin-asistencia-tabla-wrap table-wrapper">
                <table className="athletes-table">
                  <thead className="table-head">
                    <tr>
                      <th className="table-th text-left">Cédula</th>
                      <th className="table-th text-left">Atleta</th>
                      <th className="table-th text-left">Categoría</th>
                      <th className="table-th text-center">Sesiones</th>
                      <th className="table-th text-center">% Asist.</th>
                      <th className="table-th text-center" title="Asistencias / Inasistencias / Justificadas">A / I / J</th>
                      <th className="table-th text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {tableData.length > 0 ? tableData.map((row, idx) => (
                      <tr 
                        key={row.id} 
                        className={`table-row ${idx % 2 === 0 ? 'bg-even' : 'bg-odd'}`}
                      >
                        <td className="table-td font-medium text-muted">{row.id}</td>
                        <td className="table-td font-semibold text-primary-color">{row.name}</td>
                        <td className="table-td">
                          <span className="category-tag">{row.category}</span>
                        </td>
                        <td className="table-td text-center text-muted">{row.total}</td>
                        <td className="table-td text-center">
                          <span className={`perc-badge ${row.perc >= 85 ? 'high' : row.perc >= 70 ? 'mid' : 'low'}`}>
                            {row.perc}%
                          </span>
                        </td>
                        <td className="table-td text-center">
                          <div className="pill-group">
                            <span className="count-pill-green">{row.asist}</span>
                            <span className="text-divider">/</span>
                            <span className="count-pill-red">{row.inasist}</span>
                            <span className="text-divider">/</span>
                            <span className="count-pill-blue">{row.justif}</span>
                          </div>
                        </td>
                        <td className="table-td text-right">
                          <button 
                            onClick={() => handleAthleteSelect(row)}
                            className="btn-detail"
                          >
                            Ver detalle <ChevronRight size={14} className="chevron-icon" />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="7" className="table-td text-center py-8 text-muted">No hay atletas que coincidan con los filtros actuales.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="admin-asistencia-cards-wrap">
                {tableData.length > 0 ? tableData.map((row) => (
                  <article className="admin-asistencia-card" key={row.id}>
                    <div className="admin-asistencia-card-header"><div><strong>{row.name}</strong><span>{row.id}</span></div><span className={`perc-badge ${row.perc >= 85 ? 'high' : row.perc >= 70 ? 'mid' : 'low'}`}>{row.perc}%</span></div>
                    <div className="admin-asistencia-card-meta">{row.category}</div>
                    <div className="admin-asistencia-card-stats"><span>Sesiones <b>{row.total}</b></span><span>Asistencias <b>{row.asist}</b></span><span>Inasistencias <b>{row.inasist}</b></span><span>Justificadas <b>{row.justif}</b></span></div>
                    <button onClick={() => handleAthleteSelect(row)} className="btn-detail">Ver detalle <ChevronRight size={14} className="chevron-icon" /></button>
                  </article>
                )) : <div className="table-td text-center py-8 text-muted">No hay atletas que coincidan con los filtros actuales.</div>}
              </div>
            </Card>
          </div>
        )}

        {currentView === 'athlete' && selectedAthlete?.isDatabaseAthlete && (
          <div className="athlete-view-container animate-slide-in">
            <div className="athlete-header">
              <button
                type="button"
                className="btn-back-asistencia"
                onClick={() => {
                  setCurrentView('global');
                  setSelectedAthlete(null);
                  setSearchValue('');
                  setSearchState('idle');
                  setSearchError('');
                }}
              >
                <ArrowLeft size={18} />
                Volver a Asistencia
              </button>
              <div>
                <h2 className="athlete-name">
                  {selectedAthlete.name} {selectedAthlete.lastname}
                </h2>
                <div className="athlete-meta">
                  <span className="flex-center gap-1 font-medium">
                    <MapPin size={14} className="text-muted" /> C.I. {selectedAthlete.cedula}
                  </span>
                </div>
              </div>
            </div>

            {(() => {
              const records = selectedAthlete.attendances;
              const counts = records.reduce((summary, record) => {
                summary[record.status] = (summary[record.status] || 0) + 1;
                return summary;
              }, {});
              return (
                <>
                  <div className="kpi-grid">
                    {[
                      ['REGISTROS', records.length],
                      ['PRESENTE', counts.Presente || 0],
                      ['AUSENTE', counts.Ausente || 0],
                      ['JUSTIFICADO', counts.Justificado || 0],
                    ].map(([label, value]) => (
                      <Card className="p-5" key={label}>
                        <div className="kpi-title">{label}</div>
                        <div className="kpi-value">{value}</div>
                      </Card>
                    ))}
                  </div>

                  <Card className="overflow-hidden">
                    <div className="history-header">
                      <h3 className="section-title border-none mb-0">
                        <Clock size={18} className="title-icon" /> Historial de asistencia
                      </h3>
                    </div>
                    <div className="history-list-wrapper">
                      {records.length ? (
                        <div className="history-list">
                          {records.map((record) => {
                            const statusClass = record.status === 'Presente'
                              ? 'green'
                              : record.status === 'Ausente' ? 'red' : 'blue';
                            return (
                              <div className="history-item" key={record.id}>
                                <div>
                                  <div className="history-title">{record.status}</div>
                                  <div className="history-date">
                                    <Calendar size={12} /> {record.date}
                                  </div>
                                  {record.status === 'Justificado' && record.detail && (
                                    <p className="history-detail">
                                      Detalle: {record.detail}
                                    </p>
                                  )}
                                  <div className="history-date">
                                    Registrado por: {record.registered_by}
                                  </div>
                                </div>
                                <span className={`history-status-badge ${statusClass}`}>
                                  {record.status}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-muted">
                          Este atleta todavía no tiene asistencias registradas.
                        </div>
                      )}
                    </div>
                  </Card>
                </>
              );
            })()}
          </div>
        )}

        {currentView === 'athlete' && selectedAthlete && !selectedAthlete.isDatabaseAthlete && sesionesContexto.length > 0 && (
          <div className="athlete-view-container animate-slide-in">
            
            {/* Header del Atleta */}
            <div className="athlete-header">
              <button
                type="button"
                className="btn-back-asistencia"
                onClick={() => {
                  setCurrentView('global');
                  setSelectedAthlete(null);
                }}
              >
                <ArrowLeft size={18} />
                Volver a Asistencia
              </button>
              <div>
                <h2 className="athlete-name">{selectedAthlete.name}</h2>
                <div className="athlete-meta">
                  <span className="flex-center gap-1 font-medium"><MapPin size={14} className="text-muted"/> C.I. {selectedAthlete.id}</span>
                  <span className="dot-divider"></span>
                  <span className="badge-indigo">{selectedAthlete.category}</span>
                </div>
                <div className="chips-wrapper">
                  {selectedAthlete.subareas.map(sub => (
                     <span key={sub} className="subarea-chip">
                       {SUBAREA_TO_AREA[sub]} → {sub}
                     </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Contenido Individual */}
            <div className="athlete-grid">
              
              {/* Columna Izquierda: KPIs y Donut */}
              <div className="athlete-sidebar">
                
                {/* KPIs Individuales */}
                <Card className="p-5">
                  <h3 className="card-subtitle">Resumen Individual</h3>
                  
                  {(() => {
                    const stats = { total: 0, asist: 0, inasist: 0, justif: 0, lastA: '-', lastI: '-' };
                    const sorted = [...sesionesAtleta].sort((a,b) => new Date(b.date) - new Date(a.date));
                    
                    sesionesAtleta.forEach(s => {
                      stats.total++;
                      if(s.status === 'ASISTENCIA') stats.asist++;
                      else if(s.status === 'INASISTENCIA') stats.inasist++;
                      else if(s.status === 'JUSTIFICADA') stats.justif++;
                    });
                    
                    stats.lastA = sorted.find(s=>s.status === 'ASISTENCIA')?.date || '-';
                    stats.lastI = sorted.find(s=>s.status === 'INASISTENCIA')?.date || '-';
                    const percA = stats.total > 0 ? Math.round((stats.asist/stats.total)*100) : 0;

                    const pieData = [
                      { name: 'Asistencia', value: stats.asist, color: COLORS.ASISTENCIA },
                      { name: 'Inasistencia', value: stats.inasist, color: COLORS.INASISTENCIA },
                      { name: 'Justificada', value: stats.justif, color: COLORS.JUSTIFICADA }
                    ].filter(d => d.value > 0);

                    return (
                      <>
                        <div className="summary-header">
                           <div>
                             <div className="summary-main-perc">{percA}%</div>
                             <div className="summary-label">ASISTENCIA REAL</div>
                           </div>
                           <div className="text-right">
                             <div className="summary-main-total">{stats.total}</div>
                             <div className="summary-sublabel">Sesiones Totales</div>
                           </div>
                        </div>

                        {/* Gráfico Donut */}
                        {stats.total > 0 ? (
                          <div className="donut-wrapper">
                            <div className="donut-chart-container">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                  >
                                    {pieData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <RechartsTooltip 
                                    formatter={(value, name) => [value, name]}
                                    contentStyle={TOOLTIP_CONTENT_STYLE}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="donut-center">
                                 <span className="donut-center-value">{stats.total}</span>
                              </div>
                            </div>
                            
                            {/* Leyenda Donut */}
                            <div className="legend-list">
                              <div className="legend-item">
                                <span className="legend-label"><span className="kpi-dot green"></span> Asistencias</span>
                                <span className="legend-value">{stats.asist}</span>
                              </div>
                              <div className="legend-item">
                                <span className="legend-label"><span className="kpi-dot red"></span> Inasistencias</span>
                                <span className="legend-value">{stats.inasist}</span>
                              </div>
                              <div className="legend-item">
                                <span className="legend-label"><span className="kpi-dot blue"></span> Justificadas</span>
                                <span className="legend-value">{stats.justif}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="empty-chart">Sin sesiones en este período</div>
                        )}

                        {/* Breakdown por Área */}
                        <div className="area-breakdown-container">
                          <h4 className="card-subtitle mb-4">Rendimiento por Área</h4>
                          <div className="space-y-4">
                            {Array.from(new Set(selectedAthlete.subareas.map(sub => SUBAREA_TO_AREA[sub]))).map(area => {
                              const areaSes = sesionesAtleta.filter(s => s.area === area);
                              if(areaSes.length === 0) return null;
                              
                              const aTotal = areaSes.length;
                              const aAsist = areaSes.filter(s => s.status === 'ASISTENCIA').length;
                              const aPerc = Math.round((aAsist / aTotal) * 100);

                              return (
                                <div key={area} className="area-progress-block">
                                  <div className="flex-between text-sm mb-1">
                                    <span className="font-medium text-primary-color">{area}</span>
                                    <span className="font-bold text-primary-color">{aPerc}%</span>
                                  </div>
                                  <div className="progress-bg">
                                    <div className="progress-fill" style={{ width: `${aPerc}%` }}></div>
                                  </div>
                                  
                                  <div className="subarea-breakdown-list">
                                    {selectedAthlete.subareas.filter(sub => SUBAREA_TO_AREA[sub] === area).map(sub => {
                                      const subSes = areaSes.filter(s => s.subarea === sub);
                                      if(subSes.length === 0) return null;
                                      const sTotal = subSes.length;
                                      const sAsist = subSes.filter(s => s.status === 'ASISTENCIA').length;
                                      const sPerc = Math.round((sAsist / sTotal) * 100);
                                      return (
                                        <div key={sub} className="flex-between text-xs text-muted">
                                          <span>{sub}</span>
                                          <span className="font-medium">{sPerc}% <span className="text-faint ml-1">({sAsist}/{sTotal})</span></span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </Card>
              </div>

              {/* Columna Derecha: Calendario y Lista */}
              <div className="athlete-main">
                
                {/* CALENDARIO MENSUAL */}
                <Card className="p-0 overflow-hidden">
                  <div className="calendar-card-header">
                    <h3 className="section-title border-none mb-0">
                      <Calendar size={18} className="title-icon"/> Registro de Sesiones (Agosto 2026)
                    </h3>
                    <div className="calendar-legend">
                      <span className="legend-pill"><span className="kpi-dot green"></span> A</span>
                      <span className="legend-pill"><span className="kpi-dot red"></span> I</span>
                      <span className="legend-pill"><span className="kpi-dot blue"></span> J</span>
                    </div>
                  </div>
                  
                  <div className="calendar-wrapper">
                    <div className="calendar-grid">
                      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                        <div key={d} className="calendar-day-header">{d}</div>
                      ))}
                      
                      {Array.from({length: 5}).map((_, i) => (
                        <div key={`empty-${i}`} className="calendar-day-empty"></div>
                      ))}
                      
                      {Array.from({length: 31}).map((_, i) => {
                        const day = i + 1;
                        const dateStr = `2026-08-${day.toString().padStart(2, '0')}`;
                        const daySessions = sesionesAtleta.filter(s => s.date === dateStr);
                        
                        return (
                          <div key={day} className="calendar-day">
                            <span className={`day-number ${daySessions.length > 0 ? 'active' : 'inactive'}`}>
                              {day}
                            </span>
                            
                            <div className="status-dots-container">
                              {daySessions.map(s => (
                                <div 
                                  key={s.id} 
                                  title={`${s.subarea} - ${s.status}`}
                                  className={`status-dot ${
                                    s.status === 'ASISTENCIA' ? 'green' : 
                                    s.status === 'INASISTENCIA' ? 'red' : 'blue'
                                  }`}
                                />
                              ))}
                            </div>

                            {daySessions.length > 0 && (
                              <div className="calendar-tooltip">
                                <div className="tooltip-date">{dateStr}</div>
                                {daySessions.map(s => (
                                  <div key={s.id} className="tooltip-item">
                                    <span className="truncate">{s.subarea}</span>
                                    <StatusIcon status={s.status} size={12} />
                                  </div>
                                ))}
                                <div className="tooltip-arrow"></div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </Card>

                {/* HISTORIAL RECIENTE EN LISTA */}
                <Card className="overflow-hidden">
                  <div className="history-header">
                    <h3 className="section-title border-none mb-0">
                      <Clock size={18} className="title-icon"/> Historial Detallado (Reciente)
                    </h3>
                  </div>
                  <div className="history-list-wrapper">
                    {sesionesAtleta.length > 0 ? (
                      <div className="history-list">
                        {[...sesionesAtleta].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 15).map(session => (
                          <div key={session.id} className="history-item">
                            <div className="flex-center gap-4">
                              <div className={`history-icon-box ${
                                session.status === 'ASISTENCIA' ? 'green' : 
                                session.status === 'INASISTENCIA' ? 'red' : 'blue'
                              }`}>
                                <StatusIcon status={session.status} size={20} />
                              </div>
                              <div>
                                <div className="history-title">
                                  {session.area} <span className="history-divider">/</span> {session.subarea}
                                </div>
                                <div className="history-date">
                                  <Calendar size={12} /> {session.date}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`history-status-badge ${
                                session.status === 'ASISTENCIA' ? 'green' : 
                                session.status === 'INASISTENCIA' ? 'red' : 'blue'
                              }`}>
                                {session.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-muted">
                        No hay historial reciente para mostrar con los filtros actuales.
                      </div>
                    )}
                  </div>
                </Card>

              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}