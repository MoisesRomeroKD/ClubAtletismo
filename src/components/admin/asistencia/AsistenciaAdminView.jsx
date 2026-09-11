import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Search, Calendar, Filter, ChevronRight, ArrowLeft, Activity, User, 
  CheckCircle, XCircle, AlertCircle, Clock, MapPin, Target, Layers, 
  AlertTriangle, Info
} from 'lucide-react';
import '../../../styles/components/admin/asistencia/AsistenciaAdminView.css';

// Constantes de colores para estados
const COLORS = {
  ASISTENCIA: '#22c55e', // Verde
  INASISTENCIA: '#ef4444', // Rojo
  JUSTIFICADA: '#3b82f6', // Azul
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

// Generador de datos ficticios
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

const PERIODOS = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'semana_actual', label: 'Esta semana' },
  { id: 'semana_anterior', label: 'Semana anterior' },
  { id: 'mes_actual', label: 'Este mes' },
  { id: 'mes_anterior', label: 'Mes anterior' },
  { id: 'ultimos_3_meses', label: 'Últimos 3 meses' },
  { id: 'ultimos_6_meses', label: 'Últimos 6 meses' },
  { id: 'este_ano', label: 'Este año' }
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

export default function AsistenciaAdminView() {
  const [currentView, setCurrentView] = useState('global');
  const [selectedAthlete, setSelectedAthlete] = useState(null);

  const [periodo, setPeriodo] = useState('mes_actual');
  const [areaFilter, setAreaFilter] = useState('Todas');
  const [subareaFilter, setSubareaFilter] = useState('Todas');
  const [categoriaFilter, setCategoriaFilter] = useState('Todas');

  const [searchValue, setSearchValue] = useState('');
  const [searchState, setSearchState] = useState('idle');

  const sesionesPeriodo = useMemo(() => {
    let filtered = ALL_SESSIONS;
    const today = '2026-08-02';
    
    if (periodo === 'hoy') {
      filtered = ALL_SESSIONS.filter(s => s.date === today);
    } else if (periodo === 'mes_actual') {
      filtered = ALL_SESSIONS.filter(s => s.date.startsWith('2026-08'));
    } else if (periodo === 'mes_anterior') {
      filtered = ALL_SESSIONS.filter(s => s.date.startsWith('2026-07'));
    }
    
    return filtered;
  }, [periodo]);

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

  useEffect(() => {
    const val = searchValue.trim();
    if (val.length < 3) {
      setSearchState('idle');
      return;
    }

    if (val.length >= 3 && val.length <= 4) {
      setSearchState('searching_local');
      const foundLocally = ATHLETES.some(a => a.id.startsWith(val));
      setTimeout(() => {
        setSearchState(foundLocally ? 'searching_local' : 'not_found_local');
      }, 300);
    } else if (val.length >= 5) {
      setSearchState('searching_server');
      setTimeout(() => {
        const found = ATHLETES.find(a => a.id.startsWith(val));
        if (found) {
          setSearchState('found');
        } else {
          setSearchState('not_found_server');
        }
      }, 600);
    }
  }, [searchValue]);

  const handleSearchSelect = (e) => {
    e.preventDefault();
    const val = searchValue.trim();
    const found = ATHLETES.find(a => a.id === val || a.id.startsWith(val));
    if (found) {
      handleAthleteSelect(found);
      setSearchValue('');
      setSearchState('idle');
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
      if(!s.date.startsWith('2026-08')) return;
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

  const handleBackToGlobal = () => {
    setCurrentView('global');
    setSelectedAthlete(null);
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
      
      {/* HEADER PRINCIPAL */}
      <header className="admin-header">
        <div className="header-content">
          
          <div className="header-left">
            <div className="brand-logo">
              <Activity className="brand-icon" />
              POD
            </div>
            <div className="header-divider"></div>
            
            {/* BREADCRUMBS */}
            <nav className="breadcrumbs-nav">
              <ol className="breadcrumbs-list">
                <li>
                  <button onClick={handleBackToGlobal} className="breadcrumb-link">
                    Asistencias
                  </button>
                </li>
                {areaFilter !== 'Todas' && (
                  <>
                    <ChevronRight size={14} />
                    <li className="breadcrumb-item">{areaFilter}</li>
                  </>
                )}
                {subareaFilter !== 'Todas' && (
                  <>
                    <ChevronRight size={14} />
                    <li className="breadcrumb-item">{subareaFilter}</li>
                  </>
                )}
                {categoriaFilter !== 'Todas' && (
                  <>
                    <ChevronRight size={14} />
                    <li className="breadcrumb-item">{categoriaFilter}</li>
                  </>
                )}
                {currentView === 'athlete' && selectedAthlete && (
                  <>
                    <ChevronRight size={14} />
                    <li className="breadcrumb-item-active">{selectedAthlete.name}</li>
                  </>
                )}
              </ol>
            </nav>
          </div>

          {/* BUSCADOR */}
          <div className="search-wrapper">
            <form onSubmit={handleSearchSelect} className="search-form">
              <Search className="search-icon" size={18} />
              <input 
                type="text" 
                placeholder="Buscar cédula (ej. 25123...)"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="search-input"
              />
              {/* ESTADOS DE BÚSQUEDA */}
              {searchState !== 'idle' && (
                <div className="search-dropdown">
                  {searchState === 'searching_local' && (
                    <span className="search-status-searching">
                      <div className="spinner"></div> Buscando en equipo local...
                    </span>
                  )}
                  {searchState === 'not_found_local' && (
                    <span className="search-status-warning">
                      <Info size={14}/> No se encontró coincidencia local. Ingresa 5+ dígitos para buscar en el servidor.
                    </span>
                  )}
                  {searchState === 'searching_server' && (
                    <span className="search-status-searching">
                      <div className="spinner"></div> Buscando en base de datos global...
                    </span>
                  )}
                  {searchState === 'found' && (
                    <div className="search-status-success">
                      <CheckCircle size={14}/> Atleta encontrado. Presiona Enter para ver.
                    </div>
                  )}
                  {searchState === 'not_found_server' && (
                    <span className="search-status-error">
                      <AlertTriangle size={14}/> No se encontró ninguna cédula coincidente.
                    </span>
                  )}
                </div>
              )}
            </form>
          </div>
          
        </div>
      </header>

      {/* FILTROS GLOBALES BAR */}
      <div className="filters-bar">
        <div className="filters-container">
          <div className="filter-label">
            <Filter size={16} /> Filtros:
          </div>
          
          <select 
            value={periodo} 
            onChange={(e) => setPeriodo(e.target.value)}
            className="filter-select"
          >
            {PERIODOS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>

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
        {sesionesContexto.length === 0 && (
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
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={100} />
                      <RechartsTooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
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
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={90} />
                        <RechartsTooltip 
                          cursor={{fill: '#f8fafc'}}
                          contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
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
                <Clock size={18} className="title-icon"/> Evolución Temporal (Ago 2026)
              </h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDataEvolution} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, dy: 10}} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `${val}%`} />
                    <RechartsTooltip 
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        formatter={(value) => [`${value}%`, 'Asistencia']}
                    />
                    <Line type="monotone" dataKey="Asistencia %" stroke={COLORS.ASISTENCIA} strokeWidth={3} dot={{r: 4, fill: COLORS.ASISTENCIA, strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
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
              <div className="table-wrapper">
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
                        <td className="table-td font-medium text-slate-600">{row.id}</td>
                        <td className="table-td font-semibold text-slate-800">{row.name}</td>
                        <td className="table-td">
                          <span className="category-tag">{row.category}</span>
                        </td>
                        <td className="table-td text-center text-slate-600">{row.total}</td>
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
                        <td colSpan="7" className="table-td text-center py-8 text-slate-500">No hay atletas que coincidan con los filtros actuales.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {sesionesContexto.length > 0 && currentView === 'athlete' && selectedAthlete && (
          <div className="athlete-view-container animate-slide-in">
            
            {/* Header del Atleta */}
            <div className="athlete-header">
              <div className="athlete-info-wrapper">
                <button 
                  onClick={handleBackToGlobal}
                  className="btn-back"
                  aria-label="Volver"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h2 className="athlete-name">{selectedAthlete.name}</h2>
                  <div className="athlete-meta">
                    <span className="flex-center gap-1 font-medium"><MapPin size={14} className="text-slate-400"/> C.I. {selectedAthlete.id}</span>
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
                                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
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
                                    <span className="font-medium text-slate-700">{area}</span>
                                    <span className="font-bold text-slate-800">{aPerc}%</span>
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
                                        <div key={sub} className="flex-between text-xs text-slate-500">
                                          <span>{sub}</span>
                                          <span className="font-medium">{sPerc}% <span className="text-slate-300 ml-1">({sAsist}/{sTotal})</span></span>
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
                          <div key={day} className="calendar-day group">
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
                      <div className="p-8 text-center text-slate-500">
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