import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Clock3, Dumbbell, X } from 'lucide-react';
import RoutineService from '../../../api/services/RoutineService';
import BuilderPlanForm from './BuilderPlanForm';
import '../../../styles/components/trainer/BuilderPlanForm.css';
import '../../../styles/components/trainer/RoutineManager.css';

const formatError = (value) => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(formatError).filter(Boolean).join(' ');
  if (value && typeof value === 'object') {
    return Object.entries(value).map(([field, detail]) => `${field}: ${formatError(detail)}`).join(' ');
  }
  return '';
};

const errorText = (error) => formatError(error.response?.data?.detail ?? error.response?.data)
  || error.message
  || 'No se pudieron cargar las rutinas.';

const tieneValor = (value) => value !== null && value !== undefined && String(value).trim() !== '';

const getAsignaciones = (plan) => (plan.assignments || [])
  .map((item) => item.athlete_name || item.subarea_name)
  .filter(Boolean);

const getDiasPlan = (plan) => new Set(
  (plan.weeks || []).flatMap((week) => (week.sessions || []).map((session) => session.dia_semana).filter(Boolean)),
).size;

const getPeriodo = (plan) => {
  const weeks = [...(plan.weeks || [])].sort((a, b) => a.numero_semana - b.numero_semana);
  if (!weeks.length) return '';
  const inicio = weeks[0].fecha_inicio;
  const fin = weeks[weeks.length - 1].fecha_fin;
  if (inicio && fin) return `${inicio} – ${fin}`;
  return inicio || fin || '';
};

const getEstado = (estado) => {
  if (estado === 'publicado') return 'Publicado';
  if (estado === 'borrador') return 'Borrador';
  return estado || 'Estado no indicado';
};

const getClaseEstado = (estado) => (
  estado === 'publicado' || estado === 'borrador' ? estado : 'other'
);

