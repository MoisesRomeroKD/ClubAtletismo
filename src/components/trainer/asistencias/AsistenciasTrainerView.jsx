import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Users, Activity, Calendar as CalendarIcon, ChevronRight, ChevronLeft,
  Search, Filter, Map, Layers, Target, CheckCircle2, XCircle, AlertCircle,
  ChevronDown, Clock, ArrowLeft, ArrowUpRight, ArrowDownRight,
  TrendingUp, Fingerprint, RefreshCcw, Database
} from 'lucide-react';
import '../../../styles/components/trainer/AsistenciasTrainerView.css';
import UserService from '../../../api/services/Userservice';

const STATUS = {
  ATTENDANCE: 'asistencia',
  ABSENCE: 'inasistencia',
  JUSTIFIED: 'justificada'
};

const COLORS = {
  asistencia: '#10b981',
  inasistencia: '#f43f5e',
  justificada: '#0ea5e9'
};

const EMPTY_ASSIGNMENTS = { areas: [], subareas: {}, categories: [] };

const calculateKPIs = (sessions) => {
  if (!sessions || sessions.length === 0) return { total: 0, attendance: 0, absence: 0, justified: 0, attPercent: 0, absPercent: 0, lastAtt: null, lastAbs: null };

  const total = sessions.length;
  let attendance = 0;
  let absence = 0;
  let justified = 0;
  let lastAtt = null;
  let lastAbs = null;

  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));

  sortedSessions.forEach(s => {
    if (s.status === STATUS.ATTENDANCE) {
      attendance++;
      if (!lastAtt) lastAtt = s.date;
    }
    else if (s.status === STATUS.ABSENCE) {
      absence++;
      if (!lastAbs) lastAbs = s.date;
    }
    else if (s.status === STATUS.JUSTIFIED) {
      justified++;
    }
  });

  return {
    total, attendance, absence, justified,
    attPercent: total > 0 ? (attendance / total) * 100 : 0,
    absPercent: total > 0 ? (absence / total) * 100 : 0,
    lastAtt, lastAbs
  };
};

