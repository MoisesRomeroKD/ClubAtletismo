import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import podApi from '../../../api/podApi';
import "../../../styles/components/atleta/asistencia/AsistenciaAtletaView.css";

/*
 * MIS ASISTENCIAS (atleta, solo consulta)
 * Resumen arriba y el historial como tabla (PC) o filas compactas (celular).
 * Filtros por subárea y estado con el patrón global de App.css.
 */
const ESTADOS = ['Presente', 'Ausente', 'Justificado'];
const CLASE_ESTADO = { Presente: 'presente', Ausente: 'ausente', Justificado: 'justificado' };

const formatFecha = (iso) => {
    if (!iso) return '—';
    const [y, m, d] = iso.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
};

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// % de asistencia de cada mes (presentes / registros), de más antiguo a más reciente; últimos 6 meses.
const porMes = (registros) => {
    const meses = {};
    registros.forEach((registro) => {
        const clave = registro.date.slice(0, 7);
        meses[clave] = meses[clave] || { total: 0, presentes: 0 };
        meses[clave].total += 1;
        if (registro.status === 'Presente') meses[clave].presentes += 1;
    });
    return Object.keys(meses).sort().slice(-6).map((clave) => ({
        etiqueta: `${MESES[Number(clave.slice(5, 7)) - 1]} ${clave.slice(2, 4)}`,
        porcentaje: Math.round((meses[clave].presentes / meses[clave].total) * 100),
        ...meses[clave],
    }));
};

// Verde 85% o más, amarillo 71–84%, rojo 70% o menos (mismos cortes que los reportes).
const colorAsistencia = (porcentaje) => {
    if (porcentaje >= 85) return 'var(--state-success)';
    if (porcentaje > 70) return 'var(--state-warning)';
    return 'var(--state-danger)';
};

function TooltipMes({ active, payload }) {
    if (!active || !payload?.length) return null;
    const mes = payload[0].payload;
    return (
        <div className="asis-atleta__tooltip">
            <strong>{mes.etiqueta}</strong>
            <span>{mes.porcentaje}% · {mes.presentes} de {mes.total} entrenamientos</span>
        </div>
    );
}

// Filtro por tiempo: días hacia atrás desde hoy (hora de Caracas). null = todo.
const PERIODOS = [
    ['todo', 'Todo el historial', null],
    ['7', 'Últimos 7 días', 7],
    ['30', 'Últimos 30 días', 30],
    ['90', 'Últimos 3 meses', 90],
    ['180', 'Últimos 6 meses', 180],
    ['365', 'Último año', 365],
];
const POR_PAGINA = 15;

// Primer día incluido en el período (AAAA-MM-DD), o '' si es todo el historial.
const desdeDelPeriodo = (periodo) => {
    const dias = PERIODOS.find(([valor]) => valor === periodo)?.[2];
    if (!dias) return '';
    const hoy = new Date(`${new Date().toLocaleDateString('en-CA', { timeZone: 'America/Caracas' })}T12:00:00`);
    hoy.setDate(hoy.getDate() - (dias - 1));
    return hoy.toLocaleDateString('en-CA');
};

function Paginacion({ total, pagina, setPagina, clase }) {
    const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
    return (
        <div className={`${clase}__paginacion`}>
            <span className={`${clase}__total`}>{total} registro{total === 1 ? '' : 's'} · {POR_PAGINA} por página</span>
            <div className={`${clase}__paginacion-botones`}>
                <button type="button" onClick={() => setPagina(pagina - 1)} disabled={pagina <= 1}>Anterior</button>
                <span>Página {Math.min(pagina, paginas)} de {paginas}</span>
                <button type="button" onClick={() => setPagina(pagina + 1)} disabled={pagina >= paginas}>Siguiente</button>
            </div>
        </div>
    );
}

function Estado({ valor }) {
    return <span className={`asis-atleta__estado asis-atleta__estado--${CLASE_ESTADO[valor] || 'otro'}`}>{valor}</span>;
}

