import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import TestService from '../../../api/services/Testservice';
import UserService from '../../../api/services/Userservice';
import '../../../styles/components/admin/tests/AnalisisTests.css';

/*
 * ANÁLISIS DE TESTS (entrenador): de los tests que creó (el backend limita los datos), cuántos tests se hicieron, cuántos resultados faltan,
 * participación por subárea y, por prueba, la evolución de la marca promedio y las mejores marcas.
 * Datos reales: /evaluacion/tests/ y /evaluacion/resultados/ (sin paginar, con los filtros).
 */

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const etiquetaMes = (clave) => `${MESES[Number(clave.slice(5, 7)) - 1]} ${clave.slice(2, 4)}`;
const formatFecha = (iso) => {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};
const redondear = (valor) => Math.round(valor * 100) / 100;
const esMejor = (a, b, criterio) => (criterio === 'menor' ? a < b : a > b);
const conMarca = (fila) => !fila.ausente && fila.valor !== null && fila.valor !== undefined;

function TooltipSimple({ active, payload, label, unidad = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="analisis-tests__tooltip">
      <strong>{payload[0].payload.etiquetaLarga || label}</strong>
      <span>{payload[0].value}{unidad ? ` ${unidad}` : ''}</span>
    </div>
  );
}

// Mejor marca de cada atleta en la prueba, ordenadas de mejor a peor.
function mejoresMarcas(filas, criterio) {
  const porAtleta = new Map();
  filas.filter(conMarca).forEach((fila) => {
    const actual = porAtleta.get(fila.atleta_id);
    if (!actual || esMejor(fila.valor, actual.valor, criterio)) porAtleta.set(fila.atleta_id, fila);
  });
  return [...porAtleta.values()].sort((a, b) => (criterio === 'menor' ? a.valor - b.valor : b.valor - a.valor));
}

