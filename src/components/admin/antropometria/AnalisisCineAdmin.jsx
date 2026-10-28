import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import CineantropometriaService from '../../../api/services/Cineantropometriaservice';
import { CINE_AXES } from '../../reportes/reportUtils';
import '../../../styles/components/admin/antropometria/AnalisisCine.css';

/*
 * ANÁLISIS DE CINEANTROPOMETRÍA (administrador, solo consulta).
 * Usa la última medición de cada atleta: promedio de los 6 ejes del plantel, promedio por subárea,
 * evolución mensual y quiénes destacan en cada eje (en qué subárea podrían rendir mejor).
 * Datos reales: /cineantropometria/datos/ (todas las mediciones; los filtros se aplican aquí).
 */

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const etiquetaMes = (clave) => `${MESES[Number(clave.slice(5, 7)) - 1]} ${clave.slice(2, 4)}`;
const formatFecha = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};
const promedioDe = (valores) => {
  const validos = valores.filter((valor) => valor !== null && valor !== undefined);
  return validos.length ? Math.round((validos.reduce((suma, valor) => suma + valor, 0) / validos.length) * 10) / 10 : null;
};

function TooltipSimple({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const punto = payload[0].payload;
  return (
    <div className="analisis-cine__tooltip">
      <strong>{punto.etiqueta || punto.eje || label}</strong>
      <span>{payload[0].value} pts{punto.atletas ? ` · ${punto.atletas} atleta${punto.atletas === 1 ? '' : 's'}` : ''}</span>
    </div>
  );
}

export default function AnalisisCineAdmin() {
  const [estado, setEstado] = useState({ cargando: true, filas: [], error: '' });
  const [filtros, setFiltros] = useState({ area: '', subarea: '', categoria: '', desde: '', hasta: '' });
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  useEffect(() => {
    let activo = true;
    CineantropometriaService.getDatos()
      .then((data) => {
        if (activo) setEstado({ cargando: false, filas: Array.isArray(data) ? data : data?.results || [], error: '' });
      })
      .catch(() => {
        if (activo) setEstado({ cargando: false, filas: [], error: 'No se pudieron cargar las mediciones.' });
      });
    return () => { activo = false; };
  }, []);

  // Opciones de los filtros a partir de los datos reales.
  const opciones = useMemo(() => {
    const unicos = (campo) => [...new Set(estado.filas.map((fila) => fila[campo]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
    const subareas = [...new Set(
      estado.filas.filter((fila) => !filtros.area || fila.area === filtros.area).map((fila) => fila.subarea).filter(Boolean),
    )].sort((a, b) => a.localeCompare(b, 'es'));
    return { areas: unicos('area'), subareas, categorias: unicos('categoria') };
  }, [estado.filas, filtros.area]);

  const filtradas = estado.filas.filter((fila) => (
    (!filtros.area || fila.area === filtros.area)
    && (!filtros.subarea || fila.subarea === filtros.subarea)
    && (!filtros.categoria || fila.categoria === filtros.categoria)
    && (!filtros.desde || fila.fecha >= filtros.desde)
    && (!filtros.hasta || fila.fecha <= filtros.hasta)
  ));

  // Última medición de cada atleta dentro del filtro.
  const ultimas = [...filtradas.reduce((mapa, fila) => {
    const actual = mapa.get(fila.atleta_id);
    if (!actual || fila.fecha > actual.fecha) mapa.set(fila.atleta_id, fila);
    return mapa;
  }, new Map()).values()];

  const promedioPlantel = promedioDe(ultimas.map((fila) => fila.promedio));
  const ultimaFecha = filtradas.reduce((max, fila) => (fila.fecha > max ? fila.fecha : max), '');

  const radar = CINE_AXES.map(([eje, etiqueta]) => ({ eje: etiqueta, promedio: promedioDe(ultimas.map((fila) => fila.ejes?.[eje])) }));

  const porSubarea = Object.entries(ultimas.reduce((grupos, fila) => {
    (grupos[fila.subarea] = grupos[fila.subarea] || []).push(fila.promedio);
    return grupos;
  }, {}))
    .map(([subarea, promedios]) => ({ etiqueta: subarea, promedio: promedioDe(promedios), atletas: promedios.length }))
    .sort((a, b) => (b.promedio ?? 0) - (a.promedio ?? 0))
    .slice(0, 12);

  const porMes = Object.entries(filtradas.reduce((grupos, fila) => {
    const mes = fila.fecha.slice(0, 7);
    (grupos[mes] = grupos[mes] || []).push(fila.promedio);
    return grupos;
  }, {}))
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([mes, promedios]) => ({ etiqueta: etiquetaMes(mes), promedio: promedioDe(promedios), atletas: promedios.length }));

  // Los 3 mejores de cada eje (última medición).
  const destacados = CINE_AXES.map(([eje, etiqueta]) => ({
    eje,
    etiqueta,
    atletas: ultimas
      .filter((fila) => fila.ejes?.[eje] !== undefined && fila.ejes?.[eje] !== null)
      .sort((a, b) => b.ejes[eje] - a.ejes[eje])
      .slice(0, 3),
  }));

  const cambiar = (campo, valor) => setFiltros((actual) => ({ ...actual, [campo]: valor, ...(campo === 'area' ? { subarea: '' } : {}) }));
  const controlesFiltro = (
    <>
      <select value={filtros.area} onChange={(event) => cambiar('area', event.target.value)} aria-label="Filtrar por área">
        <option value="">Todas las áreas</option>
        {opciones.areas.map((area) => <option key={area} value={area}>{area}</option>)}
      </select>
      <select value={filtros.subarea} onChange={(event) => cambiar('subarea', event.target.value)} aria-label="Filtrar por subárea">
        <option value="">Todas las subáreas</option>
        {opciones.subareas.map((subarea) => <option key={subarea} value={subarea}>{subarea}</option>)}
      </select>
      <select value={filtros.categoria} onChange={(event) => cambiar('categoria', event.target.value)} aria-label="Filtrar por categoría">
        <option value="">Todas las categorías</option>
        {opciones.categorias.map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}
      </select>
      <label className="analisis-cine__fecha"><span>Desde</span>
        <input type="date" value={filtros.desde} max={filtros.hasta || undefined} onChange={(event) => cambiar('desde', event.target.value)} />
      </label>
      <label className="analisis-cine__fecha"><span>Hasta</span>
        <input type="date" value={filtros.hasta} min={filtros.desde || undefined} onChange={(event) => cambiar('hasta', event.target.value)} />
      </label>
    </>
  );

  return (
    <div className="analisis-cine">
      <header className="analisis-cine__encabezado">
        <h2>Análisis de cineantropometría</h2>
        <p>Cada eje va de 0 a 100 (más alto es mejor). Se usa la última medición de cada atleta.</p>
      </header>

      <div className="analisis-cine__filtros">
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

      {estado.error ? (
        <p className="analisis-cine__vacio analisis-cine__error" role="alert">{estado.error}</p>
      ) : estado.cargando ? (
        <p className="analisis-cine__vacio">Cargando análisis...</p>
      ) : !filtradas.length ? (
        <p className="analisis-cine__vacio">No hay mediciones con estos filtros.</p>
      ) : (
        <>
          <div className="analisis-cine__kpis">
            <div className="analisis-cine__kpi"><span>Atletas evaluados</span><strong>{ultimas.length}</strong></div>
            <div className="analisis-cine__kpi"><span>Mediciones</span><strong>{filtradas.length}</strong></div>
            <div className="analisis-cine__kpi"><span>Promedio del plantel</span><strong>{promedioPlantel ?? '—'}</strong><small>de 100</small></div>
            <div className="analisis-cine__kpi"><span>Última medición</span><strong>{formatFecha(ultimaFecha)}</strong></div>
          </div>

          <div className="analisis-cine__grid">
            <section className="analisis-cine__panel">
              <h3>Promedio por eje</h3>
              <div className="analisis-cine__radar" role="img" aria-label="Promedio del plantel en cada eje">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radar} outerRadius="70%">
                    <PolarGrid stroke="var(--border-main)" />
                    <PolarAngleAxis dataKey="eje" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Promedio" dataKey="promedio" stroke="var(--func-primary)" fill="var(--func-primary)" fillOpacity={0.25} strokeWidth={2} />
                    <Tooltip content={<TooltipSimple />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="analisis-cine__panel">
              <h3>Promedio por subárea</h3>
              <div className="analisis-cine__grafico" role="img" aria-label="Promedio de los 6 ejes en cada subárea">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porSubarea} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="etiqueta" width={110} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<TooltipSimple />} cursor={{ fill: 'var(--bg-surface)' }} />
                    <Bar dataKey="promedio" fill="var(--func-primary)" radius={[0, 4, 4, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {porMes.length > 1 && (
              <section className="analisis-cine__panel analisis-cine__panel--ancho">
                <h3>Evolución mensual del promedio</h3>
                <div className="analisis-cine__grafico" role="img" aria-label="Promedio de las mediciones de cada mes">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={porMes} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
                      <XAxis dataKey="etiqueta" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<TooltipSimple />} />
                      <Line type="monotone" dataKey="promedio" stroke="var(--func-primary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <small className="analisis-cine__nota">Promedio de todas las mediciones hechas en cada mes.</small>
              </section>
            )}

            <section className="analisis-cine__panel analisis-cine__panel--ancho">
              <h3>Destacados por eje</h3>
              <p className="analisis-cine__nota">Los 3 atletas con mejor puntaje en cada eje: orienta en qué subárea podrían rendir mejor.</p>
              <div className="analisis-cine__destacados">
                {destacados.map((grupo) => (
                  <div key={grupo.eje} className="analisis-cine__destacado">
                    <h4>{grupo.etiqueta}</h4>
                    {grupo.atletas.length ? (
                      <ol>
                        {grupo.atletas.map((fila) => (
                          <li key={fila.atleta_id}>
                            <span>{fila.nombre} {fila.apellido}<small>{fila.subarea}</small></span>
                            <strong>{fila.ejes[grupo.eje]}</strong>
                          </li>
                        ))}
                      </ol>
                    ) : <p className="analisis-cine__nota">Sin datos.</p>}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