export default function AsistenciaAtletaView() {
    const [attendances, setAttendances] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [filtros, setFiltros] = useState({ subarea: '', estado: '', periodo: 'todo' });
    const [pagina, setPagina] = useState(1);
    const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

    useEffect(() => {
        let isCurrent = true;

        const loadAttendances = async () => {
            try {
                const response = await podApi.get('/v1/asistencias/atletas/mi-asistencia/');
                if (isCurrent) setAttendances(Array.isArray(response.data) ? response.data : []);
            } catch (requestError) {
                if (isCurrent) {
                    setError(
                        requestError.response?.data?.error
                        || 'No se pudieron cargar tus asistencias. Intenta nuevamente.'
                    );
                }
            } finally {
                if (isCurrent) setIsLoading(false);
            }
        };

        loadAttendances();
        return () => {
            isCurrent = false;
        };
    }, []);

    const subareas = useMemo(
        () => [...new Set(attendances.map((attendance) => attendance.subarea).filter(Boolean))].sort(),
        [attendances],
    );

    const desde = desdeDelPeriodo(filtros.periodo);
    const filtradas = attendances.filter((attendance) => (
        (!filtros.subarea || attendance.subarea === filtros.subarea)
        && (!filtros.estado || attendance.status === filtros.estado)
        && (!desde || String(attendance.date).slice(0, 10) >= desde)
    ));
    // Al cambiar un filtro se vuelve a la página 1.
    const cambiarFiltro = (campo, valor) => {
        setFiltros({ ...filtros, [campo]: valor });
        setPagina(1);
    };
    const paginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
    const paginaActual = Math.min(pagina, paginas);
    const visibles = filtradas.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

    // El resumen sigue a los filtros: así se ve, por ejemplo, la asistencia de una sola subárea.
    const conteo = filtradas.reduce((counts, attendance) => {
        counts[attendance.status] = (counts[attendance.status] || 0) + 1;
        return counts;
    }, {});
    const porcentaje = filtradas.length ? Math.round(((conteo.Presente || 0) / filtradas.length) * 100) : null;
    const meses = porMes(filtradas);

    const controlesFiltro = (
        <>
            <select value={filtros.periodo} onChange={(event) => cambiarFiltro('periodo', event.target.value)} aria-label="Filtrar por período">
                {PERIODOS.map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
            </select>
            <select value={filtros.subarea} onChange={(event) => cambiarFiltro('subarea', event.target.value)} aria-label="Filtrar por subárea">
                <option value="">Todas las subáreas</option>
                {subareas.map((subarea) => <option key={subarea} value={subarea}>{subarea}</option>)}
            </select>
            <select value={filtros.estado} onChange={(event) => cambiarFiltro('estado', event.target.value)} aria-label="Filtrar por estado">
                <option value="">Todos los estados</option>
                {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
            </select>
        </>
    );

    return (
        <div className="asis-atleta">
            <h2 className="asis-atleta__titulo">Mi análisis de asistencia</h2>

            {isLoading && <p className="asis-atleta__vacio" role="status">Cargando tus asistencias...</p>}
            {error && <p className="asis-atleta__vacio asis-atleta__error" role="alert">{error}</p>}
            {!isLoading && !error && attendances.length === 0 && (
                <p className="asis-atleta__vacio">Aún no tienes asistencias registradas.</p>
            )}

            {!isLoading && !error && attendances.length > 0 && (
                <>
                    <div className="asis-atleta__kpis">
                        <div className="asis-atleta__kpi">
                            <span className="asis-atleta__kpi-label">Asistencia</span>
                            <span className="asis-atleta__kpi-valor">{porcentaje === null ? '—' : `${porcentaje}%`}</span>
                            <span className="asis-atleta__kpi-nota">{filtradas.length} registro{filtradas.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="asis-atleta__kpi asis-atleta__kpi--presente">
                            <span className="asis-atleta__kpi-label">Presentes</span>
                            <span className="asis-atleta__kpi-valor">{conteo.Presente || 0}</span>
                        </div>
                        <div className="asis-atleta__kpi asis-atleta__kpi--ausente">
                            <span className="asis-atleta__kpi-label">Ausentes</span>
                            <span className="asis-atleta__kpi-valor">{conteo.Ausente || 0}</span>
                        </div>
                        <div className="asis-atleta__kpi asis-atleta__kpi--justificado">
                            <span className="asis-atleta__kpi-label">Justificados</span>
                            <span className="asis-atleta__kpi-valor">{conteo.Justificado || 0}</span>
                        </div>
                    </div>

                    {meses.length > 0 && (
                        <section className="asis-atleta__mensual" aria-label="Asistencia por mes">
                            <h3>Asistencia por mes</h3>
                            <div className="asis-atleta__grafico" role="img" aria-label="Porcentaje de asistencia de cada mes">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={meses} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
                                        <XAxis dataKey="etiqueta" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[0, 100]} ticks={[0, 50, 100]} unit="%" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<TooltipMes />} cursor={{ fill: 'var(--bg-surface)' }} />
                                        <Bar dataKey="porcentaje" radius={[4, 4, 0, 0]} maxBarSize={48}>
                                            {meses.map((mes) => <Cell key={mes.etiqueta} fill={colorAsistencia(mes.porcentaje)} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <small className="asis-atleta__nota">Verde: 85% o más · Amarillo: 71 a 84% · Rojo: 70% o menos.</small>
                        </section>
                    )}

                    <section className="asis-atleta__historial" aria-label="Historial de mis asistencias">
                        <div className="asis-atleta__toolbar">
                            <h3>Historial</h3>
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
                                        {controlesFiltro}
                                    </div>
                                    <footer className="filtros-sheet__footer">
                                        <button type="button" className="filtros-sheet__btn" onClick={() => setFiltrosAbiertos(false)}>Cerrar</button>
                                        <button type="button" className="filtros-sheet__btn filtros-sheet__btn--primario" onClick={() => setFiltrosAbiertos(false)}>Aplicar filtros</button>
                                    </footer>
                                </div>,
                                document.body,
                            )}
                            <div className="filtros-escritorio">{controlesFiltro}</div>
                        </div>

                        {filtradas.length === 0 ? (
                            <p className="asis-atleta__vacio">No hay asistencias con esos filtros.</p>
                        ) : (
                            <div className="responsive-list">
                                <Paginacion total={filtradas.length} pagina={paginaActual} setPagina={setPagina} clase="asis-atleta" />
                                <div className="responsive-list__table">
                                    <table className="asis-atleta__tabla">
                                        <thead>
                                            <tr>
                                                <th>Fecha</th>
                                                <th>Subárea</th>
                                                <th>Turno</th>
                                                <th>Estado</th>
                                                <th>Detalle</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {visibles.map((attendance) => (
                                                <tr key={`${attendance.date}-${attendance.subarea}`}>
                                                    <td>{formatFecha(attendance.date)}</td>
                                                    <td>{attendance.subarea || '—'}</td>
                                                    <td>{attendance.turno || '—'}</td>
                                                    <td><Estado valor={attendance.status} /></td>
                                                    <td className="asis-atleta__detalle">{attendance.status === 'Justificado' && attendance.detail ? attendance.detail : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <ul className="responsive-list__cards asis-atleta__filas">
                                    {visibles.map((attendance) => (
                                        <li key={`${attendance.date}-${attendance.subarea}`} className="asis-atleta__fila">
                                            <div className="asis-atleta__fila-info">
                                                <strong>{formatFecha(attendance.date)}</strong>
                                                <span>{attendance.subarea || '—'}{attendance.turno ? ` · ${attendance.turno}` : ''}</span>
                                                {attendance.status === 'Justificado' && attendance.detail && (
                                                    <span className="asis-atleta__detalle">{attendance.detail}</span>
                                                )}
                                            </div>
                                            <Estado valor={attendance.status} />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
