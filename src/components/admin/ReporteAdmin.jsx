import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  BedDouble,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Eye,
  Moon,
  Ruler,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import UserService from '../../api/services/Userservice';
import { exportToExcel, exportToPdf } from '../../api/services/reportExport';
import { CINE_AXES, ESTADO_LABELS, errorMessage, formatDate, formatMonth, formatNumber } from '../reportes/reportUtils';
import { ExportButtons, ReportSection, ReportTable, StatusBadge, TrafficLight } from '../reportes/ReportShared';
import '../../styles/components/admin/ReporteAdmin.css';

const PAGE_SIZE = 15;
const INDICADORES = ['asistencia', 'sueno', 'cine'];

const PERIODOS = [
  ['hoy', 'Hoy'],
  ['semana', 'Esta semana'],
  ['mes', 'Este mes'],
  ['3meses', 'Últimos 3 meses'],
  ['personalizado', 'Personalizado'],
];

const MOSTRAR_OPCIONES = [
  ['listados', 'Listados'],
  ['asistencia', 'Asistencia'],
  ['sueno', 'Calidad de sueño'],
  ['cine', 'Cineantropometría'],
];

const FILTROS_INICIALES = {
  periodo: 'mes',
  customDesde: '',
  customHasta: '',
  categoria: '',
  areaId: '',
  subareaId: '',
  roles: { atletas: true, entrenadores: true },
  mostrar: { listados: true, asistencia: false, sueno: false, cine: false },
  usuario: null,
};

const SLEEP_TONES = {
  optimo: 'success',
  bueno: 'success',
  regular: 'warning',
  deficiente: 'danger',
  critico: 'danger-strong',
};

const estadoConMotivo = (row) => {
  const label = ESTADO_LABELS[row.estado] || row.estado;
  return row.estado === 'justificado' && row.estado_motivo ? `${label} (${row.estado_motivo})` : label;
};

const ATHLETE_COLUMNS = [
  { key: 'nombres', label: 'Nombre' },
  { key: 'apellidos', label: 'Apellido' },
  { key: 'edad', label: 'Edad' },
  { key: 'categoria', label: 'Categoría' },
  { key: 'area', label: 'Área' },
  { key: 'subareas_lista_texto', label: 'Subárea' },
  { key: 'telefono', label: 'Teléfono (repr.)' },
  {
    key: 'estado',
    label: 'Estado',
    render: (row) => (
      <span className="report-estado-cell">
        <StatusBadge value={row.estado} />
        {row.estado === 'justificado' && row.estado_motivo && <small>{row.estado_motivo}</small>}
      </span>
    ),
    exportValue: (row) => estadoConMotivo(row),
  },
];

const trainerAreas = (row) => [...new Set((row.subareas || []).map((s) => s.area).filter(Boolean))].join(', ');
const trainerSubareas = (row) => (row.subareas || []).map((s) => s.nombre).join(', ');

const TRAINER_COLUMNS = [
  { key: 'name', label: 'Nombre' },
  { key: 'lastname', label: 'Apellido' },
  { key: 'tlf', label: 'Teléfono' },
  { key: 'email', label: 'Correo' },
  { key: 'areas', label: 'Área', render: (row) => trainerAreas(row) || '—', exportValue: trainerAreas },
  { key: 'subareas', label: 'Subárea', render: (row) => trainerSubareas(row) || '—', exportValue: trainerSubareas },
];

const ALERT_BASE_COLUMNS = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'apellido', label: 'Apellido' },
  { key: 'categoria', label: 'Categoría' },
  { key: 'area', label: 'Área' },
  { key: 'subarea', label: 'Subárea' },
];

const SLEEP_ALERT_COLUMNS = [
  ...ALERT_BASE_COLUMNS,
  {
    key: 'promedio_sueno',
    label: 'Sueño prom.',
    render: (row) => <TrafficLight value="rojo">{row.promedio_sueno}/10</TrafficLight>,
    exportValue: (row) => `${row.promedio_sueno}/10`,
  },
];

const ATTENDANCE_ALERT_COLUMNS = [
  ...ALERT_BASE_COLUMNS,
  {
    key: 'porcentaje_asistencia',
    label: 'Asistencia',
    render: (row) => <TrafficLight value="rojo">{row.porcentaje_asistencia}%</TrafficLight>,
    exportValue: (row) => `${row.porcentaje_asistencia}%`,
  },
];

const CINE_COLUMNS = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'apellido', label: 'Apellido' },
  { key: 'categoria', label: 'Categoría' },
  { key: 'area', label: 'Área' },
  { key: 'subarea', label: 'Subárea' },
  { key: 'fecha', label: 'Fecha', render: (row) => formatDate(row.fecha), exportValue: (row) => formatDate(row.fecha) },
  ...CINE_AXES.map(([axis, label]) => ({
    key: axis,
    label,
    render: (row) => formatNumber(row.ejes?.[axis]),
    exportValue: (row) => row.ejes?.[axis] ?? '—',
  })),
];

const SECTION_CONFIG = {
  atletas: { title: 'Atletas', columns: ATHLETE_COLUMNS },
  entrenadores: { title: 'Entrenadores', columns: TRAINER_COLUMNS },
  sueno: { title: 'Alerta sueño crítico', columns: SLEEP_ALERT_COLUMNS },
  asistencia: { title: 'Alerta asistencia baja', columns: ATTENDANCE_ALERT_COLUMNS },
  cine: { title: 'Cineantropometría', columns: CINE_COLUMNS },
};

const toIso = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

function rangoPeriodo(periodo, customDesde, customHasta, hoy) {
  const hasta = toIso(hoy);
  if (periodo === 'hoy') return { desde: hasta, hasta };
  if (periodo === 'semana') {
    const inicio = new Date(hoy);
    inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
    return { desde: toIso(inicio), hasta };
  }
  if (periodo === 'mes') return { desde: toIso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta };
  if (periodo === '3meses') {
    const inicio = new Date(hoy);
    inicio.setMonth(inicio.getMonth() - 3);
    return { desde: toIso(inicio), hasta };
  }
  return { desde: customDesde, hasta: customHasta };
}

// Aplica un cambio a los filtros manteniendo sus reglas (subárea ligada al área, usuario ligado a su rol).
function aplicarCambio(prev, patch) {
  const next = { ...prev, ...patch };
  if ('areaId' in patch && patch.areaId !== prev.areaId) next.subareaId = '';
  const rolUsuario = next.usuario?.rol;
  if ((rolUsuario === 'atleta' && !next.roles.atletas) || (rolUsuario === 'entrenador' && !next.roles.entrenadores)) {
    next.usuario = null;
  }
  return next;
}

