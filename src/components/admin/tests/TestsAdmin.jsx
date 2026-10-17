import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, SlidersHorizontal, X } from 'lucide-react';
import TestService from '../../../api/services/Testservice';
import '../../../styles/components/admin/tests/TestsAdmin.css';

const PAGE_SIZE = 15;

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

/* ---------------- Resultados de un test (solo consulta) ---------------- */
function DetalleTest({ testId, onVolver }) {
  const [detalle, setDetalle] = useState({ id: null, data: null, error: '' });

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

      {!test.convocados.length ? (
        <p className="tests-adm-vacio">Este test no tiene atletas.</p>
      ) : (
        <div className="responsive-list">
          <div className="responsive-list__table tests-adm-tabla-wrap">
            <table className="tests-adm-tabla">
              <thead>
                <tr><th>Atleta</th><th>Cédula</th><th>Categoría</th><th>Resultado ({test.prueba_unidad})</th><th>Observación</th></tr>
              </thead>
              <tbody>
                {test.convocados.map((fila) => (
                  <tr key={fila.atleta_id}>
                    <td className="tests-adm-fuerte">{fila.nombre} {fila.apellido}</td>
                    <td>{fila.cedula}</td>
                    <td>{fila.categoria || '—'}</td>
                    <td>{fila.ausente ? 'Ausente' : conUnidad(fila.valor, test.prueba_unidad)}</td>
                    <td>{fila.observacion || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="responsive-list__cards">
            <div className="tests-adm-cards">
              {test.convocados.map((fila) => (
                <article className="tests-adm-card" key={fila.atleta_id}>
                  <h4>{fila.nombre} {fila.apellido}</h4>
                  <p className="tests-adm-card-sub">C.I. {fila.cedula} · {fila.categoria || 'Sin categoría'}</p>
                  <dl>
                    <div><dt>Resultado</dt><dd>{fila.ausente ? 'Ausente' : conUnidad(fila.valor, test.prueba_unidad)}</dd></div>
                    {fila.observacion && <div><dt>Observación</dt><dd>{fila.observacion}</dd></div>}
                  </dl>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------------- Pestaña: tests programados (solo consulta) ---------------- */
function TestsProgramados({ pruebas, filtrosBase }) {
  const [filtros, setFiltros] = useState({ entrenador: '', area: '', subarea: '', estado: '', prueba: '' });
  const [detalleId, setDetalleId] = useState(null);
  // En celular los filtros van detrás del botón "Filtros" (en monitores siempre se ven).
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const params = useMemo(() => Object.fromEntries(Object.entries(filtros).filter(([, valor]) => valor)), [filtros]);
  const fetchPage = useMemo(
    () => (page) => TestService.getTests({ ...params, page }),
    [params],
  );
  const lista = usePaginado(fetchPage);
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
      </div>

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
                <tr><th>Fecha</th><th>Prueba</th><th>Entrenador</th><th>Área · Subárea</th><th>Estado</th><th>Resultados</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {lista.filas.map((test) => (
                  <tr key={test.id}>
                    <td>{formatFecha(test.fecha)}</td>
                    <td className="tests-adm-fuerte">{test.prueba_nombre}</td>
                    <td>{test.entrenador_nombre || '—'}</td>
                    <td>{test.area_nombre} · {test.subarea_nombre}</td>
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
                    <div><dt>Subárea</dt><dd>{test.area_nombre} · {test.subarea_nombre}</dd></div>
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

/* ---------------- Vista principal ---------------- */
const SECCIONES = {
  tests: {
    titulo: 'Tests programados',
  },
};

export default function TestsAdmin({ seccion = 'tests' }) {
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
  }, []);

  const actual = SECCIONES[seccion] || SECCIONES.tests;

  return (
    <div className="tests-adm">
      <header className="tests-adm-header">
        <h2>{actual.titulo}</h2>
      </header>

      {catalogos.error && <p className="tests-adm-error" role="alert">{catalogos.error}</p>}

      {seccion === 'tests' && <TestsProgramados pruebas={catalogos.pruebas} filtrosBase={catalogos.filtros} />}
    </div>
  );
}
