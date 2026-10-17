import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainNav from '../components/layout/user/MainNav';
import UserService from '../api/services/Userservice';
import RoutineService from '../api/services/RoutineService';
import '../styles/pages/AthleteDashboard.css';

import SleepQualityDashboard from '../components/atleta/AthleteSleep/SleepQualityDashboard'; 
import HistorialSuenoAtleta from '../components/atleta/AthleteSleep/HistorialSuenoAtleta';
import AsistenciaAtletaView from '../components/atleta/asistencia/AsistenciaAtletaView';
import AntropometriaAtletaView from '../components/atleta/antropometria/AntropometriaAtletaView';
import HomeAtleta from '../components/atleta/home/HomeAtleta';
import TestsAtleta from '../components/atleta/tests/TestsAtleta';
import PerfilAtleta from '../components/atleta/perfil/PerfilAtleta';
import CargaCircular from '../components/layout/CargaCircular';

const ATHLETE_ROUTE_PATHS = {
  home: '/atleta/home',
  tests: '/atleta/tests',
  asistencias: '/atleta/asistencias',
  antropometria: '/atleta/antropometria',
  sueno: '/atleta/sueno',
  sueno_historial: '/atleta/sueno-historial',
  perfil: '/atleta/perfil',
  rutina: '/atleta/rutina',
};

export default function AthleteDashboard({ onActionChange, onLogout, isDarkMode, onToggleTheme }) {
  const location = useLocation();
  const navigate = useNavigate();
  const legacyRouteActions = {
    '/atleta/dashboard': 'home',
    '/atleta/asistencia': 'asistencias',
  };
  const routeActiveAction = Object.entries(ATHLETE_ROUTE_PATHS)
    .find(([, path]) => path === location.pathname)?.[0]
    || legacyRouteActions[location.pathname];
  const effectiveAction = routeActiveAction || 'home';

  const handleTabChange = (newTab) => {
    const path = ATHLETE_ROUTE_PATHS[newTab];
    if (path) navigate(path);
    if (onActionChange && typeof onActionChange === 'function') {
      onActionChange(newTab);
    }
  };

  const [userData, setUserData] = useState({ name: '', id: null });
  const [sleepData, setSleepData] = useState([]);
  const [routine, setRoutine] = useState([]);
  const [routineError, setRoutineError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedName = localStorage.getItem("user_name") || localStorage.getItem("userName");
    const storedId = localStorage.getItem("user_id") || localStorage.getItem("userId");

    if (!storedName || !storedId) {
      console.warn("Advertencia: No se encontraron las credenciales en localStorage.");
      setIsLoading(false);
      return;
    }

    setUserData({ name: storedName, id: storedId });

    const fetchAthleteData = async () => {
      try {
        setIsLoading(true);
        const [sleepRes, routineRes] = await Promise.allSettled([
          UserService.getSleepHistoryByAthlete(storedId),
          RoutineService.list(),
        ]);

        if (sleepRes.status === 'fulfilled' && sleepRes.value) {
          const sleepHistorial = sleepRes.value.historial || sleepRes.value;
          setSleepData(Array.isArray(sleepHistorial) ? sleepHistorial : []);
        }

        if (routineRes.status === 'fulfilled') {
          const plans = Array.isArray(routineRes.value) ? routineRes.value : routineRes.value?.results || [];
          setRoutine(plans);
        } else {
          setRoutineError(routineRes.reason?.response?.data?.detail || 'No se pudieron cargar tus rutinas.');
        }
      } catch (error) {
        console.error("Error de sincronización:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAthleteData();
  }, []);

  if (isLoading) {
    return <CargaCircular texto="Cargando" />;
  }

  return (
    <MainNav
      role="atleta"
      roleTitle="Atleta"
      activeTab={effectiveAction}
      onTabChange={handleTabChange}
      onLogout={onLogout}
      isDarkMode={isDarkMode}
      onToggleTheme={onToggleTheme}
    >
      <div className="dashboard-page" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-main)', minHeight: '100vh' }}>
        <div className="dashboard-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* VISTA HOME (datos reales del backend) */}
          {effectiveAction === 'home' && (
            <HomeAtleta onNavigate={handleTabChange} />
          )}

          {/* VISTA RUTINA */}
          {effectiveAction === 'rutina' && (
            <div className="dashboard-card max-w-mid" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)', borderRadius: '12px' }}>
              <h3 className="section-title" style={{ borderBottom: '2px solid var(--func-primary)', display: 'inline-block', paddingBottom: '5px' }}>
                Mi Plan Semanal
              </h3>
              {routineError ? (
                <div role="alert" className="empty-state" style={{ marginTop: '1rem' }}>{routineError}</div>
              ) : routine.length ? (
                <div className="routine-list" style={{ marginTop: '1rem' }}>
                  {routine.map((plan) => (
                    <article className="routine-item" key={plan.id} style={{ display: 'block', padding: '12px 0', borderBottom: '1px solid var(--border-main)' }}>
                      <h4>{plan.nombre}</h4>
                      {plan.weeks.map((week) => (
                        <section key={week.id}>
                          <strong>Semana {week.numero_semana} · {week.fecha_inicio} – {week.fecha_fin}</strong>
                          <p>{week.objetivo}</p>
                          {week.sessions.map((session) => (
                            <div key={session.id}>
                              <span className="day-label">{session.dia_semana}</span>
                              {session.session_exercises.map((item) => (
                                <p className="task-text" key={item.id}>
                                  {item.exercise_name} · {item.series} series × {item.repeticiones} reps · micro {item.micro_pausa || 'Consultar'} · macro {item.macro_pausa || 'Consultar'} · {item.intensidad || 'Intensidad por consultar'}
                                </p>
                              ))}
                            </div>
                          ))}
                        </section>
                      ))}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ marginTop: '1rem', color: 'var(--clr-gris-base)' }}>No tienes rutinas asignadas aún.</div>
              )}
            </div>
          )}

          {/* VISTA SUEÑO */}
          {effectiveAction === 'sueno' && (
            <SleepQualityDashboard
              onRegistrado={() => {
                UserService.getSleepHistoryByAthlete(userData.id)
                  .then((res) => {
                    const historial = res?.historial || res;
                    setSleepData(Array.isArray(historial) ? historial : []);
                  })
                  .catch(() => {});
              }}
            />
          )}

          {/* VISTA HISTORIAL DE SUEÑO */}
          {effectiveAction === 'sueno_historial' && (
            <HistorialSuenoAtleta sleepData={sleepData} />
          )}

          {/* VISTA ASISTENCIA */}
          {(effectiveAction === 'asistencia' || effectiveAction === 'asistencias') && (
            <div className="dashboard-card width-full" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)', borderRadius: '12px' }}>
              <AsistenciaAtletaView 
                athleteId={userData.id} 
                athleteName={userData.name} 
              />
            </div>
          )}

          {/* VISTA TESTS (solo consulta) */}
{effectiveAction === 'tests' && (
  <div className="dashboard-card width-full">
    <TestsAtleta />
  </div>
)}

{/* VISTA ANTROPOMETRÍA */}
{(effectiveAction === 'antropometria' || effectiveAction === 'antropometría') && (
  <div className="dashboard-card width-full" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)', borderRadius: '12px' }}>
    <AntropometriaAtletaView
      athleteId={userData.id}
      athleteName={userData.name}
    />
  </div>
)}

{/* MI PERFIL: datos, entrenadores y representante (aún sin conectar al backend) */}
{effectiveAction === 'perfil' && <PerfilAtleta />}

        </div>
      </div>
    </MainNav>
  );
}