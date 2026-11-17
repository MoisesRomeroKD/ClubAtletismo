import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainNav from '../components/layout/user/MainNav';
import UserService from '../api/services/Userservice';
import '../styles/pages/AthleteDashboard.css';

import SleepQualityDashboard from '../components/atleta/AthleteSleep/SleepQualityDashboard'; 
import HistorialSuenoAtleta from '../components/atleta/AthleteSleep/HistorialSuenoAtleta';
import AsistenciaAtletaView from '../components/atleta/asistencia/AsistenciaAtletaView';
import AntropometriaAtletaView from '../components/atleta/antropometria/AntropometriaAtletaView';
import HomeAtleta from '../components/atleta/home/HomeAtleta';
import TestsAtleta from '../components/atleta/tests/TestsAtleta';
import PerfilAtleta from '../components/atleta/perfil/PerfilAtleta';
import RutinasAtleta from '../components/atleta/rutinas/RutinasAtleta';
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
        // Las rutinas las carga su propia vista (con filtros y paginación).
        const [sleepRes] = await Promise.allSettled([
          UserService.getSleepHistoryByAthlete(storedId),
        ]);

        if (sleepRes.status === 'fulfilled' && sleepRes.value) {
          const sleepHistorial = sleepRes.value.historial || sleepRes.value;
          setSleepData(Array.isArray(sleepHistorial) ? sleepHistorial : []);
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

          {/* VISTA RUTINA: sus planes con filtros (misma vista que el entrenador) */}
          {effectiveAction === 'rutina' && <RutinasAtleta />}

          {/* VISTA SUEÑO */}
          {effectiveAction === 'sueno' && (
            <SleepQualityDashboard
              historial={sleepData}
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