const filterSessionsByPeriod = (sessions, period) => {
  const today = new Date();
  return sessions.filter(s => {
    const sessionDate = new Date(s.date);
    const diffTime = Math.abs(today - sessionDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    switch (period) {
      case 'hoy': return diffDays === 0;
      case 'semana': return diffDays <= 7;
      case 'mes': return sessionDate.getMonth() === today.getMonth() && sessionDate.getFullYear() === today.getFullYear();
      case '3meses': return diffDays <= 90;
      case '6meses': return diffDays <= 180;
      case 'ano': return sessionDate.getFullYear() === today.getFullYear();
      default: return true;
    }
  });
};

const Card = ({ children, className = "" }) => (
  <div className={`pod-card ${className}`}>
    {children}
  </div>
);

const StatusBadge = ({ status }) => {
  const config = {
    [STATUS.ATTENDANCE]: { icon: CheckCircle2, classSuffix: 'attendance', label: 'Asistencia' },
    [STATUS.ABSENCE]: { icon: XCircle, classSuffix: 'absence', label: 'Inasistencia' },
    [STATUS.JUSTIFIED]: { icon: AlertCircle, classSuffix: 'justified', label: 'Justificada' },
  };
  const c = config[status] || config[STATUS.ATTENDANCE];
  const Icon = c.icon;
  return (
    <span className={`status-badge status-badge--${c.classSuffix}`}>
      <Icon className="icon-xs" />
      {c.label}
    </span>
  );
};

const KPICard = ({ title, value, subtext, icon: Icon, colorClass, trend }) => {
  return (
  <Card className="kpi-card">
    <div className="kpi-header">
      <div>
        <p className="kpi-title">{title}</p>
        <h3 className="kpi-value">{value}</h3>
        {subtext && <p className="kpi-subtext">{subtext}</p>}
      </div>
      <div className={`kpi-icon-box ${colorClass}`}>
        {React.createElement(Icon, { className: 'icon-md' })}
      </div>
    </div>
    {trend && (
      <div className="kpi-trend font-sans">
        {trend.isPositive ? <ArrowUpRight className="icon-sm trend-positive" /> : <ArrowDownRight className="icon-sm trend-negative" />}
        <span className={trend.isPositive ? 'trend-positive-text' : 'trend-negative-text'}>
          {trend.value}%
        </span>
        <span className="trend-label">vs período anterior</span>
      </div>
    )}
  </Card>
  );
};

const MonthlyCalendar = ({ sessions, month, year }) => {
  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (m, y) => new Date(y, m, 1).getDay();
  
  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  const days = Array.from({ length: 42 }, (_, i) => {
    const dayNumber = i - offset + 1;
    if (dayNumber > 0 && dayNumber <= daysInMonth) return dayNumber;
    return null;
  });

  const getSessionsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return sessions.filter(s => s.date === dateStr);
  };

  return (
    <div className="calendar-container">
      <div className="calendar-weekdays">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
          <div key={d} className="calendar-weekday-item">{d}</div>
        ))}
      </div>
      <div className="calendar-days-grid">
        {days.map((day, idx) => {
          const daySessions = getSessionsForDay(day);
          const hasSessions = daySessions.length > 0;
          
          return (
            <div key={idx} className={`calendar-day-cell ${day ? 'calendar-day-active' : 'calendar-day-empty'}`}>
              {day && (
                <>
                  <span className="calendar-day-number">{day}</span>
                  <div className="calendar-dots-wrapper">
                     {daySessions.slice(0,3).map((s, i) => (
                        <div key={i} className={`calendar-dot dot-${s.status}`} />
                     ))}
                     {daySessions.length > 3 && <span className="calendar-dot-more">+{daySessions.length - 3}</span>}
                  </div>
                  
                  {hasSessions && (
                    <div className="calendar-tooltip">
                       <p className="calendar-tooltip-header">Día {day}</p>
                       {daySessions.map((s, i) => (
                         <div key={i} className="calendar-tooltip-row">
                           <span className="calendar-tooltip-subarea">{s.subarea}</span>
                           <span className={`calendar-dot dot-${s.status}`} />
                         </div>
                       ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="calendar-legend">
         <div className="legend-item"><div className="calendar-dot dot-asistencia"/> Asistencia</div>
         <div className="legend-item"><div className="calendar-dot dot-inasistencia"/> Inasistencia</div>
         <div className="legend-item"><div className="calendar-dot dot-justificada"/> Justificada</div>
         <div className="legend-item"><div className="calendar-dot dot-empty"/> Sin sesión</div>
      </div>
    </div>
  );
};

const AthleteDetailView = ({ athleteId, onBack, allSessions, period, athletes }) => {
  const athlete = athletes.find(a => a.id === athleteId);
  const rawSessions = allSessions.filter(s => s.athleteId === athleteId);
  const sessions = filterSessionsByPeriod(rawSessions, period);
  const kpis = calculateKPIs(sessions);

  const pieData = [
    { name: 'Asistencias', value: kpis.attendance, color: COLORS.asistencia },
    { name: 'Inasistencias', value: kpis.absence, color: COLORS.inasistencia },
    { name: 'Justificadas', value: kpis.justificada, color: COLORS.justificada },
  ].filter(d => d.value > 0);

  const attendanceBreakdown = {};
  athlete.assignments.forEach(assign => {
    if (!attendanceBreakdown[assign.area]) attendanceBreakdown[assign.area] = {};
    attendanceBreakdown[assign.area][assign.subarea] = { total: 0, att: 0 };
  });

  sessions.forEach(s => {
    if (attendanceBreakdown[s.area] && attendanceBreakdown[s.area][s.subarea]) {
      attendanceBreakdown[s.area][s.subarea].total++;
      if (s.status === STATUS.ATTENDANCE) attendanceBreakdown[s.area][s.subarea].att++;
    }
  });

  if (!athlete) return <div className="no-data-msg">Atleta no encontrado.</div>;

  return (
    <div className="detail-view-container">
      {/* Header Detalle */}
      <div className="detail-header-card">
        <div className="detail-athlete-info flex-center-gap">
          <button onClick={onBack} className="btn-back">
            <ArrowLeft className="icon-md" />
          </button>
          <div>
            <div className="flex-center-gap">
              <h2 className="athlete-detail-name">{athlete.name}</h2>
              <span className="athlete-id-badge">{athlete.id}</span>
            </div>
            <div className="assignments-badges-list">
              {athlete.assignments.map((a, i) => (
                 <span key={i} className="assignment-badge">
                   <Target className="icon-xs" />
                   {a.area} <ChevronRight className="icon-xs text-muted" /> {a.subarea} <span className="text-muted">({a.category})</span>
                 </span>
              ))}
            </div>
          </div>
        </div>
        <div className="detail-global-score">
          <p className="score-label">Asistencia Global</p>
          <div className="score-value">{kpis.attPercent.toFixed(1)}%</div>
        </div>
      </div>

      <div className="detail-grid-layout">
        {/* Columna Izquierda */}
        <div className="detail-col-left">
          <Card className="card-padding">
            <h3 className="section-title">
              <Activity className="icon-md text-indigo" /> Distribución
            </h3>
            {sessions.length > 0 ? (
              <div className="chart-container-height">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} sesiones`, name]}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-chart-box">
                Sin datos en este período
              </div>
            )}
          </Card>

          <Card className="card-padding">
            <h3 className="section-title">
              <Layers className="icon-md text-indigo" /> Rendimiento por Área
            </h3>
            <div className="performance-list">
              {Object.entries(attendanceBreakdown).map(([area, subareas]) => (
                <div key={area} className="performance-group">
                  <h4 className="performance-area-title">{area}</h4>
                  {Object.entries(subareas).map(([subarea, stats]) => {
                    const pct = stats.total > 0 ? (stats.att / stats.total) * 100 : 0;
                    const barColorClass = pct >= 80 ? 'bar-emerald' : pct >= 60 ? 'bar-amber' : 'bar-rose';
                    return (
                      <div key={subarea} className="performance-subarea-item">
                        <div className="performance-subarea-header">
                          <span className="subarea-name">{subarea}</span>
                          <span className="subarea-percentage">{pct.toFixed(0)}%</span>
                        </div>
                        <div className="progress-bar-bg">
                          <div className={`progress-bar-fill ${barColorClass}`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Columna Derecha */}
        <div className="detail-col-right">
          <div className="kpis-grid-4">
            <KPICard title="Sesiones" value={kpis.total} icon={Database} colorClass="kpi-bg-slate" />
            <KPICard title="Asistencias" value={kpis.attendance} icon={CheckCircle2} colorClass="kpi-bg-emerald" />
            <KPICard title="Inasistencias" value={kpis.absence} icon={XCircle} colorClass="kpi-bg-rose" />
            <KPICard title="Justificadas" value={kpis.justificada} icon={AlertCircle} colorClass="kpi-bg-sky" />
          </div>

          <Card className="card-padding">
            <div className="calendar-card-header">
               <h3 className="section-title">
                <CalendarIcon className="icon-md text-indigo" /> Historial Mensual
              </h3>
              <div className="calendar-date-tag">
                {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </div>
            </div>
            
            <MonthlyCalendar sessions={sessions} month={new Date().getMonth()} year={new Date().getFullYear()} />
          </Card>
        </div>
      </div>
    </div>
  );
};

const DashboardView = ({ 
  assignments, 
  sessions, 
  athletes, 
  onSelectAthlete,
  navContext
}) => {
  const kpis = calculateKPIs(sessions);

  const areasData = useMemo(() => {
    const data = {};
    sessions.forEach(s => {
      if (!data[s.area]) data[s.area] = { name: s.area, total: 0, att: 0 };
      data[s.area].total++;
      if (s.status === STATUS.ATTENDANCE) data[s.area].att++;
    });
    return Object.values(data).map(d => ({
      name: d.name,
      asistencia: d.total > 0 ? parseFloat(((d.att / d.total) * 100).toFixed(1)) : 0
    }));
  }, [sessions]);

  const subareasData = useMemo(() => {
    const data = {};
    sessions.forEach(s => {
      if (!data[s.subarea]) data[s.subarea] = { name: s.subarea, total: 0, att: 0 };
      data[s.subarea].total++;
      if (s.status === STATUS.ATTENDANCE) data[s.subarea].att++;
    });
    return Object.values(data).map(d => ({
      name: d.name,
      asistencia: d.total > 0 ? parseFloat(((d.att / d.total) * 100).toFixed(1)) : 0
    })).sort((a,b) => b.asistencia - a.asistencia);
  }, [sessions]);

  const evolutionData = useMemo(() => {
     return [
       { name: 'Sem 1', asistencia: 82 },
       { name: 'Sem 2', asistencia: 85 },
       { name: 'Sem 3', asistencia: 81 },
       { name: 'Sem 4', asistencia: kpis.attPercent || 0 },
     ]
  }, [kpis.attPercent]);

  const athleteStats = useMemo(() => {
    const statsMap = {};
    sessions.forEach(s => {
      if (!statsMap[s.athleteId]) {
        const a = athletes.find(a => a.id === s.athleteId);
        statsMap[s.athleteId] = { 
          id: s.athleteId, 
          name: a ? a.name : 'Desconocido',
          area: a ? a.assignments[0].area : s.area,
          subarea: a ? a.assignments[0].subarea : s.subarea,
          category: a ? a.assignments[0].category : s.category,
          total: 0, att: 0, abs: 0, just: 0, lastAtt: null, lastAbs: null 
        };
      }
      const st = statsMap[s.athleteId];
      st.total++;
      if (s.status === STATUS.ATTENDANCE) { st.att++; if(!st.lastAtt || s.date > st.lastAtt) st.lastAtt = s.date; }
      else if (s.status === STATUS.ABSENCE) { st.abs++; if(!st.lastAbs || s.date > st.lastAbs) st.lastAbs = s.date; }
      else if (s.status === STATUS.JUSTIFIED) { st.just++; }
    });

    return Object.values(statsMap).map(st => ({
      ...st,
      attPct: st.total > 0 ? (st.att / st.total) * 100 : 0
    })).sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }, [sessions, athletes]);

  const showAreaChart = assignments.areas.length > 1 && navContext.type === 'global';

  return (
    <div className="dashboard-layout">
      {/* KPIs Principales */}
      <div className="kpis-grid-4">
        <KPICard title="Total Sesiones" value={kpis.total} icon={Database} colorClass="kpi-bg-indigo" />
        <KPICard title="Asistencia Real" value={`${kpis.attPercent.toFixed(1)}%`} subtext={`${kpis.attendance} de ${kpis.total}`} icon={TrendingUp} colorClass="kpi-bg-emerald" trend={{value: 2.1, isPositive: true}} />
        <KPICard title="Inasistencias" value={kpis.absence} subtext={`${kpis.absPercent.toFixed(1)}% del total`} icon={XCircle} colorClass="kpi-bg-rose" />
        <KPICard title="Justificadas" value={kpis.justificada} subtext="No cuentan como asistencia" icon={AlertCircle} colorClass="kpi-bg-sky" />
      </div>

      {/* Gráficos */}
      <div className={`charts-grid ${showAreaChart ? 'grid-cols-3-lg' : 'grid-cols-2-lg'}`}>
        {showAreaChart && (
          <Card className="card-padding">
            <h3 className="chart-card-title">Comparativa por Área</h3>
            <div className="chart-box-height">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={areasData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={80} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px'}} formatter={(value) => [`${value}%`, 'Asistencia']}/>
                  <Bar dataKey="asistencia" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
        
        <Card className="card-padding">
          <h3 className="chart-card-title">Top Subáreas (Asistencia)</h3>
          <div className="chart-box-height">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subareasData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis domain={[0, 100]} hide />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px'}} formatter={(value) => [`${value}%`, 'Asistencia']}/>
                <Bar dataKey="asistencia" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className={`card-padding ${!showAreaChart ? '' : 'hide-desktop-only'}`}>
           <h3 className="chart-card-title">Evolución (Últimas 4 Semanas)</h3>
           <div className="chart-box-height">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={30} />
                <Tooltip contentStyle={{borderRadius: '8px'}} formatter={(value) => [`${value}%`, 'Asistencia']}/>
                <Line type="monotone" dataKey="asistencia" stroke="#6366f1" strokeWidth={3} dot={{r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Tabla de Atletas */}
      <Card className="directory-card">
        <div className="directory-header">
          <h3 className="directory-title">Directorio de Atletas ({athleteStats.length})</h3>
          <span className="directory-subtitle">Ordenado por Cédula</span>
        </div>
        
        {/* Vista Desktop */}
        <div className="desktop-table-wrapper">
          <table className="athletes-table">
            <thead>
              <tr>
                <th>Cédula</th>
                <th>Atleta</th>
                <th>Área / Sub</th>
                <th className="text-center">Sesiones</th>
                <th className="text-center">Asist. / Inasist.</th>
                <th className="text-right">% Asist.</th>
              </tr>
            </thead>
            <tbody>
              {athleteStats.length > 0 ? athleteStats.map((at) => (
                <tr key={at.id} onClick={() => onSelectAthlete(at.id)}>
                  <td className="font-id">{at.id}</td>
                  <td className="font-name">{at.name}</td>
                  <td>
                    <div className="cell-subarea">{at.subarea}</div>
                    <div className="cell-meta">{at.area} • {at.category}</div>
                  </td>
                  <td className="text-center font-sessions">{at.total}</td>
                  <td className="text-center">
                    <span className="pill-att">{at.att}</span>
                    <span className="pill-abs">{at.abs}</span>
                  </td>
                  <td className="text-right">
                    <span className={`font-pct ${at.attPct >= 80 ? 'text-emerald' : at.attPct >= 60 ? 'text-amber' : 'text-rose'}`}>
                      {at.attPct.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="no-data-cell">No hay atletas registrados en este contexto temporal.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Vista Móvil (Tarjetas) */}
        <div className="mobile-cards-wrapper">
          {athleteStats.length > 0 ? athleteStats.map((at) => (
            <div key={at.id} className="athlete-mobile-card" onClick={() => onSelectAthlete(at.id)}>
              <div className="mobile-card-top">
                <div>
                  <h4 className="mobile-card-name">{at.name}</h4>
                  <span className="mobile-card-id">{at.id}</span>
                </div>
                <div className={`mobile-card-pct ${at.attPct >= 80 ? 'text-emerald' : at.attPct >= 60 ? 'text-amber' : 'text-rose'}`}>
                  {at.attPct.toFixed(0)}%
                </div>
              </div>
              <div className="mobile-card-assignment">
                <Target className="icon-xs text-muted" /> {at.subarea} <span className="text-muted">({at.category})</span>
              </div>
              <div className="mobile-card-stats-grid">
                 <div className="mobile-stat-box box-slate">
                   <div className="mobile-stat-label">Sesiones</div>
                   <div className="mobile-stat-val text-slate">{at.total}</div>
                 </div>
                 <div className="mobile-stat-box box-emerald">
                   <div className="mobile-stat-label text-emerald">Asist.</div>
                   <div className="mobile-stat-val text-emerald">{at.att}</div>
                 </div>
                 <div className="mobile-stat-box box-rose">
                   <div className="mobile-stat-label text-rose">Faltas</div>
                   <div className="mobile-stat-val text-rose">{at.abs}</div>
                 </div>
              </div>
            </div>
          )) : (
            <div className="no-data-cell">No hay atletas registrados.</div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default function AsistenciasTrainerView() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    let active = true;
    UserService.getTrainerDashboardSummary()
      .then((data) => { if (active) setDashboardData(data); })
      .catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, []);

  const realAthletes = useMemo(() => (dashboardData?.athletes || []).map((athlete) => ({
    ...athlete,
    id: athlete.id,
    assignments: (athlete.assignments || []).map((assignment) => ({
      ...assignment,
      category: assignment.category || 'Sin categoría'
    }))
  })), [dashboardData]);
  const COACH_ASSIGNMENTS = useMemo(() => {
    const assignments = { ...EMPTY_ASSIGNMENTS, subareas: {} };
    realAthletes.forEach((athlete) => athlete.assignments.forEach(({ area, subarea, category }) => {
      if (!assignments.subareas[area]) assignments.subareas[area] = [];
      if (!assignments.subareas[area].includes(subarea)) assignments.subareas[area].push(subarea);
      if (category && !assignments.categories.includes(category)) assignments.categories.push(category);
    }));
    assignments.areas = Object.keys(assignments.subareas);
    return assignments;
  }, [realAthletes]);
  const realSessions = useMemo(() => (dashboardData?.attendance_records || []).flatMap((record) => {
    const athlete = realAthletes.find((item) => item.id === record.athleteId);
    return (athlete?.assignments || [{ area: 'Sin área', subarea: 'Sin subárea', category: 'Sin categoría' }]).map((assignment) => ({
      id: `${record.id}-${assignment.subarea}`,
      athleteId: record.athleteId,
      athleteName: athlete?.name || 'Atleta',
      date: record.date,
      ...assignment,
      status: record.status === 'Presente' ? STATUS.ATTENDANCE
        : record.status === 'Ausente' ? STATUS.ABSENCE : STATUS.JUSTIFIED
    }));
  }), [dashboardData, realAthletes]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  
  const [navContext, setNavContext] = useState({ type: 'global', value: null });
  const [selectedPeriod, setSelectedPeriod] = useState('6meses');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchState, setSearchState] = useState('idle');
  const searchTimeout = useRef(null);

  const filteredSessions = useMemo(() => {
    let base = filterSessionsByPeriod(realSessions, selectedPeriod);
    
    if (navContext.type === 'area') {
      base = base.filter(s => s.area === navContext.value);
    } else if (navContext.type === 'subarea') {
      base = base.filter(s => s.subarea === navContext.value);
    }
    
    return base;
  }, [navContext, selectedPeriod, realSessions]);

  const handleSearchChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setSearchQuery(val);
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (val.length < 3) {
      setSearchState('idle');
      return;
    }

    setSearchState('searching_local');
    
    searchTimeout.current = setTimeout(() => {
      const match = realAthletes.find(a => String(a.cedula || a.id).includes(val));
      
      if (match) {
        setSearchState('found');
      } else {
        if (val.length >= 5) {
           setSearchState('searching_server');
           setTimeout(() => {
              setSearchState('not_found');
           }, 1000);
        } else {
           setSearchState('not_found_local');
        }
      }
    }, 400);
  };

  const executeSearch = () => {
    const match = realAthletes.find(a => String(a.cedula || a.id).includes(searchQuery));
    if (match) {
      handleSelectAthlete(match.id);
      setSearchQuery('');
      setSearchState('idle');
    }
  };

  const handleSelectAthlete = (id) => {
    setSelectedAthlete(id);
    setCurrentView('athlete');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loadError) return <div className="attendance-view"><div className="no-data-cell">No se pudieron cargar las asistencias.</div></div>;
  if (!dashboardData) return <div className="attendance-view"><div className="no-data-cell">Cargando asistencias...</div></div>;

  return (
    <div className="attendance-view">
        <div className="attendance-toolbar">
          
          {/* Breadcrumbs */}
          <div className="attendance-breadcrumbs">
            <span className="breadcrumb-link" onClick={() => {setNavContext({type:'global', value:null}); setCurrentView('dashboard');}}>Asistencias</span>
            <ChevronRight className="icon-xs text-muted" />
            
            {navContext.type !== 'global' && (
              <>
                <span className={`breadcrumb-link ${navContext.type === 'area' && !selectedAthlete ? 'breadcrumb-active' : ''}`}
                  onClick={() => {
                     if(navContext.type === 'subarea') {
                        const area = Object.keys(COACH_ASSIGNMENTS.subareas).find(a => COACH_ASSIGNMENTS.subareas[a].includes(navContext.value));
                        setNavContext({type: 'area', value: area});
                     }
                     setCurrentView('dashboard');
                  }}
                >
                  {navContext.type === 'subarea' ? Object.keys(COACH_ASSIGNMENTS.subareas).find(a => COACH_ASSIGNMENTS.subareas[a].includes(navContext.value)) : navContext.value}
                </span>
                <ChevronRight className="icon-xs text-muted" />
              </>
            )}

            {navContext.type === 'subarea' && (
              <>
                <span className={`breadcrumb-link ${!selectedAthlete ? 'breadcrumb-active' : ''}`} onClick={() => setCurrentView('dashboard')}>
                  {navContext.value}
                </span>
                {selectedAthlete && <ChevronRight className="icon-xs text-muted" />}
              </>
            )}

            {selectedAthlete && (
              <span className="breadcrumb-active">{realAthletes.find(a=>a.id===selectedAthlete)?.name}</span>
            )}
          </div>

          {/* Filters Row */}
          <div className="attendance-toolbar-row">
            <h1 className="attendance-title">
              {currentView === 'athlete' ? 'Detalle de Atleta' : 'Asistencia Global'}
            </h1>

            <div className="attendance-controls flex-center-gap">
              <div className="attendance-area-selector">
                <select
                  aria-label="Seleccionar área"
                  value={navContext.type === 'global'
                    ? 'global'
                    : navContext.type === 'area'
                      ? navContext.value
                      : COACH_ASSIGNMENTS.areas.find((area) => COACH_ASSIGNMENTS.subareas[area].includes(navContext.value))}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNavContext(value === 'global' ? { type: 'global', value: null } : { type: 'area', value });
                    setSelectedAthlete(null);
                    setCurrentView('dashboard');
                  }}
                >
                  <option value="global">Vista Global</option>
                  {COACH_ASSIGNMENTS.areas.map((area) => <option key={area} value={area}>{area}</option>)}
                </select>
              </div>

              <div className="attendance-subarea-selector">
                <select
                  aria-label="Seleccionar subárea"
                  value={navContext.type === 'subarea' ? navContext.value : 'all'}
                  onChange={(e) => {
                    const subarea = e.target.value;
                    if (subarea === 'all') {
                      const selectedArea = navContext.type === 'area' ? navContext.value : null;
                      setNavContext(selectedArea ? { type: 'area', value: selectedArea } : { type: 'global', value: null });
                    } else {
                      setNavContext({ type: 'subarea', value: subarea });
                    }
                    setSelectedAthlete(null);
                    setCurrentView('dashboard');
                  }}
                >
                  <option value="all">Todas las subáreas</option>
                  {COACH_ASSIGNMENTS.areas
                    .filter((area) => navContext.type !== 'area' || navContext.value === area)
                    .flatMap((area) => COACH_ASSIGNMENTS.subareas[area])
                    .map((subarea) => <option key={subarea} value={subarea}>{subarea}</option>)}
                </select>
              </div>

              {/* Buscador por Cédula */}
              <div className="attendance-search search-input-wrapper">
                <div className="search-icon-left">
                  {searchState === 'searching_local' || searchState === 'searching_server' ? 
                    <RefreshCcw className="icon-sm text-indigo spin" /> : 
                    <Search className="icon-sm text-muted" />
                  }
                </div>
                <input
                  type="text"
                  placeholder="Buscar cédula (Ej: V-10...)"
                  className="search-input"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={(e) => e.key === 'Enter' && searchState === 'found' && executeSearch()}
                />
                <div className="search-icon-right">
                   <Fingerprint className="icon-sm text-muted" />
                </div>
                
                {/* Search Feedback Tooltip */}
                {searchQuery.length > 0 && searchState !== 'idle' && (
                  <div className="search-tooltip">
                    {searchState === 'searching_local' && <span className="tooltip-text text-muted"><RefreshCcw className="icon-xs spin"/> Buscando localmente...</span>}
                    {searchState === 'not_found_local' && <span className="tooltip-text text-amber"><AlertCircle className="icon-xs"/> No encontrada localmente. Ingresa más dígitos.</span>}
                    {searchState === 'searching_server' && <span className="tooltip-text text-indigo"><Database className="icon-xs pulse"/> Buscando en base de datos...</span>}
                    {searchState === 'found' && <button onClick={executeSearch} className="btn-search-found"><span>Atleta encontrado</span> <ArrowUpRight className="icon-xs"/></button>}
                    {searchState === 'not_found' && <span className="tooltip-text text-rose"><XCircle className="icon-xs"/> No se encontró la cédula.</span>}
                  </div>
                )}
              </div>

              {/* Selector de Período */}
              <div className="attendance-period select-wrapper">
                <select 
                  className="period-select"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  <option value="hoy">Hoy</option>
                  <option value="semana">Esta semana</option>
                  <option value="mes">Este mes</option>
                  <option value="3meses">Últimos 3 meses</option>
                  <option value="6meses">Últimos 6 meses</option>
                  <option value="ano">Este año</option>
                </select>
                <div className="select-icons">
                  <Clock className="icon-xs mr-1"/>
                  <ChevronDown className="icon-xs" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="content-container">
          {currentView === 'dashboard' ? (
            <DashboardView 
              assignments={COACH_ASSIGNMENTS} 
              sessions={filteredSessions} 
              athletes={realAthletes}
              navContext={navContext}
              onSelectAthlete={handleSelectAthlete}
            />
          ) : (
            <AthleteDetailView 
              athleteId={selectedAthlete} 
              onBack={() => setCurrentView('dashboard')}
              allSessions={realSessions}
              athletes={realAthletes}
              period={selectedPeriod}
            />
          )}
        </div>
    </div>
  );
}
