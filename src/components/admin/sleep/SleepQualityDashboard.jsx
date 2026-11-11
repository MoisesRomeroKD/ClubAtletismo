import React, { lazy, Suspense, useEffect, useState } from 'react';
import UserService from '../../../api/services/Userservice';
import { useApplicationPermissions } from '../../../context/ApplicationPermissionsContext';
import '../../../styles/components/admin/sleep/AdminSleepDashboard.css';
import CargaCircular from '../../layout/CargaCircular';

const SleepGeneralView = lazy(() => import('../../trainer/sleeptracker/SleepGeneralView'));
const SuenoIndividualAdmin = lazy(() => import('./SuenoIndividualAdmin'));
const SleepAthleteDetailPanel = lazy(() => import('../../trainer/sleeptracker/SleepAthleteDetailPanel'));
const SleepRegistrationView = lazy(() => import('../../trainer/sleeptracker/SleepRegistrationView'));

/*
 * Sueño y Descanso del administrador. Todo se calcula en el backend:
 *   - Vista General: GET /descanso/sueno/admin/resumen/ (indicadores y promedio por día).
 *   - Detalle Individual: GET /descanso/sueno/admin/atletas/ (15 por página, con filtros).
 *   - El historial de un atleta se pide solo al abrir su detalle.
 * (Pendientes tiene su propia pantalla.)
 */
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

const mensajeError = (error, porDefecto) => error?.response?.data?.detail || error?.response?.data?.message || porDefecto;

const qualityColor = (quality) => {
  if (quality >= 8) return 'var(--sl-success, #16a34a)';
  if (quality >= 5) return 'var(--sl-warning, #d97706)';
  return 'var(--sl-danger, #dc2626)';
};

// Fila de la lista → datos que esperan el panel de detalle y la pantalla de registro.
const atletaParaPanel = (atleta) => ({
  ...atleta,
  area: atleta.subareas?.[0]?.area || '',
  subarea: (atleta.subareas || []).map((fila) => fila.subarea).join(', '),
});

