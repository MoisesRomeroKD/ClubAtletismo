import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Plus, SlidersHorizontal, X } from 'lucide-react';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import CineantropometriaService from '../../../api/services/Cineantropometriaservice';
import UserService from '../../../api/services/Userservice';
import '../../../styles/components/admin/antropometria/AntropometriaAdmin.css';

// Hoy en hora de Caracas: las fechas que se programan son desde hoy en adelante.
const hoyCaracas = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Caracas' });

const PAGE_SIZE = 15;

const EJES = [
  ['potencia', 'Potencia'],
  ['velocidad', 'Velocidad'],
  ['resistencia', 'Resistencia'],
  ['envergadura', 'Envergadura'],
  ['fuerza', 'Fuerza'],
  ['flexibilidad', 'Flexibilidad'],
];

const ESTADOS = [
  ['programada', 'Programada'],
  ['realizada', 'Realizada'],
  ['cancelada', 'Cancelada'],
];

const formatFecha = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

const numero = (valor, sufijo = '') => (valor === null || valor === undefined ? '—' : `${valor}${sufijo}`);

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
    <div className="antro-adm-paginacion">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1}>← Anterior</button>
      <span>Página {page} de {paginas}</span>
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= paginas}>Siguiente →</button>
    </div>
  );
}

function EstadoBadge({ estado, label }) {
  return <span className={`antro-adm-estado antro-adm-estado--${estado}`}>{label}</span>;
}

