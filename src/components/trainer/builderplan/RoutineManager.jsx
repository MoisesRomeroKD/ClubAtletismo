import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Clock3, Dumbbell, SlidersHorizontal, UserRound, Users, X } from 'lucide-react';
import RoutineService from '../../../api/services/RoutineService';
import BuilderPlanForm from './BuilderPlanForm';
import '../../../styles/components/trainer/BuilderPlanForm.css';
import '../../../styles/components/trainer/RoutineManager.css';

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

/* Atletas a los que llega el plan, dentro del detalle (administrador y entrenador). */
function AsignadosDelPlan({ planId }) {
  const [estado, setEstado] = useState({ id: null, datos: null, error: '' });

  useEffect(() => {
    let activo = true;
    RoutineService.getAsignados(planId)
      .then((datos) => { if (activo) setEstado({ id: planId, datos, error: '' }); })
      .catch(() => { if (activo) setEstado({ id: planId, datos: null, error: 'No se pudo cargar la lista de atletas.' }); });
    return () => { activo = false; };
  }, [planId]);

  if (estado.id !== planId) return <p className="routine-detail__empty">Cargando atletas...</p>;
  if (estado.error) return <p className="routine-detail__empty rutinas-error" role="alert">{estado.error}</p>;
  return estado.datos.grupos.map((grupo) => (
    <details className="routine-detail__asignados" key={`${grupo.tipo}-${grupo.nombre}`} open={grupo.atletas.length <= 8}>
      <summary>
        <span>{grupo.tipo === 'subarea' ? `Subárea ${grupo.nombre}` : grupo.nombre}</span>
        <small>{grupo.atletas.length} {grupo.atletas.length === 1 ? 'atleta' : 'atletas'}</small>
      </summary>
      {grupo.atletas.length ? (
        <ol>
          {grupo.atletas.map((atleta) => (
            <li key={atleta.id}>
              <strong>{atleta.nombre} {atleta.apellido}</strong>
              <span>Cédula {atleta.cedula || '—'}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="routine-detail__empty">La subárea no tiene atletas activos inscritos.</p>
      )}
    </details>
  ));
}

function DetallePlan({ plan, onClose, mostrarAsignados = false }) {
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
              <div className="routine-detail__meta">
                <UserRound size={16} aria-hidden="true" />
                <span>Creado por {plan.trainer_nombre_completo || plan.trainer_name || '—'}</span>
              </div>
              {plan.fecha_publicacion && (
                <div className="routine-detail__meta">
                  <CalendarDays size={16} aria-hidden="true" />
                  <span>Publicado el {formatPublicado(plan.fecha_publicacion)}</span>
                </div>
              )}
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

            {mostrarAsignados && (
              <section className="routine-detail__week-list" aria-label="Atletas asignados">
                <h3>Asignado a</h3>
                <AsignadosDelPlan planId={plan.id} />
              </section>
            )}

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

/* ---------------- Lista de planes: tabla en monitores y tarjetas en celular ---------------- */
// Planes: 10 por página (en tarjetas, en el celular, 15 se hacía largo).
const PAGE_SIZE = 10;

const VIGENCIAS = [
  ['en_curso', 'En curso'],
  ['proximos', 'Próximos'],
  ['terminados', 'Terminados'],
];

const formatFecha = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

// La fecha de publicación es fecha y hora: se muestra el día en hora de Caracas.
function formatPublicado(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-VE', { timeZone: 'America/Caracas', day: '2-digit', month: '2-digit', year: 'numeric' });
}

const mensajeError = (error, fallback) => {
  if (!error?.response) return `${fallback} El servidor no respondió; revisa tu conexión.`;
  const data = error.response.data;
  if (data && typeof data.detail === 'string') return data.detail;
  return fallback;
};

// Resumen de a quién llega: el atleta (personalizado) o la subárea con cuántos atletas tiene.
const asignadoTexto = (plan) => {
  const asignacion = (plan.assignments || [])[0];
  if (!asignacion) return 'Sin asignar';
  if (asignacion.athlete) return asignacion.athlete_name || 'Atleta';
  const total = plan.asignados_total ?? 0;
  return `${asignacion.subarea_name || 'Subárea'} · ${total} ${total === 1 ? 'atleta' : 'atletas'}`;
};

function Paginacion({ page, total, onChange }) {
  const paginas = Math.ceil(total / PAGE_SIZE);
  if (paginas <= 1) return null;
  return (
    <div className="rutinas-paginacion">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1}>← Anterior</button>
      <span>Página {page} de {paginas}</span>
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= paginas}>Siguiente →</button>
    </div>
  );
}

/* Lista de atletas a los que llega el plan. */
function AsignadosModal({ plan, onClose }) {
  const [estado, setEstado] = useState({ id: null, datos: null, error: '' });

  useEffect(() => {
    let activo = true;
    RoutineService.getAsignados(plan.id)
      .then((datos) => { if (activo) setEstado({ id: plan.id, datos, error: '' }); })
      .catch((error) => { if (activo) setEstado({ id: plan.id, datos: null, error: mensajeError(error, 'No se pudo cargar la lista de atletas.') }); });
    const cerrarConEscape = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', cerrarConEscape);
    return () => {
      activo = false;
      window.removeEventListener('keydown', cerrarConEscape);
    };
  }, [plan.id, onClose]);

  return createPortal(
    <div className="rutinas-modal" role="dialog" aria-modal="true" aria-labelledby="rutinas-modal-titulo">
      <button type="button" className="rutinas-modal__fondo" onClick={onClose} aria-label="Cerrar" tabIndex={-1} />
      <div className="rutinas-modal__panel">
        <header className="rutinas-modal__header">
          <div>
            <span className="routine-detail__eyebrow">Asignado a</span>
            <h3 id="rutinas-modal-titulo">{plan.nombre}</h3>
          </div>
          <button type="button" className="routine-detail__close" onClick={onClose} aria-label="Cerrar lista">
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className="rutinas-modal__body">
          {estado.id !== plan.id ? (
            <p className="rutinas-vacio">Cargando atletas...</p>
          ) : estado.error ? (
            <p className="rutinas-vacio rutinas-error" role="alert">{estado.error}</p>
          ) : estado.datos.grupos.map((grupo) => (
            <section key={`${grupo.tipo}-${grupo.nombre}`} className="rutinas-modal__grupo">
              <h4>{grupo.tipo === 'subarea' ? `Subárea ${grupo.nombre}` : grupo.nombre} · {grupo.atletas.length} {grupo.atletas.length === 1 ? 'atleta' : 'atletas'}</h4>
              {grupo.atletas.length ? (
                <ol className="rutinas-modal__lista">
                  {grupo.atletas.map((atleta) => (
                    <li key={atleta.id}>
                      <strong>{atleta.nombre} {atleta.apellido}</strong>
                      <span>Cédula {atleta.cedula || '—'}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="rutinas-vacio">La subárea no tiene atletas activos inscritos.</p>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* Abre el detalle: la lista trae el resumen; aquí se pide el plan completo con sus semanas. */
function PlanAbierto({ planId, onClose }) {
  const [estado, setEstado] = useState({ id: null, plan: null, error: '' });

  useEffect(() => {
    let activo = true;
    RoutineService.getPlan(planId)
      .then((plan) => { if (activo) setEstado({ id: planId, plan, error: '' }); })
      .catch((error) => { if (activo) setEstado({ id: planId, plan: null, error: mensajeError(error, 'No se pudo cargar el plan.') }); });
    return () => { activo = false; };
  }, [planId]);

  if (estado.id !== planId) return <p className="rutinas-vacio" role="status">Cargando plan...</p>;
  if (estado.error) {
    return (
      <div className="rutinas-vacio">
        <p className="rutinas-error" role="alert">{estado.error}</p>
        <button type="button" className="btn btn-outline" onClick={onClose}>Volver a la lista</button>
      </div>
    );
  }
  return <DetallePlan key={planId} plan={estado.plan} onClose={onClose} mostrarAsignados />;
}

export default function RoutineManager() {
  const [opciones, setOpciones] = useState({ subareas: [], atletas: [] });
  const [filtros, setFiltros] = useState({ subarea: '', atleta: '', creado: '', vigencia: '', desde: '', hasta: '', buscar: '' });
  const [buscarTexto, setBuscarTexto] = useState('');
  const [page, setPage] = useState(1);
  const [recarga, setRecarga] = useState(0);
  const [lista, setLista] = useState({ clave: '', filas: [], total: 0, error: '' });
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [asignadosDe, setAsignadosDe] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [aviso, setAviso] = useState('');
  const cerrarDetalle = useCallback(() => setSelectedId(null), []);
  const cerrarAsignados = useCallback(() => setAsignadosDe(null), []);

  useEffect(() => {
    let activo = true;
    RoutineService.getFiltros()
      .then((data) => { if (activo) setOpciones({ subareas: data?.subareas ?? [], atletas: data?.atletas ?? [] }); })
      .catch(() => {});
    return () => { activo = false; };
  }, []);

  // La búsqueda se aplica medio segundo después de dejar de escribir.
  useEffect(() => {
    const espera = setTimeout(() => {
      setFiltros((prev) => (prev.buscar === buscarTexto.trim() ? prev : { ...prev, buscar: buscarTexto.trim() }));
      setPage(1);
    }, 500);
    return () => clearTimeout(espera);
  }, [buscarTexto]);

  const params = useMemo(
    () => ({ ...Object.fromEntries(Object.entries(filtros).filter(([, valor]) => valor)), page }),
    [filtros, page],
  );
  const clave = `${JSON.stringify(params)}-${recarga}`;

  useEffect(() => {
    let activo = true;
    RoutineService.listar(params)
      .then((data) => { if (activo) setLista({ clave, filas: data?.results ?? [], total: data?.count ?? 0, error: '' }); })
      .catch((error) => { if (activo) setLista({ clave, filas: [], total: 0, error: mensajeError(error, 'No se pudieron cargar los planes.') }); });
    return () => { activo = false; };
  }, [params, clave]);

  const cambiarFiltro = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setPage(1);
  };

  // Editar: el entrenador edita los planes que él creó (publicados o no). Los borradores viejos (de antes
  // de quitar "Guardar borrador") también se pueden publicar desde aquí.
  const editarPlan = async (plan) => {
    setBusyId(plan.id);
    setAviso('');
    try {
      setEditingPlan(await RoutineService.getPlan(plan.id));
    } catch (error) {
      setAviso(mensajeError(error, 'No se pudo abrir el plan.'));
    } finally {
      setBusyId(null);
    }
  };

  const publicarBorrador = async (plan) => {
    setBusyId(plan.id);
    setAviso('');
    try {
      await RoutineService.publish(plan.id);
      setRecarga((n) => n + 1);
    } catch (error) {
      setAviso(mensajeError(error, 'No se pudo publicar el plan.'));
    } finally {
      setBusyId(null);
    }
  };

  if (editingPlan) {
    return (
      <BuilderPlanForm
        plan={editingPlan}
        onCancel={() => setEditingPlan(null)}
        onSaved={() => {
          setEditingPlan(null);
          setRecarga((n) => n + 1);
        }}
      />
    );
  }

  const cargando = lista.clave !== clave;

  const acciones = (plan) => (
    <div className="rutinas-acciones">
      <button type="button" className="btn btn-primary rutinas-btn-chico" onClick={() => setSelectedId(plan.id)}>Ver</button>
      {plan.puede_editar && (
        <button type="button" className="btn btn-outline rutinas-btn-chico" disabled={busyId === plan.id} onClick={() => editarPlan(plan)}>Editar</button>
      )}
      {plan.puede_editar && plan.estado === 'borrador' && (
        <button type="button" className="btn btn-outline rutinas-btn-chico" disabled={busyId === plan.id} onClick={() => publicarBorrador(plan)}>
          {busyId === plan.id ? 'Publicando...' : 'Publicar'}
        </button>
      )}
    </div>
  );

  // Los planes de colegas muestran quién los creó; los propios, además, la marca "Tú".
  const creadoPor = (plan) => (
    <span className="rutinas-creado">
      {plan.es_mio && <span className="rutinas-tu">Tú</span>}
      {plan.trainer_nombre_completo || '—'}
    </span>
  );

  const asignado = (plan) => (
    <div className="rutinas-asignado">
      <span>{asignadoTexto(plan)}</span>
      <button type="button" className="rutinas-link" onClick={() => setAsignadosDe(plan)}>
        <Users size={14} aria-hidden="true" />Ver lista
      </button>
    </div>
  );

  // Filtros del entrenador: en monitores van en la barra; en celular, en el panel del botón "Filtros".
  const controles = (
    <>
      <select value={filtros.subarea} onChange={(event) => cambiarFiltro('subarea', event.target.value)} aria-label="Filtrar por subárea">
        <option value="">Todas mis subáreas</option>
        {opciones.subareas.map((item) => <option key={item.id} value={String(item.id)}>{item.area ? `${item.area} · ` : ''}{item.nombre}</option>)}
      </select>
      <select value={filtros.atleta} onChange={(event) => cambiarFiltro('atleta', event.target.value)} aria-label="Filtrar por atleta">
        <option value="">Todos mis atletas</option>
        {opciones.atletas.map((item) => <option key={item.id} value={String(item.id)}>{item.nombre}</option>)}
      </select>
      <select value={filtros.creado} onChange={(event) => cambiarFiltro('creado', event.target.value)} aria-label="Filtrar por quién lo creó">
        <option value="">Creados por mí y colegas</option>
        <option value="mios">Creados por mí</option>
        <option value="colegas">De colegas de mi subárea</option>
      </select>
      <select value={filtros.vigencia} onChange={(event) => cambiarFiltro('vigencia', event.target.value)} aria-label="Filtrar por vigencia">
        <option value="">Toda vigencia</option>
        {VIGENCIAS.map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}
      </select>
      <label className="rutinas-fecha">
        <span>Desde</span>
        <input type="date" value={filtros.desde} max={filtros.hasta || undefined} onChange={(event) => cambiarFiltro('desde', event.target.value)} />
      </label>
      <label className="rutinas-fecha">
        <span>Hasta</span>
        <input type="date" value={filtros.hasta} min={filtros.desde || undefined} onChange={(event) => cambiarFiltro('hasta', event.target.value)} />
      </label>
    </>
  );

  return (
    <section className={`routine-manager${selectedId ? ' routine-manager--detail-open' : ''}`}>
      <header className="routine-manager-header">
        <div>
          <h2>Rutinas asignadas</h2>
          <p>Tus planes y los de colegas de tu subárea, con a quién llegan y su cronograma.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setRecarga((n) => n + 1)} disabled={cargando}>
          Actualizar
        </button>
      </header>

      <div className="routine-manager-list">
        <div className="rutinas-toolbar">
          <input
            type="search"
            className="rutinas-buscar"
            value={buscarTexto}
            onChange={(event) => setBuscarTexto(event.target.value)}
            placeholder="Buscar por plan, atleta o cédula"
            aria-label="Buscar por nombre del plan, atleta o cédula"
          />
          <button type="button" className="filtros-fab" onClick={() => setFiltrosAbiertos(true)}>
            <SlidersHorizontal size={18} aria-hidden="true" />Filtros
          </button>
          {filtrosAbiertos && createPortal(
            <div className="filtros-sheet" role="dialog" aria-modal="true" aria-label="Filtros">
              <header className="filtros-sheet__header">
                <h2>Filtros</h2>
                <button type="button" className="filtros-sheet__cerrar" onClick={() => setFiltrosAbiertos(false)} aria-label="Cerrar filtros">
                  <X size={18} />
                </button>
              </header>
              <div className="filtros-sheet__body">{controles}</div>
              <footer className="filtros-sheet__footer">
                <button type="button" className="filtros-sheet__btn" onClick={() => setFiltrosAbiertos(false)}>Cerrar</button>
                <button type="button" className="filtros-sheet__btn filtros-sheet__btn--primario" onClick={() => setFiltrosAbiertos(false)}>Aplicar filtros</button>
              </footer>
            </div>,
            document.body,
          )}
          <div className="filtros-escritorio">{controles}</div>
        </div>

        {aviso && <p className="builder-feedback-error" role="alert">{aviso}</p>}
        <Paginacion page={page} total={lista.total} onChange={setPage} />
        {cargando ? (
          <p className="rutinas-vacio" role="status">Cargando planes...</p>
        ) : lista.error ? (
          <p className="rutinas-vacio rutinas-error" role="alert">{lista.error}</p>
        ) : !lista.filas.length ? (
          <p className="rutinas-vacio">No hay planes con esos filtros.</p>
        ) : (
          <div className="responsive-list">
            <div className="responsive-list__table rutinas-tabla-wrap">
              <table className="rutinas-tabla">
                <thead>
                  <tr><th>Plan</th><th>Publicado</th><th>Inicio</th><th>Fin</th><th>Creado por</th><th>Asignado a</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {lista.filas.map((plan) => (
                    <tr key={plan.id}>
                      <td className="rutinas-fuerte">
                        {plan.nombre}
                        {plan.estado === 'borrador' && <span className="routine-manager-status routine-manager-status--borrador">Borrador</span>}
                      </td>
                      <td>{formatPublicado(plan.fecha_publicacion)}</td>
                      <td>{formatFecha(plan.fecha_inicio)}</td>
                      <td>{formatFecha(plan.fecha_fin)}</td>
                      <td>{creadoPor(plan)}</td>
                      <td>{asignado(plan)}</td>
                      <td>{acciones(plan)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="responsive-list__cards">
              <div className="rutinas-cards">
                {lista.filas.map((plan) => (
                  <article className="card rutinas-card" key={plan.id}>
                    <header className="rutinas-card__head">
                      <h3>{plan.nombre}</h3>
                      {plan.estado === 'borrador' && <span className="routine-manager-status routine-manager-status--borrador">Borrador</span>}
                    </header>
                    <dl>
                      <div><dt>Publicado</dt><dd>{formatPublicado(plan.fecha_publicacion)}</dd></div>
                      <div><dt>Inicio</dt><dd>{formatFecha(plan.fecha_inicio)}</dd></div>
                      <div><dt>Fin</dt><dd>{formatFecha(plan.fecha_fin)}</dd></div>
                      <div><dt>Creado por</dt><dd>{creadoPor(plan)}</dd></div>
                      <div className="rutinas-card__ancho"><dt>Asignado a</dt><dd>{asignado(plan)}</dd></div>
                    </dl>
                    {acciones(plan)}
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}
        <Paginacion page={page} total={lista.total} onChange={setPage} />
      </div>

      {selectedId && <PlanAbierto key={selectedId} planId={selectedId} onClose={cerrarDetalle} />}
      {asignadosDe && <AsignadosModal plan={asignadosDe} onClose={cerrarAsignados} />}
    </section>
  );
}