export default function SleepQualityDashboard({ activeSection = 'sueño_general' }) {
  const { hasPermission } = useApplicationPermissions();
  const puedeRegistrarSueno = hasPermission('registrar_descanso');
  const puedeCorregirSueno = hasPermission('editar_descanso');
  const [timeRange, setTimeRange] = useState('week');
  const [recarga, setRecarga] = useState(0);
  const [resumen, setResumen] = useState({ clave: '', data: null, error: '' });
  const [panel, setPanel] = useState({ atleta: null, registros: [], error: '' });
  const [selectedAthleteForReg, setSelectedAthleteForReg] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [systemDate, setSystemDate] = useState(getCaracasDate);

  const seccion = activeSection === 'sueño' || activeSection === 'sueño_registro' ? 'sueño_general' : activeSection;
  const enGeneral = seccion === 'sueño_general';
  const claveResumen = `${timeRange}-${recarga}`;

  // Vista General: indicadores del período elegido.
  useEffect(() => {
    if (!enGeneral) return undefined;
    let activo = true;
    UserService.getSuenoAdminResumen(timeRange)
      .then((data) => { if (activo) setResumen({ clave: claveResumen, data, error: '' }); })
      .catch((error) => { if (activo) setResumen({ clave: claveResumen, data: null, error: mensajeError(error, 'No se pudo cargar el resumen de sueño.') }); });
    return () => { activo = false; };
  }, [enGeneral, timeRange, claveResumen]);

  const datosResumen = resumen.data;
  const dashboardStats = {
    totalAthletes: datosResumen?.total_atletas ?? 0,
    registeredToday: datosResumen?.registrados_hoy ?? 0,
    registeredPct: datosResumen?.porcentaje_registrados ?? 0,
    pendingToday: datosResumen?.pendientes_hoy ?? 0,
    avgQualityToday: datosResumen?.promedio_periodo ?? 0,
  };
  const chartData = (datosResumen?.por_dia || []).map((fila) => ({
    label: new Date(`${fila.fecha}T12:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    quality: fila.promedio,
  }));

  // Detalle de un atleta: se pide su historial solo al abrirlo.
  const cargarHistorial = async (atleta) => {
    try {
      const data = await UserService.getSleepHistoryByAthlete(atleta.id);
      const registros = (data.historial || []).map((registro) => ({
        id: `${atleta.id}-${registro.date}`,
        registroId: registro.id,
        athleteId: atleta.id,
        date: registro.date,
        quality: Number(registro.calidad),
        registrarName: registro.registrado_por || 'Sistema',
        registrarRole: registro.registrado_por || 'Sistema',
      }));
      setPanel({ atleta, registros, error: '' });
    } catch (error) {
      setPanel({ atleta, registros: [], error: mensajeError(error, 'No se pudo cargar el historial del atleta.') });
    }
  };

  const verDetalle = (fila) => {
    const atleta = atletaParaPanel(fila);
    setPanel({ atleta, registros: [], error: '' });
    cargarHistorial(atleta);
  };

  const getAthleteStats = () => ({
    records: panel.registros,
    todayRecord: panel.registros.find((registro) => registro.date === systemDate),
  });

  const handleSaveSleep = async (athleteId, quality) => {
    const response = await UserService.registerSleep(athleteId, quality);
    if (response.status !== 'success') {
      throw new Error(response.message || 'No se pudo registrar el sueño.');
    }
    setSystemDate(getCaracasDate());
    setRecarga((n) => n + 1);
    if (panel.atleta?.id === athleteId) cargarHistorial(panel.atleta);
    return response;
  };

  // Corrige la calidad de un registro ya guardado (hasta una semana después de su fecha).
  const corregirSueno = async (registroId, quality) => {
    await UserService.corregirSueno(registroId, quality);
    setPanel((actual) => ({
      ...actual,
      registros: actual.registros.map((registro) => (
        registro.registroId === registroId ? { ...registro, quality: Number(quality) } : registro
      )),
    }));
    setRecarga((n) => n + 1);
  };

  // Abre la pantalla "Registrar Sueño" (la misma de Pendientes).
  const openRegistration = (fila) => {
    if (!puedeRegistrarSueno) return;
    setPanel({ atleta: null, registros: [], error: '' });
    setSaveError('');
    setSelectedAthleteForReg(atletaParaPanel(fila));
  };
  const registrando = Boolean(selectedAthleteForReg);

  return (
    <section className="admin-sleep-dashboard">
      <header className="admin-sleep-dashboard__header">
        <h1>Sueño y Descanso</h1>
      </header>

      {saveError && <div className="admin-sleep-dashboard__error" role="alert">{saveError}</div>}
      {enGeneral && resumen.error && <div className="admin-sleep-dashboard__error" role="alert">{resumen.error}</div>}
      {panel.error && <div className="admin-sleep-dashboard__error" role="alert">{panel.error}</div>}

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
            qualityColor={qualityColor}
          />
        )}

        {!registrando && enGeneral && (
          resumen.clave !== claveResumen && !datosResumen
            ? <CargaCircular texto="Cargando sueño" />
            : (
              <SleepGeneralView
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                dashboardStats={dashboardStats}
                chartData={chartData}
                adminMode
              />
            )
        )}

        {!registrando && seccion === 'sueño_individual' && (
          <SuenoIndividualAdmin
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            recarga={recarga}
            qualityColor={qualityColor}
            puedeRegistrar={puedeRegistrarSueno}
            onVerDetalle={verDetalle}
            onRegistrar={openRegistration}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        <SleepAthleteDetailPanel
          athlete={panel.atleta}
          onClose={() => setPanel({ atleta: null, registros: [], error: '' })}
          getAthleteStats={getAthleteStats}
          onRegistrar={puedeRegistrarSueno ? openRegistration : undefined}
          onCorregir={puedeCorregirSueno ? corregirSueno : undefined}
          qualityColor={qualityColor}
          systemDate={systemDate}
        />
      </Suspense>
    </section>
  );
}
