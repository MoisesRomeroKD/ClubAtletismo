import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import TestService from '../../../api/services/Testservice';
import UserService from '../../../api/services/Userservice';
import ResumenTestsAtleta from '../../atleta/tests/ResumenTestsAtleta';
import '../../../styles/components/atleta/TestsAtleta.css';
import '../../../styles/components/admin/tests/AnalisisTests.css';

/*
 * ANÁLISIS DE TESTS (entrenador: solo sus tests y sus subáreas). Arriba, un resumen general (tests, resultados, ausencias y
 * atletas evaluados). Debajo, el análisis es POR ATLETA: se elige un atleta y se ven sus pruebas, una
 * gráfica de evolución por prueba (cada una con su unidad, nunca mezclando atletas) y su historial.
 * La comparación entre evaluaciones es la misma de "Mis tests" del atleta (ResumenTestsAtleta).
 * Datos reales: /evaluacion/tests/ y /evaluacion/resultados/ (sin paginar, con los filtros).
 */

const formatFecha = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};
const conMarca = (fila) => !fila.ausente && fila.valor !== null && fila.valor !== undefined;
const normalizar = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const resultadoDe = (fila) => {
  if (fila.ausente) return 'Ausente';
  if (fila.valor === null || fila.valor === undefined) return 'Pendiente';
  return `${fila.valor} ${fila.unidad}`;
};

// Observación de un resultado: si se registró (marca o ausencia) y no tiene observación, "Sin novedad";
// si todavía no se registró nada, "Sin registro".
const observacionDe = (fila) => {
  const registrado = fila.ausente || (fila.valor !== null && fila.valor !== undefined && fila.valor !== '');
  if (!registrado) return 'Sin registro';
  return fila.observacion || 'Sin novedad';
};

