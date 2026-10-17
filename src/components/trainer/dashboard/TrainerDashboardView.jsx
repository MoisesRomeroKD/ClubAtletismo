import React, { useEffect, useState } from 'react';
import {
  Users, UserCheck, AlertCircle,
  Moon, Calendar, Clock, Layers, CheckCircle2, Dumbbell
} from 'lucide-react';

import '../../../styles/components/trainer/TrainerDashboardView.css';
import UserService from '../../../api/services/Userservice';
import CargaCircular from '../../layout/CargaCircular';

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

const StatCard = ({ title, value, subtitle, icon: Icon }) => (
  <div className="glass-card metric-card">
    <div className="metric-header">
      <span className="metric-label">{title}</span>
      <div className="icon-wrapper">
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
const AbsenceControlCard = ({ absentToday, absentAthletes, isLoading, error }) => (
  <div className="glass-card attendance-card">
    <h3 className="section-title">Inasistencias del Día</h3>

    <div className="absence-summary">
      <div className="absence-big-number">
        <span className="num-danger">{isLoading ? '...' : error ? '--' : absentToday}</span>
        <span className="label">Atletas Ausentes Hoy</span>
      </div>
    </div>

    <div className="absent-athletes-section">
      <h4 className="sub-title">Detalle de Ausencias:</h4>
      {isLoading ? (
        <p className="areas-empty">Cargando asistencias...</p>
      ) : error ? (
        <p className="areas-empty">No fue posible cargar las asistencias.</p>
      ) : absentAthletes.length > 0 ? (
        <ul className="pending-list">
          {absentAthletes.map((athlete) => (
            <li key={athlete.id} className="pending-item">
              <span className="athlete-name">{athlete.name}</span>
              <span className="subarea-tag">{athlete.subareas.join(', ') || 'Sin subárea'}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="all-done-msg">
          <CheckCircle2 size={14} />
          Plantilla completa hoy.
        </p>
      )}
    </div>
  </div>
);

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
      <div className="score-big">
        {isLoading ? '...' : error ? '--' : (score ?? '--')}{' '}
        <span className="score-max">/ 10</span>
      </div>
      <p className="score-label">Promedio de descanso del equipo hoy</p>
    </div>

    <div className="pending-sleep-section">
      <h4 className="sub-title">
        <AlertCircle size={14} className="icon-warning" />
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
        <p className="all-done-msg">
          <CheckCircle2 size={14} />
          ¡Todos los atletas ingresaron su calificación de sueño!
        </p>
      )}
    </div>
  </div>
);

// Módulo del Plan de Entrenamiento del día: sesión de hoy de cada plan publicado
const SubAreaPlansCard = ({ plans, isLoading, error }) => (
  <div className="glass-card subarea-plans-card">
    <h3 className="section-title">
      <Calendar size={18} /> Plan de Entrenamiento del Día
    </h3>

    {isLoading ? (
      <p className="areas-empty">Cargando planes...</p>
    ) : error ? (
      <p className="areas-empty">No fue posible cargar los planes.</p>
    ) : plans.length === 0 ? (
      <p className="areas-empty">No hay sesiones programadas para hoy en tus planes publicados.</p>
    ) : (
      <div className="subarea-plans-grid">
        {plans.map((plan) => (
          <div key={`${plan.plan_id}-${plan.semana}`} className="subarea-plan-box">
            <div className="subarea-header">
              <span className="area-badge">Semana {plan.semana}</span>
              <h4>{plan.plan}</h4>
              {plan.asignado_a && <span className="subarea-tag">{plan.asignado_a}</span>}
            </div>
            <div className="session-list">
              {plan.ejercicios.length === 0 ? (
                <p className="areas-empty">Sesión sin ejercicios cargados.</p>
              ) : plan.ejercicios.map((ejercicio) => (
                <div key={ejercicio.id} className="session-item">
                  <div className="session-info">
                    <span className="session-time"><Dumbbell size={12} className="icon-inline" /> {ejercicio.series} x {ejercicio.repeticiones}</span>
                    <span className="session-type">{ejercicio.nombre}</span>
                  </div>
                  {ejercicio.intensidad && (
                    <div className="session-meta">
                      <span className="intensity-normal">{ejercicio.intensidad}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ============================================================================
// 📁 COMPONENTE PRINCIPAL
// ============================================================================

export const TrainerDashboardView = () => {
  // Todo el Home sale de una sola petición con datos reales.
  const [home, setHome] = useState({ data: null, error: false });

  useEffect(() => {
    let isMounted = true;
    UserService.getHomeEntrenador()
      .then((data) => { if (isMounted) setHome({ data, error: false }); })
      .catch(() => { if (isMounted) setHome({ data: null, error: true }); });
    return () => { isMounted = false; };
  }, []);

  const data = home.data;
  const isLoading = data === null && !home.error;
  const kpi = (campo) => (data ? data.kpis[campo] : '—');

  if (isLoading) return <CargaCircular texto="Cargando Home" />;

  return (
    <div className="dashboard-grid">
      <WelcomeBanner />

      {/* KPI Cards Superiores */}
      <StatCard
        title="Atletas Totales"
        value={kpi('atletas_totales')}
        icon={Users}
      />
      <StatCard
        title="Atletas Activos"
        value={kpi('atletas_activos')}
        subtitle="Disponibles para entrenar"
        icon={UserCheck}
      />
      <StatCard
        title="Atletas Justificados"
        value={kpi('atletas_justificados')}
        subtitle="Reposo / Permisos"
        icon={AlertCircle}
      />
      <StatCard
        title="Pendientes Nota Sueño"
        value={kpi('pendientes_sueno')}
        subtitle="Activos sin registro hoy (1-10)"
        icon={Moon}
      />

      {/* Módulos Principales de Operación */}
      <AbsenceControlCard
        absentToday={data?.ausentes_hoy.length ?? 0}
        absentAthletes={data?.ausentes_hoy ?? []}
        isLoading={isLoading}
        error={home.error}
      />

      <AtletismAreasCard
        areas={data?.areas ?? []}
        isLoading={isLoading}
        error={home.error}
      />

      <SleepQualityCard
        score={data?.sueno.promedio_hoy}
        pendingList={data?.sueno.pendientes ?? []}
        isLoading={isLoading}
        error={home.error}
      />

      {/* Sesión de hoy de cada plan publicado */}
      <SubAreaPlansCard plans={data?.planes_hoy ?? []} isLoading={isLoading} error={home.error} />
    </div>
  );
};

export default TrainerDashboardView;