import React, { useEffect, useMemo, useState } from 'react';
import { 
  Users, UserCheck, UserX, AlertCircle, 
  Moon, Calendar, Clock, Layers, CheckCircle2 
} from 'lucide-react';

import '../../../styles/components/trainer/TrainerDashboardView.css';
import UserService from '../../../api/services/Userservice';

// ============================================================================
// 📁 MOCK DATA (Especializado para Atletismo)
// ============================================================================

const MOCK_ATHLETE_METRICS = {
  totales: 42,
  disponibles: 37,
  justificados: 3, 
  sinRegistroSueno: 4, 
  calidadSuenoGrupal: 8.2, 
};

// Planes de Entrenamiento del día por Sub-área de Atletismo
const MOCK_ATHLETISM_PLANS = [
  {
    id: 'plan-1',
    area: 'Velocidad',
    subArea: '100m / 200m',
    sessions: [
      { id: 101, type: 'Salidas de Taco + Aceleración (30m)', time: '07:00 AM', duration: '75 min', intensity: 'Alta' },
      { id: 102, type: 'Pesas / Potencia Reactiva', time: '10:00 AM', duration: '60 min', intensity: 'Alta' },
    ]
  },
  {
    id: 'plan-2',
    area: 'Saltos',
    subArea: 'Salto Largo / Triple',
    sessions: [
      { id: 201, type: 'Técnica de Batida y Fosa', time: '07:30 AM', duration: '90 min', intensity: 'Media' },
    ]
  },
  {
    id: 'plan-3',
    area: 'Lanzamientos',
    subArea: 'Lanzamiento de Jabalina',
    sessions: [
      { id: 301, type: 'Lanzamientos Rápidos + Movilidad Hombro', time: '08:00 AM', duration: '90 min', intensity: 'Media' },
    ]
  },
  {
    id: 'plan-4',
    area: 'Fondo y Semifondo',
    subArea: '21k / 42k',
    sessions: [
      { id: 401, type: 'Rodaje Continuo Acumulativo (18k)', time: '06:00 AM', duration: '110 min', intensity: 'Media' },
    ]
  }
];

// ============================================================================
// 📁 COMPONENTES INTERNOS
// ============================================================================

const WelcomeBanner = () => (
  <div className="glass-card welcome-banner">
    <div className="welcome-content">
      <h1 className="text-gradient">Panel Operativo de Atletismo</h1>
      <p>Supervisión diaria de pista y campo por áreas especializadas.</p>
    </div>
    <div className="date-display">
      <Clock size={16} />
      <span>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
    </div>
  </div>
);

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
  <div className="glass-card metric-card">
    <div className="metric-header">
      <span className="metric-label">{title}</span>
      <div className={`icon-wrapper ${colorClass || ''}`}>
        {React.createElement(Icon, { size: 18, className: 'metric-icon' })}
      </div>
    </div>
    <div className="metric-value-container">
      <span className="metric-value">{value}</span>
      {subtitle && <span className="metric-subtitle">{subtitle}</span>}
    </div>
  </div>
);

