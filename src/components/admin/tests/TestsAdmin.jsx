import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import TestService from '../../../api/services/Testservice';
import UserService from '../../../api/services/Userservice';
import { exportToExcel, exportToPdf } from '../../../api/services/reportExport';
import { useApplicationPermissions } from '../../../context/ApplicationPermissionsContext';
import '../../../styles/components/admin/tests/TestsAdmin.css';

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
    <div className="tests-adm-paginacion">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1}>← Anterior</button>
      <span>Página {page} de {paginas}</span>
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= paginas}>Siguiente →</button>
    </div>
  );
}

function EstadoBadge({ estado, label }) {
  return <span className={`tests-adm-estado tests-adm-estado--${estado}`}>{label}</span>;
}

/* ---------------- Registrar resultados de un test ---------------- */
function DetalleTest({ testId, puedeRegistrar, onVolver }) {
  const [detalle, setDetalle] = useState({ id: null, data: null, error: '' });
  const [valores, setValores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let activo = true;
    TestService.getTest(testId)
      .then((data) => {
        if (!activo) return;
        setDetalle({ id: testId, data, error: '' });
        setValores(Object.fromEntries(data.convocados.map((fila) => [
          fila.atleta_id,
          { valor: fila.valor ?? '', ausente: fila.ausente, observacion: fila.observacion },
        ])));
      })
      .catch((error) => { if (activo) setDetalle({ id: testId, data: null, error: mensajeError(error, 'No se pudo cargar el test.') }); });
    return () => { activo = false; };
  }, [testId, recarga]);

  if (detalle.id !== testId) return <p className="tests-adm-vacio">Cargando test...</p>;
  if (detalle.error) return <p className="tests-adm-vacio tests-adm-error" role="alert">{detalle.error}</p>;

  const test = detalle.data;
  const editable = puedeRegistrar && test.estado !== 'cancelado';
  const cambiar = (atletaId, campo, valor) => setValores((prev) => ({ ...prev, [atletaId]: { ...prev[atletaId], [campo]: valor } }));

  const guardar = async (finalizar) => {
    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });
    try {
      const resultados = test.convocados.map((fila) => ({
        atleta: fila.atleta_id,
        valor: valores[fila.atleta_id]?.ausente ? null : valores[fila.atleta_id]?.valor,
        ausente: Boolean(valores[fila.atleta_id]?.ausente),
        observacion: valores[fila.atleta_id]?.observacion || '',
      }));
      await TestService.saveResultados(testId, { resultados, finalizar });
      setMensaje({ tipo: 'ok', texto: finalizar ? 'Resultados guardados y test marcado como realizado.' : 'Resultados guardados.' });
      setRecarga((n) => n + 1);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: mensajeError(error, 'No se pudieron guardar los resultados.') });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="tests-adm-panel">
      <button type="button" className="tests-adm-btn tests-adm-btn--ghost" onClick={onVolver}>
        <ArrowLeft size={16} aria-hidden="true" />Volver a la lista
      </button>
      <div className="tests-adm-detalle-head">
        <div>
          <h3>{test.prueba_nombre}</h3>
          <p>{test.area_nombre} · {test.subarea_nombre} · {formatFecha(test.fecha)} · unidad: {test.prueba_unidad}</p>
          {test.observaciones && <p className="tests-adm-observaciones">{test.observaciones}</p>}
        </div>
        <EstadoBadge estado={test.estado} label={test.estado_label} />
      </div>

      {!test.convocados.length ? (
        <p className="tests-adm-vacio">La subárea no tiene atletas activos convocados.</p>
      ) : (
        <div className="responsive-list">
          <div className="responsive-list__table tests-adm-tabla-wrap">
            <table className="tests-adm-tabla">
              <thead>
                <tr><th>Atleta</th><th>Cédula</th><th>Categoría</th><th>Resultado ({test.prueba_unidad})</th><th>Ausente</th><th>Observación</th></tr>
              </thead>
              <tbody>
                {test.convocados.map((fila) => {
                  const actual = valores[fila.atleta_id] || {};
                  return (
                    <tr key={fila.atleta_id}>
                      <td className="tests-adm-fuerte">{fila.nombre} {fila.apellido}</td>
                      <td>{fila.cedula}</td>
                      <td>{fila.categoria || '—'}</td>
                      <td>
                        {editable ? (
                          <input
                            type="number" min="0" step="0.01" inputMode="decimal"
                            className="tests-adm-input-valor"
                            value={actual.ausente ? '' : actual.valor}
                            disabled={actual.ausente}
                            onChange={(event) => cambiar(fila.atleta_id, 'valor', event.target.value)}
                            aria-label={`Resultado de ${fila.nombre} ${fila.apellido}`}
                          />
                        ) : conUnidad(fila.valor, test.prueba_unidad)}
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={Boolean(actual.ausente)}
                          disabled={!editable}
                          onChange={(event) => cambiar(fila.atleta_id, 'ausente', event.target.checked)}
                          aria-label={`${fila.nombre} ${fila.apellido} ausente`}
                        />
                      </td>
                      <td>
                        {editable ? (
                          <input
                            type="text" className="tests-adm-input-obs"
                            value={actual.observacion || ''}
                            onChange={(event) => cambiar(fila.atleta_id, 'observacion', event.target.value)}
                            aria-label={`Observación de ${fila.nombre} ${fila.apellido}`}
                          />
                        ) : (fila.observacion || '—')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="responsive-list__cards">
            <div className="tests-adm-cards">
              {test.convocados.map((fila) => {
                const actual = valores[fila.atleta_id] || {};
                return (
                  <article className="tests-adm-card" key={fila.atleta_id}>
                    <h4>{fila.nombre} {fila.apellido}</h4>
                    <p className="tests-adm-card-sub">C.I. {fila.cedula} · {fila.categoria || 'Sin categoría'}</p>
                    {editable ? (
                      <div className="tests-adm-card-campos">
                        <label>
                          <span>Resultado ({test.prueba_unidad})</span>
                          <input
                            type="number" min="0" step="0.01" inputMode="decimal"
                            value={actual.ausente ? '' : actual.valor}
                            disabled={actual.ausente}
                            onChange={(event) => cambiar(fila.atleta_id, 'valor', event.target.value)}
                          />
                        </label>
                        <label className="tests-adm-check">
                          <input type="checkbox" checked={Boolean(actual.ausente)} onChange={(event) => cambiar(fila.atleta_id, 'ausente', event.target.checked)} />
                          Ausente
                        </label>
                        <label>
                          <span>Observación</span>
                          <input type="text" value={actual.observacion || ''} onChange={(event) => cambiar(fila.atleta_id, 'observacion', event.target.value)} />
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
        <p className={mensaje.tipo === 'ok' ? 'tests-adm-ok' : 'tests-adm-error'} role={mensaje.tipo === 'ok' ? 'status' : 'alert'}>{mensaje.texto}</p>
      )}

      {editable && test.convocados.length > 0 && (
        <div className="tests-adm-acciones">
          <button type="button" className="tests-adm-btn tests-adm-btn--ghost" disabled={guardando} onClick={() => guardar(false)}>
            Guardar
          </button>
          {test.estado === 'programado' && (
            <button type="button" className="tests-adm-btn" disabled={guardando} onClick={() => guardar(true)}>
              Guardar y marcar como realizado
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/* ---------------- Formulario para programar un test ---------------- */
function ProgramarTest({ pruebas, subareas, onCreado, onCancelar }) {
  const [form, setForm] = useState({ prueba: '', subarea: '', fecha: '', observaciones: '' });
  const [aplicaciones, setAplicaciones] = useState({ prueba: null, filas: [] });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!form.prueba) return undefined;
    let activo = true;
    TestService.getAplicacionesPrueba(form.prueba)
      .then((filas) => { if (activo) setAplicaciones({ prueba: form.prueba, filas }); })
      .catch(() => { if (activo) setAplicaciones({ prueba: form.prueba, filas: [] }); });
    return () => { activo = false; };
  }, [form.prueba]);

  const filas = aplicaciones.prueba === form.prueba ? aplicaciones.filas : [];
  const pendientes = new Set(filas.filter((fila) => fila.estado === 'programado').map((fila) => String(fila.subarea_id)));
  const conflicto = form.subarea && pendientes.has(form.subarea);

  const enviar = async (event) => {
    event.preventDefault();
    setGuardando(true);
    setError('');
    try {
      await TestService.createTest(form);
      onCreado();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo programar el test.'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className="tests-adm-panel tests-adm-form" onSubmit={enviar}>
      <h3>Programar test</h3>
      <div className="tests-adm-form-grid">
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
                {subarea.area?.nombre ? `${subarea.area.nombre} · ` : ''}{subarea.nombre}{pendientes.has(String(subarea.id)) ? ' (ya programada)' : ''}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Fecha</span>
          <input type="date" value={form.fecha} onChange={(event) => setForm({ ...form, fecha: event.target.value })} required />
        </label>
        <label className="tests-adm-form-ancho">
          <span>Observaciones (opcional)</span>
          <textarea rows={2} value={form.observaciones} onChange={(event) => setForm({ ...form, observaciones: event.target.value })} />
        </label>
      </div>

      {form.prueba && (
        <div className="tests-adm-aplicaciones">
          <strong>Subáreas donde ya se aplicó esta prueba</strong>
          {filas.length ? (
            <ul>
              {filas.map((fila) => (
                <li key={fila.test_id}>
                  {fila.area ? `${fila.area} · ` : ''}{fila.subarea} — {formatFecha(fila.fecha)}{' '}
                  <EstadoBadge estado={fila.estado} label={fila.estado_label} />
                </li>
              ))}
            </ul>
          ) : (
            <p>Todavía no se ha aplicado en ninguna subárea.</p>
          )}
        </div>
      )}

      {conflicto && <p className="tests-adm-error" role="alert">Esta subárea ya tiene esta prueba programada y pendiente. Realiza o cancela ese test primero.</p>}
      {error && <p className="tests-adm-error" role="alert">{error}</p>}

      <div className="tests-adm-acciones">
        <button type="button" className="tests-adm-btn tests-adm-btn--ghost" onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="tests-adm-btn" disabled={guardando || conflicto}>Programar</button>
      </div>
    </form>
  );
}

/* ---------------- Pestaña: tests programados ---------------- */
function TestsProgramados({ pruebas, subareas, puedeEditar, puedeRegistrar }) {
  const [filtros, setFiltros] = useState({ subarea: '', estado: '', prueba: '' });
  const [recarga, setRecarga] = useState(0);
  const [formAbierto, setFormAbierto] = useState(false);
  const [detalleId, setDetalleId] = useState(null);
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

  const exportar = async (formato) => {
    const filas = await TestService.getTests(params);
    const secciones = [{
      title: 'Tests programados',
      columns: [
        { key: 'fecha', label: 'Fecha', exportValue: (fila) => formatFecha(fila.fecha) },
        { key: 'prueba_nombre', label: 'Prueba' },
        { key: 'area_nombre', label: 'Área' },
        { key: 'subarea_nombre', label: 'Subárea' },
        { key: 'estado_label', label: 'Estado' },
        { key: 'resultados_registrados', label: 'Resultados' },
      ],
      rows: Array.isArray(filas) ? filas : [],
    }];
    if (formato === 'excel') exportToExcel('tests_programados', secciones);
    else exportToPdf('tests_programados', 'Tests programados', secciones);
  };

  if (detalleId) {
    return <DetalleTest testId={detalleId} puedeRegistrar={puedeRegistrar} onVolver={() => { setDetalleId(null); setRecarga((n) => n + 1); }} />;
  }

  return (
    <>
      <div className="tests-adm-toolbar">
        <select value={filtros.subarea} onChange={(event) => setFiltros({ ...filtros, subarea: event.target.value })} aria-label="Filtrar por subárea">
          <option value="">Todas las subáreas</option>
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
        <div className="tests-adm-toolbar-acciones">
          <button type="button" className="tests-adm-btn tests-adm-btn--ghost" onClick={() => exportar('excel')}>Excel</button>
          <button type="button" className="tests-adm-btn tests-adm-btn--ghost" onClick={() => exportar('pdf')}>PDF</button>
          {puedeEditar && !formAbierto && (
            <button type="button" className="tests-adm-btn" onClick={() => setFormAbierto(true)}>
              <Plus size={16} aria-hidden="true" />Programar test
            </button>
          )}
        </div>
      </div>

      {formAbierto && (
        <ProgramarTest
          pruebas={pruebas}
          subareas={subareas}
          onCancelar={() => setFormAbierto(false)}
          onCreado={() => { setFormAbierto(false); setRecarga((n) => n + 1); }}
        />
      )}

      {error && <p className="tests-adm-error" role="alert">{error}</p>}

      {lista.error ? (
        <p className="tests-adm-vacio tests-adm-error" role="alert">{lista.error}</p>
      ) : lista.cargando ? (
        <p className="tests-adm-vacio">Cargando tests...</p>
      ) : !lista.filas.length ? (
        <p className="tests-adm-vacio">No hay tests con esos filtros.</p>
      ) : (
        <div className="responsive-list">
          <div className="responsive-list__table tests-adm-tabla-wrap">
            <table className="tests-adm-tabla">
              <thead>
                <tr><th>Fecha</th><th>Prueba</th><th>Área · Subárea</th><th>Estado</th><th>Resultados</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {lista.filas.map((test) => (
                  <tr key={test.id}>
                    <td>{formatFecha(test.fecha)}</td>
                    <td className="tests-adm-fuerte">{test.prueba_nombre}</td>
                    <td>{test.area_nombre} · {test.subarea_nombre}</td>
                    <td><EstadoBadge estado={test.estado} label={test.estado_label} /></td>
                    <td>{test.resultados_registrados}</td>
                    <td>
                      <div className="tests-adm-fila-acciones">
                        <button type="button" className="tests-adm-btn tests-adm-btn--chico" onClick={() => setDetalleId(test.id)}>
                          {puedeRegistrar && test.estado !== 'cancelado' ? 'Registrar resultados' : 'Ver resultados'}
                        </button>
                        {puedeEditar && test.estado === 'programado' && (
                          <button type="button" className="tests-adm-btn tests-adm-btn--chico tests-adm-btn--peligro" onClick={() => cancelarTest(test)}>
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="responsive-list__cards">
            <div className="tests-adm-cards">
              {lista.filas.map((test) => (
                <article className="tests-adm-card" key={test.id}>
                  <div className="tests-adm-card-head">
                    <h4>{test.prueba_nombre}</h4>
                    <EstadoBadge estado={test.estado} label={test.estado_label} />
                  </div>
                  <dl>
                    <div><dt>Fecha</dt><dd>{formatFecha(test.fecha)}</dd></div>
                    <div><dt>Subárea</dt><dd>{test.area_nombre} · {test.subarea_nombre}</dd></div>
                    <div><dt>Resultados</dt><dd>{test.resultados_registrados}</dd></div>
                  </dl>
                  <div className="tests-adm-fila-acciones">
                    <button type="button" className="tests-adm-btn tests-adm-btn--chico" onClick={() => setDetalleId(test.id)}>
                      {puedeRegistrar && test.estado !== 'cancelado' ? 'Registrar resultados' : 'Ver resultados'}
                    </button>
                    {puedeEditar && test.estado === 'programado' && (
                      <button type="button" className="tests-adm-btn tests-adm-btn--chico tests-adm-btn--peligro" onClick={() => cancelarTest(test)}>
                        Cancelar
                      </button>
                    )}
                  </div>
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

/* ---------------- Pestaña: catálogo de pruebas ---------------- */
const PRUEBA_VACIA = { nombre: '', unidad: 's', criterio: 'menor', descripcion: '' };

function CatalogoPruebas({ pruebas, puedeEditar, onCambio }) {
  const [form, setForm] = useState(PRUEBA_VACIA);
  const [editandoId, setEditandoId] = useState(null);
  const [aplicaciones, setAplicaciones] = useState({ id: null, filas: [] });
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

  const verAplicaciones = async (prueba) => {
    if (aplicaciones.id === prueba.id) {
      setAplicaciones({ id: null, filas: [] });
      return;
    }
    try {
      setAplicaciones({ id: prueba.id, filas: await TestService.getAplicacionesPrueba(prueba.id) });
    } catch {
      setAplicaciones({ id: prueba.id, filas: [] });
    }
  };

  const editar = (prueba) => {
    setEditandoId(prueba.id);
    setForm({ nombre: prueba.nombre, unidad: prueba.unidad, criterio: prueba.criterio, descripcion: prueba.descripcion || '' });
    setMensaje({ tipo: '', texto: '' });
  };

  const aplicacionesDe = (prueba) => aplicaciones.id === prueba.id && (
    <div className="tests-adm-aplicaciones">
      {aplicaciones.filas.length ? (
        <ul>
          {aplicaciones.filas.map((fila) => (
            <li key={fila.test_id}>{fila.subarea} — {formatFecha(fila.fecha)} <EstadoBadge estado={fila.estado} label={fila.estado_label} /></li>
          ))}
        </ul>
      ) : <p>Todavía no se ha aplicado en ninguna subárea.</p>}
    </div>
  );

  return (
    <>
      {puedeEditar && (
        <form className="tests-adm-panel tests-adm-form" onSubmit={enviar}>
          <h3>{editandoId ? 'Editar prueba' : 'Nueva prueba'}</h3>
          <div className="tests-adm-form-grid">
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
            <label className="tests-adm-form-ancho">
              <span>Descripción (opcional)</span>
              <textarea rows={2} value={form.descripcion} onChange={(event) => setForm({ ...form, descripcion: event.target.value })} />
            </label>
          </div>
          {mensaje.texto && <p className={mensaje.tipo === 'ok' ? 'tests-adm-ok' : 'tests-adm-error'}>{mensaje.texto}</p>}
          <div className="tests-adm-acciones">
            {editandoId && (
              <button type="button" className="tests-adm-btn tests-adm-btn--ghost" onClick={() => { setEditandoId(null); setForm(PRUEBA_VACIA); }}>
                Cancelar edición
              </button>
            )}
            <button type="submit" className="tests-adm-btn" disabled={guardando}>{editandoId ? 'Guardar cambios' : 'Crear prueba'}</button>
          </div>
        </form>
      )}

      {!pruebas.length ? (
        <p className="tests-adm-vacio">Todavía no hay pruebas en el catálogo.</p>
      ) : (
        <div className="responsive-list">
          <div className="responsive-list__table tests-adm-tabla-wrap">
            <table className="tests-adm-tabla">
              <thead>
                <tr><th>Prueba</th><th>Unidad</th><th>Criterio</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {pruebas.map((prueba) => (
                  <tr key={prueba.id}>
                    <td>
                      <div className="tests-adm-fuerte">{prueba.nombre}</div>
                      {prueba.descripcion && <small className="tests-adm-muted">{prueba.descripcion}</small>}
                      {aplicacionesDe(prueba)}
                    </td>
                    <td>{prueba.unidad_label}</td>
                    <td>{prueba.criterio_label}</td>
                    <td>{prueba.activa ? 'Activa' : 'Desactivada'}</td>
                    <td>
                      <div className="tests-adm-fila-acciones">
                        <button type="button" className="tests-adm-btn tests-adm-btn--chico tests-adm-btn--ghost" onClick={() => verAplicaciones(prueba)}>
                          {aplicaciones.id === prueba.id ? 'Ocultar subáreas' : 'Ver subáreas'}
                        </button>
                        {puedeEditar && (
                          <>
                            <button type="button" className="tests-adm-btn tests-adm-btn--chico tests-adm-btn--ghost" onClick={() => editar(prueba)}>Editar</button>
                            <button type="button" className="tests-adm-btn tests-adm-btn--chico tests-adm-btn--ghost" onClick={() => alternarActiva(prueba)}>
                              {prueba.activa ? 'Desactivar' : 'Activar'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="responsive-list__cards">
            <div className="tests-adm-cards">
              {pruebas.map((prueba) => (
                <article className="tests-adm-card" key={prueba.id}>
                  <div className="tests-adm-card-head">
                    <h4>{prueba.nombre}</h4>
                    <span className="tests-adm-muted">{prueba.activa ? 'Activa' : 'Desactivada'}</span>
                  </div>
                  <dl>
                    <div><dt>Unidad</dt><dd>{prueba.unidad_label}</dd></div>
                    <div><dt>Criterio</dt><dd>{prueba.criterio_label}</dd></div>
                    {prueba.descripcion && <div><dt>Descripción</dt><dd>{prueba.descripcion}</dd></div>}
                  </dl>
                  {aplicacionesDe(prueba)}
                  <div className="tests-adm-fila-acciones">
                    <button type="button" className="tests-adm-btn tests-adm-btn--chico tests-adm-btn--ghost" onClick={() => verAplicaciones(prueba)}>
                      {aplicaciones.id === prueba.id ? 'Ocultar subáreas' : 'Ver subáreas'}
                    </button>
                    {puedeEditar && (
                      <>
                        <button type="button" className="tests-adm-btn tests-adm-btn--chico tests-adm-btn--ghost" onClick={() => editar(prueba)}>Editar</button>
                        <button type="button" className="tests-adm-btn tests-adm-btn--chico tests-adm-btn--ghost" onClick={() => alternarActiva(prueba)}>
                          {prueba.activa ? 'Desactivar' : 'Activar'}
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------- Pestaña: ranking ---------------- */
function RankingTests({ pruebas, subareas, categorias }) {
  const [filtros, setFiltros] = useState({ prueba: '', subarea: '', categoria: '', sexo: '' });
  const params = useMemo(() => Object.fromEntries(Object.entries(filtros).filter(([, valor]) => valor)), [filtros]);
  const fetchPage = useMemo(
    () => (filtros.prueba ? (page) => TestService.getRanking({ ...params, page }) : () => Promise.resolve({ results: [], count: 0 })),
    [filtros.prueba, params],
  );
  const lista = usePaginado(fetchPage);
  const prueba = pruebas.find((item) => String(item.id) === filtros.prueba);

  const exportar = async (formato) => {
    const data = await TestService.getRanking(params);
    const secciones = [{
      title: 'Ranking',
      columns: [
        { key: 'posicion', label: 'Posición' },
        { key: 'nombre', label: 'Nombre' },
        { key: 'apellido', label: 'Apellido' },
        { key: 'categoria', label: 'Categoría' },
        { key: 'subarea', label: 'Subárea' },
        { key: 'valor', label: `Mejor marca (${prueba?.unidad || ''})` },
        { key: 'fecha', label: 'Fecha', exportValue: (fila) => formatFecha(fila.fecha) },
      ],
      rows: data?.results ?? [],
    }];
    const titulo = `Ranking — ${prueba?.nombre || ''}`;
    if (formato === 'excel') exportToExcel('ranking_tests', secciones);
    else exportToPdf('ranking_tests', titulo, secciones);
  };

  return (
    <>
      <div className="tests-adm-toolbar">
        <select value={filtros.prueba} onChange={(event) => setFiltros({ ...filtros, prueba: event.target.value })} aria-label="Prueba del ranking">
          <option value="">Selecciona una prueba</option>
          {pruebas.map((item) => <option key={item.id} value={String(item.id)}>{item.nombre}</option>)}
        </select>
        <select value={filtros.subarea} onChange={(event) => setFiltros({ ...filtros, subarea: event.target.value })} aria-label="Filtrar por subárea">
          <option value="">Todas las subáreas</option>
          {subareas.map((subarea) => <option key={subarea.id} value={String(subarea.id)}>{subarea.nombre}</option>)}
        </select>
        <select value={filtros.categoria} onChange={(event) => setFiltros({ ...filtros, categoria: event.target.value })} aria-label="Filtrar por categoría">
          <option value="">Todas las categorías</option>
          {categorias.map((categoria) => <option key={categoria.id} value={categoria.name}>{categoria.name}</option>)}
        </select>
        <select value={filtros.sexo} onChange={(event) => setFiltros({ ...filtros, sexo: event.target.value })} aria-label="Filtrar por sexo">
          <option value="">Ambos sexos</option>
          <option value="F">Femenino</option>
          <option value="M">Masculino</option>
        </select>
        {filtros.prueba && (
          <div className="tests-adm-toolbar-acciones">
            <button type="button" className="tests-adm-btn tests-adm-btn--ghost" onClick={() => exportar('excel')}>Excel</button>
            <button type="button" className="tests-adm-btn tests-adm-btn--ghost" onClick={() => exportar('pdf')}>PDF</button>
          </div>
        )}
      </div>

      {prueba && <p className="tests-adm-muted">Mejor marca de cada atleta · {prueba.criterio_label.toLowerCase()} · tests cancelados y atletas inactivos no cuentan.</p>}

      {!filtros.prueba ? (
        <p className="tests-adm-vacio">Selecciona una prueba para ver el ranking.</p>
      ) : lista.error ? (
        <p className="tests-adm-vacio tests-adm-error" role="alert">{lista.error}</p>
      ) : lista.cargando ? (
        <p className="tests-adm-vacio">Cargando ranking...</p>
      ) : !lista.filas.length ? (
        <p className="tests-adm-vacio">Todavía no hay resultados para esta prueba con esos filtros.</p>
      ) : (
        <div className="responsive-list">
          <div className="responsive-list__table tests-adm-tabla-wrap">
            <table className="tests-adm-tabla">
              <thead>
                <tr><th>#</th><th>Atleta</th><th>Categoría</th><th>Subárea</th><th>Mejor marca</th><th>Fecha</th></tr>
              </thead>
              <tbody>
                {lista.filas.map((fila) => (
                  <tr key={fila.atleta_id}>
                    <td className="tests-adm-posicion">{fila.posicion}</td>
                    <td className="tests-adm-fuerte">{fila.nombre} {fila.apellido}</td>
                    <td>{fila.categoria || '—'}</td>
                    <td>{fila.subarea}</td>
                    <td className="tests-adm-fuerte">{conUnidad(fila.valor, prueba?.unidad)}</td>
                    <td>{formatFecha(fila.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="responsive-list__cards">
            <div className="tests-adm-cards">
              {lista.filas.map((fila) => (
                <article className="tests-adm-card tests-adm-card--ranking" key={fila.atleta_id}>
                  <span className="tests-adm-posicion">{fila.posicion}</span>
                  <div>
                    <h4>{fila.nombre} {fila.apellido}</h4>
                    <p className="tests-adm-card-sub">{fila.categoria || 'Sin categoría'} · {fila.subarea} · {formatFecha(fila.fecha)}</p>
                  </div>
                  <strong>{conUnidad(fila.valor, prueba?.unidad)}</strong>
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

/* ---------------- Vista principal ---------------- */
const SECCIONES = {
  tests: {
    titulo: 'Tests programados',
    descripcion: 'Programa pruebas por subárea y registra los resultados del plantel.',
  },
  catalogo: {
    titulo: 'Creación de pruebas',
    descripcion: 'Crea y administra las pruebas que se usan en los tests (ej. Sprint 50 m).',
  },
  ranking: {
    titulo: 'Ranking',
    descripcion: 'Mejor marca de cada atleta por prueba, con filtros por subárea, categoría y sexo.',
  },
};

export default function TestsAdmin({ seccion = 'tests' }) {
  const { hasPermission } = useApplicationPermissions();
  const [catalogos, setCatalogos] = useState({ pruebas: [], subareas: [], categorias: [], error: '' });
  const [recargaPruebas, setRecargaPruebas] = useState(0);

  useEffect(() => {
    let activo = true;
    Promise.all([TestService.getPruebas(), UserService.getSubareas(), UserService.getAthleteCategories()])
      .then(([pruebas, subareas, categorias]) => {
        if (activo) {
          setCatalogos({
            pruebas: Array.isArray(pruebas) ? pruebas : [],
            subareas: Array.isArray(subareas) ? subareas : [],
            categorias: Array.isArray(categorias) ? categorias : [],
            error: '',
          });
        }
      })
      .catch((error) => { if (activo) setCatalogos((prev) => ({ ...prev, error: mensajeError(error, 'No se pudieron cargar los catálogos.') })); });
    return () => { activo = false; };
  }, [recargaPruebas]);

  const puedeEditar = hasPermission('editar_evaluaciones');
  const puedeRegistrar = hasPermission('registrar_evaluaciones');
  const actual = SECCIONES[seccion] || SECCIONES.tests;

  return (
    <div className="tests-adm">
      <header className="tests-adm-header">
        <h2>{actual.titulo}</h2>
        <p>{actual.descripcion}</p>
      </header>

      {catalogos.error && <p className="tests-adm-error" role="alert">{catalogos.error}</p>}

      {seccion === 'tests' && (
        <TestsProgramados pruebas={catalogos.pruebas} subareas={catalogos.subareas} puedeEditar={puedeEditar} puedeRegistrar={puedeRegistrar} />
      )}
      {seccion === 'catalogo' && (
        <CatalogoPruebas pruebas={catalogos.pruebas} puedeEditar={puedeEditar} onCambio={() => setRecargaPruebas((n) => n + 1)} />
      )}
      {seccion === 'ranking' && (
        <RankingTests pruebas={catalogos.pruebas} subareas={catalogos.subareas} categorias={catalogos.categorias} />
      )}
    </div>
  );
}