// Alterna una casilla sin permitir que todas queden desmarcadas.
function alternar(grupo, clave) {
  const next = { ...grupo, [clave]: !grupo[clave] };
  return Object.values(next).some(Boolean) ? next : grupo;
}

function derivarFiltros(filtros, hoy) {
  const rango = rangoPeriodo(filtros.periodo, filtros.customDesde, filtros.customHasta, hoy);
  const rangoValido = Boolean(rango.desde && rango.hasta && rango.desde <= rango.hasta);
  const rangoTexto = rangoValido
    ? (rango.desde === rango.hasta ? formatDate(rango.desde) : `${formatDate(rango.desde)} – ${formatDate(rango.hasta)}`)
    : '';
  const { usuario } = filtros;

  const comunes = {};
  if (filtros.areaId) comunes.area = filtros.areaId;
  if (filtros.subareaId) comunes.subarea = filtros.subareaId;
  const atletas = { ...comunes };
  if (filtros.categoria) atletas.categoria = filtros.categoria;
  if (usuario?.rol === 'atleta') atletas.atleta = usuario.id;
  const entrenadores = { ...comunes };
  if (usuario?.rol === 'entrenador') entrenadores.entrenador = usuario.id;

  return {
    rango,
    rangoValido,
    rangoTexto,
    atletas,
    entrenadores,
    reporte: rangoValido ? { ...atletas, desde: rango.desde, hasta: rango.hasta } : null,
    verAtletas: filtros.roles.atletas && (!usuario || usuario.rol === 'atleta'),
    verEntrenadores: filtros.roles.entrenadores && (!usuario || usuario.rol === 'entrenador'),
  };
}

// El layout no desplaza el body sino contenedores internos; se bloquean todos mientras haya un panel abierto.
const SCROLL_CONTAINERS = 'html, body, .main-content-wrapper, .content-area';

function bloquearScroll() {
  const elementos = [...document.querySelectorAll(SCROLL_CONTAINERS)];
  const previos = elementos.map((elemento) => elemento.style.overflow);
  elementos.forEach((elemento) => { elemento.style.overflow = 'hidden'; });
  return () => elementos.forEach((elemento, index) => { elemento.style.overflow = previos[index]; });
}

const atletaNombre = (atleta) => `${atleta.nombres || ''} ${atleta.apellidos || ''}`.trim() || atleta.name || 'Atleta';
const entrenadorNombre = (entrenador) => entrenador.nombre_completo || `${entrenador.name || ''} ${entrenador.lastname || ''}`.trim();

function usePaginatedList(fetchPage) {
  const [pageState, setPageState] = useState({ fetchPage, page: 1 });
  const [result, setResult] = useState({ fetchPage: null, page: 0, rows: [], count: 0, error: '' });
  const page = pageState.fetchPage === fetchPage ? pageState.page : 1;

  useEffect(() => {
    if (!fetchPage) return undefined;
    let active = true;
    fetchPage(page)
      .then((data) => {
        if (active) setResult({ fetchPage, page, rows: data?.results ?? [], count: data?.count ?? 0, error: '' });
      })
      .catch((error) => {
        if (active) setResult({ fetchPage, page, rows: [], count: 0, error: errorMessage(error, 'No se pudo cargar la lista.') });
      });
    return () => { active = false; };
  }, [fetchPage, page]);

  return {
    ...result,
    disabled: !fetchPage,
    loading: Boolean(fetchPage) && (result.fetchPage !== fetchPage || result.page !== page),
    page,
    setPage: (newPage) => setPageState({ fetchPage, page: newPage }),
  };
}

function Paginacion({ page, count, onChange }) {
  const totalPages = Math.ceil(count / PAGE_SIZE);
  if (totalPages <= 1) return null;
  return (
    <div className="report-pagination">
      <button type="button" className="report-pagination-btn" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        ← Anterior
      </button>
      <span className="report-pagination-info">Página {page} de {totalPages}</span>
      <button type="button" className="report-pagination-btn" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>
        Siguiente →
      </button>
    </div>
  );
}

function SectionList({ list, columns, emptyText }) {
  if (list.disabled) return <p className="report-table-empty">Selecciona un rango de fechas válido.</p>;
  if (list.error) return <p className="report-table-empty" role="alert">{list.error}</p>;
  if (list.loading) return <p className="report-table-empty">Cargando...</p>;
  return (
    <>
      <ReportTable columns={columns} rows={list.rows} emptyText={emptyText} />
      <Paginacion page={list.page} count={list.count} onChange={list.setPage} />
    </>
  );
}

