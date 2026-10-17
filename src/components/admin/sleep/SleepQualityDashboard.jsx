import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import UserService from '../../../api/services/Userservice';
import { useApplicationPermissions } from '../../../context/ApplicationPermissionsContext';
import '../../../styles/components/admin/sleep/AdminSleepDashboard.css';
import CargaCircular from '../../layout/CargaCircular';

const SleepGeneralView = lazy(() => import('../../trainer/sleeptracker/SleepGeneralView'));
const SleepIndividualView = lazy(() => import('../../trainer/sleeptracker/SleepIndividualView'));
const SleepPendingView = lazy(() => import('../../trainer/sleeptracker/SleepPendingView'));
const SleepAuditView = lazy(() => import('../../trainer/sleeptracker/SleepAuditView'));
const SleepAthleteDetailPanel = lazy(() => import('../../trainer/sleeptracker/SleepAthleteDetailPanel'));
const SleepRegistrationView = lazy(() => import('../../trainer/sleeptracker/SleepRegistrationView'));

const HISTORY_REQUEST_BATCH_SIZE = 8;
const PERIOD_DAYS = {
  day: 0,
  week: 7,
  month: 30,
  quarter: 90,
  semester: 180,
  year: 365,
};
const SLEEP_PERIOD_DAYS = {
  hoy: 0,
  ayer: 1,
  semana: 7,
  mes: 30,
  '3meses': 90,
  '6meses': 180,
  anio: 365,
};

