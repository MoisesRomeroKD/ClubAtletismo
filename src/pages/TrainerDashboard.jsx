import React, { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

// 🔝 IMPORTACIÓN DEL LAYOUT CONTENEDOR
import MainNav from '../components/layout/user/MainNav';

import '../styles/pages/TrainerDashboard.css';
import UserService from '../api/services/Userservice';

// 💤 Datos y contexto del módulo de Sueño y Descanso (sin coachContext)
const SYSTEM_DATE = new Date().toISOString().split('T')[0];

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
const TrainerDashboardView = lazyWithDelay(() => import('../components/trainer/dashboard/TrainerDashboardView'));

// 📐 Importación perezosa del Módulo de Cineantropometría
const CineantropometriaTrainer = lazyWithDelay(() => import('../components/trainer/cineantropometria/CineantropometriaTrainer'));

// 💤 Importación perezosa de los componentes del módulo de Sueño y Descanso
const SleepGeneralView = lazyWithDelay(() => import('../components/trainer/sleeptracker/SleepGeneralView'));
const SleepIndividualView = lazyWithDelay(() => import('../components/trainer/sleeptracker/SleepIndividualView'));
const SleepAuditView = lazyWithDelay(() => import('../components/trainer/sleeptracker/SleepAuditView'));
const SleepRegistrationView = lazyWithDelay(() => import('../components/trainer/sleeptracker/SleepRegistrationView'));
const SleepAthleteDetailPanel = lazyWithDelay(() => import('../components/trainer/sleeptracker/SleepAthleteDetailPanel'));

// 📋 Importación perezosa del Módulo de Asistencias
const AsistenciasTrainerView = lazyWithDelay(() => import('../components/trainer/asistencias/AsistenciasTrainerView'));

// 👥 Importación perezosa del componente Atletas Trainer
const AtletasTrainer = lazyWithDelay(() => import('../components/trainer/atletasTrainer/AtletasTrainer'));

// 📂 Importación perezosa del componente SubAreas Trainer
const SubAreasTrainer = lazyWithDelay(() => import('../components/trainer/subareasTrainer/SubAreasTrainer'));

// 👤 Importación perezosa del componente Perfil Trainer
const PerfilTrainer = lazyWithDelay(() => import('../components/trainer/perfilTrainer/PerfilTrainer'));

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

  // ────────────────────────────────────────────────────────────
  // 💤 ESTADO DEL MÓDULO DE SUEÑO Y DESCANSO
  // ────────────────────────────────────────────────────────────
  const [sleepRecords, setSleepRecords] = useState([]);
  const [trainerData, setTrainerData] = useState(null);
  const [sleepLoadError, setSleepLoadError] = useState(false);
  const [filters, setFilters] = useState({ search: '', area: 'all', status: 'all' });
  const [timeRange, setTimeRange] = useState('week');
  const [selectedAthleteForReg, setSelectedAthleteForReg] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState(null);
  
  // Atleta actualmente abierto en el panel lateral de detalle (null = panel cerrado)
  const [selectedAthleteForPanel, setSelectedAthleteForPanel] = useState(null);
  
  // Estado para la vista individual
  const [selectedIndividualId, setSelectedIndividualId] = useState(null);

  useEffect(() => {
    let active = true;
    UserService.getTrainerDashboardSummary()
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

  // Al entrar a "Registrar Sueño" limpiamos el formulario si no viene precargado
  useEffect(() => {
    if (currentAction !== 'sueño_registro') {
      setSelectedAthleteForReg(null);
      setSelectedQuality(null);
    }
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
  }, [sleepRecords, timeRange]);

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

  // Atletas que aún no registraron sueño hoy
  const pendingAthletes = useMemo(() => {
    return myAthletes.filter((athlete) => !getAthleteStats(athlete.id).todayRecord);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myAthletes, sleepRecords]);

  // KPIs para la Vista General
  const dashboardStats = useMemo(() => {
    const totalAthletes = myAthletes.length;
    const registeredToday = totalAthletes - pendingAthletes.length;
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
      pendingToday: pendingAthletes.length,
      avgQualityToday,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myAthletes, pendingAthletes, sleepRecords, activeSleepRecords]);

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

  // Abre el formulario de registro con el atleta preseleccionado
  const openRegistrationModal = (athlete) => {
    setSelectedAthleteForReg(athlete);
    setSelectedQuality(null);
    setCurrentAction('sueño_registro');
  };

  // Guarda un nuevo registro de sueño (desde el formulario completo)
  const saveRegistration = async () => {
    if (!selectedAthleteForReg || !selectedQuality) return;
    try {
      const response = await UserService.registerSleep(selectedAthleteForReg.id, selectedQuality);
      if (response.status !== 'success') throw new Error(response.message || 'No se pudo registrar el sueño');
      const refreshed = await UserService.getTrainerDashboardSummary();
      setTrainerData(refreshed);
      setSleepRecords(refreshed.sleep_records || []);
    } catch {
      setSleepLoadError(true);
      return;
    }
    setSelectedAthleteForReg(null);
    setSelectedQuality(null);
    setCurrentAction('sueño_general');
  };

  // Abre el panel lateral de detalle para un atleta
  const openAthletePanel = (athlete) => {
    setSelectedAthleteForPanel(athlete);
  };

  // Cierra el panel lateral de detalle
  const closeAthletePanel = () => {
    setSelectedAthleteForPanel(null);
  };

  // Guarda un registro de sueño desde el panel lateral (registro rápido)
  const quickRegisterSleep = async (athlete, quality) => {
    if (!athlete || !quality) return;
    try {
      await UserService.registerSleep(athlete.id, quality);
      const refreshed = await UserService.getTrainerDashboardSummary();
      setTrainerData(refreshed);
      setSleepRecords(refreshed.sleep_records || []);
    } catch {
      setSleepLoadError(true);
    }
  };

  if (isLoading) return <div className="loading-container">Sincronizando atletas desde el POD...</div>;

  return (
    <MainNav
      role="entrenador"
      roleTitle="Entrenador"
      activeTab={currentAction}
      onTabChange={setCurrentAction}
      onLogout={onLogout}
      isDarkMode={isDarkMode}
      onToggleTheme={onToggleTheme}
    >
      <div className="trainer-dashboard">
      {sleepLoadError && currentAction.startsWith('sueño') && (
        <div className="no-data-cell">No se pudieron sincronizar los datos de sueño.</div>
      )}
        <Suspense fallback={
          <div className="view-fade-in main-grid-layout" style={{ opacity: 0.6, pointerEvents: 'none' }}>
            <div className="glass-panel welcome-banner skeleton-loading" style={{ height: '115px', marginBottom: '8px' }}></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
              <div className="glass-panel skeleton-loading" style={{ flex: '1 1 450px', height: '350px' }}></div>
              <div className="glass-panel skeleton-loading" style={{ flex: '1.2 1 500px', height: '350px' }}></div>
            </div>
          </div>
        }>

          {(currentAction === 'home' || currentAction === 'dashboard_view') && (
            <div className="view-fade-in">
              <TrainerDashboardView />
            </div>
          )}

          {currentAction === 'rutina' && (
            <div className="view-fade-in">
              <BuilderPlanForm athletes={athletes} />
            </div>
          )}

          {(currentAction === 'asistencias' || currentAction === 'asistencia') && (
            <div className="view-fade-in">
              <AsistenciasTrainerView
                athletes={athletes}
                isDarkMode={isDarkMode}
              />
            </div>
          )}

          {currentAction === 'mis_atletas' && (
            <div className="view-fade-in">
              <AtletasTrainer />
            </div>
          )}

          {currentAction === 'subareas' && (
            <div className="view-fade-in">
              <SubAreasTrainer />
            </div>
          )}

          {currentAction === 'perfil' && (
            <div className="view-fade-in">
              <PerfilTrainer />
            </div>
          )}

          {(currentAction === 'cineantropometria' || currentAction === 'cineantropometria_trainer') && (
            <div className="view-fade-in">
              <CineantropometriaTrainer />
            </div>
          )}

          {currentAction === 'sueño_general' && (
            <div className="view-fade-in">
              <SleepGeneralView
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                dashboardStats={dashboardStats}
                chartData={chartData}
              />
            </div>
          )}

          {(currentAction === 'sueno' || currentAction === 'sueño_individual') && (
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
                pendingAthletes={pendingAthletes}
                getAthleteStats={getAthleteStats}
                openRegistrationModal={openRegistrationModal}
                onOpenPanel={openAthletePanel}
              />
            </div>
          )}

          {currentAction === 'sueño_auditoria' && (
            <div className="view-fade-in">
              <SleepAuditView
                sleepRecords={sleepRecords}
                pendingAthletes={pendingAthletes}
                athletes={myAthletes}
                systemDate={SYSTEM_DATE}
                openRegistrationModal={openRegistrationModal}
                onOpenPanel={openAthletePanel}
              />
            </div>
          )}

          {currentAction === 'sueño_registro' && (
            <div className="view-fade-in">
              <SleepRegistrationView
                athletes={myAthletes}
                systemDate={SYSTEM_DATE}
                selectedAthleteForReg={selectedAthleteForReg}
                setSelectedAthleteForReg={setSelectedAthleteForReg}
                selectedQuality={selectedQuality}
                setSelectedQuality={setSelectedQuality}
                saveRegistration={saveRegistration}
                qualityColor={qualityColor}
              />
            </div>
          )}

        </Suspense>

        <Suspense fallback={null}>
          <SleepAthleteDetailPanel
            athlete={selectedAthleteForPanel}
            onClose={closeAthletePanel}
            getAthleteStats={getAthleteStats}
            onQuickRegister={quickRegisterSleep}
            qualityColor={qualityColor}
            systemDate={SYSTEM_DATE}
          />
        </Suspense>
      </div>
    </MainNav>
  );
}