/* Radar de los 6 ejes (puntaje de 0 a 100 de la última evaluación). */
function RadarEjes({ ejes }) {
  const data = EJES.map(([eje, label]) => ({ label, puntaje: Number(ejes?.[eje] ?? 0) }));
  return (
    <div className="antro-adm-radar" role="img" aria-label={`Radar de 6 ejes: ${data.map((d) => `${d.label} ${d.puntaje}`).join(', ')}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--border-main)" />
          <PolarAngleAxis dataKey="label" tick={{ fill: 'var(--text-main)', fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} />
          <Radar
            name="Puntaje"
            dataKey="puntaje"
            stroke="var(--accent-card)"
            fill="var(--accent-card)"
            fillOpacity={0.25}
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--accent-card)' }}
          />
          <Tooltip
            formatter={(valor) => [`${valor} pts`, 'Puntaje']}
            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-main)', borderRadius: 8, color: 'var(--text-main)' }}
            labelStyle={{ color: 'var(--text-main)' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------------- Formulario de mediciones de un atleta ---------------- */
function FormularioMediciones({ medicionId, atleta, medicionesPorEje, onGuardado, onCancelar }) {
  const [valores, setValores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const guardar = async (event) => {
    event.preventDefault();
    setGuardando(true);
    setError('');
    const measurements = Object.fromEntries(Object.entries(medicionesPorEje).map(([eje, config]) => [
      eje,
      Object.fromEntries(config.campos.map(([campo]) => [campo, valores[`${eje}.${campo}`]])),
    ]));
    try {
      await CineantropometriaService.registrarMedicion(medicionId, { atleta: atleta.atleta_id, measurements });
      onGuardado();
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron guardar las mediciones.'));
      setGuardando(false);
    }
  };

  return (
    <form className="antro-adm-form-medicion" onSubmit={guardar}>
      <p className="antro-adm-muted">Mediciones de {atleta.nombre} {atleta.apellido}</p>
      <div className="antro-adm-form-ejes">
        {Object.entries(medicionesPorEje).map(([eje, config]) => (
          <fieldset key={eje}>
            <legend>{EJES.find(([id]) => id === eje)?.[1] || eje}</legend>
            {config.campos.map(([campo, nombre, unidad]) => (
              <label key={campo}>
                <span>{nombre} ({unidad})</span>
                <input
                  type="number" step="0.01" inputMode="decimal" required
                  value={valores[`${eje}.${campo}`] ?? ''}
                  onChange={(event) => setValores((prev) => ({ ...prev, [`${eje}.${campo}`]: event.target.value }))}
                />
              </label>
            ))}
          </fieldset>
        ))}
      </div>
      {error && <p className="antro-adm-error" role="alert">{error}</p>}
      <div className="antro-adm-acciones">
        <button type="button" className="antro-adm-btn antro-adm-btn--ghost" onClick={onCancelar} disabled={guardando}>Cancelar</button>
        <button type="submit" className="antro-adm-btn" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar mediciones'}</button>
      </div>
    </form>
  );
}

/* ---------------- Detalle de una medición programada ---------------- */
function DetalleMedicion({ medicionId, puedeRegistrar, onVolver }) {
  const [detalle, setDetalle] = useState({ id: null, version: -1, data: null, error: '' });
  const [recarga, setRecarga] = useState(0);
  const [abierto, setAbierto] = useState(null);

  useEffect(() => {
    let activo = true;
    CineantropometriaService.getMedicion(medicionId)
      .then((data) => { if (activo) setDetalle({ id: medicionId, version: recarga, data, error: '' }); })
      .catch((error) => { if (activo) setDetalle({ id: medicionId, version: recarga, data: null, error: mensajeError(error, 'No se pudo cargar la medición.') }); });
    return () => { activo = false; };
  }, [medicionId, recarga]);

  if (detalle.id !== medicionId || (detalle.version !== recarga && !detalle.data)) return <p className="antro-adm-vacio">Cargando medición...</p>;
  if (detalle.error) return <p className="antro-adm-vacio antro-adm-error" role="alert">{detalle.error}</p>;

  const medicion = detalle.data;
  const editable = puedeRegistrar && medicion.estado !== 'cancelada';
  const pendientes = medicion.convocados.filter((fila) => !fila.evaluacion).length;

  return (
    <section className="antro-adm-panel">
      <button type="button" className="antro-adm-btn antro-adm-btn--ghost antro-adm-volver" onClick={onVolver}>
        <ArrowLeft size={16} aria-hidden="true" />Volver a la lista
      </button>
      <div className="antro-adm-detalle-head">
        <div>
          <h3>Medición · {medicion.area_nombre} · {medicion.subarea_nombre}</h3>
          <p>{formatFecha(medicion.fecha)} · {medicion.evaluados} de {medicion.convocados.length} atletas registrados</p>
          {medicion.observaciones && <p className="antro-adm-observaciones">{medicion.observaciones}</p>}
        </div>
        <EstadoBadge estado={medicion.estado} label={medicion.estado_label} />
      </div>

      {!medicion.convocados.length ? (
        <p className="antro-adm-vacio">La subárea no tiene atletas activos convocados.</p>
      ) : (
        <div className="antro-adm-convocados">
          {medicion.convocados.map((fila) => (
            <article className="antro-adm-convocado" key={fila.atleta_id}>
              <div className="antro-adm-convocado-head">
                <div>
                  <h4>{fila.nombre} {fila.apellido}</h4>
                  <p className="antro-adm-muted">Cédula {fila.cedula} · {fila.categoria || 'Sin categoría'}</p>
                </div>
                {fila.evaluacion ? (
                  <span className="antro-adm-registrado">
                    ✓ Registrado · {numero(fila.evaluacion.altura_cm, ' cm')} · {numero(fila.evaluacion.peso_kg, ' kg')} · prom. {numero(fila.evaluacion.promedio)}
                  </span>
                ) : editable && abierto !== fila.atleta_id ? (
                  <button type="button" className="antro-adm-btn antro-adm-btn--chico" onClick={() => setAbierto(fila.atleta_id)}>
                    Registrar mediciones
                  </button>
                ) : (
                  <span className="antro-adm-muted">Pendiente</span>
                )}
              </div>
              {abierto === fila.atleta_id && (
                <FormularioMediciones
                  medicionId={medicionId}
                  atleta={fila}
                  medicionesPorEje={medicion.mediciones_por_eje}
                  onCancelar={() => setAbierto(null)}
                  onGuardado={() => { setAbierto(null); setRecarga((n) => n + 1); }}
                />
              )}
            </article>
          ))}
        </div>
      )}
      {editable && pendientes === 0 && medicion.estado === 'programada' && (
        <p className="antro-adm-ok">Todos los convocados están registrados. Puedes marcar la medición como realizada desde la lista.</p>
      )}
    </section>
  );
}

/* ---------------- Sección 1: programar medición ---------------- */
function ProgramarMedicion({ subareas, puedeEditar, puedeRegistrar }) {
  const [filtros, setFiltros] = useState({ subarea: '', estado: '' });
  const [recarga, setRecarga] = useState(0);
  const [form, setForm] = useState(null);
  const [detalleId, setDetalleId] = useState(null);
  const [error, setError] = useState('');
  const [pendientes, setPendientes] = useState([]);
  // En celular los filtros van detrás del botón "Filtros" (en monitores siempre se ven).
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const params = useMemo(() => Object.fromEntries(Object.entries(filtros).filter(([, valor]) => valor)), [filtros]);
  const fetchPage = useMemo(() => (page) => CineantropometriaService.getMediciones({ ...params, page }), [params]);
  const lista = usePaginado(fetchPage, recarga);

  useEffect(() => {
    let activo = true;
    CineantropometriaService.getMediciones({ estado: 'programada' })
      .then((filas) => { if (activo) setPendientes(Array.isArray(filas) ? filas : []); })
      .catch(() => { if (activo) setPendientes([]); });
    return () => { activo = false; };
  }, [recarga]);

  const subareasPendientes = new Set(pendientes.map((fila) => String(fila.subarea)));
  const conflicto = form?.subarea && subareasPendientes.has(form.subarea);

  const programar = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await CineantropometriaService.createMedicion(form);
      setForm(null);
      setRecarga((n) => n + 1);
    } catch (err) {
      setError(mensajeError(err, 'No se pudo programar la medición.'));
    }
  };

  const cambiarEstado = async (medicion, estado, pregunta) => {
    if (pregunta && !window.confirm(pregunta)) return;
    setError('');
    try {
      await CineantropometriaService.updateMedicion(medicion.id, { estado });
      setRecarga((n) => n + 1);
    } catch (err) {
      setError(mensajeError(err, 'No se pudo actualizar la medición.'));
    }
  };

  if (detalleId) {
    return <DetalleMedicion medicionId={detalleId} puedeRegistrar={puedeRegistrar} onVolver={() => { setDetalleId(null); setRecarga((n) => n + 1); }} />;
  }

  const acciones = (medicion) => (
    <div className="antro-adm-fila-acciones">
      <button type="button" className="antro-adm-btn antro-adm-btn--chico" onClick={() => setDetalleId(medicion.id)}>
        {puedeRegistrar && medicion.estado !== 'cancelada' ? 'Registrar mediciones' : 'Ver atletas'}
      </button>
      {puedeEditar && medicion.estado === 'programada' && (
        <>
          <button type="button" className="antro-adm-btn antro-adm-btn--chico antro-adm-btn--ghost" onClick={() => cambiarEstado(medicion, 'realizada')}>
            Marcar realizada
          </button>
          <button
            type="button"
            className="antro-adm-btn antro-adm-btn--chico antro-adm-btn--peligro"
            onClick={() => cambiarEstado(medicion, 'cancelada', `¿Cancelar la medición de ${medicion.subarea_nombre} del ${formatFecha(medicion.fecha)}?`)}
          >
            Cancelar
          </button>
        </>
      )}
    </div>
  );

  // Filtros: se pintan en la barra (monitores) y en el panel "Filtros" (celular).
  const controlesFiltro1 = (
    <>
        <select value={filtros.subarea} onChange={(event) => setFiltros({ ...filtros, subarea: event.target.value })} aria-label="Filtrar por subárea">
          <option value="">Todas las subáreas</option>
          {subareas.map((subarea) => <option key={subarea.id} value={String(subarea.id)}>{subarea.nombre}</option>)}
        </select>
        <select value={filtros.estado} onChange={(event) => setFiltros({ ...filtros, estado: event.target.value })} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          {ESTADOS.map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}
        </select>
    </>
  );

  return (
    <>
      <div className="antro-adm-toolbar">
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
        {puedeEditar && !form && (
          <button type="button" className="antro-adm-btn antro-adm-toolbar-derecha" onClick={() => setForm({ subarea: '', fecha: '', observaciones: '' })}>
            <Plus size={16} aria-hidden="true" />Programar medición
          </button>
        )}
      </div>

      {form && (
        <form className="antro-adm-panel" onSubmit={programar}>
          <h3>Programar medición</h3>
          <div className="antro-adm-form-grid">
            <label>
              <span>Subárea</span>
              <select value={form.subarea} onChange={(event) => setForm({ ...form, subarea: event.target.value })} required>
                <option value="">Selecciona una subárea</option>
                {subareas.map((subarea) => (
                  <option key={subarea.id} value={String(subarea.id)}>
                    {subarea.area?.nombre ? `${subarea.area.nombre} · ` : ''}{subarea.nombre}{subareasPendientes.has(String(subarea.id)) ? ' (ya programada)' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Fecha</span>
              <input type="date" value={form.fecha} min={hoyCaracas()} onChange={(event) => setForm({ ...form, fecha: event.target.value })} required />
            </label>
            <label className="antro-adm-form-ancho">
              <span>Observaciones (opcional)</span>
              <textarea rows={2} value={form.observaciones} onChange={(event) => setForm({ ...form, observaciones: event.target.value })} />
            </label>
          </div>
          {conflicto && <p className="antro-adm-error" role="alert">Esta subárea ya tiene una medición programada pendiente. Realízala o cancélala primero.</p>}
          <div className="antro-adm-acciones">
            <button type="button" className="antro-adm-btn antro-adm-btn--ghost" onClick={() => { setForm(null); setError(''); }}>Cancelar</button>
            <button type="submit" className="antro-adm-btn" disabled={conflicto}>Programar</button>
          </div>
        </form>
      )}

      {error && <p className="antro-adm-error" role="alert">{error}</p>}

      {lista.error ? (
        <p className="antro-adm-vacio antro-adm-error" role="alert">{lista.error}</p>
      ) : lista.cargando ? (
        <p className="antro-adm-vacio">Cargando mediciones...</p>
      ) : !lista.filas.length ? (
        <p className="antro-adm-vacio">No hay mediciones con esos filtros.</p>
      ) : (
        <div className="responsive-list">
          <div className="responsive-list__table antro-adm-tabla-wrap">
            <table className="antro-adm-tabla">
              <thead>
                <tr><th>Fecha</th><th>Subárea</th><th>Estado</th><th>Registrados</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {lista.filas.map((medicion) => (
                  <tr key={medicion.id}>
                    <td className="antro-adm-fuerte">{formatFecha(medicion.fecha)}</td>
                    <td>{medicion.subarea_nombre}</td>
                    <td><EstadoBadge estado={medicion.estado} label={medicion.estado_label} /></td>
                    <td>{medicion.evaluados}</td>
                    <td>{acciones(medicion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="responsive-list__cards">
            <div className="antro-adm-cards">
              {lista.filas.map((medicion) => (
                <article className="antro-adm-card" key={medicion.id}>
                  <div className="antro-adm-card-head">
                    <h4>{medicion.subarea_nombre}</h4>
                    <EstadoBadge estado={medicion.estado} label={medicion.estado_label} />
                  </div>
                  <dl>
                    <div><dt>Fecha</dt><dd>{formatFecha(medicion.fecha)}</dd></div>
                    <div><dt>Registrados</dt><dd>{medicion.evaluados}</dd></div>
                  </dl>
                  {acciones(medicion)}
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

/* ---------------- Historial de un atleta ---------------- */
function HistorialAtleta({ atletaId, onVolver }) {
  const [estado, setEstado] = useState({ id: null, data: null, error: '' });

  useEffect(() => {
    let activo = true;
    CineantropometriaService.getHistorialAtleta(atletaId)
      .then((data) => { if (activo) setEstado({ id: atletaId, data, error: '' }); })
      .catch((error) => { if (activo) setEstado({ id: atletaId, data: null, error: mensajeError(error, 'No se pudo cargar el historial.') }); });
    return () => { activo = false; };
  }, [atletaId]);

  if (estado.id !== atletaId) return <p className="antro-adm-vacio">Cargando historial...</p>;
  if (estado.error) return <p className="antro-adm-vacio antro-adm-error" role="alert">{estado.error}</p>;

  const { atleta, evaluaciones, mediciones_por_eje: medicionesPorEje } = estado.data;
  const ultima = evaluaciones[0];

  return (
    <section className="antro-adm-panel">
      <button type="button" className="antro-adm-btn antro-adm-btn--ghost antro-adm-volver" onClick={onVolver}>
        <ArrowLeft size={16} aria-hidden="true" />Volver a los datos
      </button>
      <div className="antro-adm-detalle-head">
        <div>
          <h3>{atleta.nombre} {atleta.apellido}</h3>
          <p>Cédula {atleta.cedula} · {atleta.edad} años · {atleta.categoria || 'Sin categoría'} · {evaluaciones.length} evaluaciones</p>
        </div>
      </div>

      {!ultima ? (
        <p className="antro-adm-vacio">El atleta no tiene evaluaciones registradas.</p>
      ) : (
        <>
          <div className="antro-adm-resumen">
            <div><strong>{numero(ultima.altura_cm, ' cm')}</strong><span>Altura</span></div>
            <div><strong>{numero(ultima.peso_kg, ' kg')}</strong><span>Peso</span></div>
            <div><strong>{numero(ultima.promedio)}</strong><span>Promedio ejes</span></div>
            <div><strong>{formatFecha(ultima.fecha)}</strong><span>Última evaluación</span></div>
          </div>
          <RadarEjes ejes={ultima.ejes} />
          <div className="antro-adm-mediciones">
            {EJES.map(([eje, label]) => (
              <article key={eje}>
                <header><strong>{label}</strong><span>{numero(ultima.ejes?.[eje])} pts</span></header>
                {(medicionesPorEje[eje]?.campos || []).map(([campo, nombre, unidad]) => (
                  <p key={campo}><span>{nombre}</span><b>{numero(ultima.mediciones?.[eje]?.[campo], ` ${unidad}`)}</b></p>
                ))}
              </article>
            ))}
          </div>

          <h4 className="antro-adm-subtitulo">Historial de evaluaciones</h4>
          <div className="responsive-list">
            <div className="responsive-list__table antro-adm-tabla-wrap">
              <table className="antro-adm-tabla">
                <thead>
                  <tr><th>Fecha</th><th>Subárea</th><th>Altura</th><th>Peso</th>{EJES.map(([eje, label]) => <th key={eje}>{label}</th>)}<th>Promedio</th></tr>
                </thead>
                <tbody>
                  {evaluaciones.map((evaluacion) => (
                    <tr key={evaluacion.id}>
                      <td className="antro-adm-fuerte">{formatFecha(evaluacion.fecha)}</td>
                      <td>{evaluacion.subarea}</td>
                      <td>{numero(evaluacion.altura_cm, ' cm')}</td>
                      <td>{numero(evaluacion.peso_kg, ' kg')}</td>
                      {EJES.map(([eje]) => <td key={eje}>{numero(evaluacion.ejes?.[eje])}</td>)}
                      <td className="antro-adm-fuerte">{numero(evaluacion.promedio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="responsive-list__cards">
              <div className="antro-adm-cards">
                {evaluaciones.map((evaluacion) => (
                  <article className="antro-adm-card" key={evaluacion.id}>
                    <div className="antro-adm-card-head">
                      <h4>{formatFecha(evaluacion.fecha)}</h4>
                      <span className="antro-adm-muted">{evaluacion.subarea}</span>
                    </div>
                    <dl>
                      <div><dt>Altura</dt><dd>{numero(evaluacion.altura_cm, ' cm')}</dd></div>
                      <div><dt>Peso</dt><dd>{numero(evaluacion.peso_kg, ' kg')}</dd></div>
                      <div><dt>Promedio ejes</dt><dd>{numero(evaluacion.promedio)}</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

/* ---------------- Sección 2: datos registrados ---------------- */
function DatosRegistrados({ subareas }) {
  const [inputBuscar, setInputBuscar] = useState('');
  const [filtros, setFiltros] = useState({ buscar: '', subarea: '', desde: '', hasta: '' });
  const [atletaId, setAtletaId] = useState(null);
  // En celular los filtros van detrás del botón "Filtros" (en monitores siempre se ven).
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFiltros((prev) => (prev.buscar === inputBuscar.trim() ? prev : { ...prev, buscar: inputBuscar.trim() })), 400);
    return () => clearTimeout(t);
  }, [inputBuscar]);

  const params = useMemo(() => Object.fromEntries(Object.entries(filtros).filter(([, valor]) => valor)), [filtros]);
  const fetchPage = useMemo(() => (page) => CineantropometriaService.getDatos({ ...params, page }), [params]);
  const lista = usePaginado(fetchPage);

  if (atletaId) return <HistorialAtleta atletaId={atletaId} onVolver={() => setAtletaId(null)} />;

  // Filtros: se pintan en la barra (monitores) y en el panel "Filtros" (celular).
  const controlesFiltro2 = (
    <>
        <input
          type="search"
          className="antro-adm-buscar"
          placeholder="Buscar atleta por nombre o cédula..."
          value={inputBuscar}
          onChange={(event) => setInputBuscar(event.target.value)}
          aria-label="Buscar atleta"
        />
        <select value={filtros.subarea} onChange={(event) => setFiltros({ ...filtros, subarea: event.target.value })} aria-label="Filtrar por subárea">
          <option value="">Todas las subáreas</option>
          {subareas.map((subarea) => <option key={subarea.id} value={String(subarea.id)}>{subarea.nombre}</option>)}
        </select>
        <label className="antro-adm-fecha">
          <span>Desde</span>
          <input type="date" value={filtros.desde} max={filtros.hasta || undefined} onChange={(event) => setFiltros({ ...filtros, desde: event.target.value })} />
        </label>
        <label className="antro-adm-fecha">
          <span>Hasta</span>
          <input type="date" value={filtros.hasta} min={filtros.desde || undefined} onChange={(event) => setFiltros({ ...filtros, hasta: event.target.value })} />
        </label>
    </>
  );

  return (
    <>
      <div className="antro-adm-toolbar">
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
              {controlesFiltro2}
            </div>
            <footer className="filtros-sheet__footer">
              <button type="button" className="filtros-sheet__btn" onClick={() => setFiltrosAbiertos(false)}>Cerrar</button>
              <button type="button" className="filtros-sheet__btn filtros-sheet__btn--primario" onClick={() => setFiltrosAbiertos(false)}>Aplicar filtros</button>
            </footer>
          </div>,
          document.body,
        )}
        <div className="filtros-escritorio">{controlesFiltro2}</div>
      </div>

      {lista.error ? (
        <p className="antro-adm-vacio antro-adm-error" role="alert">{lista.error}</p>
      ) : lista.cargando ? (
        <p className="antro-adm-vacio">Cargando datos...</p>
      ) : !lista.filas.length ? (
        <p className="antro-adm-vacio">No hay evaluaciones con esos filtros.</p>
      ) : (
        <div className="responsive-list">
          <div className="responsive-list__table antro-adm-tabla-wrap">
            <table className="antro-adm-tabla">
              <thead>
                <tr><th>Fecha</th><th>Atleta</th><th>Categoría</th><th>Subárea</th><th>Altura</th><th>Peso</th><th>Promedio</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {lista.filas.map((fila) => (
                  <tr key={fila.id}>
                    <td>{formatFecha(fila.fecha)}</td>
                    <td className="antro-adm-fuerte">{fila.nombre} {fila.apellido}</td>
                    <td>{fila.categoria || '—'}</td>
                    <td>{fila.subarea}</td>
                    <td>{numero(fila.altura_cm, ' cm')}</td>
                    <td>{numero(fila.peso_kg, ' kg')}</td>
                    <td className="antro-adm-fuerte">{numero(fila.promedio)}</td>
                    <td>
                      <button type="button" className="antro-adm-btn antro-adm-btn--chico" onClick={() => setAtletaId(fila.atleta_id)}>Ver historial</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="responsive-list__cards">
            <div className="antro-adm-cards">
              {lista.filas.map((fila) => (
                <article className="antro-adm-card" key={fila.id}>
                  <div className="antro-adm-card-head">
                    <h4>{fila.nombre} {fila.apellido}</h4>
                    <span className="antro-adm-muted">{formatFecha(fila.fecha)}</span>
                  </div>
                  <dl>
                    <div><dt>Subárea</dt><dd>{fila.subarea} · {fila.categoria || 'Sin categoría'}</dd></div>
                    <div><dt>Altura / Peso</dt><dd>{numero(fila.altura_cm, ' cm')} · {numero(fila.peso_kg, ' kg')}</dd></div>
                    <div><dt>Promedio ejes</dt><dd>{numero(fila.promedio)}</dd></div>
                  </dl>
                  <button type="button" className="antro-adm-btn antro-adm-btn--chico" onClick={() => setAtletaId(fila.atleta_id)}>Ver historial</button>
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
  programar: { titulo: 'Mediciones' },
  datos: { titulo: 'Datos registrados' },
};

export default function AntropometriaAdmin({ seccion = 'programar' }) {
  const [subareas, setSubareas] = useState({ filas: [], error: '' });

  useEffect(() => {
    let activo = true;
    UserService.getSubareas()
      .then((filas) => { if (activo) setSubareas({ filas: Array.isArray(filas) ? filas : [], error: '' }); })
      .catch((error) => { if (activo) setSubareas({ filas: [], error: mensajeError(error, 'No se pudieron cargar las subáreas.') }); });
    return () => { activo = false; };
  }, []);

  const actual = SECCIONES[seccion] || SECCIONES.programar;

  return (
    <div className="antro-adm">
      <header className="antro-adm-header">
        <h2>{actual.titulo}</h2>
      </header>
      {subareas.error && <p className="antro-adm-error" role="alert">{subareas.error}</p>}
      {seccion === 'datos' ? (
        <DatosRegistrados subareas={subareas.filas} />
      ) : (
        // Cineantropometría la programa y registra el entrenador: el administrador solo consulta.
        <ProgramarMedicion
          subareas={subareas.filas}
          puedeEditar={false}
          puedeRegistrar={false}
        />
      )}
    </div>
  );
}