function BuscadorUsuario({ roles, filtros, usuario, onSelect }) {
  const [texto, setTexto] = useState('');
  const [busqueda, setBusqueda] = useState({ termino: '', resultados: [], error: '' });
  const termino = texto.trim();

  useEffect(() => {
    if (termino.length < 2) return undefined;
    let active = true;
    const t = setTimeout(() => {
      const peticiones = [];
      if (roles.atletas) {
        peticiones.push(
          UserService.getAllAthletes({ ...filtros.atletas, buscar: termino, page: 1 })
            .then((data) => (data?.results ?? []).map((a) => ({ rol: 'atleta', id: a.user_id, nombre: atletaNombre(a), cedula: a.cedula }))),
        );
      }
      if (roles.entrenadores) {
        peticiones.push(
          UserService.getTrainers({ ...filtros.entrenadores, buscar: termino, page: 1 })
            .then((data) => (data?.results ?? []).map((e) => ({ rol: 'entrenador', id: e.user_id, nombre: entrenadorNombre(e), cedula: e.cedula }))),
        );
      }
      Promise.all(peticiones)
        .then((listas) => { if (active) setBusqueda({ termino, resultados: listas.flat(), error: '' }); })
        .catch((error) => { if (active) setBusqueda({ termino, resultados: [], error: errorMessage(error, 'No se pudo buscar.') }); });
    }, 350);
    return () => { active = false; clearTimeout(t); };
  }, [termino, roles, filtros]);

  if (usuario) {
    return (
      <div className="report-user-chip">
        <span className={`report-user-role report-user-role-${usuario.rol}`}>{usuario.rol === 'atleta' ? 'Atleta' : 'Entrenador'}</span>
        <span className="report-user-chip-name">{usuario.nombre}</span>
        <button type="button" onClick={() => onSelect(null)} aria-label="Quitar usuario seleccionado"><X size={14} /></button>
      </div>
    );
  }

  const mostrarLista = termino.length >= 2;
  const cargando = mostrarLista && busqueda.termino !== termino;

  return (
    <div className="report-user-search">
      <Search size={15} aria-hidden="true" />
      <input
        type="search"
        value={texto}
        onChange={(event) => setTexto(event.target.value)}
        placeholder="Nombre o cédula..."
        aria-label="Buscar usuario"
      />
      {mostrarLista && (
        <ul className="report-user-results" role="listbox">
          {cargando && <li className="report-user-empty">Buscando...</li>}
          {!cargando && busqueda.error && <li className="report-user-empty">{busqueda.error}</li>}
          {!cargando && !busqueda.error && !busqueda.resultados.length && <li className="report-user-empty">Sin resultados.</li>}
          {!cargando && busqueda.resultados.map((item) => (
            <li key={`${item.rol}-${item.id}`}>
              <button type="button" role="option" aria-selected="false" onClick={() => { onSelect(item); setTexto(''); }}>
                <span className={`report-user-role report-user-role-${item.rol}`}>{item.rol === 'atleta' ? 'Atleta' : 'Entrenador'}</span>
                <span className="report-user-result-name">{item.nombre}</span>
                <small>C.I. {item.cedula || '—'}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FiltrosControles({ value, onChange, catalogos, hoy }) {
  const derivados = useMemo(() => derivarFiltros(value, hoy), [value, hoy]);
  const hoyIso = toIso(hoy);
  const subareas = value.areaId
    ? catalogos.subareas.filter((subarea) => String(subarea.area?.id) === value.areaId)
    : catalogos.subareas;
  const unicoRol = (clave) => value.roles[clave] && Object.values(value.roles).filter(Boolean).length === 1;
  const unicoMostrar = (clave) => value.mostrar[clave] && Object.values(value.mostrar).filter(Boolean).length === 1;

  return (
    <>
      <div className="report-filters">
        <label className="report-filter">
          <span>Período</span>
          <select value={value.periodo} onChange={(event) => onChange({ periodo: event.target.value })}>
            {PERIODOS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        {value.periodo === 'personalizado' && (
          <>
            <label className="report-filter">
              <span>Desde</span>
              <input
                type="date"
                value={value.customDesde}
                max={value.customHasta || hoyIso}
                onChange={(event) => onChange({ customDesde: event.target.value })}
              />
            </label>
            <label className="report-filter">
              <span>Hasta</span>
              <input
                type="date"
                value={value.customHasta}
                min={value.customDesde || undefined}
                max={hoyIso}
                onChange={(event) => onChange({ customHasta: event.target.value })}
              />
            </label>
          </>
        )}
        <label className="report-filter">
          <span>Categoría</span>
          <select value={value.categoria} onChange={(event) => onChange({ categoria: event.target.value })}>
            <option value="">Todas las categorías</option>
            {catalogos.categorias.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
          </select>
        </label>
        <label className="report-filter">
          <span>Área</span>
          <select value={value.areaId} onChange={(event) => onChange({ areaId: event.target.value })}>
            <option value="">Todas las áreas</option>
            {catalogos.areas.map((item) => <option key={item.id} value={String(item.id)}>{item.nombre}</option>)}
          </select>
        </label>
        <label className="report-filter">
          <span>Subárea</span>
          <select value={value.subareaId} onChange={(event) => onChange({ subareaId: event.target.value })}>
            <option value="">Todas las subáreas</option>
            {subareas.map((item) => <option key={item.id} value={String(item.id)}>{item.nombre}</option>)}
          </select>
        </label>
      </div>

      <div className="report-filters">
        <fieldset className="report-role-check">
          <legend>Roles</legend>
          {[['atletas', 'Atletas'], ['entrenadores', 'Entrenadores']].map(([clave, label]) => (
            <label key={clave} title={unicoRol(clave) ? 'Debe quedar al menos un rol marcado' : undefined}>
              <input
                type="checkbox"
                checked={value.roles[clave]}
                disabled={unicoRol(clave)}
                onChange={() => onChange({ roles: alternar(value.roles, clave) })}
              />
              {label}
            </label>
          ))}
        </fieldset>
        <fieldset className="report-role-check">
          <legend>Mostrar</legend>
          {MOSTRAR_OPCIONES.map(([clave, label]) => (
            <label key={clave} title={unicoMostrar(clave) ? 'Debe quedar al menos una opción marcada' : undefined}>
              <input
                type="checkbox"
                checked={value.mostrar[clave]}
                disabled={unicoMostrar(clave)}
                onChange={() => onChange({ mostrar: alternar(value.mostrar, clave) })}
              />
              {label}
            </label>
          ))}
        </fieldset>
        <div className="report-filter report-filter-user">
          <span>Usuario</span>
          <BuscadorUsuario
            roles={value.roles}
            filtros={derivados}
            usuario={value.usuario}
            onSelect={(usuario) => onChange({ usuario })}
          />
        </div>
      </div>

      {value.periodo === 'personalizado' && !derivados.rangoValido && (
        <p className="report-filter-error" role="alert">
          {value.customDesde && value.customHasta ? 'La fecha "Desde" no puede ser posterior a "Hasta".' : 'Selecciona las fechas Desde y Hasta.'}
        </p>
      )}
    </>
  );
}

function ResumenAtletas({ params }) {
  const [state, setState] = useState({ params: null, data: null, error: '' });

  useEffect(() => {
    if (!params) return undefined;
    let active = true;
    UserService.getAdminReport({ ...params, seccion: 'resumen' })
      .then((data) => { if (active) setState({ params, data, error: '' }); })
      .catch((error) => { if (active) setState({ params, data: null, error: errorMessage(error, 'No se pudieron cargar los indicadores.') }); });
    return () => { active = false; };
  }, [params]);

  if (!params) return <div className="report-panel report-loading">Selecciona un rango de fechas válido para ver los indicadores.</div>;
  if (state.params !== params) return <div className="report-panel report-loading">Cargando indicadores...</div>;
  if (state.error) return <div className="report-panel report-error" role="alert">{state.error}</div>;

  const { asistencia, sueno, evaluaciones, categorias, atletas_activos: activos } = state.data;
  const porSemana = asistencia?.tendencia.agrupacion === 'semana';
  const variacion = asistencia?.variacion ?? null;
  const panelesCount = (asistencia ? 1 : 0) + (sueno ? 1 : 0);

  return (
    <>
      <div className="report-kpi-grid report-kpi-grid-fit">
        {asistencia && (
          <article className="report-panel report-kpi">
            <div className="report-kpi-label"><span>Asistencia media</span><CheckCircle2 className="report-icon-success" size={18} /></div>
            <strong className="report-kpi-value">{formatNumber(asistencia.porcentaje, '%')}</strong>
            {variacion === null ? (
              <p className="report-kpi-sub">Sin datos del período anterior para comparar</p>
            ) : (
              <p className={`report-kpi-sub ${variacion >= 0 ? 'report-icon-success' : 'report-icon-danger'}`}>
                {variacion >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {variacion >= 0 ? '+' : ''}{variacion}% respecto al período anterior
              </p>
            )}
          </article>
        )}
        {sueno && (
          <article className="report-panel report-kpi">
            <div className="report-kpi-label"><span>Calidad de sueño promedio</span><BedDouble className="report-icon-tertiary" size={18} /></div>
            <div className="report-kpi-inline">
              <strong className="report-kpi-value">{sueno.promedio === null ? '—' : `${sueno.promedio}/10`}</strong>
              <span>{sueno.registros} registros</span>
            </div>
            <p className="report-kpi-sub">Escala del 1 al 10</p>
          </article>
        )}
        <article className="report-panel report-kpi">
          <div className="report-kpi-label"><span>Atletas activos</span><Users className="report-icon-primary" size={18} /></div>
          <strong className="report-kpi-value">{activos}</strong>
          <p className="report-kpi-sub">{categorias.map((c) => `${c.atletas} ${c.categoria}`).join(' · ') || 'Sin atletas'}</p>
        </article>
        {evaluaciones && (
          <article className="report-panel report-kpi">
            <div className="report-kpi-label"><span>Evaluaciones registradas</span><ClipboardCheck className="report-icon-primary" size={18} /></div>
            <strong className="report-kpi-value">{evaluaciones.total}</strong>
            <p className="report-kpi-sub report-icon-tertiary">
              <Clock3 size={14} />{evaluaciones.atletas_evaluados} evaluados · {evaluaciones.pendientes} sin evaluación en el período
            </p>
          </article>
        )}
      </div>

      {panelesCount > 0 && (
        <div className={`report-admin-grid ${panelesCount === 1 ? 'report-grid-single' : ''}`}>
          {asistencia && (
            <section className="report-panel report-attendance-panel">
              <div className="report-section-heading">
                <div>
                  <h2>Asistencia {porSemana ? 'por semana' : 'por mes'}</h2>
                  <p>Desglose de registros por estado en el período seleccionado</p>
                </div>
                <div className="report-legend">
                  <span><i className="report-dot report-dot-success" />Presentes</span>
                  <span><i className="report-dot report-dot-danger" />Ausentes</span>
                  <span><i className="report-dot report-dot-warning" />Justificadas</span>
                </div>
              </div>
              {asistencia.tendencia.periodos.length ? (
                <div className="report-week-list">
                  {asistencia.tendencia.periodos.map((item) => {
                    const etiqueta = porSemana ? `Semana del ${formatDate(item.inicio)}` : formatMonth(item.inicio.slice(0, 7));
                    const ancho = (valor) => (item.total ? (valor / item.total) * 100 : 0);
                    return (
                      <div className="report-week" key={item.inicio}>
                        <div className="report-week-label">
                          <span>{etiqueta}</span>
                          <span>{formatNumber(item.porcentaje, '%')} · {item.total} registros</span>
                        </div>
                        <div
                          className="report-stacked-bar"
                          aria-label={`${etiqueta}: ${item.presentes} presentes, ${item.ausentes} ausentes, ${item.justificados} justificadas`}
                        >
                          {[['present', item.presentes], ['absent', item.ausentes], ['justified', item.justificados]].map(([tipo, valor]) => (
                            <span key={tipo} className={`report-bar-${tipo}`} style={{ width: `${ancho(valor)}%` }}>
                              {ancho(valor) >= 8 ? `${Math.round(ancho(valor))}%` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="report-table-empty">No hay registros de asistencia en este período.</p>
              )}
              <div className="report-category-breakdown">
                <h3>Asistencia por categoría</h3>
                {asistencia.categorias.length ? (
                  <div className="report-category-grid">
                    {asistencia.categorias.map((c) => (
                      <article className="report-category-stat" key={c.categoria}>
                        <span>{c.categoria} ({c.atletas})</span>
                        <strong>{formatNumber(c.porcentaje, '%')}</strong>
                        <small>{c.ausentes} ausencias · {c.justificados} justificadas</small>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="report-table-empty">Sin atletas para estos filtros.</p>
                )}
              </div>
            </section>
          )}

          {sueno && (
            <section className="report-panel report-sleep-panel">
              <div className="report-section-heading report-section-heading-compact">
                <div><h2>Calidad de sueño</h2><p>{sueno.registros} registros en el período</p></div>
                <Moon className="report-icon-tertiary" size={20} />
              </div>
              <p className="report-description">Distribución de la calidad de sueño registrada (escala del 1 al 10).</p>
              {sueno.registros ? (
                <div className="report-sleep-distribution">
                  {sueno.distribucion.map((item) => (
                    <div className="report-sleep-row" key={item.clave}>
                      <span><b>{item.rango}</b> {item.etiqueta}</span>
                      <div className="report-sleep-track">
                        <i className={`report-sleep-fill report-tone-${SLEEP_TONES[item.clave]}`} style={{ width: `${item.porcentaje ?? 0}%` }} />
                      </div>
                      <strong>{item.porcentaje ?? 0}%</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="report-table-empty">No hay registros de sueño en este período.</p>
              )}
            </section>
          )}
        </div>
      )}
    </>
  );
}

const sleepTone = (calidad) => (calidad >= 7 ? 'verde' : calidad >= 5 ? 'amarillo' : 'rojo');
const barTone = (porcentaje) => (porcentaje === null ? 'is-empty' : porcentaje <= 70 ? 'is-low' : porcentaje < 85 ? 'is-mid' : 'is-high');

// Mediciones en bruto por eje (mismas pruebas y unidades del formulario del entrenador).
const CINE_MEDICIONES = {
  potencia: { campos: [['salto_vertical', 'Salto vertical', 'cm']] },
  velocidad: { campos: [['sprint_30m', 'Sprint 30 m', 's']] },
  resistencia: { campos: [['navette', 'Navette', 'niveles']] },
  envergadura: {
    campos: [['altura', 'Altura', 'cm'], ['envergadura', 'Envergadura', 'cm']],
    indicador: ['Índice (envergadura − altura)', 'cm'],
  },
  fuerza: {
    campos: [['peso', 'Peso corporal', 'kg'], ['sentadilla', 'Carga sentadilla', 'kg']],
    indicador: ['Ratio (sentadilla ÷ peso)', ''],
  },
  flexibilidad: { campos: [['wells', 'Test de Wells', 'cm']] },
};

const conUnidad = (valor, unidad) => (valor === null || valor === undefined || valor === '' ? '—' : `${valor}${unidad ? ` ${unidad}` : ''}`);

function filasMediciones(evaluacion) {
  return CINE_AXES.map(([axis, label]) => {
    const config = CINE_MEDICIONES[axis];
    const medidas = evaluacion.mediciones?.[axis] || {};
    return {
      id: axis,
      eje: label,
      mediciones: config.campos.map(([clave, nombre, unidad]) => `${nombre}: ${conUnidad(medidas[clave], unidad)}`).join(' · '),
      indicador: config.indicador
        ? `${config.indicador[0]}: ${conUnidad(evaluacion.indicadores?.[axis], config.indicador[1])}`
        : '',
      puntaje: evaluacion.ejes?.[axis],
    };
  });
}

const MEDICIONES_COLUMNS = [
  { key: 'eje', label: 'Eje' },
  { key: 'mediciones', label: 'Mediciones' },
  { key: 'indicador', label: 'Indicador calculado' },
  { key: 'puntaje', label: 'Puntaje (0–100)' },
];

const DETALLE_CINE_COLUMNS = [
  { key: 'fecha', label: 'Fecha', render: (row) => formatDate(row.fecha), exportValue: (row) => formatDate(row.fecha) },
  { key: 'subarea', label: 'Subárea', exportValue: (row) => `${row.area} · ${row.subarea}` },
  { key: 'altura_cm', label: 'Altura (cm)' },
  { key: 'peso_kg', label: 'Peso (kg)' },
  { key: 'promedio', label: 'Promedio ejes' },
];

function DetalleAtleta({ atletaId, params, rangoTexto, onClose }) {
  const [state, setState] = useState({ id: null, data: null, error: '' });

  useEffect(() => {
    let active = true;
    UserService.getAthleteReportDetail(atletaId, params)
      .then((data) => { if (active) setState({ id: atletaId, data, error: '' }); })
      .catch((error) => { if (active) setState({ id: atletaId, data: null, error: errorMessage(error, 'No se pudo cargar el detalle.') }); });
    return () => { active = false; };
  }, [atletaId, params]);

  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    const desbloquear = bloquearScroll();
    window.addEventListener('keydown', onKey);
    return () => {
      desbloquear();
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const loading = state.id !== atletaId;
  const data = loading ? null : state.data;
  const atleta = data?.atleta;
  const ultima = data?.cineantropometria?.[0];
  const nombreCompleto = atleta ? `${atleta.nombre} ${atleta.apellido}`.trim() : '';

  const exportar = (formato) => {
    const representante = (atleta.representantes || []).map((r) => `${r.nombre} (${r.tlf || 's/tlf'})`).join(', ');
    const sections = [
      {
        title: 'Datos del atleta',
        columns: [
          { key: 'nombre', label: 'Nombre' }, { key: 'apellido', label: 'Apellido' }, { key: 'cedula', label: 'Cédula' },
          { key: 'edad', label: 'Edad' }, { key: 'categoria', label: 'Categoría' }, { key: 'area', label: 'Área' },
          { key: 'subarea', label: 'Subárea' },
          { key: 'estado', label: 'Estado', exportValue: estadoConMotivo },
          { key: 'email', label: 'Correo' },
          { key: 'representante', label: 'Representante', exportValue: () => representante },
        ],
        rows: [atleta],
      },
      {
        title: 'Asistencia del período',
        columns: [
          { key: 'presentes', label: 'Presentes' }, { key: 'ausentes', label: 'Ausentes' },
          { key: 'justificados', label: 'Justificadas' }, { key: 'total', label: 'Total' },
          { key: 'porcentaje', label: 'Asistencia', exportValue: (row) => formatNumber(row.porcentaje, '%') },
        ],
        rows: [data.asistencia],
      },
      {
        title: 'Asistencia mensual',
        columns: [
          { key: 'mes', label: 'Mes', exportValue: (row) => formatMonth(row.mes) },
          { key: 'porcentaje', label: 'Asistencia', exportValue: (row) => formatNumber(row.porcentaje, '%') },
        ],
        rows: data.asistencia.mensual,
      },
      {
        title: 'Calidad de sueño',
        columns: [
          { key: 'fecha', label: 'Fecha', exportValue: (row) => formatDate(row.fecha) },
          { key: 'calidad', label: 'Calidad (1-10)' },
        ],
        rows: data.sueno.ultimos,
      },
      ...(ultima ? [{ title: 'Mediciones última evaluación', columns: MEDICIONES_COLUMNS, rows: filasMediciones(ultima) }] : []),
      {
        title: 'Cineantropometría',
        columns: [
          ...DETALLE_CINE_COLUMNS,
          ...CINE_AXES.map(([axis, label]) => ({ key: axis, label, exportValue: (row) => row.ejes?.[axis] ?? '—' })),
        ],
        rows: data.cineantropometria,
      },
    ];
    const fileName = `detalle_${atleta.cedula || atleta.id}`;
    if (formato === 'excel') exportToExcel(fileName, sections);
    else exportToPdf(fileName, `Detalle del atleta — ${nombreCompleto} (${rangoTexto || 'últimos 30 días'})`, sections);
  };

  return createPortal(
    <div className="report-admin report-detail-overlay" onClick={onClose}>
      <aside
        className="report-detail-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Detalle del atleta"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="report-detail-header">
          <div>
            <span className="report-detail-kicker">Detalle del atleta</span>
            <h2>{nombreCompleto || 'Cargando...'}</h2>
            {atleta && <p>C.I. {atleta.cedula} · {rangoTexto || 'Últimos 30 días'}</p>}
          </div>
          <button type="button" className="report-detail-close" onClick={onClose} aria-label="Cerrar detalle"><X size={18} /></button>
        </header>

        <div className="report-detail-body">
          {loading && <p className="report-table-empty">Cargando detalle...</p>}
          {!loading && state.error && <p className="report-table-empty" role="alert">{state.error}</p>}

          {atleta && (
            <>
              {atleta.estado !== 'activo' && (
                <div className="report-detail-alert">
                  <StatusBadge value={atleta.estado} />
                  {atleta.estado === 'justificado' && <span>{atleta.estado_motivo || 'Sin motivo registrado'}</span>}
                </div>
              )}

              <section className="report-detail-section">
                <h3>Datos</h3>
                <dl className="report-detail-grid">
                  <div><dt>Edad</dt><dd>{atleta.edad ?? '—'} años</dd></div>
                  <div><dt>Categoría</dt><dd>{atleta.categoria || '—'}</dd></div>
                  <div><dt>Área</dt><dd>{atleta.area || '—'}</dd></div>
                  <div><dt>Subárea</dt><dd>{atleta.subarea || '—'}</dd></div>
                  <div><dt>Estado</dt><dd><StatusBadge value={atleta.estado} /></dd></div>
                  <div><dt>Correo</dt><dd>{atleta.email || '—'}</dd></div>
                  <div className="report-detail-wide">
                    <dt>Representante</dt>
                    <dd>
                      {atleta.representantes.length
                        ? atleta.representantes.map((r) => `${r.nombre} · ${r.tlf || 'sin teléfono'} · ${r.relacion}`).join(' / ')
                        : 'Sin representante registrado'}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="report-detail-section">
                <h3>Asistencia</h3>
                <div className="report-detail-stats">
                  <div><strong>{formatNumber(data.asistencia.porcentaje, '%')}</strong><span>Asistencia</span></div>
                  <div><strong>{data.asistencia.presentes}</strong><span>Presentes</span></div>
                  <div><strong>{data.asistencia.ausentes}</strong><span>Ausentes</span></div>
                  <div><strong>{data.asistencia.justificados}</strong><span>Justificadas</span></div>
                </div>
                <p className="report-detail-caption">Evolución mensual (últimos 6 meses)</p>
                <div className="report-progress-chart" role="img" aria-label={`Asistencia mensual de ${nombreCompleto}`}>
                  {data.asistencia.mensual.map((item) => (
                    <div className="report-progress-col" key={item.mes}>
                      <span className="report-progress-value">{formatNumber(item.porcentaje, '%')}</span>
                      <div className="report-progress-track">
                        <i className={`report-progress-bar ${barTone(item.porcentaje)}`} style={{ height: `${item.porcentaje ?? 3}%` }} />
                      </div>
                      <small>{formatMonth(item.mes)}</small>
                    </div>
                  ))}
                </div>
              </section>

              <section className="report-detail-section">
                <h3>Calidad de sueño</h3>
                <div className="report-detail-stats">
                  <div><strong>{data.sueno.promedio === null ? '—' : `${data.sueno.promedio}/10`}</strong><span>Promedio</span></div>
                  <div><strong>{data.sueno.registros}</strong><span>Registros</span></div>
                </div>
                {data.sueno.ultimos.length ? (
                  <>
                    <p className="report-detail-caption">Últimos registros</p>
                    <ul className="report-detail-sleep">
                      {data.sueno.ultimos.map((item) => (
                        <li key={item.fecha}>
                          <TrafficLight value={sleepTone(item.calidad)}>{item.calidad}/10</TrafficLight>
                          <small>{formatDate(item.fecha)}</small>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="report-table-empty">Sin registros de sueño en el período.</p>
                )}
              </section>

              <section className="report-detail-section">
                <h3>Cineantropometría</h3>
                {ultima ? (
                  <>
                    <div className="report-detail-stats">
                      <div><strong>{formatNumber(ultima.altura_cm, ' cm')}</strong><span>Altura</span></div>
                      <div><strong>{formatNumber(ultima.peso_kg, ' kg')}</strong><span>Peso</span></div>
                      <div><strong>{formatNumber(ultima.promedio)}</strong><span>Promedio ejes</span></div>
                    </div>
                    <p className="report-detail-caption">
                      Última evaluación: {formatDate(ultima.fecha)} · {ultima.area} · {ultima.subarea}
                    </p>
                    <div className="report-detail-axes">
                      {CINE_AXES.map(([axis, label]) => (
                        <div className="report-detail-axis" key={axis}>
                          <span>{label}</span>
                          <div className="report-sleep-track">
                            <i className="report-sleep-fill report-tone-success" style={{ width: `${ultima.ejes?.[axis] ?? 0}%` }} />
                          </div>
                          <strong>{formatNumber(ultima.ejes?.[axis])}</strong>
                        </div>
                      ))}
                    </div>
                    <p className="report-detail-caption">Mediciones de la última evaluación</p>
                    <div className="report-detail-measures">
                      {CINE_AXES.map(([axis, label]) => {
                        const config = CINE_MEDICIONES[axis];
                        const medidas = ultima.mediciones?.[axis] || {};
                        return (
                          <article className="report-detail-measure" key={axis}>
                            <header>
                              <strong>{label}</strong>
                              <span>{formatNumber(ultima.ejes?.[axis])} pts</span>
                            </header>
                            <dl>
                              {config.campos.map(([clave, nombre, unidad]) => (
                                <div key={clave}><dt>{nombre}</dt><dd>{conUnidad(medidas[clave], unidad)}</dd></div>
                              ))}
                              {config.indicador && (
                                <div className="report-detail-measure-indicator">
                                  <dt>{config.indicador[0]}</dt>
                                  <dd>{conUnidad(ultima.indicadores?.[axis], config.indicador[1])}</dd>
                                </div>
                              )}
                            </dl>
                          </article>
                        );
                      })}
                    </div>
                    {data.cineantropometria.length > 1 && (
                      <>
                        <p className="report-detail-caption">Historial de evaluaciones</p>
                        <ReportTable columns={DETALLE_CINE_COLUMNS} rows={data.cineantropometria} />
                      </>
                    )}
                  </>
                ) : (
                  <p className="report-table-empty">El atleta no tiene evaluaciones registradas.</p>
                )}
              </section>
            </>
          )}
        </div>

        <footer className="report-detail-footer">
          <ExportButtons disabled={!atleta} onExcel={() => exportar('excel')} onPdf={() => exportar('pdf')} />
        </footer>
      </aside>
    </div>,
    document.body,
  );
}

function AdminDataSections({ filtros, mostrar, onVerDetalle }) {
  const [inputBusqueda, setInputBusqueda] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const { verAtletas, verEntrenadores, rangoTexto } = filtros;

  useEffect(() => {
    const t = setTimeout(() => setBusqueda(inputBusqueda.trim()), 400);
    return () => clearTimeout(t);
  }, [inputBusqueda]);

  const verListaAtletas = mostrar.listados && verAtletas;
  const verListaEntrenadores = mostrar.listados && verEntrenadores;
  const verSueno = mostrar.sueno && verAtletas;
  const verAsistencia = mostrar.asistencia && verAtletas;
  const verCine = mostrar.cine && verAtletas;

  const atletaParams = useMemo(() => {
    if (!verListaAtletas) return null;
    const params = { ...filtros.atletas };
    if (busqueda) params.buscar = busqueda;
    if (estadoFiltro) params.estado = estadoFiltro;
    return params;
  }, [verListaAtletas, filtros.atletas, busqueda, estadoFiltro]);
  const entrenadorParams = verListaEntrenadores ? filtros.entrenadores : null;
  const reporte = filtros.reporte;

  const fetchAthletesPage = useMemo(
    () => (atletaParams ? (page) => UserService.getAllAthletes({ ...atletaParams, page }) : null),
    [atletaParams],
  );
  const fetchTrainersPage = useMemo(
    () => (entrenadorParams ? (page) => UserService.getTrainers({ ...entrenadorParams, page }) : null),
    [entrenadorParams],
  );
  const fetchSleepPage = useMemo(
    () => (verSueno && reporte ? (page) => UserService.getAdminReport({ ...reporte, seccion: 'sueno', page }) : null),
    [verSueno, reporte],
  );
  const fetchAttendancePage = useMemo(
    () => (verAsistencia && reporte ? (page) => UserService.getAdminReport({ ...reporte, seccion: 'asistencia', page }) : null),
    [verAsistencia, reporte],
  );
  const fetchCinePage = useMemo(
    () => (verCine && reporte ? (page) => UserService.getAdminReport({ ...reporte, seccion: 'cine', page }) : null),
    [verCine, reporte],
  );

  const atletas = usePaginatedList(fetchAthletesPage);
  const entrenadores = usePaginatedList(fetchTrainersPage);
  const sueno = usePaginatedList(fetchSleepPage);
  const asistencia = usePaginatedList(fetchAttendancePage);
  const cine = usePaginatedList(fetchCinePage);

  const athleteDisplayColumns = useMemo(() => [
    ...ATHLETE_COLUMNS,
    {
      key: 'detalle',
      label: 'Detalle',
      render: (row) => (
        <button type="button" className="report-button report-button-small" onClick={() => onVerDetalle(row.user_id)}>
          <Eye size={14} aria-hidden="true" />Ver detalle
        </button>
      ),
    },
  ], [onVerDetalle]);

  if (!verListaAtletas && !verListaEntrenadores && !verSueno && !verAsistencia && !verCine) {
    return (
      <div className="report-panel report-loading">
        No hay secciones para esta combinación: Asistencia, Calidad de sueño y Cineantropometría solo aplican a atletas.
      </div>
    );
  }

  const fetchAllRows = {
    atletas: () => UserService.getAllAthletes(atletaParams),
    entrenadores: () => UserService.getTrainers(entrenadorParams),
    sueno: () => UserService.getAdminReport({ ...reporte, seccion: 'sueno' }),
    asistencia: () => UserService.getAdminReport({ ...reporte, seccion: 'asistencia' }),
    cine: () => UserService.getAdminReport({ ...reporte, seccion: 'cine' }),
  };
  const visibleKeys = [
    ...(verListaAtletas ? ['atletas'] : []),
    ...(verListaEntrenadores ? ['entrenadores'] : []),
    ...(verSueno && reporte ? ['sueno'] : []),
    ...(verAsistencia && reporte ? ['asistencia'] : []),
    ...(verCine && reporte ? ['cine'] : []),
  ];

  const runExport = async (keys, fileName, title, format) => {
    setExporting(true);
    setExportError('');
    try {
      const allRows = await Promise.all(keys.map((key) => fetchAllRows[key]()));
      const sections = keys.map((key, index) => ({
        ...SECTION_CONFIG[key],
        rows: Array.isArray(allRows[index]) ? allRows[index] : [],
      }));
      if (format === 'excel') exportToExcel(fileName, sections);
      else exportToPdf(fileName, title, sections);
    } catch (error) {
      setExportError(errorMessage(error, 'No se pudo generar el archivo.'));
    } finally {
      setExporting(false);
    }
  };

  const exportButtons = (keys, fileName, title) => (
    <ExportButtons
      disabled={exporting || !keys.length}
      onExcel={() => runExport(keys, fileName, title, 'excel')}
      onPdf={() => runExport(keys, fileName, title, 'pdf')}
    />
  );
  const reportButtons = (key, fileName, title) => exportButtons(reporte ? [key] : [], fileName, title);
  const alertasVisibles = (verSueno ? 1 : 0) + (verAsistencia ? 1 : 0);

  return (
    <>
      <div className="report-filter-bar">
        <div>
          <strong className="report-filter-title">Reporte general del club</strong>
          <p className="report-filter-hint">Exporta en un solo archivo las secciones visibles con los filtros aplicados.</p>
        </div>
        {exportButtons(visibleKeys, 'reporte_general', 'Reporte general del club')}
      </div>
      {exportError && <div className="report-panel report-error" role="alert">{exportError}</div>}

      {verListaAtletas && (
        <ReportSection
          title="Listado de atletas"
          description="Datos para inscripción en competencias. Usa «Ver detalle» para asistencia, sueño y cineantropometría."
          icon={<Users className="report-icon-primary" size={20} />}
          actions={exportButtons(['atletas'], 'listado_atletas', 'Listado de atletas')}
        >
          <div className="report-table-filters">
            <input
              type="search"
              placeholder="Buscar por nombre o cédula..."
              value={inputBusqueda}
              onChange={(event) => setInputBusqueda(event.target.value)}
              aria-label="Buscar atleta en el listado"
            />
            <select value={estadoFiltro} onChange={(event) => setEstadoFiltro(event.target.value)} aria-label="Filtrar por estado">
              <option value="">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
              <option value="justificado">Justificados</option>
            </select>
            <span className="report-count">{atletas.count} atletas</span>
          </div>
          <SectionList list={atletas} columns={athleteDisplayColumns} emptyText="No hay atletas con ese criterio." />
        </ReportSection>
      )}

      {verListaEntrenadores && (
        <ReportSection
          title="Listado de entrenadores"
          icon={<UserRound className="report-icon-primary" size={20} />}
          actions={exportButtons(['entrenadores'], 'listado_entrenadores', 'Listado de entrenadores')}
        >
          <SectionList list={entrenadores} columns={TRAINER_COLUMNS} emptyText="No hay entrenadores con ese criterio." />
        </ReportSection>
      )}

      {alertasVisibles > 0 && (
        <div className={`report-alert-grid ${alertasVisibles === 1 ? 'report-grid-single' : ''}`}>
          {verSueno && (
            <ReportSection
              title="Alerta: sueño crítico"
              description={`Atletas activos con promedio de sueño ≤ 4/10 en el período ${rangoTexto}.`}
              icon={<Moon className="report-icon-danger" size={20} />}
              actions={reportButtons('sueno', 'alerta_sueno', 'Alerta: sueño crítico')}
            >
              <SectionList list={sueno} columns={SLEEP_ALERT_COLUMNS} emptyText="Ningún atleta en sueño crítico." />
            </ReportSection>
          )}
          {verAsistencia && (
            <ReportSection
              title="Alerta: asistencia baja"
              description={`Atletas activos con asistencia ≤ 70% en el período ${rangoTexto}.`}
              icon={<AlertTriangle className="report-icon-danger" size={20} />}
              actions={reportButtons('asistencia', 'alerta_asistencia', 'Alerta: asistencia baja')}
            >
              <SectionList list={asistencia} columns={ATTENDANCE_ALERT_COLUMNS} emptyText="Ningún atleta con asistencia baja." />
            </ReportSection>
          )}
        </div>
      )}

      {verCine && (
        <ReportSection
          title="Evaluación cineantropométrica"
          description={`Última evaluación de cada atleta en el período ${rangoTexto}. Puntuación normalizada (0–100) por eje.`}
          icon={<Ruler className="report-icon-primary" size={20} />}
          actions={reportButtons('cine', 'cineantropometria', 'Evaluación cineantropométrica')}
        >
          <SectionList list={cine} columns={CINE_COLUMNS} emptyText="No hay evaluaciones en este período." />
        </ReportSection>
      )}
    </>
  );
}

function AdminReport() {
  const [hoy] = useState(() => new Date());
  const [aplicado, setAplicado] = useState(FILTROS_INICIALES);
  const [borrador, setBorrador] = useState(null);
  const [detalleId, setDetalleId] = useState(null);
  const [catalogos, setCatalogos] = useState({ categorias: [], areas: [], subareas: [] });
  const panelFiltrosAbierto = Boolean(borrador);

  useEffect(() => {
    let active = true;
    Promise.all([UserService.getAthleteCategories(), UserService.getAreas(), UserService.getSubareas()])
      .then(([categorias, areas, subareas]) => {
        if (!active) return;
        setCatalogos({
          categorias: Array.isArray(categorias) ? categorias : [],
          areas: Array.isArray(areas) ? areas : [],
          subareas: Array.isArray(subareas) ? subareas : [],
        });
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!panelFiltrosAbierto) return undefined;
    return bloquearScroll();
  }, [panelFiltrosAbierto]);

  const filtros = useMemo(() => derivarFiltros(aplicado, hoy), [aplicado, hoy]);
  const borradorValido = borrador ? derivarFiltros(borrador, hoy).rangoValido : false;

  const indicadoresKey = INDICADORES.filter((clave) => aplicado.mostrar[clave]).join(',');
  const resumenParams = useMemo(
    () => (filtros.reporte && indicadoresKey ? { ...filtros.reporte, indicadores: indicadoresKey } : null),
    [filtros.reporte, indicadoresKey],
  );
  const detalleParams = useMemo(
    () => (filtros.rangoValido ? { desde: filtros.rango.desde, hasta: filtros.rango.hasta } : {}),
    [filtros.rangoValido, filtros.rango.desde, filtros.rango.hasta],
  );

  const verDetalle = useCallback((id) => setDetalleId(id), []);
  const cerrarDetalle = useCallback(() => setDetalleId(null), []);
  const aplicarBorrador = () => {
    setAplicado(borrador);
    setBorrador(null);
  };

  return (
    <section className="report-role-panel" aria-label="Vista Administrador (Global)">
      <div className="report-filter-bar report-filter-bar-main report-filter-desktop">
        <FiltrosControles
          value={aplicado}
          onChange={(patch) => setAplicado((prev) => aplicarCambio(prev, patch))}
          catalogos={catalogos}
          hoy={hoy}
        />
      </div>

      <button type="button" className="report-filter-fab" onClick={() => setBorrador(aplicado)}>
        <SlidersHorizontal size={18} aria-hidden="true" />Filtros
      </button>

      {borrador && createPortal(
        <div className="report-admin report-filter-sheet" role="dialog" aria-modal="true" aria-label="Filtros del reporte">
          <header className="report-filter-sheet-header">
            <h2>Filtros</h2>
            <button type="button" className="report-detail-close" onClick={() => setBorrador(null)} aria-label="Cerrar filtros">
              <X size={18} />
            </button>
          </header>
          <div className="report-filter-sheet-body report-filter-bar-main">
            <FiltrosControles
              value={borrador}
              onChange={(patch) => setBorrador((prev) => aplicarCambio(prev, patch))}
              catalogos={catalogos}
              hoy={hoy}
            />
          </div>
          <footer className="report-filter-sheet-footer">
            <button type="button" className="report-sheet-btn" onClick={() => setBorrador(null)}>Cerrar</button>
            <button type="button" className="report-sheet-btn report-sheet-btn-primary" onClick={aplicarBorrador} disabled={!borradorValido}>
              Aplicar filtros
            </button>
          </footer>
        </div>,
        document.body,
      )}

      {filtros.verAtletas && indicadoresKey && <ResumenAtletas params={resumenParams} />}

      {filtros.verAtletas && aplicado.mostrar.cine && (
        <section className="report-evaluations-section">
          <div className="report-warning-banner">
            <AlertTriangle size={19} aria-hidden="true" />
            <div><strong>Responsabilidad de registro de evaluaciones: Configuración pendiente de definir en el sistema</strong><p>Se requiere asignar la jerarquía de carga de datos clínicos/cineantropométricos entre médicos deportólogos o entrenadores principales.</p></div>
            <button className="report-button report-button-warning" type="button" disabled title="Configuración pendiente"><ShieldCheck size={16} aria-hidden="true" />Configurar permisos de registro (Pendiente)</button>
          </div>
        </section>
      )}

      <AdminDataSections filtros={filtros} mostrar={aplicado.mostrar} onVerDetalle={verDetalle} />

      {detalleId && (
        <DetalleAtleta atletaId={detalleId} params={detalleParams} rangoTexto={filtros.rangoTexto} onClose={cerrarDetalle} />
      )}
    </section>
  );
}

export default function ReporteAdmin() {
  return (
    <div className="report-admin">
      <div className="report-content">
        <AdminReport />
      </div>
    </div>
  );
}
