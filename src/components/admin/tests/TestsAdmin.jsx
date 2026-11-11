import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Plus, SlidersHorizontal, X } from 'lucide-react';
import TestService from '../../../api/services/Testservice';
import { useApplicationPermissions } from '../../../context/ApplicationPermissionsContext';
import '../../../styles/components/admin/tests/TestsAdmin.css';

const PAGE_SIZE = 15;

// Hoy en hora de Caracas: la recuperación se programa desde hoy en adelante.
const hoyCaracas = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Caracas' });

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

// Trimestres del calendario (ene–mar, abr–jun, jul–sep, oct–dic).
const NOMBRE_TRIMESTRE = ['ene–mar', 'abr–jun', 'jul–sep', 'oct–dic'];
const finDelTrimestre = (iso) => {
  const anio = Number(iso.slice(0, 4));
  const mesFin = Math.floor((Number(iso.slice(5, 7)) - 1) / 3) * 3 + 3;
  const ultimoDia = new Date(anio, mesFin, 0).getDate();
  return `${anio}-${String(mesFin).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
};
// Último día para recuperar un test: 3 meses después de su fecha (si el mes no tiene ese día, el último del mes).
const limiteRecuperacion = (iso) => {
  const [anio, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  const total = mes - 1 + 3;
  const anioFin = anio + Math.floor(total / 12);
  const mesFin = (total % 12) + 1;
  const diaFin = Math.min(dia, new Date(anioFin, mesFin, 0).getDate());
  return `${anioFin}-${String(mesFin).padStart(2, '0')}-${String(diaFin).padStart(2, '0')}`;
};
// Los últimos 8 trimestres (2 años), del actual hacia atrás, para el filtro.
const opcionesTrimestre = () => {
  const hoy = hoyCaracas();
  let anio = Number(hoy.slice(0, 4));
  let t = Math.floor((Number(hoy.slice(5, 7)) - 1) / 3);
  const opciones = [];
  for (let i = 0; i < 8; i += 1) {
    const mesIni = t * 3 + 1;
    const desde = `${anio}-${String(mesIni).padStart(2, '0')}-01`;
    opciones.push({ valor: desde, etiqueta: `${anio} · T${t + 1} (${NOMBRE_TRIMESTRE[t]})`, desde, hasta: finDelTrimestre(desde) });
    t -= 1;
    if (t < 0) { t = 3; anio -= 1; }
  }
  return opciones;
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

/* ---------------- Reprogramar: recuperación individual de un test finalizado ---------------- */
// Solo para quienes no presentaron (sin resultado) y aún no tienen recuperación. La fecha del test no cambia.
function Reprogramar({ test, onReprogramado }) {
  const [elegidos, setElegidos] = useState([]);
  const [fecha, setFecha] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const pendientes = test.convocados.filter((fila) => fila.valor === null && !fila.fecha_recuperacion);
  // La recuperación solo se hace hasta 3 meses después del test (15/01 -> hasta el 15/04).
  const limite = limiteRecuperacion(test.fecha);
  const trimestreCerrado = hoyCaracas() > limite;

  const alternar = (atletaId) => {
    setElegidos((actual) => (actual.includes(atletaId) ? actual.filter((id) => id !== atletaId) : [...actual, atletaId]));
  };

  const enviar = async (event) => {
    event.preventDefault();
    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });
    try {
      const actualizado = await TestService.reprogramarTest(test.id, { atletas: elegidos, fecha });
      setElegidos([]);
      setFecha('');
      setMensaje({ tipo: 'ok', texto: `Recuperación programada para el ${formatFecha(fecha)}.` });
      onReprogramado(actualizado);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: mensajeError(error, 'No se pudo reprogramar.') });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className="tests-adm-reprogramar" onSubmit={enviar}>
      <h4>Reprogramar a quienes no presentaron</h4>
      {trimestreCerrado ? (
        <p className="tests-adm-vacio">
          El plazo para recuperar este test venció el {formatFecha(limite)} (3 meses después del test): ya no se puede programar una recuperación.
        </p>
      ) : !pendientes.length ? (
        <p className="tests-adm-vacio">Todos presentaron el test o ya tienen su recuperación programada.</p>
      ) : (
        <>
          <div className="tests-adm-reprogramar-lista">
            {pendientes.map((fila) => (
              <label key={fila.atleta_id} className="tests-adm-reprogramar-atleta">
                <input type="checkbox" checked={elegidos.includes(fila.atleta_id)} onChange={() => alternar(fila.atleta_id)} />
                <span>{fila.nombre} {fila.apellido} · Cédula {fila.cedula}{fila.ausente ? ' · Ausente' : ''}</span>
              </label>
            ))}
          </div>
          <label className="tests-adm-reprogramar-fecha">
            <span>Fecha de recuperación</span>
            <input type="date" value={fecha} min={hoyCaracas()} max={limite} onChange={(event) => setFecha(event.target.value)} required />
            <small>Dentro de los 3 meses siguientes al test: a más tardar el {formatFecha(limite)}.</small>
          </label>
          <button type="submit" className="tests-adm-btn" disabled={guardando || !elegidos.length || !fecha}>
            {guardando ? 'Guardando...' : `Reprogramar (${elegidos.length})`}
          </button>
        </>
      )}
      {mensaje.texto && <p className={mensaje.tipo === 'ok' ? 'tests-adm-ok' : 'tests-adm-error'} role={mensaje.tipo === 'ok' ? 'status' : 'alert'}>{mensaje.texto}</p>}
    </form>
  );
}

/* ---------------- Resultados de un test (consulta; con permiso, reprogramar si ya culminó) ---------------- */
function DetalleTest({ testId, onVolver }) {
  const [detalle, setDetalle] = useState({ id: null, data: null, error: '' });
  const [pagina, setPagina] = useState(1);
  const { hasPermission } = useApplicationPermissions();

  useEffect(() => {
    let activo = true;
    TestService.getTest(testId)
      .then((data) => { if (activo) setDetalle({ id: testId, data, error: '' }); })
      .catch((error) => { if (activo) setDetalle({ id: testId, data: null, error: mensajeError(error, 'No se pudo cargar el test.') }); });
    return () => { activo = false; };
  }, [testId]);

  if (detalle.id !== testId) return <p className="tests-adm-vacio">Cargando test...</p>;
  if (detalle.error) return <p className="tests-adm-vacio tests-adm-error" role="alert">{detalle.error}</p>;

  const test = detalle.data;
  // Los convocados se muestran de 15 en 15 (paginación arriba y abajo).
  const paginaActual = Math.min(pagina, Math.max(1, Math.ceil(test.convocados.length / PAGE_SIZE)));
  const convocadosPagina = test.convocados.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE);

  return (
    <section className="tests-adm-panel">
      <button type="button" className="tests-adm-btn tests-adm-btn--ghost" onClick={onVolver}>
        <ArrowLeft size={16} aria-hidden="true" />Volver a la lista
      </button>
      <div className="tests-adm-detalle-head">
        <div>
          <h3>{test.prueba_nombre}</h3>
          <p>{test.area_nombre} · {test.subarea_nombre} · {formatFecha(test.fecha)} · unidad: {test.prueba_unidad}</p>
          <p>Entrenador: {test.entrenador_nombre || '—'}</p>
          {test.observaciones && <p className="tests-adm-observaciones">{test.observaciones}</p>}
        </div>
        <EstadoBadge estado={test.estado} label={test.estado_label} />
      </div>

      <Paginacion page={paginaActual} total={test.convocados.length} onChange={setPagina} />
      {!test.convocados.length ? (
        <p className="tests-adm-vacio">Este test no tiene atletas.</p>
      ) : (
        <div className="responsive-list">
          <div className="responsive-list__table tests-adm-tabla-wrap">
            <table className="tests-adm-tabla">
              <thead>
                <tr><th>Atleta</th><th>Cédula</th><th>Categoría</th><th>Resultado ({test.prueba_unidad})</th><th>Recuperación</th><th>Observación</th></tr>
              </thead>
              <tbody>
                {convocadosPagina.map((fila) => (
                  <tr key={fila.atleta_id}>
                    <td className="tests-adm-fuerte">{fila.nombre} {fila.apellido}</td>
                    <td>{fila.cedula}</td>
                    <td>{fila.categoria || '—'}</td>
                    <td>{fila.ausente ? 'Ausente' : conUnidad(fila.valor, test.prueba_unidad)}</td>
                    <td>{fila.fecha_recuperacion ? `${formatFecha(fila.fecha_recuperacion)}${fila.recuperacion_pendiente ? ' (pendiente)' : ''}` : '—'}</td>
                    <td>{observacionDe(fila)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="responsive-list__cards">
            <div className="tests-adm-cards">
              {convocadosPagina.map((fila) => (
                <article className="tests-adm-card" key={fila.atleta_id}>
                  <h4>{fila.nombre} {fila.apellido}</h4>
                  <p className="tests-adm-card-sub">Cédula {fila.cedula} · {fila.categoria || 'Sin categoría'}</p>
                  <dl>
                    <div><dt>Resultado</dt><dd>{fila.ausente ? 'Ausente' : conUnidad(fila.valor, test.prueba_unidad)}</dd></div>
                    {fila.fecha_recuperacion && <div><dt>Recuperación</dt><dd>{fila.fecha_recuperacion ? `${formatFecha(fila.fecha_recuperacion)}${fila.recuperacion_pendiente ? ' (pendiente)' : ''}` : '—'}</dd></div>}
                    <div><dt>Observación</dt><dd>{observacionDe(fila)}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
      <Paginacion page={paginaActual} total={test.convocados.length} onChange={setPagina} />

      {test.estado === 'realizado' && hasPermission('reprogramar_test') && (
        <Reprogramar test={test} onReprogramado={(data) => setDetalle({ id: testId, data, error: '' })} />
      )}
    </section>
  );
}

/* ---------------- Asignar test (permiso asignar_test) ---------------- */
// Como el del entrenador, pero en cualquier subárea y eligiendo al entrenador responsable: él carga los
// resultados en su planilla, y los atletas que se ofrecen son los que lleva en esa subárea.
function AsignarTest({ pruebas, filtrosBase, onCreado, onCancelar }) {
  const [form, setForm] = useState({ subarea: '', entrenador: '', prueba: '', fecha: '' });
  const [disponibles, setDisponibles] = useState({ clave: '', filas: [], error: '' });
  const [seleccion, setSeleccion] = useState({ clave: '', ids: [] });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const subareaElegida = filtrosBase.subareas.find((subarea) => String(subarea.id) === form.subarea);
  const areaElegida = subareaElegida?.area_id ?? null;
  const nombreArea = filtrosBase.areas.find((area) => area.id === areaElegida)?.nombre || 'esta área';
  const trabajaEn = (entrenador, subareaId) => (entrenador.subareas || []).some((id) => String(id) === subareaId);
  const entrenadoresDeSubarea = form.subarea
    ? filtrosBase.entrenadores.filter((entrenador) => trabajaEn(entrenador, form.subarea))
    : [];
  const pruebasDelArea = pruebas.filter((prueba) => prueba.activa && areaElegida !== null && prueba.area === areaElegida);
  const avisoSinPruebas = form.subarea && !pruebasDelArea.length
    ? `No hay tests activos de ${nombreArea}. Créalo primero en "Crear test".`
    : '';

  const clave = form.subarea && form.entrenador ? `${form.subarea}-${form.entrenador}-${form.prueba}` : '';

  useEffect(() => {
    if (!clave) return undefined;
    let activo = true;
    const params = { subarea: form.subarea, entrenador: form.entrenador };
    if (form.prueba) params.prueba = form.prueba;
    TestService.getAtletasDisponibles(params)
      .then((filas) => { if (activo) setDisponibles({ clave, filas: Array.isArray(filas) ? filas : [], error: '' }); })
      .catch((err) => { if (activo) setDisponibles({ clave, filas: [], error: mensajeError(err, 'No se pudieron cargar los atletas.') }); });
    return () => { activo = false; };
  }, [clave, form.subarea, form.entrenador, form.prueba]);

  // Al cambiar la subárea se limpian el entrenador y la prueba si ya no corresponden.
  const cambiarSubarea = (valor) => {
    const area = filtrosBase.subareas.find((subarea) => String(subarea.id) === valor)?.area_id ?? null;
    const pruebaValida = pruebas.some((prueba) => String(prueba.id) === form.prueba && prueba.area === area);
    const entrenadorValido = filtrosBase.entrenadores.some(
      (entrenador) => String(entrenador.id) === form.entrenador && trabajaEn(entrenador, valor),
    );
    setForm({ ...form, subarea: valor, prueba: pruebaValida ? form.prueba : '', entrenador: entrenadorValido ? form.entrenador : '' });
  };

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
      setError(mensajeError(err, 'No se pudo asignar el test.'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className="tests-adm-panel tests-adm-form" onSubmit={enviar}>
      <h3>Asignar test</h3>
      {avisoSinPruebas && <p className="tests-adm-error" role="alert">{avisoSinPruebas}</p>}
      <div className="tests-adm-form-grid">
        <label>
          <span>Subárea</span>
          <select value={form.subarea} onChange={(event) => cambiarSubarea(event.target.value)} required>
            <option value="">Selecciona una subárea</option>
            {filtrosBase.subareas.map((subarea) => {
              const area = filtrosBase.areas.find((item) => item.id === subarea.area_id)?.nombre;
              return <option key={subarea.id} value={String(subarea.id)}>{area ? `${area} · ` : ''}{subarea.nombre}</option>;
            })}
          </select>
        </label>
        <label>
          <span>Entrenador responsable</span>
          <select value={form.entrenador} onChange={(event) => setForm({ ...form, entrenador: event.target.value })} required disabled={!form.subarea}>
            <option value="">
              {!form.subarea ? 'Primero elige la subárea' : entrenadoresDeSubarea.length ? 'Selecciona el entrenador' : 'Esta subárea no tiene entrenadores'}
            </option>
            {entrenadoresDeSubarea.map((entrenador) => (
              <option key={entrenador.id} value={String(entrenador.id)}>{entrenador.nombre}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Test</span>
          <select value={form.prueba} onChange={(event) => setForm({ ...form, prueba: event.target.value })} required disabled={!form.subarea}>
            <option value="">
              {!form.subarea ? 'Primero elige la subárea' : pruebasDelArea.length ? 'Selecciona un test' : 'No hay tests de esta área'}
            </option>
            {pruebasDelArea.map((prueba) => (
              <option key={prueba.id} value={String(prueba.id)}>{prueba.nombre} ({prueba.unidad})</option>
            ))}
          </select>
        </label>
        <label>
          <span>Fecha</span>
          <input type="date" value={form.fecha} min={hoyCaracas()} onChange={(event) => setForm({ ...form, fecha: event.target.value })} required />
        </label>
      </div>

      <div className="tests-adm-atletas">
        <div className="tests-adm-atletas-head">
          <strong>Atletas del entrenador en la subárea</strong>
          {elegibles.length > 0 && (
            <label className="tests-adm-check">
              <input type="checkbox" checked={todosMarcados} onChange={alternarTodos} />
              Seleccionar todos ({elegidos.length}/{elegibles.length})
            </label>
          )}
        </div>
        {!clave ? (
          <p className="tests-adm-muted">Elige la subárea y el entrenador responsable para ver sus atletas.</p>
        ) : cargandoAtletas ? (
          <p className="tests-adm-muted">Cargando atletas...</p>
        ) : disponibles.error ? (
          <p className="tests-adm-error" role="alert">{disponibles.error}</p>
        ) : !atletas.length ? (
          <p className="tests-adm-muted">Este entrenador no tiene atletas activos en esta subárea.</p>
        ) : (
          <div className="tests-adm-atletas-lista">
            {atletas.map((atleta) => (
              <label key={atleta.atleta_id} className={`tests-adm-atleta${atleta.pendiente ? ' tests-adm-atleta--bloqueado' : ''}`}>
                <input
                  type="checkbox"
                  checked={elegidos.includes(atleta.atleta_id)}
                  disabled={atleta.pendiente}
                  onChange={() => alternar(atleta.atleta_id)}
                />
                <span className="tests-adm-atleta-info">
                  <strong>{atleta.nombre} {atleta.apellido}</strong>
                  <small>Cédula {atleta.cedula}{atleta.categoria ? ` · ${atleta.categoria}` : ''}</small>
                  {atleta.pendiente && <small className="tests-adm-aviso">Ya tiene este test pendiente</small>}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {error && <p className="tests-adm-error" role="alert">{error}</p>}

      <div className="tests-adm-acciones">
        <button type="button" className="tests-adm-btn tests-adm-btn--ghost" onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="tests-adm-btn" disabled={guardando || !elegidos.length || Boolean(avisoSinPruebas)}>
          {guardando ? 'Guardando...' : 'Asignar test'}
        </button>
      </div>
    </form>
  );
}

/* ---------------- Pestaña: tests programados (consulta; con asignar_test, también asignar) ---------------- */
function TestsProgramados({ pruebas, filtrosBase }) {
  const [filtros, setFiltros] = useState({ entrenador: '', area: '', subarea: '', estado: '', prueba: '' });
  const [trimestre, setTrimestre] = useState('');
  const trimestres = useMemo(() => opcionesTrimestre(), []);
  const [detalleId, setDetalleId] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const [formAbierto, setFormAbierto] = useState(false);
  const { hasPermission } = useApplicationPermissions();
  // Sin el permiso asignar_test no se muestra el botón ni el formulario.
  const puedeAsignar = hasPermission('asignar_test');
  // En celular los filtros van detrás del botón "Filtros" (en monitores siempre se ven).
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const params = useMemo(() => {
    const elegido = trimestres.find((opcion) => opcion.valor === trimestre);
    return {
      ...Object.fromEntries(Object.entries(filtros).filter(([, valor]) => valor)),
      ...(elegido && { desde: elegido.desde, hasta: elegido.hasta }),
    };
  }, [filtros, trimestre, trimestres]);
  const fetchPage = useMemo(
    () => (page) => TestService.getTests({ ...params, page }),
    [params],
  );
  const lista = usePaginado(fetchPage, recarga);
  const subareasDelArea = filtros.area
    ? filtrosBase.subareas.filter((subarea) => String(subarea.area_id) === filtros.area)
    : filtrosBase.subareas;

  if (detalleId) {
    return <DetalleTest testId={detalleId} onVolver={() => setDetalleId(null)} />;
  }

  // Filtros: se pintan en la barra (monitores) y en el panel "Filtros" (celular).
  const controlesFiltro1 = (
    <>
        <select value={filtros.entrenador} onChange={(event) => setFiltros({ ...filtros, entrenador: event.target.value })} aria-label="Filtrar por entrenador">
          <option value="">Todos los entrenadores</option>
          {filtrosBase.entrenadores.map((entrenador) => <option key={entrenador.id} value={String(entrenador.id)}>{entrenador.nombre}</option>)}
        </select>
        <select value={filtros.area} onChange={(event) => setFiltros({ ...filtros, area: event.target.value, subarea: '' })} aria-label="Filtrar por área">
          <option value="">Todas las áreas</option>
          {filtrosBase.areas.map((area) => <option key={area.id} value={String(area.id)}>{area.nombre}</option>)}
        </select>
        <select value={filtros.subarea} onChange={(event) => setFiltros({ ...filtros, subarea: event.target.value })} aria-label="Filtrar por subárea">
          <option value="">Todas las subáreas</option>
          {subareasDelArea.map((subarea) => <option key={subarea.id} value={String(subarea.id)}>{subarea.nombre}</option>)}
        </select>
        <select value={filtros.prueba} onChange={(event) => setFiltros({ ...filtros, prueba: event.target.value })} aria-label="Filtrar por prueba">
          <option value="">Todas las pruebas</option>
          {pruebas.map((prueba) => <option key={prueba.id} value={String(prueba.id)}>{prueba.nombre}</option>)}
        </select>
        <select value={filtros.estado} onChange={(event) => setFiltros({ ...filtros, estado: event.target.value })} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          {ESTADOS.map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}
        </select>
        <select value={trimestre} onChange={(event) => setTrimestre(event.target.value)} aria-label="Filtrar por trimestre">
          <option value="">Todos los trimestres</option>
          {trimestres.map((opcion) => <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>)}
        </select>
    </>
  );

  return (
    <>
      <div className="tests-adm-toolbar">
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
        {puedeAsignar && !formAbierto && (
          <div className="tests-adm-toolbar-acciones">
            <button type="button" className="tests-adm-btn" onClick={() => setFormAbierto(true)}>
              <Plus size={16} aria-hidden="true" />Asignar test
            </button>
          </div>
        )}
      </div>

      {puedeAsignar && formAbierto && (
        <AsignarTest
          pruebas={pruebas}
          filtrosBase={filtrosBase}
          onCancelar={() => setFormAbierto(false)}
          onCreado={() => { setFormAbierto(false); setRecarga((n) => n + 1); }}
        />
      )}

      {/* Paginación arriba de la lista (para no bajar hasta el final) y también al final. */}
      <Paginacion page={lista.page} total={lista.total} onChange={lista.setPage} />
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
                <tr><th>Fecha</th><th>Prueba</th><th>Entrenador</th><th>Subárea</th><th>Estado</th><th>Resultados</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {lista.filas.map((test) => (
                  <tr key={test.id}>
                    <td>{formatFecha(test.fecha)}</td>
                    <td className="tests-adm-fuerte">{test.prueba_nombre}</td>
                    <td>{test.entrenador_nombre || '—'}</td>
                    <td>{test.subarea_nombre}</td>
                    <td><EstadoBadge estado={test.estado} label={test.estado_label} /></td>
                    <td>{test.resultados_registrados} de {test.convocados_total}</td>
                    <td>
                      <button type="button" className="tests-adm-btn tests-adm-btn--chico" onClick={() => setDetalleId(test.id)}>
                        Ver resultados
                      </button>
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
                    <div><dt>Entrenador</dt><dd>{test.entrenador_nombre || '—'}</dd></div>
                    <div><dt>Subárea</dt><dd>{test.subarea_nombre}</dd></div>
                    <div><dt>Resultados</dt><dd>{test.resultados_registrados} de {test.convocados_total}</dd></div>
                  </dl>
                  <div className="tests-adm-fila-acciones">
                    <button type="button" className="tests-adm-btn tests-adm-btn--chico" onClick={() => setDetalleId(test.id)}>
                      Ver resultados
                    </button>
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

/* ---------------- Pestaña: crear test (catálogo, permiso asignar_test; cualquier área) ---------------- */
const UNIDADES = [
  ['s', 'Segundos (s)'],
  ['min', 'Minutos (min)'],
  ['m', 'Metros (m)'],
  ['cm', 'Centímetros (cm)'],
  ['kg', 'Kilogramos (kg)'],
  ['rep', 'Repeticiones'],
  ['pts', 'Puntos'],
];

const PRUEBA_VACIA = { nombre: '', area: '', unidad: 's', criterio: 'menor', descripcion: '', valor_maximo: '', decimales: 2 };

function CatalogoPruebas({ pruebas, areas, onCambio }) {
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
      setMensaje({ tipo: 'ok', texto: editandoId ? 'Test actualizado.' : 'Test creado.' });
      setForm(PRUEBA_VACIA);
      setEditandoId(null);
      onCambio();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: mensajeError(error, 'No se pudo guardar el test.') });
    } finally {
      setGuardando(false);
    }
  };

  const alternarActiva = async (prueba) => {
    try {
      await TestService.updatePrueba(prueba.id, { activa: !prueba.activa });
      onCambio();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: mensajeError(error, 'No se pudo actualizar el test.') });
    }
  };

  const editar = (prueba) => {
    setEditandoId(prueba.id);
    setForm({
      nombre: prueba.nombre, area: String(prueba.area ?? ''), unidad: prueba.unidad, criterio: prueba.criterio,
      descripcion: prueba.descripcion || '', valor_maximo: String(Number(prueba.valor_maximo)), decimales: prueba.decimales,
    });
    setMensaje({ tipo: '', texto: '' });
  };

  const accionesDe = (prueba) => (
    <div className="tests-adm-fila-acciones">
      <button type="button" className="tests-adm-btn tests-adm-btn--chico tests-adm-btn--ghost" onClick={() => editar(prueba)}>Editar</button>
      <button type="button" className="tests-adm-btn tests-adm-btn--chico tests-adm-btn--ghost" onClick={() => alternarActiva(prueba)}>
        {prueba.activa ? 'Desactivar' : 'Activar'}
      </button>
    </div>
  );

  return (
    <>
      <form className="tests-adm-panel tests-adm-form" onSubmit={enviar}>
        <h3>{editandoId ? 'Editar test' : 'Crear test'}</h3>
        <div className="tests-adm-form-grid">
          <label>
            <span>Nombre</span>
            <input type="text" value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} placeholder="Ej. Sprint 50 m" required maxLength={80} />
          </label>
          <label>
            <span>Área</span>
            <select value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })} required>
              <option value="">Selecciona el área</option>
              {areas.map((area) => <option key={area.id} value={String(area.id)}>{area.nombre}</option>)}
            </select>
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
          {/* El resultado va de 0 a este tope (en la unidad elegida). Se puede subir después. */}
          <label>
            <span>Valor máximo ({form.unidad})</span>
            <input
              type="number" min="0.01" step="0.01" inputMode="decimal" required
              value={form.valor_maximo}
              onChange={(event) => setForm({ ...form, valor_maximo: event.target.value })}
              placeholder="Ej. 30"
            />
          </label>
          <label>
            <span>Decimales del resultado</span>
            <select value={form.decimales} onChange={(event) => setForm({ ...form, decimales: Number(event.target.value) })}>
              <option value={0}>Sin decimales</option>
              <option value={1}>1 decimal</option>
              <option value={2}>2 decimales</option>
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
          <button type="submit" className="tests-adm-btn" disabled={guardando}>{editandoId ? 'Guardar cambios' : 'Crear test'}</button>
        </div>
      </form>

      {!pruebas.length ? (
        <p className="tests-adm-vacio">Todavía no hay tests en el catálogo.</p>
      ) : (
        <div className="responsive-list">
          <div className="responsive-list__table tests-adm-tabla-wrap">
            <table className="tests-adm-tabla">
              <thead>
                <tr><th>Test</th><th>Área</th><th>Unidad</th><th>Criterio</th><th>Resultado</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {pruebas.map((prueba) => (
                  <tr key={prueba.id}>
                    <td>
                      <div className="tests-adm-fuerte">{prueba.nombre}</div>
                      {prueba.descripcion && <small className="tests-adm-muted">{prueba.descripcion}</small>}
                    </td>
                    <td>{prueba.area_nombre || '—'}</td>
                    <td>{prueba.unidad_label}</td>
                    <td>{prueba.criterio_label}</td>
                    <td>0 a {Number(prueba.valor_maximo)} {prueba.unidad}</td>
                    <td>{prueba.activa ? 'Activo' : 'Desactivado'}</td>
                    <td>{accionesDe(prueba)}</td>
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
                    <span className="tests-adm-muted">{prueba.activa ? 'Activo' : 'Desactivado'}</span>
                  </div>
                  <dl>
                    <div><dt>Área</dt><dd>{prueba.area_nombre || '—'}</dd></div>
                    <div><dt>Unidad</dt><dd>{prueba.unidad_label}</dd></div>
                    <div><dt>Criterio</dt><dd>{prueba.criterio_label}</dd></div>
                    <div><dt>Resultado</dt><dd>0 a {Number(prueba.valor_maximo)} {prueba.unidad}</dd></div>
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

/* ---------------- Vista principal ---------------- */
const SECCIONES = {
  tests: {
    titulo: 'Tests programados',
  },
  catalogo: {
    titulo: 'Crear test',
  },
};

// Observación de un resultado: si se registró (marca o ausencia) y no tiene observación, "Sin novedad";
// si todavía no se registró nada, "Sin registro".
const observacionDe = (fila) => {
  const registrado = fila.ausente || (fila.valor !== null && fila.valor !== undefined && fila.valor !== '');
  if (!registrado) return 'Sin registro';
  return fila.observacion || 'Sin novedad';
};

export default function TestsAdmin({ seccion = 'tests' }) {
  const { hasPermission } = useApplicationPermissions();
  const [recargaPruebas, setRecargaPruebas] = useState(0);
  const [catalogos, setCatalogos] = useState({
    pruebas: [], filtros: { entrenadores: [], areas: [], subareas: [] }, error: '',
  });

  useEffect(() => {
    let activo = true;
    Promise.all([TestService.getPruebas(), TestService.getFiltrosTests()])
      .then(([pruebas, filtros]) => {
        if (activo) {
          setCatalogos({
            pruebas: Array.isArray(pruebas) ? pruebas : [],
            filtros: {
              entrenadores: filtros?.entrenadores ?? [],
              areas: filtros?.areas ?? [],
              subareas: filtros?.subareas ?? [],
            },
            error: '',
          });
        }
      })
      .catch((error) => { if (activo) setCatalogos((prev) => ({ ...prev, error: mensajeError(error, 'No se pudieron cargar los catálogos.') })); });
    return () => { activo = false; };
  }, [recargaPruebas]);

  const actual = SECCIONES[seccion] || SECCIONES.tests;

  return (
    <div className="tests-adm">
      <header className="tests-adm-header">
        <h2>{actual.titulo}</h2>
      </header>

      {catalogos.error && <p className="tests-adm-error" role="alert">{catalogos.error}</p>}

      {seccion === 'tests' && <TestsProgramados pruebas={catalogos.pruebas} filtrosBase={catalogos.filtros} />}
      {seccion === 'catalogo' && hasPermission('asignar_test') && (
        <CatalogoPruebas pruebas={catalogos.pruebas} areas={catalogos.filtros.areas} onCambio={() => setRecargaPruebas((n) => n + 1)} />
      )}
    </div>
  );
}