function getCaracasDate() {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getErrorMessage(error) {
  return error.response?.data?.detail
    || error.response?.data?.message
    || error.message
    || 'No se pudieron cargar los datos de sueño.';
}

async function getAdminSleepData() {
  const [athleteResponse, subareaResponse] = await Promise.all([
    UserService.getAllAthletes(),
    UserService.getSubareas(),
  ]);
  const subareas = subareaResponse;
  const athletes = athleteResponse.map((athlete) => {
    const names = athlete.subareas_nombres || [];
    const assignments = names.map((subareaName) => {
      const matches = subareas.filter((subarea) => subarea.nombre === subareaName);
      const matchedSubarea = matches.length === 1 ? matches[0] : null;
      return {
        area: matchedSubarea?.area?.nombre || '',
        subarea: subareaName,
      };
    });

    return {
      id: athlete.user_id,
      name: athlete.name || `${athlete.nombres || ''} ${athlete.apellidos || ''}`.trim(),
      cedula: athlete.cedula,
      category: athlete.categoria || '',
      subareas: names,
      assignments,
      area: assignments.find((assignment) => assignment.area)?.area || '',
      subarea: assignments.map((assignment) => assignment.subarea).join(', '),
    };
  });

  const sleepRecords = [];
  for (let start = 0; start < athletes.length; start += HISTORY_REQUEST_BATCH_SIZE) {
    const batch = athletes.slice(start, start + HISTORY_REQUEST_BATCH_SIZE);
    const histories = await Promise.all(
      batch.map((athlete) => UserService.getSleepHistoryByAthlete(athlete.id))
    );
    histories.forEach((history, index) => {
      const athlete = batch[index];
      (history.historial || []).forEach((record) => {
        sleepRecords.push({
          id: `${athlete.id}-${record.date}`,
          athleteId: athlete.id,
          date: record.date,
          quality: Number(record.calidad),
          registrarName: record.registrado_por || 'Sistema',
        });
      });
    });
  }

  return { athletes, sleepRecords };
}

export default function SleepQualityDashboard({
  activeSection = 'sueño_general',
}) {
  const { hasPermission } = useApplicationPermissions();
  const puedeRegistrarSueno = hasPermission('registrar_descanso');
  const [adminData, setAdminData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [timeRange, setTimeRange] = useState('week');
  const [sleepPeriod, setSleepPeriod] = useState('hoy');
  const [filters, setFilters] = useState({ search: '', area: 'all', status: 'all' });
  const [selectedIndividualId, setSelectedIndividualId] = useState(null);
  const [selectedAthleteForReg, setSelectedAthleteForReg] = useState(null);
  const [selectedAthleteForPanel, setSelectedAthleteForPanel] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [systemDate, setSystemDate] = useState(getCaracasDate);
  const normalizeSection = (sec) => {
    if (sec === 'sueño') return 'sueño_general';
    if (sec === 'sueño_registro') return 'sueño_pendientes';
    return sec || 'sueño_general';
  };
  const activeTab = normalizeSection(activeSection);

  useEffect(() => {
    let active = true;
    getAdminSleepData()
      .then((data) => {
        if (!active) return;
        setAdminData(data);
        setLoadError('');
      })
      .catch((error) => {
        if (active) setLoadError(getErrorMessage(error));
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const athletes = adminData?.athletes || [];
  const sleepRecords = adminData?.sleepRecords || [];
  const timeRangeStart = addDays(systemDate, -(PERIOD_DAYS[timeRange] || 0));
  const activeSleepRecords = useMemo(
    () => sleepRecords.filter((record) => record.date >= timeRangeStart && record.date <= systemDate),
    [sleepRecords, timeRangeStart, systemDate]
  );

  const getAthleteStats = (athleteId) => {
    const records = activeSleepRecords.filter((record) => record.athleteId === athleteId);
    const todayRecord = sleepRecords.find(
      (record) => record.athleteId === athleteId && record.date === systemDate
    );
    const avgQuality = records.length
      ? Math.round((records.reduce((sum, record) => sum + record.quality, 0) / records.length) * 10) / 10
      : 0;
    return { todayRecord, avgQuality, records };
  };

  const filteredAthletes = useMemo(
    () => athletes.filter((athlete) => {
      const matchesSearch = athlete.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchesArea = filters.area === 'all' || athlete.area === filters.area;
      const todayRecord = sleepRecords.find(
        (record) => record.athleteId === athlete.id && record.date === systemDate
      );
      const matchesStatus = filters.status === 'all'
        || (filters.status === 'registered' && Boolean(todayRecord))
        || (filters.status === 'pending' && !todayRecord);
      return matchesSearch && matchesArea && matchesStatus;
    }),
    [athletes, filters, sleepRecords, systemDate]
  );

  const pendingAthletes = useMemo(() => {
    const rangeStart = sleepPeriod === 'historico'
      ? null
      : addDays(systemDate, -(SLEEP_PERIOD_DAYS[sleepPeriod] || 0));
    const registeredIds = new Set(
      sleepRecords
        .filter((record) => (
          (!rangeStart || record.date >= rangeStart)
          && (sleepPeriod !== 'ayer' || record.date === rangeStart)
          && record.date <= systemDate
        ))
        .map((record) => record.athleteId)
    );
    return athletes.filter((athlete) => !registeredIds.has(athlete.id));
  }, [athletes, sleepPeriod, sleepRecords, systemDate]);

  const pendingTodayAthletes = useMemo(() => {
    const registeredTodayIds = new Set(
      sleepRecords
        .filter((record) => record.date === systemDate)
        .map((record) => record.athleteId)
    );
    return athletes.filter((athlete) => !registeredTodayIds.has(athlete.id));
  }, [athletes, sleepRecords, systemDate]);

  const dashboardStats = useMemo(() => {
    const todayRecords = sleepRecords.filter((record) => record.date === systemDate);
    const registeredToday = new Set(todayRecords.map((record) => record.athleteId)).size;
    const totalAthletes = athletes.length;
    const periodQualities = activeSleepRecords.map((record) => record.quality);
    const avgQualityToday = periodQualities.length
      ? Math.round((periodQualities.reduce((sum, quality) => sum + quality, 0) / periodQualities.length) * 10) / 10
      : 0;
    return {
      totalAthletes,
      registeredToday,
      registeredPct: totalAthletes ? Math.round((registeredToday / totalAthletes) * 100) : 0,
      pendingToday: totalAthletes - registeredToday,
      avgQualityToday,
    };
  }, [athletes, sleepRecords, activeSleepRecords, systemDate]);

  const chartData = useMemo(() => {
    const byDate = new Map();
    activeSleepRecords.forEach((record) => {
      const daily = byDate.get(record.date) || [];
      daily.push(record.quality);
      byDate.set(record.date, daily);
    });
    return [...byDate.entries()]
      .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
      .map(([date, qualities]) => ({
        label: new Date(`${date}T12:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        quality: Math.round((qualities.reduce((sum, quality) => sum + quality, 0) / qualities.length) * 10) / 10,
      }));
  }, [activeSleepRecords]);

  const qualityColor = (quality) => {
    if (quality >= 8) return 'var(--sl-success, #16a34a)';
    if (quality >= 5) return 'var(--sl-warning, #d97706)';
    return 'var(--sl-danger, #dc2626)';
  };

  const handleSaveSleep = async (athleteId, quality) => {
    const response = await UserService.registerSleep(athleteId, quality);
    if (response.status !== 'success') {
      throw new Error(response.message || 'No se pudo registrar el sueño.');
    }
    const todayStr = getCaracasDate();
    setSystemDate(todayStr);
    // Inmediatamente actualizamos los registros para reflejar el cambio sin recargar
    setAdminData((prev) => {
      if (!prev) return prev;
      const newRecord = {
        id: `${athleteId}-${todayStr}`,
        athleteId,
        date: todayStr,
        quality: Number(quality),
        registrarName: 'Administrador',
      };
      return {
        ...prev,
        sleepRecords: [newRecord, ...(prev.sleepRecords || [])],
      };
    });
    setRefreshKey((key) => key + 1);
    return response;
  };

  // Abre la pantalla "Registrar Sueño" (la misma de Pendientes) en la sección actual.
  const openRegistration = (athlete) => {
    if (!puedeRegistrarSueno) return;
    setSelectedAthleteForPanel(null);
    setSaveError('');
    setSelectedAthleteForReg(athlete);
  };
  const registrando = Boolean(selectedAthleteForReg);

  const selectedSection = activeSection === 'sueño' ? activeTab : activeSection;

  if (!adminData && loadError) {
    return <div className="admin-sleep-dashboard__error" role="alert">{loadError}</div>;
  }
  if (!adminData) {
    return <CargaCircular texto="Cargando sueño" />;
  }

  return (
    <section className="admin-sleep-dashboard">
      <header className="admin-sleep-dashboard__header">
        <h1>Sueño y Descanso</h1>
        {selectedSection === 'sueño_general' && <h2 className="admin-sleep-dashboard__seccion">Vista General</h2>}
      </header>

      {loadError && (
        <div className="admin-sleep-dashboard__error" role="alert">{loadError}</div>
      )}
      {saveError && (
        <div className="admin-sleep-dashboard__error" role="alert">{saveError}</div>
      )}

      <Suspense fallback={<CargaCircular texto="Cargando sección" />}>
        {registrando && (
          <SleepRegistrationView
            athlete={selectedAthleteForReg}
            onSave={async (athleteId, quality) => {
              await handleSaveSleep(athleteId, quality);
              setSelectedAthleteForReg(null);
            }}
            onCancel={() => setSelectedAthleteForReg(null)}
            systemDate={systemDate}
            registrarRole="Administrador"
            qualityColor={qualityColor}
          />
        )}

        {!registrando && selectedSection === 'sueño_general' && (
          <SleepGeneralView
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            dashboardStats={dashboardStats}
            chartData={chartData}
            adminMode
          />
        )}

        {!registrando && selectedSection === 'sueño_individual' && (
          <SleepIndividualView
            athletes={athletes}
            selectedAthleteId={selectedIndividualId || athletes[0]?.id || null}
            setSelectedAthleteId={(athleteId) => setSelectedIndividualId(Number(athleteId))}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            adminMode
            sleepRecords={sleepRecords}
            systemDate={systemDate}
            getIndividualStats={(athleteId) => {
              const { avgQuality, records, todayRecord } = getAthleteStats(athleteId);
              const expectedDays = PERIOD_DAYS[timeRange] || 1;
              return {
                avgQuality,
                totalRecords: records.length,
                compliancePct: Math.min(Math.round((records.length / expectedDays) * 100), 100) || 0,
                registeredToday: Boolean(todayRecord),
                todayRegistrar: todayRecord?.registrarName,
                linePoints: records.map((record) => record.quality),
              };
            }}
            filters={filters}
            setFilters={setFilters}
            filteredAthletes={filteredAthletes}
            pendingAthletes={pendingAthletes}
            getAthleteStats={getAthleteStats}
            openRegistrationModal={openRegistration}
            onOpenPanel={setSelectedAthleteForPanel}
          />
        )}

        {!registrando && selectedSection === 'sueño_pendientes' && (
          <SleepPendingView
            pendingAthletes={pendingTodayAthletes}
            allAthletes={athletes}
            onSaveSleep={puedeRegistrarSueno ? handleSaveSleep : undefined}
            systemDate={systemDate}
            registrarRole="Administrador"
            sleepPeriod={sleepPeriod}
            setSleepPeriod={setSleepPeriod}
            showPeriodFilter={false}
          />
        )}

        {!registrando && selectedSection === 'sueño_auditoria' && (
          <SleepAuditView
            recordsData={sleepRecords}
            pendingAthletes={pendingAthletes}
            athletes={athletes}
            systemDate={systemDate}
            openRegistrationModal={openRegistration}
            onOpenPanel={setSelectedAthleteForPanel}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        <SleepAthleteDetailPanel
          athlete={selectedAthleteForPanel}
          onClose={() => setSelectedAthleteForPanel(null)}
          getAthleteStats={getAthleteStats}
          onRegistrar={puedeRegistrarSueno ? openRegistration : undefined}
          qualityColor={qualityColor}
          systemDate={systemDate}
        />
      </Suspense>
    </section>
  );
}