export default function AnalisisTestsTrainer() {
  const [catalogo, setCatalogo] = useState({ pruebas: [], subareas: [] });
  const [filtros, setFiltros] = useState({ prueba: '', subarea: '', desde: '', hasta: '' });
  const [datos, setDatos] = useState({ clave: '', tests: [], resultados: [], error: '' });
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

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
  const pruebaElegida = catalogo.pruebas.find((prueba) => String(prueba.id) === filtros.prueba);

  // KPIs
  const finalizados = tests.filter((test) => test.estado === 'finalizado').length;
  const convocados = resultados.length;
  const registrados = resultados.filter(conMarca).length;
  const ausencias = resultados.filter((fila) => fila.ausente).length;
  const atletasEvaluados = new Set(resultados.filter(conMarca).map((fila) => fila.atleta_id)).size;

  // Tests por mes
  const porMes = {};
  tests.forEach((test) => { const mes = test.fecha.slice(0, 7); porMes[mes] = (porMes[mes] || 0) + 1; });
  const testsPorMes = Object.keys(porMes).sort().slice(-12)
    .map((mes) => ({ etiqueta: etiquetaMes(mes), cantidad: porMes[mes] }));

  // Resultados registrados por subárea
  const porSubarea = {};
  resultados.filter(conMarca).forEach((fila) => { porSubarea[fila.subarea] = (porSubarea[fila.subarea] || 0) + 1; });
  const participacion = Object.entries(porSubarea)
    .map(([subarea, cantidad]) => ({ subarea, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 10);

  // Una prueba elegida: evolución de la marca promedio y mejores marcas
  const criterio = pruebaElegida?.criterio || resultados[0]?.criterio_codigo;
  const unidad = pruebaElegida?.unidad || resultados[0]?.unidad || '';
  const porFecha = {};
  resultados.filter(conMarca).forEach((fila) => {
    porFecha[fila.fecha] = porFecha[fila.fecha] || [];
    porFecha[fila.fecha].push(fila.valor);
  });
  const evolucion = Object.keys(porFecha).sort().map((fecha) => ({
    etiqueta: formatFecha(fecha),
    promedio: redondear(porFecha[fecha].reduce((suma, valor) => suma + valor, 0) / porFecha[fecha].length),
  }));
  const mejores = filtros.prueba ? mejoresMarcas(resultados, criterio).slice(0, 10) : [];

  // Sin prueba elegida: resumen por prueba
  const resumenPruebas = useMemo(() => {
    if (filtros.prueba) return [];
    const grupos = new Map();
    resultados.filter(conMarca).forEach((fila) => {
      const grupo = grupos.get(fila.prueba_id) || { prueba: fila.prueba, unidad: fila.unidad, criterio: fila.criterio_codigo, filas: [] };
      grupo.filas.push(fila);
      grupos.set(fila.prueba_id, grupo);
    });
    return [...grupos.values()].map((grupo) => {
      const mejor = mejoresMarcas(grupo.filas, grupo.criterio)[0];
      const promedio = grupo.filas.reduce((suma, fila) => suma + fila.valor, 0) / grupo.filas.length;
      return { ...grupo, cantidad: grupo.filas.length, promedio: redondear(promedio), mejor };
    }).sort((a, b) => b.cantidad - a.cantidad);
  }, [resultados, filtros.prueba]);

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

          {!tests.length ? (
            <p className="analisis-tests__vacio">No hay tests con estos filtros.</p>
          ) : (
            <div className="analisis-tests__grid">
              <section className="analisis-tests__panel">
                <h3>Tests por mes</h3>
                <div className="analisis-tests__grafico" role="img" aria-label="Cantidad de tests por mes">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={testsPorMes} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
                      <XAxis dataKey="etiqueta" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<TooltipSimple unidad="tests" />} cursor={{ fill: 'var(--bg-surface)' }} />
                      <Bar dataKey="cantidad" fill="var(--func-primary)" radius={[4, 4, 0, 0]} maxBarSize={44} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="analisis-tests__panel">
                <h3>Resultados registrados por subárea</h3>
                {participacion.length ? (
                  <div className="analisis-tests__grafico" role="img" aria-label="Resultados registrados por subárea">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={participacion} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="subarea" width={110} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<TooltipSimple unidad="resultados" />} cursor={{ fill: 'var(--bg-surface)' }} />
                        <Bar dataKey="cantidad" fill="var(--func-primary)" radius={[0, 4, 4, 0]} maxBarSize={22} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="analisis-tests__vacio">Todavía no hay resultados registrados.</p>}
              </section>

              {filtros.prueba ? (
                <>
                  <section className="analisis-tests__panel">
                    <h3>Evolución de la marca promedio · {pruebaElegida?.nombre}</h3>
                    {evolucion.length > 1 ? (
                      <>
                        <div className="analisis-tests__grafico" role="img" aria-label="Evolución de la marca promedio">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={evolucion} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
                              <XAxis dataKey="etiqueta" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                              <YAxis domain={['auto', 'auto']} reversed={criterio === 'menor'} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                              <Tooltip content={<TooltipSimple unidad={unidad} />} />
                              <Line type="monotone" dataKey="promedio" stroke="var(--func-primary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <small className="analisis-tests__nota">
                          {criterio === 'menor' ? 'Menor es mejor: el eje está invertido (más arriba es mejor).' : 'Mayor es mejor: más arriba es mejor.'}
                        </small>
                      </>
                    ) : <p className="analisis-tests__vacio">Se necesitan al menos dos fechas con marcas para ver la evolución.</p>}
                  </section>

                  <section className="analisis-tests__panel">
                    <h3>Mejores marcas · {pruebaElegida?.nombre}</h3>
                    {mejores.length ? (
                      <ol className="analisis-tests__ranking">
                        {mejores.map((fila) => (
                          <li key={fila.atleta_id}>
                            <span>{fila.nombre} {fila.apellido}<small>{fila.subarea} · {formatFecha(fila.fecha)}</small></span>
                            <strong>{fila.valor} {fila.unidad}</strong>
                          </li>
                        ))}
                      </ol>
                    ) : <p className="analisis-tests__vacio">Sin marcas registradas en esta prueba.</p>}
                  </section>
                </>
              ) : (
                <section className="analisis-tests__panel analisis-tests__panel--ancho">
                  <h3>Resumen por prueba</h3>
                  <p className="analisis-tests__nota">Elige una prueba en los filtros para ver su evolución y el ranking completo.</p>
                  {resumenPruebas.length ? (
                    <div className="analisis-tests__tabla-wrap">
                      <table className="analisis-tests__tabla">
                        <thead>
                          <tr><th>Prueba</th><th>Marcas</th><th>Promedio</th><th>Mejor marca</th></tr>
                        </thead>
                        <tbody>
                          {resumenPruebas.map((fila) => (
                            <tr key={fila.prueba}>
                              <td>{fila.prueba}<small>{fila.criterio === 'menor' ? 'Menor es mejor' : 'Mayor es mejor'}</small></td>
                              <td>{fila.cantidad}</td>
                              <td>{fila.promedio} {fila.unidad}</td>
                              <td><strong>{fila.mejor.valor} {fila.unidad}</strong><small>{fila.mejor.nombre} {fila.mejor.apellido}</small></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <p className="analisis-tests__vacio">Todavía no hay marcas registradas.</p>}
                </section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
