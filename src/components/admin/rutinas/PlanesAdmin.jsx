import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, SlidersHorizontal, X } from 'lucide-react';
import RoutineService from '../../../api/services/RoutineService';
import { useApplicationPermissions } from '../../../context/ApplicationPermissionsContext';
import BuilderPlanFormAdmin from './BuilderPlanFormAdmin';
import '../../../styles/components/admin/rutinas/PlanesAdmin.css';

// Consulta de los planes de entrenamiento de todos los entrenadores. Con el permiso crear_plan, el
// administrador también crea planes (para el entrenador que elija) y edita o publica los borradores.
const PAGE_SIZE = 12;

const ESTADOS = [
  ['publicado', 'Publicado'],
  ['borrador', 'Borrador'],
];

const formatFecha = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

const mensajeError = (error, fallback) => {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data.detail === 'string') return data.detail;
  const primero = Object.values(data).flat()[0];
  return typeof primero === 'string' ? primero : fallback;
};

const tieneValor = (valor) => valor !== null && valor !== undefined && String(valor).trim() !== '';

const asignadoA = (plan) => {
  const nombres = (plan.assignments || []).map((item) => item.athlete_name || item.subarea_name).filter(Boolean);
  return nombres.length ? nombres.join(', ') : 'Sin asignar';
};

const tipoDe = (plan) => ((plan.assignments || []).some((item) => item.subarea) ? 'Grupal' : 'Personalizado');

// La lista trae el resumen (fecha_inicio y fecha_fin); el detalle, las semanas.
const periodoDe = (plan) => {
  const semanas = [...(plan.weeks || [])].sort((a, b) => a.numero_semana - b.numero_semana);
  const inicio = formatFecha(plan.fecha_inicio ?? semanas[0]?.fecha_inicio);
  const fin = formatFecha(plan.fecha_fin ?? semanas[semanas.length - 1]?.fecha_fin);
  return [inicio, fin].filter(Boolean).join(' – ') || '—';
};

const estadoLabel = (estado) => (estado === 'publicado' ? 'Publicado' : estado === 'borrador' ? 'Borrador' : estado || '—');

function EstadoBadge({ estado }) {
  return <span className={`planes-adm-estado planes-adm-estado--${estado}`}>{estadoLabel(estado)}</span>;
}

function Paginacion({ page, total, onChange }) {
  const paginas = Math.ceil(total / PAGE_SIZE);
  if (paginas <= 1) return null;
  return (
    <div className="planes-adm-paginacion">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1}>← Anterior</button>
      <span>Página {page} de {paginas}</span>
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= paginas}>Siguiente →</button>
    </div>
  );
}

