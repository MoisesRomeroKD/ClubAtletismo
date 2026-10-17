import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, X } from 'lucide-react';
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

function Estado({ valor }) {
    return <span className={`asis-atleta__estado asis-atleta__estado--${CLASE_ESTADO[valor] || 'otro'}`}>{valor}</span>;
}

export default function AsistenciaAtletaView() {
    const [attendances, setAttendances] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [filtros, setFiltros] = useState({ subarea: '', estado: '' });
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

    const filtradas = attendances.filter((attendance) => (
        (!filtros.subarea || attendance.subarea === filtros.subarea)
        && (!filtros.estado || attendance.status === filtros.estado)
    ));

    // El resumen sigue a los filtros: así se ve, por ejemplo, la asistencia de una sola subárea.
    const conteo = filtradas.reduce((counts, attendance) => {
        counts[attendance.status] = (counts[attendance.status] || 0) + 1;
        return counts;
    }, {});
    const porcentaje = filtradas.length ? Math.round(((conteo.Presente || 0) / filtradas.length) * 100) : null;

    const controlesFiltro = (
        <>
            <select value={filtros.subarea} onChange={(event) => setFiltros({ ...filtros, subarea: event.target.value })} aria-label="Filtrar por subárea">
                <option value="">Todas las subáreas</option>
                {subareas.map((subarea) => <option key={subarea} value={subarea}>{subarea}</option>)}
            </select>
            <select value={filtros.estado} onChange={(event) => setFiltros({ ...filtros, estado: event.target.value })} aria-label="Filtrar por estado">
                <option value="">Todos los estados</option>
                {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
            </select>
        </>
    );

    return (
        <div className="asis-atleta">
            <h2 className="asis-atleta__titulo">Mis asistencias</h2>

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
                                            {filtradas.map((attendance) => (
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
                                    {filtradas.map((attendance) => (
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
