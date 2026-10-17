import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Plus, SlidersHorizontal, X } from 'lucide-react';
import TestService from '../../../api/services/Testservice';
import UserService from '../../../api/services/Userservice';
import '../../../styles/components/trainer/TestsTrainer.css';

const PAGE_SIZE = 15;

const UNIDADES = [
  ['s', 'Segundos (s)'],
  ['min', 'Minutos (min)'],
  ['m', 'Metros (m)'],
  ['cm', 'Centímetros (cm)'],
  ['kg', 'Kilogramos (kg)'],
  ['rep', 'Repeticiones'],
  ['pts', 'Puntos'],
];

const ESTADOS = [
  ['programado', 'Programado'],
  ['realizado', 'Realizado'],
  ['cancelado', 'Cancelado'],
];

const formatFecha = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

const conUnidad = (valor, unidad) => (valor === null || valor === undefined ? '—' : `${valor} ${unidad}`);

const mensajeError = (error, fallback) => {
  const data = error?.response?.data;
  if (!data) return fallback;
  if (typeof data.detail === 'string') return data.detail;
  const primero = Object.values(data).flat()[0];
  return typeof primero === 'string' ? primero : fallback;
};

function usePaginado(fetchPage, version = 0) {
  const [pagina, setPagina] = useState({ fetchPage, page: 1 });
  const [estado, setEstado] = useState({ fetchPage: null, version: -1, page: 0, filas: [], total: 0, error: '' });
  const page = pagina.fetchPage === fetchPage ? pagina.page : 1;

  useEffect(() => {
    let activo = true;
    fetchPage(page)
      .then((data) => { if (activo) setEstado({ fetchPage, version, page, filas: data?.results ?? [], total: data?.count ?? 0, error: '' }); })
      .catch((error) => { if (activo) setEstado({ fetchPage, version, page, filas: [], total: 0, error: mensajeError(error, 'No se pudo cargar la lista.') }); });
    return () => { activo = false; };
  }, [fetchPage, page, version]);

  return {
    ...estado,
    page,
    cargando: estado.fetchPage !== fetchPage || estado.version !== version || estado.page !== page,
    setPage: (nueva) => setPagina({ fetchPage, page: nueva }),
  };
}

function Paginacion({ page, total, onChange }) {
  const paginas = Math.ceil(total / PAGE_SIZE);
  if (paginas <= 1) return null;
  return (
    <div className="tests-ent-paginacion">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1}>← Anterior</button>
      <span>Página {page} de {paginas}</span>
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= paginas}>Siguiente →</button>
    </div>
  );
}

function EstadoBadge({ estado, label }) {
  return <span className={`tests-ent-estado tests-ent-estado--${estado}`}>{label}</span>;
}

/* ---------------- Planilla de toma: cada fila se guarda al momento ---------------- */
const filaVacia = { valor: '', ausente: false, observacion: '' };

const valoresDeFila = (fila) => ({
  valor: fila.valor === null || fila.valor === undefined ? '' : String(fila.valor),
  ausente: Boolean(fila.ausente),
  observacion: fila.observacion || '',
});

const mismaFila = (a, b) => a.valor === b.valor && a.ausente === b.ausente && a.observacion === b.observacion;