function DetallePlan({ plan, onClose }) {
  const [indiceSemana, setIndiceSemana] = useState(0);
  const [esDrawer, setEsDrawer] = useState(() => window.matchMedia('(max-width: 899px)').matches);
  const semanas = plan.weeks || [];
  const semana = semanas[indiceSemana];
  const asignaciones = getAsignaciones(plan);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 899px)');
    const actualizarVista = (event) => setEsDrawer(event.matches);
    const overflowPrevio = document.body.style.overflow;
    mediaQuery.addEventListener('change', actualizarVista);
    const scrollLock = 'scroll-bloqueado';
    const yaEstabaBloqueado = document.documentElement.classList.contains(scrollLock);
    if (esDrawer) {
      document.documentElement.classList.add(scrollLock);
      document.body.style.overflow = 'hidden';
    }
    const cerrarConEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', cerrarConEscape);
    return () => {
      mediaQuery.removeEventListener('change', actualizarVista);
      if (esDrawer) {
        document.body.style.overflow = overflowPrevio;
        if (!yaEstabaBloqueado) document.documentElement.classList.remove(scrollLock);
      }
      window.removeEventListener('keydown', cerrarConEscape);
    };
  }, [esDrawer, onClose]);

  const cambiarSemana = (nuevoIndice) => {
    setIndiceSemana(Math.max(0, Math.min(nuevoIndice, semanas.length - 1)));
  };

  return (
    <section
      className="routine-detail"
      role={esDrawer ? 'dialog' : undefined}
      aria-modal={esDrawer ? 'true' : undefined}
      aria-labelledby="routine-detail-title"
    >
      <button type="button" className="routine-detail__backdrop" onClick={onClose} aria-label="Cerrar detalle" tabIndex={-1} />
      <div className="routine-detail__panel">
        <header className="routine-detail__header">
          <button type="button" className="routine-detail__back" onClick={onClose}>
            <ArrowLeft size={18} aria-hidden="true" />
            <span className="routine-detail__back-label">Volver a mis planes</span>
          </button>
          <div className="routine-detail__heading">
            <span className="routine-detail__eyebrow">Entrenamientos del plan</span>
            <h2 id="routine-detail-title">{plan.nombre}</h2>
            {asignaciones.length > 0 && <p>{asignaciones.join(', ')}</p>}
          </div>
          <button type="button" className="routine-detail__close" onClick={onClose} aria-label="Cerrar detalle">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="routine-detail__body">
          <aside className="routine-detail__sidebar" aria-label="Información del plan y selección de semana">
            <section className="routine-detail__summary">
              <span className={`routine-manager-status routine-manager-status--${getClaseEstado(plan.estado)}`}>
                {getEstado(plan.estado)}
              </span>
              {plan.descripcion && <p>{plan.descripcion}</p>}
              {getPeriodo(plan) && (
                <div className="routine-detail__meta">
                  <CalendarDays size={16} aria-hidden="true" />
                  <span>{getPeriodo(plan)}</span>
                </div>
              )}
              <div className="routine-detail__meta">
                <Dumbbell size={16} aria-hidden="true" />
                <span>{semanas.length} {semanas.length === 1 ? 'semana' : 'semanas'}</span>
              </div>
              <div className="routine-detail__meta">
                <Clock3 size={16} aria-hidden="true" />
                <span>{getDiasPlan(plan)} días programados</span>
              </div>
            </section>

            {semanas.length > 0 ? (
              <nav className="routine-detail__week-list" aria-label="Semanas del plan">
                <h3>Semanas</h3>
                {semanas.map((item, index) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`routine-detail__week-option${index === indiceSemana ? ' is-active' : ''}`}
                    onClick={() => cambiarSemana(index)}
                    aria-current={index === indiceSemana ? 'step' : undefined}
                  >
                    <span>Semana {item.numero_semana}</span>
                    {item.fecha_inicio && <small>{item.fecha_inicio}</small>}
                  </button>
                ))}
              </nav>
            ) : (
              <p className="routine-detail__empty">Este plan no tiene semanas registradas.</p>
            )}
          </aside>

          <main className="routine-detail__content">
            {semana ? (
              <>
                <div className="routine-detail__week-heading">
                  <div>
                    <span className="routine-detail__eyebrow">Semana {semana.numero_semana} de {semanas.length}</span>
                    <h3>Entrenamientos</h3>
                    {(semana.fecha_inicio || semana.fecha_fin) && (
                      <p>{[semana.fecha_inicio, semana.fecha_fin].filter(Boolean).join(' – ')}</p>
                    )}
                    {tieneValor(semana.objetivo) && <p className="routine-detail__objective">{semana.objetivo}</p>}
                  </div>
                  <div className="routine-detail__week-controls" aria-label="Navegación por semanas">
                    <button
                      type="button"
                      onClick={() => cambiarSemana(indiceSemana - 1)}
                      disabled={indiceSemana === 0}
                      aria-label="Semana anterior"
                    >
                      <ChevronLeft size={18} aria-hidden="true" />
                    </button>
                    <span>Semana {semana.numero_semana} / {semanas.length}</span>
                    <button
                      type="button"
                      onClick={() => cambiarSemana(indiceSemana + 1)}
                      disabled={indiceSemana === semanas.length - 1}
                      aria-label="Semana siguiente"
                    >
                      <ChevronRight size={18} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div
                  className="routine-detail__progress"
                  role="progressbar"
                  aria-label="Progreso de navegación por semanas"
                  aria-valuemin={1}
                  aria-valuemax={semanas.length}
                  aria-valuenow={indiceSemana + 1}
                >
                  <span style={{ width: `${((indiceSemana + 1) / semanas.length) * 100}%` }} />
                </div>

                <div className="routine-detail__days">
                  {(semana.sessions || []).map((session) => {
                    const exercises = session.session_exercises || [];
                    return (
                      <details className="routine-detail__day" key={session.id}>
                        <summary>
                          <span>{session.dia_semana}</span>
                          <small>{exercises.length} {exercises.length === 1 ? 'ejercicio' : 'ejercicios'}</small>
                          <ChevronRight size={18} aria-hidden="true" />
                        </summary>
                        <div className="routine-detail__exercise-list">
                          {exercises.length ? exercises.map((exercise) => {
                            const metrics = [
                              ['Series', exercise.series],
                              ['Repeticiones', exercise.repeticiones],
                              ['Micro pausa', exercise.micro_pausa],
                              ['Macro pausa', exercise.macro_pausa],
                              ['Intensidad', exercise.intensidad],
                            ].filter(([, value]) => tieneValor(value));
                            return (
                              <article className="routine-detail__exercise" key={exercise.id}>
                                <h4>{exercise.exercise_name}</h4>
                                {metrics.length > 0 && (
                                  <dl>
                                    {metrics.map(([label, value]) => (
                                      <div key={label}>
                                        <dt>{label}</dt>
                                        <dd>{value}</dd>
                                      </div>
                                    ))}
                                  </dl>
                                )}
                              </article>
                            );
                          }) : <p className="routine-detail__empty">Sin ejercicios asignados.</p>}
                        </div>
                      </details>
                    );
                  })}
                  {!semana.sessions?.length && (
                    <p className="routine-detail__empty">Esta semana no tiene días de entrenamiento registrados.</p>
                  )}
                </div>
              </>
            ) : (
              <p className="routine-detail__empty">No hay entrenamientos disponibles para este plan.</p>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}

export default function RoutineManager() {
  const [plans, setPlans] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const cerrarDetalle = useCallback(() => setSelectedId(null), []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await RoutineService.list();
      setPlans(Array.isArray(response) ? response : response?.results || []);
      setError('');
    } catch (requestError) {
      setError(errorText(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPlans(); }, []);

  const publishPlan = async (plan) => {
    setBusyId(plan.id);
    setError('');
    try {
      await RoutineService.publish(plan.id);
      await loadPlans();
    } catch (requestError) {
      setError(errorText(requestError));
    } finally {
      setBusyId(null);
    }
  };

  if (editingPlan) {
    return (
      <BuilderPlanForm
        plan={editingPlan}
        onCancel={() => setEditingPlan(null)}
        onSaved={async () => {
          setEditingPlan(null);
          await loadPlans();
        }}
      />
    );
  }

  const selectedPlan = plans.find((plan) => plan.id === selectedId);

  return (
    <section className={`routine-manager${selectedPlan ? ' routine-manager--detail-open' : ''}`}>
      <header className="routine-manager-header">
        <div>
          <h2>Rutinas asignadas</h2>
          <p>Planes creados por ti, con sus destinatarios y cronograma.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={loadPlans} disabled={loading}>
          Actualizar
        </button>
      </header>

      {error && <p className="builder-feedback-error" role="alert">{error}</p>}
      {loading ? (
        <p role="status">Cargando tus planes...</p>
      ) : plans.length === 0 ? (
        <p>No tienes rutinas creadas.</p>
      ) : (
        <div className="routine-manager-list">
          {plans.map((plan) => {
            const asignaciones = getAsignaciones(plan);
            const dias = getDiasPlan(plan);
            return (
              <article className="card routine-manager-plan" key={plan.id}>
                <header className="routine-manager-plan__header">
                  <div className="routine-manager-plan__title">
                    <span className="routine-manager-plan__eyebrow">
                      {asignaciones.length ? asignaciones.join(', ') : 'Sin asignaciones'}
                    </span>
                    <h3>{plan.nombre}</h3>
                    {plan.descripcion && <p>{plan.descripcion}</p>}
                  </div>
                  <span className={`routine-manager-status routine-manager-status--${getClaseEstado(plan.estado)}`}>
                    {getEstado(plan.estado)}
                  </span>
                </header>

                <div className="routine-manager-plan__facts">
                  {getPeriodo(plan) && (
                    <div><CalendarDays size={16} aria-hidden="true" /><span>{getPeriodo(plan)}</span></div>
                  )}
                  <div><Dumbbell size={16} aria-hidden="true" /><span>{plan.weeks.length} {plan.weeks.length === 1 ? 'semana' : 'semanas'}</span></div>
                  <div><Clock3 size={16} aria-hidden="true" /><span>{dias} días programados</span></div>
                </div>

                <div className="routine-manager-actions">
                  <button type="button" className="btn btn-primary routine-manager-plan__view" onClick={() => setSelectedId(plan.id)}>
                    Ver entrenamientos
                  </button>
                  {plan.estado === 'borrador' && (
                    <>
                      <button type="button" className="btn btn-outline" onClick={() => setEditingPlan(plan)}>Editar</button>
                      <button type="button" className="btn btn-outline" disabled={busyId === plan.id} onClick={() => publishPlan(plan)}>
                        {busyId === plan.id ? 'Publicando...' : 'Publicar'}
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedPlan && <DetallePlan key={selectedPlan.id} plan={selectedPlan} onClose={cerrarDetalle} />}
    </section>
  );
}
