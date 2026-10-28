import React, { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

// 🔝 IMPORTACIÓN DEL LAYOUT CONTENEDOR
import MainNav from '../components/layout/user/MainNav';

import '../styles/pages/TrainerDashboard.css';
import UserService from '../api/services/Userservice';
import CargaCircular from '../components/layout/CargaCircular';
import { useApplicationPermissions } from '../context/ApplicationPermissionsContext';

// 💤 Datos y contexto del módulo de Sueño y Descanso (sin coachContext)
// Los pendientes de sueño son siempre los de hoy.
const SLEEP_PERIOD = 'hoy';
// "Hoy" en hora de Caracas (no UTC: después de las 8 p. m. UTC ya sería el día siguiente).
const hoyCaracas = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Caracas' });
const TRAINER_ROUTE_PATHS = {
  home: '/entrenador/home',
  perfil: '/entrenador/perfil',
  mis_atletas: '/entrenador/mis-atletas',
  asistencias: '/entrenador/asistencias',
  registro_asistencia: '/entrenador/asistencias/registro',
  mis_tests: '/entrenador/mis-tests',
  crear_test: '/entrenador/crear-test',
  tests_resultados: '/entrenador/tests-resultados',
  tests_analisis: '/entrenador/tests-analisis',
  cineantropometria: '/entrenador/cineantropometria',
  cine_programar: '/entrenador/cineantropometria/programar',
  cine_datos: '/entrenador/cineantropometria/datos',
  'sueño_general': '/entrenador/sueno-general',
  'sueño_individual': '/entrenador/sueno-individual',
  'sueño_pendientes': '/entrenador/sueno-pendientes',
  rutina: '/entrenador/rutina',
  gestion_rutinas: '/entrenador/gestion-rutinas',
  reportes: '/entrenador/reportes',
};

// ⏱️ Helper técnico para forzar un retardo de red artificial y estabilizar el Skeleton
const lazyWithDelay = (importFunction, delay = 300) => {
  return lazy(() =>
    Promise.all([
      importFunction(),
      new Promise(resolve => setTimeout(resolve, delay))
    ]).then(([moduleExports]) => moduleExports)
  );
};

// 🚀 Lazy Loading a demanda de componentes
const BuilderPlanForm = lazyWithDelay(() => import('../components/trainer/builderplan/BuilderPlanForm'));
const RoutineManager = lazyWithDelay(() => import('../components/trainer/builderplan/RoutineManager'));
const TrainerDashboardView = lazyWithDelay(() => import('../components/trainer/dashboard/TrainerDashboardView'));

// 📐 Importación perezosa del Módulo de Cineantropometría
const CineantropometriaTrainer = lazyWithDelay(() => import('../components/trainer/cineantropometria/CineantropometriaTrainer'));
const MedicionesTrainer = lazyWithDelay(() => import('../components/trainer/cineantropometria/MedicionesTrainer'));

// 💤 Importación perezosa de los componentes del módulo de Sueño y Descanso
const SleepGeneralView = lazyWithDelay(() => import('../components/trainer/sleeptracker/SleepGeneralView'));
const SleepIndividualView = lazyWithDelay(() => import('../components/trainer/sleeptracker/SleepIndividualView'));
const SleepPendingView = lazyWithDelay(() => import('../components/trainer/sleeptracker/SleepPendingView'));
const SleepAthleteDetailPanel = lazyWithDelay(() => import('../components/trainer/sleeptracker/SleepAthleteDetailPanel'));
const SleepRegistrationView = lazyWithDelay(() => import('../components/trainer/sleeptracker/SleepRegistrationView'));

// 📋 Importación perezosa del Módulo de Asistencias
const AsistenciasTrainerView = lazyWithDelay(() => import('../components/trainer/asistencias/AsistenciasTrainerView'));
const RegistroAsistencia = lazyWithDelay(() => import('../components/RegistroAsistencia'));

// 👥 Importación perezosa del componente Atletas Trainer
const AtletasTrainer = lazyWithDelay(() => import('../components/trainer/AtletasViewTrainer/AtletasViewTrainer'));

// 👤 Importación perezosa del componente Perfil Trainer
const PerfilTrainer = lazyWithDelay(() => import('../components/trainer/perfilTrainer/PerfilTrainer'));

const ReporteEntrenador = lazyWithDelay(() => import('../components/trainer/reportes/ReporteEntrenador'));
const TestsTrainer = lazyWithDelay(() => import('../components/trainer/tests/TestsTrainer'));
const ResultadosTestsTrainer = lazyWithDelay(() => import('../components/trainer/tests/ResultadosTestsTrainer'));
const AnalisisTestsTrainer = lazyWithDelay(() => import('../components/trainer/tests/AnalisisTestsTrainer'));

// 🎨 Color asociado a cada nivel de calidad de sueño (1-10)
function qualityColor(quality) {
  if (quality >= 8) return 'var(--sl-success, #16a34a)';
  if (quality >= 5) return 'var(--sl-warning, #d97706)';
  return 'var(--sl-danger, #dc2626)';
}

/**
 * TRAINER DASHBOARD - PANEL DE MÁXIMO RENDIMIENTO
 */
export default function TrainerDashboard({
  currentAction,
  setCurrentAction,
  athletes = [],
  isLoading = false,
  setSelectedAthlete,
  onLogout,
  isDarkMode,
  onToggleTheme
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission, isLoading: permisosCargando } = useApplicationPermissions();
  // Se calcula en cada render: si la página queda abierta pasada la medianoche, cambia de día.
  const SYSTEM_DATE = hoyCaracas();
  const legacyRouteAction = {
    '/entrenador/dashboard': 'home',
    '/entrenador/asignar-test': 'mis_tests',
    '/entrenador/entrenamientos': 'rutina',
  }[location.pathname];
  const routeAction = Object.entries(TRAINER_ROUTE_PATHS)
    .find(([, path]) => path === location.pathname)?.[0] || legacyRouteAction;
  const rawAction = routeAction || currentAction;
  const effectiveAction = rawAction === 'sueño_registro' ? 'sueño_pendientes' : rawAction;

  const handleTabChange = (action) => {
    const path = TRAINER_ROUTE_PATHS[action];
    if (path) navigate(path);
    setCurrentAction(action);
  };

  // ────────────────────────────────────────────────────────────
  // 💤 ESTADO DEL MÓDULO DE SUEÑO Y DESCANSO
  // ────────────────────────────────────────────────────────────
  const [sleepRecords, setSleepRecords] = useState([]);
  const [trainerData, setTrainerData] = useState(null);
  const [sleepLoadError, setSleepLoadError] = useState(false);
  const [filters, setFilters] = useState({ search: '', area: 'all', status: 'all' });
  const [timeRange, setTimeRange] = useState('week');
  const [selectedAthleteForReg, setSelectedAthleteForReg] = useState(null);

  // Atleta actualmente abierto en el panel lateral de detalle (null = panel cerrado)
  const [selectedAthleteForPanel, setSelectedAthleteForPanel] = useState(null);

  // Estado para la vista individual
  const [selectedIndividualId, setSelectedIndividualId] = useState(null);

  useEffect(() => {
    let active = true;
    UserService.getTrainerDashboardSummary({ sleep_period: SLEEP_PERIOD })
      .then((data) => {
        if (!active) return;
        setTrainerData(data);
        setSleepRecords(data.sleep_records || []);
      })
      .catch(() => { if (active) setSleepLoadError(true); });
    return () => { active = false; };
  }, []);

  // Sincronización del Sidebar
  useEffect(() => {
    if (currentAction !== 'sueño_individual' && typeof setSelectedAthlete === 'function') {
      setSelectedAthlete(null);
    }
  }, [currentAction, setSelectedAthlete]);

  // Al cambiar de sección se cierra la pantalla "Registrar Sueño" si estaba abierta.
  useEffect(() => {
    setSelectedAthleteForReg(null);
  }, [currentAction]);

  // ────────────────────────────────────────────────────────────
  // 🕒 NÚCLEO DE FILTRADO POR TIEMPO
  // ────────────────────────────────────────────────────────────
  const activeSleepRecords = useMemo(() => {
    const sysDate = new Date(SYSTEM_DATE);

    return sleepRecords.filter((record) => {
      const recDate = new Date(record.date);
      const diffTime = sysDate - recDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      switch (timeRange) {
        case 'day': return diffDays === 0;
        case 'week': return diffDays >= 0 && diffDays <= 7;
        case 'month': return diffDays >= 0 && diffDays <= 30;
        case 'quarter': return diffDays >= 0 && diffDays <= 90;
        case 'semester': return diffDays >= 0 && diffDays <= 180;
        case 'year': return diffDays >= 0 && diffDays <= 365;
        default: return true;
      }
    });
  }, [sleepRecords, timeRange, SYSTEM_DATE]);

  // ────────────────────────────────────────────────────────────
  // 💤 DATOS DERIVADOS DEL MÓDULO DE SUEÑO
  // ────────────────────────────────────────────────────────────

  // Se toma directamente el universo completo de atletas
  const myAthletes = useMemo(() => (trainerData?.athletes || []).map((athlete) => ({
    ...athlete,
    assignments: (athlete.assignments || []).map((assignment) => ({
      ...assignment,
      category: assignment.category || 'Sin categoría'
    }))
  })), [trainerData]);

  // Estadísticas (registro de hoy + promedio histórico) por atleta
  const getAthleteStats = (athleteId) => {
    const records = activeSleepRecords.filter((record) => record.athleteId === athleteId);
    const todayRecord = sleepRecords.find((record) => record.athleteId === athleteId && record.date === SYSTEM_DATE);
    const avgQuality = records.length
      ? Math.round((records.reduce((sum, record) => sum + record.quality, 0) / records.length) * 10) / 10
      : 0;
    return { todayRecord, avgQuality, records };
  };

  // Filtro de búsqueda + área + estado sobre los atletas
  const filteredAthletes = useMemo(() => {
    return myAthletes.filter((athlete) => {
      const matchesSearch = athlete.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchesArea = filters.area === 'all' || athlete.area === filters.area;
      const { todayRecord } = getAthleteStats(athlete.id);
      const matchesStatus =
        filters.status === 'all' ||
        (filters.status === 'registered' && Boolean(todayRecord)) ||
        (filters.status === 'pending' && !todayRecord);
      return matchesSearch && matchesArea && matchesStatus;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myAthletes, filters, sleepRecords, activeSleepRecords]);

  // Atletas que aún no registraron sueño hoy (usando datos del backend)
  const pendingAthletes = useMemo(() => {
    return trainerData?.sleep?.pending_athletes || [];
  }, [trainerData]);

  // KPIs para la Vista General
  const dashboardStats = useMemo(() => {
    const totalAthletes = myAthletes.length;
    const pendingToday = trainerData?.sleep?.pending_today || 0;
    const registeredToday = totalAthletes - pendingToday;
    const registeredPct = totalAthletes ? Math.round((registeredToday / totalAthletes) * 100) : 0;
    const todayQualities = myAthletes
      .map((athlete) => getAthleteStats(athlete.id).todayRecord?.quality)
      .filter((quality) => typeof quality === 'number');
    const avgQualityToday = todayQualities.length
      ? Math.round((todayQualities.reduce((sum, q) => sum + q, 0) / todayQualities.length) * 10) / 10
      : 0;

    return {
      totalAthletes,
      registeredToday,
      registeredPct,
      pendingToday,
      avgQualityToday,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myAthletes, trainerData, sleepRecords, activeSleepRecords]);

  // 📊 Serie de datos estructurada para Recharts (AreaChart)
  const chartData = useMemo(() => {
    const dates = [...new Set(activeSleepRecords.map((record) => record.date))].sort();
    return dates.map((date) => {
      const dayRecords = activeSleepRecords.filter((record) => record.date === date);
      const avg = dayRecords.reduce((sum, record) => sum + record.quality, 0) / dayRecords.length;
      return {
        label: new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        quality: Math.round(avg * 10) / 10
      };
    });
  }, [activeSleepRecords]);

  // Guarda un nuevo registro de sueño con actualización inmediata y reactiva
  const handleSaveSleep = async (athleteId, quality) => {
    const response = await UserService.registerSleep(athleteId, quality);
    if (response.status !== 'success') {
      throw new Error(response.message || 'No se pudo registrar el sueño');
    }
    // Actualizar estado local inmediatamente para descontar el contador sin parpadeos
    setTrainerData((prev) => {
      if (!prev) return prev;
      const currentPending = prev.sleep?.pending_athletes || [];
      const updatedPending = currentPending.filter((a) => a.id !== athleteId);
      const newPendingToday = Math.max(0, (prev.sleep?.pending_today || 1) - 1);
      return {
        ...prev,
        sleep: {
          ...prev.sleep,
          pending_athletes: updatedPending,
          pending_today: newPendingToday,
        },
      };
    });
    setSleepRecords((prev) => [
      {
        id: `${athleteId}-${SYSTEM_DATE}`,
        athleteId,
        date: SYSTEM_DATE,
        quality: Number(quality),
        registrarName: 'Entrenador',
      },
      ...prev,
    ]);
    // Sincronizar en segundo plano
    UserService.getTrainerDashboardSummary({ sleep_period: SLEEP_PERIOD })
      .then((data) => {
        setTrainerData(data);
        setSleepRecords(data.sleep_records || []);
      })
      .catch(() => {});
    return response;
  };

  // Abre la pantalla "Registrar Sueño" (la misma de Pendientes) en la sección actual.
  const openRegistrationModal = (athlete) => {
    setSelectedAthleteForPanel(null);
    setSelectedAthleteForReg(athlete);
  };
  const registrandoSueno = Boolean(selectedAthleteForReg);

  // Abre el panel lateral de detalle para un atleta
  const openAthletePanel = (athlete) => {
    setSelectedAthleteForPanel(athlete);
  };

  // Cierra el panel lateral de detalle
  const closeAthletePanel = () => {
    setSelectedAthleteForPanel(null);
  };

  if (isLoading) return <div className="loading-container">Sincronizando atletas desde el POD...</div>;

  return (
    <MainNav
      role="entrenador"
      roleTitle="Entrenador"
      activeTab={effectiveAction}
      onTabChange={handleTabChange}
      onLogout={onLogout}
      isDarkMode={isDarkMode}
      onToggleTheme={onToggleTheme}
    >
      <div className="trainer-dashboard">
      {sleepLoadError && effectiveAction.startsWith('sueño') && (
        <div className="no-data-cell">No se pudieron sincronizar los datos de sueño.</div>
      )}
        <Suspense fallback={<CargaCircular texto="Cargando sección" />}>

          {(effectiveAction === 'home' || effectiveAction === 'dashboard_view') && (
            <div className="view-fade-in">
              <TrainerDashboardView />
            </div>
          )}

          {effectiveAction === 'rutina' && (
            <div className="view-fade-in">
              <BuilderPlanForm athletes={athletes} />
            </div>
          )}

          {effectiveAction === 'gestion_rutinas' && (
            <div className="view-fade-in">
              <RoutineManager />
            </div>
          )}

          {/* Registro de asistencia: mismo componente del admin, solo con las subáreas del entrenador */}
          {effectiveAction === 'registro_asistencia' && (
            <div className="view-fade-in">
              {permisosCargando ? <CargaCircular texto="Cargando" /> : hasPermission('registrar_asistencia')
                ? <RegistroAsistencia soloMisSubareas />
                : <div className="no-data-cell">No tienes permiso para registrar asistencia.</div>}
            </div>
          )}

          {(effectiveAction === 'asistencias' || effectiveAction === 'asistencia') && (
            <div className="view-fade-in">
              <AsistenciasTrainerView
                athletes={athletes}
                isDarkMode={isDarkMode}
              />
            </div>
          )}

          {effectiveAction === 'mis_atletas' && (
            <div className="view-fade-in">
              <AtletasTrainer />
            </div>
          )}

          {(effectiveAction === 'mis_tests' || effectiveAction === 'crear_test') && (
            <div className="view-fade-in">
              <TestsTrainer seccion={effectiveAction === 'crear_test' ? 'catalogo' : 'tests'} />
            </div>
          )}

          {effectiveAction === 'tests_analisis' && (
            <div className="view-fade-in">
              <AnalisisTestsTrainer />
            </div>
          )}

          {effectiveAction === 'tests_resultados' && (
            <div className="view-fade-in">
              <ResultadosTestsTrainer />
            </div>
          )}

          {effectiveAction === 'reportes' && (
            <div className="view-fade-in">
              <ReporteEntrenador />
            </div>
          )}

          {effectiveAction === 'perfil' && (
            <div className="view-fade-in">
              <PerfilTrainer />
            </div>
          )}

          {(effectiveAction === 'cineantropometria' || effectiveAction === 'cineantropometria_trainer') && (
            <div className="view-fade-in">
              <CineantropometriaTrainer />
            </div>
          )}

          {(effectiveAction === 'cine_programar' || effectiveAction === 'cine_datos') && (
            <div className="view-fade-in">
              <MedicionesTrainer key={effectiveAction} seccion={effectiveAction === 'cine_datos' ? 'datos' : 'programar'} />
            </div>
          )}

          {registrandoSueno && (
            <div className="view-fade-in">
              <SleepRegistrationView
                athlete={selectedAthleteForReg}
                onSave={async (athleteId, quality) => {
                  await handleSaveSleep(athleteId, quality);
                  setSelectedAthleteForReg(null);
                }}
                onCancel={() => setSelectedAthleteForReg(null)}
                systemDate={SYSTEM_DATE}
                qualityColor={qualityColor}
              />
            </div>
          )}

          {!registrandoSueno && effectiveAction === 'sueño_general' && (
            <div className="view-fade-in">
              <SleepGeneralView
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                dashboardStats={dashboardStats}
                chartData={chartData}
              />
            </div>
          )}

          {!registrandoSueno && (effectiveAction === 'sueno' || effectiveAction === 'sueño_individual') && (
            <div className="view-fade-in">
              <SleepIndividualView
                athletes={myAthletes}
                selectedAthleteId={selectedIndividualId ? parseInt(selectedIndividualId) : (myAthletes.length > 0 ? myAthletes[0].id : null)}
                setSelectedAthleteId={setSelectedIndividualId}
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                getIndividualStats={(id) => {
                  const { avgQuality, records, todayRecord } = getAthleteStats(id);
                  const expectedDays = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 1;
                  const compliancePct = Math.min(Math.round((records.length / expectedDays) * 100), 100) || 0;
                  const individualPoints = records.map(r => r.quality);

                  return {
                    avgQuality,
                    totalRecords: records.length,
                    compliancePct,
                    registeredToday: !!todayRecord,
                    todayRegistrar: todayRecord?.registrarName,
                    linePoints: individualPoints.length > 0 ? individualPoints : [0]
                  };
                }}
                filters={filters}
                setFilters={setFilters}
                filteredAthletes={filteredAthletes}
                getAthleteStats={getAthleteStats}
                openRegistrationModal={openRegistrationModal}
                onOpenPanel={openAthletePanel}
              />
            </div>
          )}

          {!registrandoSueno && effectiveAction === 'sueño_pendientes' && (
            <div className="view-fade-in">
              <SleepPendingView
                pendingAthletes={pendingAthletes}
                allAthletes={myAthletes}
                onSaveSleep={handleSaveSleep}
                systemDate={SYSTEM_DATE}
              />
            </div>
          )}

        </Suspense>

        <Suspense fallback={null}>
          <SleepAthleteDetailPanel
            athlete={selectedAthleteForPanel}
            onClose={closeAthletePanel}
            getAthleteStats={getAthleteStats}
            onRegistrar={openRegistrationModal}
            qualityColor={qualityColor}
            systemDate={SYSTEM_DATE}
          />
        </Suspense>
      </div>
    </MainNav>
  );
}