export default function AnalisisTestsTrainer() {
  const [catalogo, setCatalogo] = useState({ pruebas: [], subareas: [] });
  const [filtros, setFiltros] = useState({ prueba: '', subarea: '', desde: '', hasta: '' });
  const [datos, setDatos] = useState({ clave: '', tests: [], resultados: [], error: '' });
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [atletaId, setAtletaId] = useState('');

  useEffect(() => {
    let activo = true;
    Promise.all([TestService.getPruebas(), UserService.getMySubareas()])
      .then(([pruebas, misSubareas]) => {
        if (!activo) return;
        setCatalogo({
          pruebas: Array.isArray(pruebas) ? pruebas : pruebas?.results || [],
          // Solo sus subáreas.
          subareas: (Array.isArray(misSubareas) ? misSubareas : []).map((fila) => fila.subarea_detalle).filter(Boolean),
        });
      })
      .catch(() => { if (activo) setCatalogo({ pruebas: [], subareas: [] }); });
    return () => { activo = false; };
  }, []);

  const params = useMemo(() => Object.fromEntries(Object.entries(filtros).filter(([, valor]) => valor)), [filtros]);
  const clave = JSON.stringify(params);

  useEffect(() => {
    let activo = true;
    Promise.all([TestService.getTests(params), TestService.getResultados(params)])
      .then(([tests, resultados]) => {
        if (activo) setDatos({ clave, tests: Array.isArray(tests) ? tests : [], resultados: Array.isArray(resultados) ? resultados : [], error: '' });
      })
      .catch(() => {
        if (activo) setDatos({ clave, tests: [], resultados: [], error: 'No se pudieron cargar los datos de tests.' });
      });
    return () => { activo = false; };
  }, [params, clave]);

  const cargando = datos.clave !== clave;
  const { tests, resultados } = datos;

  // Resumen general
  const finalizados = tests.filter((test) => test.estado === 'realizado').length;
  const convocados = resultados.length;
  const registrados = resultados.filter(conMarca).length;
  const ausencias = resultados.filter((fila) => fila.ausente).length;
  const atletasEvaluados = new Set(resultados.filter(conMarca).map((fila) => fila.atleta_id)).size;

  // Atletas con evaluaciones (con los filtros) para elegir uno.
  const atletas = useMemo(() => {
    const unicos = new Map();
    resultados.forEach((fila) => {
      if (!unicos.has(fila.atleta_id)) {
        unicos.set(fila.atleta_id, { id: fila.atleta_id, nombre: `${fila.nombre} ${fila.apellido}`.trim(), cedula: fila.cedula });
      }
    });
    return [...unicos.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [resultados]);
  const opcionesAtleta = atletas.filter((atleta) => (
    !busqueda.trim() || normalizar(`${atleta.nombre} ${atleta.cedula}`).includes(normalizar(busqueda.trim()))
  ));
  const atleta = atletas.find((fila) => String(fila.id) === atletaId) || null;

  // Evaluaciones del atleta elegido (solo las suyas).
  const filasAtleta = atleta
    ? resultados.filter((fila) => fila.atleta_id === atleta.id).sort((a, b) => b.fecha.localeCompare(a.fecha))
    : [];
  const subareasAtleta = [...new Set(filasAtleta.map((fila) => (fila.area ? `${fila.area} · ${fila.subarea}` : fila.subarea)))];
  const historialPorPrueba = [...filasAtleta.reduce((grupos, fila) => {
    const grupo = grupos.get(fila.prueba_id) || { prueba: fila.prueba, unidad: fila.unidad, criterio: fila.criterio, filas: [] };
    grupo.filas.push(fila);
    grupos.set(fila.prueba_id, grupo);
    return grupos;
  }, new Map()).values()].sort((a, b) => a.prueba.localeCompare(b.prueba, 'es'));

  const cambiar = (campo, valor) => setFiltros((actual) => ({ ...actual, [campo]: valor }));
  const controlesFiltro = (
    <>
      <select value={filtros.prueba} onChange={(event) => cambiar('prueba', event.target.value)} aria-label="Filtrar por prueba">
        <option value="">Todas las pruebas</option>
        {catalogo.pruebas.map((prueba) => <option key={prueba.id} value={String(prueba.id)}>{prueba.nombre}</option>)}
      </select>
      <select value={filtros.subarea} onChange={(event) => cambiar('subarea', event.target.value)} aria-label="Filtrar por subárea">
        <option value="">Todas las subáreas</option>
        {catalogo.subareas.map((subarea) => <option key={subarea.id} value={String(subarea.id)}>{subarea.nombre}</option>)}
      </select>
      <label className="analisis-tests__fecha"><span>Desde</span>
        <input type="date" value={filtros.desde} max={filtros.hasta || undefined} onChange={(event) => cambiar('desde', event.target.value)} />
      </label>
      <label className="analisis-tests__fecha"><span>Hasta</span>
        <input type="date" value={filtros.hasta} min={filtros.desde || undefined} onChange={(event) => cambiar('hasta', event.target.value)} />
      </label>
    </>
  );

  return (
    <div className="analisis-tests">
      <header className="analisis-tests__encabezado">
        <h2>Análisis de mis tests</h2>
      </header>

      <div className="analisis-tests__filtros">
        <button type="button" className="filtros-fab" onClick={() => setFiltrosAbiertos(true)}>
          <SlidersHorizontal size={18} aria-hidden="true" />Filtros
        </button>
        {filtrosAbiertos && createPortal(
          <div className="filtros-sheet" role="dialog" aria-modal="true" aria-label="Filtros">
            <header className="filtros-sheet__header">
              <h2>Filtros</h2>
              <button type="button" className="filtros-sheet__cerrar" onClick={() => setFiltrosAbiertos(false)} aria-label="Cerrar filtros"><X size={18} /></button>
            </header>
            <div className="filtros-sheet__body">{controlesFiltro}</div>
            <footer className="filtros-sheet__footer">
              <button type="button" className="filtros-sheet__btn" onClick={() => setFiltrosAbiertos(false)}>Cerrar</button>
              <button type="button" className="filtros-sheet__btn filtros-sheet__btn--primario" onClick={() => setFiltrosAbiertos(false)}>Aplicar filtros</button>
            </footer>
          </div>,
          document.body,
        )}
        <div className="filtros-escritorio">{controlesFiltro}</div>
      </div>

      {datos.error ? (
        <p className="analisis-tests__vacio analisis-tests__error" role="alert">{datos.error}</p>
      ) : cargando ? (
        <p className="analisis-tests__vacio">Cargando análisis...</p>
      ) : (
        <>
          <div className="analisis-tests__kpis">
            <div className="analisis-tests__kpi"><span>Tests</span><strong>{tests.length}</strong><small>{finalizados} finalizado{finalizados === 1 ? '' : 's'}</small></div>
            <div className="analisis-tests__kpi">
              <span>Resultados registrados</span>
              <strong>{convocados ? `${Math.round((registrados / convocados) * 100)}%` : '—'}</strong>
              <small>{registrados} de {convocados} convocados</small>
            </div>
            <div className="analisis-tests__kpi"><span>Ausencias</span><strong>{ausencias}</strong></div>
            <div className="analisis-tests__kpi"><span>Atletas evaluados</span><strong>{atletasEvaluados}</strong></div>
          </div>

          <section className="analisis-tests__panel analisis-tests__panel--ancho">
            <h3>Análisis por atleta</h3>
            {!atletas.length ? (
              <p className="analisis-tests__vacio">No hay atletas evaluados con estos filtros.</p>
            ) : (
              <div className="analisis-tests__selector">
                <input
                  type="search"
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder="Buscar atleta por nombre o cédula..."
                  aria-label="Buscar atleta por nombre o cédula"
                />
                <select value={atleta ? atletaId : ''} onChange={(event) => setAtletaId(event.target.value)} aria-label="Elegir atleta">
                  <option value="">Elige un atleta ({opcionesAtleta.length})</option>
                  {opcionesAtleta.map((fila) => <option key={fila.id} value={String(fila.id)}>{fila.nombre} · Cédula {fila.cedula}</option>)}
                </select>
              </div>
            )}
          </section>

          {atletas.length > 0 && !atleta && (
            <p className="analisis-tests__vacio">Elige un atleta para ver sus pruebas, su evolución y su historial.</p>
          )}

          {atleta && (
            <>
              <section className="analisis-tests__panel analisis-tests__panel--ancho analisis-tests__ficha">
                <h3>{atleta.nombre}</h3>
                <dl>
                  <div><dt>Cédula</dt><dd>{atleta.cedula}</dd></div>
                  <div><dt>Subárea</dt><dd>{subareasAtleta.join(', ') || '—'}</dd></div>
                  <div><dt>Pruebas realizadas</dt><dd>{historialPorPrueba.map((grupo) => grupo.prueba).join(', ')}</dd></div>
                  <div><dt>Evaluaciones</dt><dd>{filasAtleta.length} · última el {formatFecha(filasAtleta[0]?.fecha)}</dd></div>
                </dl>
              </section>

              <ResumenTestsAtleta
                enTercera
                filas={filasAtleta.map((fila) => ({ ...fila, criterio: fila.criterio_codigo }))}
              />

              <h3 className="analisis-tests__subtitulo">Historial por prueba</h3>
              {historialPorPrueba.map((grupo) => (
                <section key={grupo.prueba} className="analisis-tests__panel analisis-tests__panel--ancho analisis-tests__historial">
                  <h4>{grupo.prueba} <small>{grupo.criterio} · {grupo.unidad}</small></h4>
                  <div className="analisis-tests__tabla-wrap">
                    <table className="analisis-tests__tabla">
                      <thead>
                        <tr><th>Fecha</th><th>Subárea</th><th>Resultado</th><th>Entrenador</th><th>Observación</th></tr>
                      </thead>
                      <tbody>
                        {grupo.filas.map((fila) => (
                          <tr key={fila.id}>
                            <td>{formatFecha(fila.fecha)}</td>
                            <td>{fila.subarea}</td>
                            <td><strong>{resultadoDe(fila)}</strong></td>
                            <td>{fila.entrenador || '—'}</td>
                            <td>{observacionDe(fila)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