/* ---------------- Detalle: semanas, días y ejercicios del plan ---------------- */
function DetallePlan({ planId, onVolver, onEditar }) {
  const [estado, setEstado] = useState({ id: null, plan: null, error: '' });
  const [indice, setIndice] = useState(0);
  const [publicando, setPublicando] = useState(false);
  const [aviso, setAviso] = useState('');
  const { hasPermission } = useApplicationPermissions();
  const puedeGestionar = hasPermission('crear_plan');

  const publicar = async () => {
    setPublicando(true);
    setAviso('');
    try {
      const data = await RoutineService.publish(planId);
      setEstado({ id: planId, plan: data, error: '' });
    } catch (error) {
      setAviso(mensajeError(error, 'No se pudo publicar el plan.'));
    } finally {
      setPublicando(false);
    }
  };

  useEffect(() => {
    let activo = true;
    RoutineService.getPlan(planId)
      .then((data) => { if (activo) setEstado({ id: planId, plan: data, error: '' }); })
      .catch((error) => { if (activo) setEstado({ id: planId, plan: null, error: mensajeError(error, 'No se pudo cargar el plan.') }); });
    return () => { activo = false; };
  }, [planId]);

  if (estado.id !== planId) return <p className="planes-adm-vacio">Cargando plan...</p>;
  if (estado.error) {
    return (
      <section className="planes-adm-panel">
        <button type="button" className="planes-adm-btn planes-adm-btn--ghost" onClick={onVolver}>
          <ArrowLeft size={16} aria-hidden="true" />Volver a la lista
        </button>
        <p className="planes-adm-vacio planes-adm-error" role="alert">{estado.error}</p>
      </section>
    );
  }

  const { plan } = estado;
  const semanas = [...(plan.weeks || [])].sort((a, b) => a.numero_semana - b.numero_semana);
  const semana = semanas[indice];

  return (
    <section className="planes-adm-panel">
      <button type="button" className="planes-adm-btn planes-adm-btn--ghost" onClick={onVolver}>
        <ArrowLeft size={16} aria-hidden="true" />Volver a la lista
      </button>
      <div className="planes-adm-detalle-head">
        <div>
          <h3>{plan.nombre}</h3>
          <p>Entrenador: {plan.trainer_nombre_completo || plan.trainer_name || '—'}</p>
          <p>{tipoDe(plan)} · {asignadoA(plan)}</p>
          <p>{periodoDe(plan)} · {semanas.length} {semanas.length === 1 ? 'semana' : 'semanas'}</p>
          {plan.descripcion && <p className="planes-adm-muted">{plan.descripcion}</p>}
        </div>
        <EstadoBadge estado={plan.estado} />
      </div>

      {/* Los borradores se editan o publican solo con el permiso crear_plan. */}
      {puedeGestionar && plan.estado === 'borrador' && (
        <div className="planes-adm-acciones">
          <button type="button" className="planes-adm-btn planes-adm-btn--ghost" onClick={() => onEditar(plan)}>Editar</button>
          <button type="button" className="planes-adm-btn" disabled={publicando} onClick={publicar}>
            {publicando ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      )}
      {aviso && <p className="planes-adm-error" role="alert">{aviso}</p>}

      {!semana ? (
        <p className="planes-adm-vacio">Este plan no tiene semanas registradas.</p>
      ) : (
        <>
          <div className="planes-adm-semana-nav">
            <button type="button" onClick={() => setIndice(indice - 1)} disabled={indice === 0} aria-label="Semana anterior">
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <div>
              <strong>Semana {semana.numero_semana} de {semanas.length}</strong>
              {(semana.fecha_inicio || semana.fecha_fin) && (
                <small>{[formatFecha(semana.fecha_inicio), formatFecha(semana.fecha_fin)].filter(Boolean).join(' – ')}</small>
              )}
            </div>
            <button type="button" onClick={() => setIndice(indice + 1)} disabled={indice === semanas.length - 1} aria-label="Semana siguiente">
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
          {tieneValor(semana.objetivo) && <p className="planes-adm-objetivo">Objetivo: {semana.objetivo}</p>}

          {!semana.sessions?.length ? (
            <p className="planes-adm-vacio">Esta semana no tiene días de entrenamiento.</p>
          ) : (
            <div className="planes-adm-dias">
              {semana.sessions.map((sesion) => {
                const ejercicios = sesion.session_exercises || [];
                return (
                  <details className="planes-adm-dia" key={sesion.id}>
                    <summary>
                      <span>{sesion.dia_semana}</span>
                      <small>{ejercicios.length} {ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'}</small>
                    </summary>
                    {!ejercicios.length ? (
                      <p className="planes-adm-muted">Sin ejercicios.</p>
                    ) : (
                      <div className="planes-adm-ejercicios">
                        {ejercicios.map((ejercicio) => {
                          const datos = [
                            ['Series', ejercicio.series],
                            ['Repeticiones', ejercicio.repeticiones],
                            ['Micro pausa', ejercicio.micro_pausa],
                            ['Macro pausa', ejercicio.macro_pausa],
                            ['Intensidad', ejercicio.intensidad],
                          ].filter(([, valor]) => tieneValor(valor));
                          return (
                            <article className="planes-adm-ejercicio" key={ejercicio.id}>
                              <h4>{ejercicio.exercise_name}</h4>
                              {datos.length > 0 && (
                                <dl>
                                  {datos.map(([label, valor]) => (
                                    <div key={label}><dt>{label}</dt><dd>{valor}</dd></div>
                                  ))}
                                </dl>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </details>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

/* ---------------- Vista principal ---------------- */
export default function PlanesAdmin() {
  const { hasPermission } = useApplicationPermissions();
  const puedeCrear = hasPermission('crear_plan');
  // armando: null (lista), 'nuevo' o el plan en borrador que se edita.
  const [armando, setArmando] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const [opciones, setOpciones] = useState({ entrenadores: [], subareas: [], responsables: [] });
  const [filtros, setFiltros] = useState({ entrenador: '', subarea: '', estado: '', buscar: '' });
  const [buscarTexto, setBuscarTexto] = useState('');
  const [page, setPage] = useState(1);
  const [lista, setLista] = useState({ clave: '', filas: [], total: 0, error: '' });
  const [detalle, setDetalle] = useState(null);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  useEffect(() => {
    let activo = true;
    RoutineService.getFiltrosAdmin()
      .then((data) => { if (activo) setOpciones({ entrenadores: data?.entrenadores ?? [], subareas: data?.subareas ?? [], responsables: data?.responsables ?? [] }); })
      .catch(() => {});
    return () => { activo = false; };
  }, [recarga]);

  // La búsqueda por nombre se aplica medio segundo después de dejar de escribir.
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
    RoutineService.listAdmin(params)
      .then((data) => { if (activo) setLista({ clave, filas: data?.results ?? [], total: data?.count ?? 0, error: '' }); })
      .catch((error) => { if (activo) setLista({ clave, filas: [], total: 0, error: mensajeError(error, 'No se pudieron cargar los planes.') }); });
    return () => { activo = false; };
  }, [params, clave]);

  const terminarArmado = () => {
    setArmando(null);
    setDetalle(null);
    setRecarga((n) => n + 1);
  };

  const cambiarFiltro = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setPage(1);
  };

  if (armando && puedeCrear) {
    return (
      <BuilderPlanFormAdmin
        key={armando === 'nuevo' ? 'nuevo' : armando.id}
        plan={armando === 'nuevo' ? null : armando}
        responsables={opciones.responsables}
        onCancel={() => setArmando(null)}
        onSaved={terminarArmado}
      />
    );
  }

  if (detalle) {
    return <DetallePlan planId={detalle} onVolver={() => setDetalle(null)} onEditar={(plan) => setArmando(plan)} />;
  }

  const cargando = lista.clave !== clave;

  // Filtros: en monitores van en la barra; en celular, en el panel del botón "Filtros".
  const controles = (
    <>
      <select value={filtros.entrenador} onChange={(event) => cambiarFiltro('entrenador', event.target.value)} aria-label="Filtrar por entrenador">
        <option value="">Todos los entrenadores</option>
        {opciones.entrenadores.map((item) => <option key={item.id} value={String(item.id)}>{item.nombre}</option>)}
      </select>
      <select value={filtros.subarea} onChange={(event) => cambiarFiltro('subarea', event.target.value)} aria-label="Filtrar por subárea">
        <option value="">Todas las subáreas</option>
        {opciones.subareas.map((item) => (
          <option key={item.id} value={String(item.id)}>{item.area ? `${item.area} · ` : ''}{item.nombre}</option>
        ))}
      </select>
      <select value={filtros.estado} onChange={(event) => cambiarFiltro('estado', event.target.value)} aria-label="Filtrar por estado">
        <option value="">Todos los estados</option>
        {ESTADOS.map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}
      </select>
    </>
  );

  return (
    <div className="planes-adm">
      <header className="planes-adm-header">
        <h2>Planes de entrenamiento</h2>
      </header>

      <div className="planes-adm-toolbar">
        <input
          type="search"
          className="planes-adm-buscar"
          value={buscarTexto}
          onChange={(event) => setBuscarTexto(event.target.value)}
          placeholder="Buscar por atleta, entrenador o cédula"
          aria-label="Buscar por atleta, entrenador o cédula"
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
        {puedeCrear && (
          <div className="planes-adm-toolbar-acciones">
            <button type="button" className="planes-adm-btn" onClick={() => setArmando('nuevo')}>
              <Plus size={16} aria-hidden="true" />Crear plan
            </button>
          </div>
        )}
      </div>

      <Paginacion page={page} total={lista.total} onChange={setPage} />
      {cargando ? (
        <p className="planes-adm-vacio">Cargando planes...</p>
      ) : lista.error ? (
        <p className="planes-adm-vacio planes-adm-error" role="alert">{lista.error}</p>
      ) : !lista.filas.length ? (
        <p className="planes-adm-vacio">No hay planes con esos filtros.</p>
      ) : (
        <div className="responsive-list">
          <div className="responsive-list__table planes-adm-tabla-wrap">
            <table className="planes-adm-tabla">
              <thead>
                <tr><th>Plan</th><th>Entrenador</th><th>Asignado a</th><th>Período</th><th>Semanas</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {lista.filas.map((plan) => (
                  <tr key={plan.id}>
                    <td className="planes-adm-fuerte">{plan.nombre}</td>
                    <td>{plan.trainer_nombre_completo || plan.trainer_name || '—'}</td>
                    <td>{tipoDe(plan)} · {asignadoA(plan)}</td>
                    <td>{periodoDe(plan)}</td>
                    <td>{plan.semanas ?? 0}</td>
                    <td><EstadoBadge estado={plan.estado} /></td>
                    <td>
                      <button type="button" className="planes-adm-btn planes-adm-btn--chico" onClick={() => setDetalle(plan.id)}>
                        Ver plan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="responsive-list__cards">
            <div className="planes-adm-cards">
              {lista.filas.map((plan) => (
                <article className="planes-adm-card" key={plan.id}>
                  <div className="planes-adm-card-head">
                    <h4>{plan.nombre}</h4>
                    <EstadoBadge estado={plan.estado} />
                  </div>
                  <dl>
                    <div><dt>Entrenador</dt><dd>{plan.trainer_nombre_completo || plan.trainer_name || '—'}</dd></div>
                    <div><dt>Asignado a</dt><dd>{tipoDe(plan)} · {asignadoA(plan)}</dd></div>
                    <div><dt>Período</dt><dd>{periodoDe(plan)}</dd></div>
                    <div><dt>Semanas</dt><dd>{plan.semanas ?? 0}</dd></div>
                  </dl>
                  <button type="button" className="planes-adm-btn planes-adm-btn--chico" onClick={() => setDetalle(plan.id)}>
                    Ver plan
                  </button>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
      <Paginacion page={page} total={lista.total} onChange={setPage} />
    </div>
  );
}