function PlanillaTest({ testId, onVolver }) {
  const [detalle, setDetalle] = useState({ id: null, data: null, error: '' });
  const [valores, setValores] = useState({});
  const [guardados, setGuardados] = useState({});
  const [estadoFila, setEstadoFila] = useState({});
  const [finalizando, setFinalizando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let activo = true;
    TestService.getTest(testId)
      .then((data) => {
        if (!activo) return;
        const iniciales = Object.fromEntries(data.convocados.map((fila) => [fila.atleta_id, valoresDeFila(fila)]));
        setDetalle({ id: testId, data, error: '' });
        setValores(iniciales);
        setGuardados(iniciales);
        setEstadoFila({});
      })
      .catch((error) => { if (activo) setDetalle({ id: testId, data: null, error: mensajeError(error, 'No se pudo cargar el test.') }); });
    return () => { activo = false; };
  }, [testId, recarga]);

  if (detalle.id !== testId) return <p className="tests-ent-vacio">Cargando planilla...</p>;
  if (detalle.error) return <p className="tests-ent-vacio tests-ent-error" role="alert">{detalle.error}</p>;

  const test = detalle.data;
  const editable = test.estado === 'programado';
  const actualDe = (atletaId) => valores[atletaId] || filaVacia;

  const guardarFila = async (atletaId, fila) => {
    if (guardados[atletaId] && mismaFila(guardados[atletaId], fila)) return;
    setEstadoFila((prev) => ({ ...prev, [atletaId]: { tipo: 'guardando', texto: 'Guardando...' } }));
    try {
      const guardada = await TestService.saveResultadoAtleta(testId, atletaId, {
        valor: fila.ausente ? null : fila.valor,
        ausente: fila.ausente,
        observacion: fila.observacion,
      });
      setGuardados((prev) => ({ ...prev, [atletaId]: valoresDeFila(guardada) }));
      setEstadoFila((prev) => ({ ...prev, [atletaId]: { tipo: 'ok', texto: 'Guardado' } }));
    } catch (error) {
      setEstadoFila((prev) => ({ ...prev, [atletaId]: { tipo: 'error', texto: mensajeError(error, 'No se guardó') } }));
    }
  };

  const cambiar = (atletaId, campo, valor) => {
    setValores((prev) => ({ ...prev, [atletaId]: { ...actualDe(atletaId), [campo]: valor } }));
  };

  // El check de ausente se guarda al marcarlo; el resultado y la observación al salir del campo.
  const cambiarAusente = (atletaId, ausente) => {
    const fila = { ...actualDe(atletaId), ausente, valor: ausente ? '' : actualDe(atletaId).valor };
    setValores((prev) => ({ ...prev, [atletaId]: fila }));
    guardarFila(atletaId, fila);
  };

  const sinResultado = test.convocados.filter((fila) => {
    const guardada = guardados[fila.atleta_id] || filaVacia;
    return !guardada.ausente && guardada.valor === '';
  }).length;

  const finalizar = async () => {
    const aviso = sinResultado
      ? `Hay ${sinResultado} atleta(s) sin resultado ni marcados como ausentes. ¿Finalizar el test de todas formas?`
      : '¿Finalizar el test? Después no se podrán cambiar los resultados.';
    if (!window.confirm(aviso)) return;
    setFinalizando(true);
    setMensaje({ tipo: '', texto: '' });
    try {
      await TestService.finalizarTest(testId);
      setMensaje({ tipo: 'ok', texto: 'Test finalizado.' });
      setRecarga((n) => n + 1);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: mensajeError(error, 'No se pudo finalizar el test.') });
    } finally {
      setFinalizando(false);
    }
  };

  const estadoDe = (atletaId) => {
    const estado = estadoFila[atletaId];
    if (!estado) return null;
    return <span className={`tests-ent-fila-estado tests-ent-fila-estado--${estado.tipo}`} role={estado.tipo === 'error' ? 'alert' : 'status'}>{estado.texto}</span>;
  };

  return (
    <section className="tests-ent-panel">
      <button type="button" className="tests-ent-btn tests-ent-btn--ghost" onClick={onVolver}>
        <ArrowLeft size={16} aria-hidden="true" />Volver a mis tests
      </button>
      <div className="tests-ent-detalle-head">
        <div>
          <h3>{test.prueba_nombre}</h3>
          <p>{test.area_nombre} · {test.subarea_nombre} · {formatFecha(test.fecha)} · unidad: {test.prueba_unidad}</p>
        </div>
        <EstadoBadge estado={test.estado} label={test.estado_label} />
      </div>

      {editable && (
        <p className="tests-ent-progreso">
          Cada fila se guarda sola: el resultado y la observación al salir del campo, y "Ausente" al marcarlo.
          {' '}Faltan {sinResultado} de {test.convocados.length} atletas.
        </p>
      )}

      {!test.convocados.length ? (
        <p className="tests-ent-vacio">Este test no tiene atletas.</p>
      ) : (
        <div className="responsive-list">
          <div className="responsive-list__table tests-ent-tabla-wrap">
            <table className="tests-ent-tabla">
              <thead>
                <tr><th>Atleta</th><th>Cédula</th><th>Categoría</th><th>Resultado ({test.prueba_unidad})</th><th>Ausente</th><th>Observación</th>{editable && <th>Estado</th>}</tr>
              </thead>
              <tbody>
                {test.convocados.map((fila) => {
                  const actual = actualDe(fila.atleta_id);
                  return (
                    <tr key={fila.atleta_id}>
                      <td className="tests-ent-fuerte">{fila.nombre} {fila.apellido}</td>
                      <td>{fila.cedula}</td>
                      <td>{fila.categoria || '—'}</td>
                      <td>
                        {editable ? (
                          <input
                            type="number" min="0" step="0.01" inputMode="decimal"
                            className="tests-ent-input-valor"
                            value={actual.ausente ? '' : actual.valor}
                            disabled={actual.ausente}
                            onChange={(event) => cambiar(fila.atleta_id, 'valor', event.target.value)}
                            onBlur={() => guardarFila(fila.atleta_id, actual)}
                            aria-label={`Resultado de ${fila.nombre} ${fila.apellido}`}
                          />
                        ) : (fila.ausente ? 'Ausente' : conUnidad(fila.valor, test.prueba_unidad))}
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={actual.ausente}
                          disabled={!editable}
                          onChange={(event) => cambiarAusente(fila.atleta_id, event.target.checked)}
                          aria-label={`${fila.nombre} ${fila.apellido} ausente`}
                        />
                      </td>
                      <td>
                        {editable ? (
                          <input
                            type="text" className="tests-ent-input-obs"
                            value={actual.observacion}
                            onChange={(event) => cambiar(fila.atleta_id, 'observacion', event.target.value)}
                            onBlur={() => guardarFila(fila.atleta_id, actual)}
                            aria-label={`Observación de ${fila.nombre} ${fila.apellido}`}
                          />
                        ) : (fila.observacion || '—')}
                      </td>
                      {editable && <td>{estadoDe(fila.atleta_id)}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="responsive-list__cards">
            <div className="tests-ent-cards">
              {test.convocados.map((fila) => {
                const actual = actualDe(fila.atleta_id);
                return (
                  <article className="tests-ent-card" key={fila.atleta_id}>
                    <div className="tests-ent-card-head">
                      <h4>{fila.nombre} {fila.apellido}</h4>
                      {editable && estadoDe(fila.atleta_id)}
                    </div>
                    <p className="tests-ent-card-sub">C.I. {fila.cedula} · {fila.categoria || 'Sin categoría'}</p>
                    {editable ? (
                      <div className="tests-ent-card-campos">
                        <label>
                          <span>Resultado ({test.prueba_unidad})</span>
                          <input
                            type="number" min="0" step="0.01" inputMode="decimal"
                            value={actual.ausente ? '' : actual.valor}
                            disabled={actual.ausente}
                            onChange={(event) => cambiar(fila.atleta_id, 'valor', event.target.value)}
                            onBlur={() => guardarFila(fila.atleta_id, actual)}
                          />
                        </label>
                        <label className="tests-ent-check">
                          <input type="checkbox" checked={actual.ausente} onChange={(event) => cambiarAusente(fila.atleta_id, event.target.checked)} />
                          Ausente
                        </label>
                        <label>
                          <span>Observación</span>
                          <input
                            type="text" value={actual.observacion}
                            onChange={(event) => cambiar(fila.atleta_id, 'observacion', event.target.value)}
                            onBlur={() => guardarFila(fila.atleta_id, actual)}
                          />
                        </label>
                      </div>
                    ) : (
                      <dl>
                        <div><dt>Resultado</dt><dd>{fila.ausente ? 'Ausente' : conUnidad(fila.valor, test.prueba_unidad)}</dd></div>
                        {fila.observacion && <div><dt>Observación</dt><dd>{fila.observacion}</dd></div>}
                      </dl>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {mensaje.texto && (
        <p className={mensaje.tipo === 'ok' ? 'tests-ent-ok' : 'tests-ent-error'} role={mensaje.tipo === 'ok' ? 'status' : 'alert'}>{mensaje.texto}</p>
      )}

      {editable && test.convocados.length > 0 && (
        <div className="tests-ent-acciones">
          <button type="button" className="tests-ent-btn" disabled={finalizando} onClick={finalizar}>
            Finalizar test
          </button>
        </div>
      )}
    </section>
  );
}

/* ---------------- Asignar test: prueba, subárea, fecha y atletas elegidos ---------------- */
function CrearTest({ pruebas, subareas, onCreado, onCancelar }) {
  const [form, setForm] = useState({ prueba: '', subarea: '', fecha: '' });
  const [disponibles, setDisponibles] = useState({ clave: '', filas: [], error: '' });
  const [seleccion, setSeleccion] = useState({ clave: '', ids: [] });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const clave = form.subarea ? `${form.subarea}-${form.prueba}` : '';

  useEffect(() => {
    if (!clave) return undefined;
    let activo = true;
    const params = { subarea: form.subarea };
    if (form.prueba) params.prueba = form.prueba;
    TestService.getAtletasDisponibles(params)
      .then((filas) => { if (activo) setDisponibles({ clave, filas: Array.isArray(filas) ? filas : [], error: '' }); })
      .catch((err) => { if (activo) setDisponibles({ clave, filas: [], error: mensajeError(err, 'No se pudieron cargar tus atletas.') }); });
    return () => { activo = false; };
  }, [clave, form.subarea, form.prueba]);

  const cargandoAtletas = Boolean(clave) && disponibles.clave !== clave;
  const atletas = disponibles.clave === clave ? disponibles.filas : [];
  const elegibles = atletas.filter((atleta) => !atleta.pendiente);
  const elegidos = (seleccion.clave === clave ? seleccion.ids : []).filter((id) => elegibles.some((atleta) => atleta.atleta_id === id));
  const todosMarcados = elegibles.length > 0 && elegidos.length === elegibles.length;

  const alternar = (atletaId) => {
    const nuevos = elegidos.includes(atletaId) ? elegidos.filter((id) => id !== atletaId) : [...elegidos, atletaId];
    setSeleccion({ clave, ids: nuevos });
  };

  const alternarTodos = () => {
    setSeleccion({ clave, ids: todosMarcados ? [] : elegibles.map((atleta) => atleta.atleta_id) });
  };

  const enviar = async (event) => {
    event.preventDefault();
    if (!elegidos.length) {
      setError('Elige al menos un atleta.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      const creado = await TestService.createTest({ ...form, atletas: elegidos });
      onCreado(creado);
    } catch (err) {
      setError(mensajeError(err, 'No se pudo crear el test.'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className="tests-ent-panel tests-ent-form" onSubmit={enviar}>
      <h3>Asignar test</h3>
      <div className="tests-ent-form-grid">
        <label>
          <span>Prueba</span>
          <select value={form.prueba} onChange={(event) => setForm({ ...form, prueba: event.target.value })} required>
            <option value="">Selecciona una prueba</option>
            {pruebas.filter((prueba) => prueba.activa).map((prueba) => (
              <option key={prueba.id} value={String(prueba.id)}>{prueba.nombre} ({prueba.unidad})</option>
            ))}
          </select>
        </label>
        <label>
          <span>Subárea</span>
          <select value={form.subarea} onChange={(event) => setForm({ ...form, subarea: event.target.value })} required>
            <option value="">Selecciona una subárea</option>
            {subareas.map((subarea) => (
              <option key={subarea.id} value={String(subarea.id)}>
                {subarea.areaNombre ? `${subarea.areaNombre} · ` : ''}{subarea.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Fecha</span>
          <input type="date" value={form.fecha} onChange={(event) => setForm({ ...form, fecha: event.target.value })} required />
        </label>
      </div>

      <div className="tests-ent-atletas">
        <div className="tests-ent-atletas-head">
          <strong>Atletas de la subárea</strong>
          {elegibles.length > 0 && (
            <label className="tests-ent-check">
              <input type="checkbox" checked={todosMarcados} onChange={alternarTodos} />
              Seleccionar todos ({elegidos.length}/{elegibles.length})
            </label>
          )}
        </div>
        {!form.subarea ? (
          <p className="tests-ent-muted">Elige una subárea para ver tus atletas.</p>
        ) : cargandoAtletas ? (
          <p className="tests-ent-muted">Cargando atletas...</p>
        ) : disponibles.error ? (
          <p className="tests-ent-error" role="alert">{disponibles.error}</p>
        ) : !atletas.length ? (
          <p className="tests-ent-muted">No tienes atletas activos en esta subárea.</p>
        ) : (
          <div className="tests-ent-atletas-lista">
            {atletas.map((atleta) => (
              <label key={atleta.atleta_id} className={`tests-ent-atleta${atleta.pendiente ? ' tests-ent-atleta--bloqueado' : ''}`}>
                <input
                  type="checkbox"
                  checked={elegidos.includes(atleta.atleta_id)}
                  disabled={atleta.pendiente}
                  onChange={() => alternar(atleta.atleta_id)}
                />
                <span className="tests-ent-atleta-info">
                  <strong>{atleta.nombre} {atleta.apellido}</strong>
                  <small>C.I. {atleta.cedula}{atleta.categoria ? ` · ${atleta.categoria}` : ''}</small>
                  {atleta.pendiente && <small className="tests-ent-aviso">Ya tiene esta prueba pendiente</small>}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {error && <p className="tests-ent-error" role="alert">{error}</p>}

      <div className="tests-ent-acciones">
        <button type="button" className="tests-ent-btn tests-ent-btn--ghost" onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="tests-ent-btn" disabled={guardando || !elegidos.length}>Asignar test</button>
      </div>
    </form>
  );
}

/* ---------------- Pestaña: mis tests ---------------- */
function MisTests({ pruebas, subareas }) {
  const [filtros, setFiltros] = useState({ subarea: '', estado: '', prueba: '' });
  const [recarga, setRecarga] = useState(0);
  const [formAbierto, setFormAbierto] = useState(false);
  const [planillaId, setPlanillaId] = useState(null);
  // En celular los filtros van en el panel del botón flotante "Filtros" (mismo diseño que Reportes).
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [error, setError] = useState('');

  const params = useMemo(() => Object.fromEntries(Object.entries(filtros).filter(([, valor]) => valor)), [filtros]);
  const fetchPage = useMemo(
    () => (page) => TestService.getTests({ ...params, page }),
    [params],
  );
  const lista = usePaginado(fetchPage, recarga);

  const cancelarTest = async (test) => {
    if (!window.confirm(`¿Cancelar el test "${test.prueba_nombre}" de ${test.subarea_nombre} del ${formatFecha(test.fecha)}?`)) return;
    setError('');
    try {
      await TestService.updateTest(test.id, { estado: 'cancelado' });
      setRecarga((n) => n + 1);
    } catch (err) {
      setError(mensajeError(err, 'No se pudo cancelar el test.'));
    }
  };

  if (planillaId) {
    return <PlanillaTest testId={planillaId} onVolver={() => { setPlanillaId(null); setRecarga((n) => n + 1); }} />;
  }

  const accionesDe = (test) => (
    <div className="tests-ent-fila-acciones">
      <button type="button" className="tests-ent-btn tests-ent-btn--chico" onClick={() => setPlanillaId(test.id)}>
        {test.estado === 'programado' ? 'Abrir planilla' : 'Ver resultados'}
      </button>
      {test.estado === 'programado' && (
        <button type="button" className="tests-ent-btn tests-ent-btn--chico tests-ent-btn--peligro" onClick={() => cancelarTest(test)}>
          Cancelar
        </button>
      )}
    </div>
  );

  // Filtros: se pintan en la barra (monitores) y en el panel "Filtros" (celular).
  const controlesFiltro1 = (
    <>
        <select value={filtros.subarea} onChange={(event) => setFiltros({ ...filtros, subarea: event.target.value })} aria-label="Filtrar por subárea">
          <option value="">Todas mis subáreas</option>
          {subareas.map((subarea) => <option key={subarea.id} value={String(subarea.id)}>{subarea.nombre}</option>)}
        </select>
        <select value={filtros.prueba} onChange={(event) => setFiltros({ ...filtros, prueba: event.target.value })} aria-label="Filtrar por prueba">
          <option value="">Todas las pruebas</option>
          {pruebas.map((prueba) => <option key={prueba.id} value={String(prueba.id)}>{prueba.nombre}</option>)}
        </select>
        <select value={filtros.estado} onChange={(event) => setFiltros({ ...filtros, estado: event.target.value })} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          {ESTADOS.map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}
        </select>
    </>
  );

  return (
    <>
      <div className="tests-ent-toolbar">
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
            <div className="filtros-sheet__body">
              {controlesFiltro1}
            </div>
            <footer className="filtros-sheet__footer">
              <button type="button" className="filtros-sheet__btn" onClick={() => setFiltrosAbiertos(false)}>Cerrar</button>
              <button type="button" className="filtros-sheet__btn filtros-sheet__btn--primario" onClick={() => setFiltrosAbiertos(false)}>Aplicar filtros</button>
            </footer>
          </div>,
          document.body,
        )}
        <div className="filtros-escritorio">{controlesFiltro1}</div>
        {!formAbierto && (
          <div className="tests-ent-toolbar-acciones">
            <button type="button" className="tests-ent-btn" onClick={() => setFormAbierto(true)}>
              <Plus size={16} aria-hidden="true" />Asignar test
            </button>
          </div>
        )}
      </div>

      {formAbierto && (
        <CrearTest
          pruebas={pruebas}
          subareas={subareas}
          onCancelar={() => setFormAbierto(false)}
          onCreado={(creado) => { setFormAbierto(false); setRecarga((n) => n + 1); setPlanillaId(creado?.id ?? null); }}
        />
      )}

      {error && <p className="tests-ent-error" role="alert">{error}</p>}

      {lista.error ? (
        <p className="tests-ent-vacio tests-ent-error" role="alert">{lista.error}</p>
      ) : lista.cargando ? (
        <p className="tests-ent-vacio">Cargando tests...</p>
      ) : !lista.filas.length ? (
        <p className="tests-ent-vacio">No tienes tests con esos filtros.</p>
      ) : (
        <div className="responsive-list">
          <div className="responsive-list__table tests-ent-tabla-wrap">
            <table className="tests-ent-tabla">
              <thead>
                <tr><th>Fecha</th><th>Prueba</th><th>Área · Subárea</th><th>Estado</th><th>Resultados</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {lista.filas.map((test) => (
                  <tr key={test.id}>
                    <td>{formatFecha(test.fecha)}</td>
                    <td className="tests-ent-fuerte">{test.prueba_nombre}</td>
                    <td>{test.area_nombre} · {test.subarea_nombre}</td>
                    <td><EstadoBadge estado={test.estado} label={test.estado_label} /></td>
                    <td>{test.resultados_registrados} de {test.convocados_total}</td>
                    <td>{accionesDe(test)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="responsive-list__cards">
            <div className="tests-ent-cards">
              {lista.filas.map((test) => (
                <article className="tests-ent-card" key={test.id}>
                  <div className="tests-ent-card-head">
                    <h4>{test.prueba_nombre}</h4>
                    <EstadoBadge estado={test.estado} label={test.estado_label} />
                  </div>
                  <dl>
                    <div><dt>Fecha</dt><dd>{formatFecha(test.fecha)}</dd></div>
                    <div><dt>Subárea</dt><dd>{test.area_nombre} · {test.subarea_nombre}</dd></div>
                    <div><dt>Resultados</dt><dd>{test.resultados_registrados} de {test.convocados_total}</dd></div>
                  </dl>
                  {accionesDe(test)}
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
      <Paginacion page={lista.page} total={lista.total} onChange={lista.setPage} />
    </>
  );
}

/* ---------------- Pestaña: catálogo de pruebas (cualquier entrenador crea y edita) ---------------- */
const PRUEBA_VACIA = { nombre: '', unidad: 's', criterio: 'menor', descripcion: '' };

function CatalogoPruebas({ pruebas, onCambio }) {
  const [form, setForm] = useState(PRUEBA_VACIA);
  const [editandoId, setEditandoId] = useState(null);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [guardando, setGuardando] = useState(false);

  const enviar = async (event) => {
    event.preventDefault();
    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });
    try {
      if (editandoId) await TestService.updatePrueba(editandoId, form);
      else await TestService.createPrueba(form);
      setMensaje({ tipo: 'ok', texto: editandoId ? 'Prueba actualizada.' : 'Prueba creada.' });
      setForm(PRUEBA_VACIA);
      setEditandoId(null);
      onCambio();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: mensajeError(error, 'No se pudo guardar la prueba.') });
    } finally {
      setGuardando(false);
    }
  };

  const alternarActiva = async (prueba) => {
    try {
      await TestService.updatePrueba(prueba.id, { activa: !prueba.activa });
      onCambio();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: mensajeError(error, 'No se pudo actualizar la prueba.') });
    }
  };

  const editar = (prueba) => {
    setEditandoId(prueba.id);
    setForm({ nombre: prueba.nombre, unidad: prueba.unidad, criterio: prueba.criterio, descripcion: prueba.descripcion || '' });
    setMensaje({ tipo: '', texto: '' });
  };

  const accionesDe = (prueba) => (
    <div className="tests-ent-fila-acciones">
      <button type="button" className="tests-ent-btn tests-ent-btn--chico tests-ent-btn--ghost" onClick={() => editar(prueba)}>Editar</button>
      <button type="button" className="tests-ent-btn tests-ent-btn--chico tests-ent-btn--ghost" onClick={() => alternarActiva(prueba)}>
        {prueba.activa ? 'Desactivar' : 'Activar'}
      </button>
    </div>
  );

  return (
    <>
      <form className="tests-ent-panel tests-ent-form" onSubmit={enviar}>
        <h3>{editandoId ? 'Editar test' : 'Crear test'}</h3>
        <div className="tests-ent-form-grid">
          <label>
            <span>Nombre</span>
            <input type="text" value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} placeholder="Ej. Sprint 50 m" required maxLength={80} />
          </label>
          <label>
            <span>Unidad</span>
            <select value={form.unidad} onChange={(event) => setForm({ ...form, unidad: event.target.value })}>
              {UNIDADES.map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}
            </select>
          </label>
          <label>
            <span>Criterio</span>
            <select value={form.criterio} onChange={(event) => setForm({ ...form, criterio: event.target.value })}>
              <option value="menor">Menor es mejor (ej. tiempos)</option>
              <option value="mayor">Mayor es mejor (ej. distancias)</option>
            </select>
          </label>
          <label className="tests-ent-form-ancho">
            <span>Descripción (opcional)</span>
            <textarea rows={2} value={form.descripcion} onChange={(event) => setForm({ ...form, descripcion: event.target.value })} />
          </label>
        </div>
        {mensaje.texto && <p className={mensaje.tipo === 'ok' ? 'tests-ent-ok' : 'tests-ent-error'}>{mensaje.texto}</p>}
        <div className="tests-ent-acciones">
          {editandoId && (
            <button type="button" className="tests-ent-btn tests-ent-btn--ghost" onClick={() => { setEditandoId(null); setForm(PRUEBA_VACIA); }}>
              Cancelar edición
            </button>
          )}
          <button type="submit" className="tests-ent-btn" disabled={guardando}>{editandoId ? 'Guardar cambios' : 'Crear test'}</button>
        </div>
      </form>

      {!pruebas.length ? (
        <p className="tests-ent-vacio">Todavía no hay pruebas en el catálogo.</p>
      ) : (
        <div className="responsive-list">
          <div className="responsive-list__table tests-ent-tabla-wrap">
            <table className="tests-ent-tabla">
              <thead>
                <tr><th>Prueba</th><th>Unidad</th><th>Criterio</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {pruebas.map((prueba) => (
                  <tr key={prueba.id}>
                    <td>
                      <div className="tests-ent-fuerte">{prueba.nombre}</div>
                      {prueba.descripcion && <small className="tests-ent-muted">{prueba.descripcion}</small>}
                    </td>
                    <td>{prueba.unidad_label}</td>
                    <td>{prueba.criterio_label}</td>
                    <td>{prueba.activa ? 'Activa' : 'Desactivada'}</td>
                    <td>{accionesDe(prueba)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="responsive-list__cards">
            <div className="tests-ent-cards">
              {pruebas.map((prueba) => (
                <article className="tests-ent-card" key={prueba.id}>
                  <div className="tests-ent-card-head">
                    <h4>{prueba.nombre}</h4>
                    <span className="tests-ent-muted">{prueba.activa ? 'Activa' : 'Desactivada'}</span>
                  </div>
                  <dl>
                    <div><dt>Unidad</dt><dd>{prueba.unidad_label}</dd></div>
                    <div><dt>Criterio</dt><dd>{prueba.criterio_label}</dd></div>
                    {prueba.descripcion && <div><dt>Descripción</dt><dd>{prueba.descripcion}</dd></div>}
                  </dl>
                  {accionesDe(prueba)}
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------- Vista principal del entrenador ---------------- */
// "Mis tests" y "Crear test" son botones del menú lateral; cada uno abre su sección.
const TITULOS = {
  tests: 'Mis tests',
  catalogo: 'Crear test',
};

const normalizarSubareas = (relaciones) => {
  const vistos = new Set();
  return (Array.isArray(relaciones) ? relaciones : []).reduce((lista, relacion) => {
    const detalle = relacion.subarea_detalle;
    const id = detalle?.id ?? relacion.subarea;
    if (id == null || vistos.has(id)) return lista;
    vistos.add(id);
    lista.push({ id, nombre: detalle?.nombre || 'Subárea', areaNombre: detalle?.area?.nombre || '' });
    return lista;
  }, []);
};

export default function TestsTrainer({ seccion = 'tests' }) {
  const [catalogos, setCatalogos] = useState({ pruebas: [], subareas: [], error: '' });
  const [recargaPruebas, setRecargaPruebas] = useState(0);

  useEffect(() => {
    let activo = true;
    Promise.all([TestService.getPruebas(), UserService.getMySubareas()])
      .then(([pruebas, subareas]) => {
        if (activo) {
          setCatalogos({
            pruebas: Array.isArray(pruebas) ? pruebas : [],
            subareas: normalizarSubareas(subareas),
            error: '',
          });
        }
      })
      .catch((error) => { if (activo) setCatalogos((prev) => ({ ...prev, error: mensajeError(error, 'No se pudieron cargar los datos.') })); });
    return () => { activo = false; };
  }, [recargaPruebas]);

  return (
    <div className="tests-ent">
      <header className="tests-ent-header">
        <h2>{TITULOS[seccion] || TITULOS.tests}</h2>
      </header>

      {catalogos.error && <p className="tests-ent-error" role="alert">{catalogos.error}</p>}

      {seccion !== 'catalogo' && <MisTests pruebas={catalogos.pruebas} subareas={catalogos.subareas} />}
      {seccion === 'catalogo' && <CatalogoPruebas pruebas={catalogos.pruebas} onCambio={() => setRecargaPruebas((n) => n + 1)} />}
    </div>
  );
}