// Control de Inasistencias (100% Informativo para el Entrenador)
const AbsenceControlCard = ({ absentToday, absentAthletes, isLoading, error }) => {
  return (
    <div className="glass-card attendance-card">
      <h3 className="section-title">Inasistencias del Día</h3>
      
      <div className="absence-summary">
        <div className="absence-big-number">
          <span className="num-danger">{isLoading ? '...' : error ? '--' : absentToday}</span>
          <span className="label">Atletas Ausentes Hoy</span>
        </div>
      </div>

      <div className="absent-athletes-section" style={{ marginTop: '1rem' }}>
        <h4 className="sub-title" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Detalle de Ausencias:
        </h4>
        {isLoading ? (
          <p className="areas-empty">Cargando asistencias...</p>
        ) : error ? (
          <p className="areas-empty">No fue posible cargar las asistencias.</p>
        ) : absentAthletes.length > 0 ? (
          <ul className="pending-list" style={{ marginTop: '0.5rem' }}>
            {absentAthletes.map((athlete) => (
              <li key={athlete.id} className="pending-item">
                <span className="athlete-name">{athlete.name}</span>
                <span className="subarea-tag">{athlete.subareas.join(', ') || 'Sin subárea'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="all-done-msg" style={{ marginTop: '0.5rem' }}>
            <CheckCircle2 size={14} color="var(--accent-cyan)" /> Plantilla completa hoy.
          </p>
        )}
      </div>
    </div>
  );
};

// Módulo de Áreas y Sub-áreas de Atletismo
const AtletismAreasCard = ({ areas, isLoading, error }) => (
  <div className="glass-card area-breakdown-card">
    <h3 className="section-title">
      <Layers size={18} /> Atletas por Área y Sub-área
    </h3>
    <div className="areas-container">
      {isLoading ? (
        <p className="areas-empty">Cargando asignaciones...</p>
      ) : error ? (
        <p className="areas-empty">No fue posible cargar las asignaciones.</p>
      ) : areas.length === 0 ? (
        <p className="areas-empty">No tienes subáreas con atletas asignados.</p>
      ) : areas.map((group) => (
        <div key={group.area} className="area-group-box">
          <h4 className="area-group-title">{group.area}</h4>
          <div className="subarea-list">
            {group.subAreas.map((sub) => (
              <div key={sub.name} className="subarea-row">
                <span className="subarea-name">{sub.name}</span>
                <span className="subarea-count">
                  <strong>{sub.assigned}</strong> asignados
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Módulo de Calidad del Sueño (1 al 10) y Faltantes
const SleepQualityCard = ({ score, pendingList, isLoading, error }) => (
  <div className="glass-card sleep-card">
    <div className="section-title">
      <Moon size={18} /> Calidad de Sueño (1 - 10)
    </div>
    
    <div className="sleep-score-container">
      <div className="score-big">{isLoading ? '...' : error ? '--' : (score ?? '--')} <span className="score-max">/ 10</span></div>
      <p className="score-label">Promedio de descanso del equipo hoy</p>
    </div>

    <div className="pending-sleep-section">
      <h4 className="sub-title" style={{ marginTop: '1rem' }}>
        <AlertCircle size={14} color="var(--state-warning)" />
        Pendientes por ingresar su nota ({isLoading || error ? '--' : pendingList.length})
      </h4>
      {isLoading ? (
        <p className="areas-empty">Cargando registros de sueño...</p>
      ) : error ? (
        <p className="areas-empty">No fue posible cargar los registros de sueño.</p>
      ) : pendingList.length > 0 ? (
        <ul className="pending-list">
          {pendingList.map((athlete) => (
            <li key={athlete.id} className="pending-item">
              <span className="athlete-name">{athlete.name}</span>
              <span className="subarea-tag">{athlete.subareas.join(', ') || 'Sin subárea'}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="all-done-msg"><CheckCircle2 size={14} /> ¡Todos los atletas ingresaron su calificación de sueño!</p>
      )}
    </div>
  </div>
);

// Módulo del Plan de Entrenamiento por Sub-área
const SubAreaPlansCard = ({ plans }) => (
  <div className="glass-card subarea-plans-card" style={{ gridColumn: '1 / -1' }}>
    <h3 className="section-title">
      <Calendar size={18} /> Plan de Entrenamiento del Día (por Sub-área)
    </h3>

    <div className="subarea-plans-grid">
      {plans.map((plan) => (
        <div key={plan.id} className="subarea-plan-box">
          <div className="subarea-header">
            <span className="area-badge">{plan.area}</span>
            <h4>{plan.subArea}</h4>
          </div>
          <div className="session-list">
            {plan.sessions.map((session) => (
              <div key={session.id} className="session-item">
                <div className="session-info">
                  <span className="session-time">{session.time}</span>
                  <span className="session-type">{session.type}</span>
                </div>
                <div className="session-meta">
                  <span><Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />{session.duration}</span>
                  <span style={{ color: session.intensity === 'Alta' ? 'var(--state-danger)' : 'var(--text-secondary)' }}>
                    {session.intensity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ============================================================================
// 📁 COMPONENTE PRINCIPAL
// ============================================================================

export const TrainerDashboardView = () => {
  const [myAthletes, setMyAthletes] = useState(null);
  const [mySubareas, setMySubareas] = useState([]);
  const [assignmentError, setAssignmentError] = useState(false);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [summaryError, setSummaryError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadAssignments = async () => {
      const [athletesResult, subareasResult] = await Promise.allSettled([
        UserService.getMyAthletes(),
        UserService.getMySubareas(),
      ]);

      if (!isMounted) return;

      if (athletesResult.status === 'fulfilled') {
        setMyAthletes(Array.isArray(athletesResult.value) ? athletesResult.value : []);
      } else {
        setMyAthletes([]);
        setAssignmentError(true);
      }

      if (subareasResult.status === 'fulfilled') {
        setMySubareas(Array.isArray(subareasResult.value) ? subareasResult.value : []);
      } else {
        setAssignmentError(true);
      }
    };

    loadAssignments();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;

    UserService.getTrainerDashboardSummary()
      .then((summary) => {
        if (isMounted) setDashboardSummary(summary);
      })
      .catch(() => {
        if (isMounted) setSummaryError(true);
      });

    return () => { isMounted = false; };
  }, []);

  const athletesByArea = useMemo(() => {
    if (myAthletes === null) return [];

    const groups = new Map();
    mySubareas.forEach((assignment) => {
      const subarea = assignment.subarea_detalle;
      const areaName = subarea?.area?.nombre;
      const subareaName = subarea?.nombre;
      if (!areaName || !subareaName) return;

      if (!groups.has(areaName)) groups.set(areaName, []);
      const assigned = myAthletes.filter((athlete) => (
        (Array.isArray(athlete.subareas_nombres)
          ? athlete.subareas_nombres
          : (athlete.subareas_lista_texto || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        ).includes(subareaName)
      )).length;
      groups.get(areaName).push({ name: subareaName, assigned });
    });

    return Array.from(groups, ([area, subAreas]) => ({ area, subAreas }));
  }, [myAthletes, mySubareas]);

  return (
    <div className="dashboard-grid">
      <WelcomeBanner />

      {/* KPI Cards Superiores */}
      <StatCard 
        title="Atletas Totales" 
        value={myAthletes === null ? '—' : myAthletes.length}
        icon={Users} 
      />
      <StatCard 
        title="Atletas Disponibles" 
        value={MOCK_ATHLETE_METRICS.disponibles} 
        subtitle="Listos en pista/campo"
        icon={UserCheck} 
      />
      <StatCard 
        title="Atletas Justificados" 
        value={MOCK_ATHLETE_METRICS.justificados} 
        subtitle="Reposo / Permisos"
        icon={AlertCircle} 
      />
      <StatCard 
        title="Pendientes Nota Sueño" 
        value={MOCK_ATHLETE_METRICS.sinRegistroSueno} 
        subtitle="Faltan por registrar (1-10)"
        icon={Moon} 
      />

      {/* Módulos Principales de Operación */}
      <AbsenceControlCard
        absentToday={dashboardSummary?.attendance?.absent_today ?? 0}
        absentAthletes={dashboardSummary?.attendance?.absent_athletes ?? []}
        isLoading={dashboardSummary === null && !summaryError}
        error={summaryError}
      />

      <AtletismAreasCard areas={athletesByArea} isLoading={myAthletes === null} error={assignmentError} />

      <SleepQualityCard
        score={dashboardSummary?.sleep?.average_today}
        pendingList={dashboardSummary?.sleep?.pending_athletes ?? []}
        isLoading={dashboardSummary === null && !summaryError}
        error={summaryError}
      />

      {/* Planes por Sub-área de Atletismo */}
      <SubAreaPlansCard plans={MOCK_ATHLETISM_PLANS} />
    </div>
  );
};

export default TrainerDashboardView;
