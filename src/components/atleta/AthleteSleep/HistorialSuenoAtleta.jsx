import React, { useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import '../../../styles/components/atleta/AthleteSleep/SleepQualityDashboardAthlete.css';

/*
 * HISTORIAL DE SUEÑO DEL ATLETA (solo consulta)
 * Promedio de calidad y lista de sus registros. El registro del día está en "Sueño y Fatiga".
 */
const fechaCorta = (iso) => new Date(`${String(iso).slice(0, 10)}T12:00:00`).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' });

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

const formatFecha = (iso) => {
    const [y, m, d] = String(iso).slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
};

function TooltipNoche({ active, payload }) {
    if (!active || !payload?.length) return null;
    const punto = payload[0].payload;
    return (
        <div className="historial-sueno__tooltip">
            <strong>{punto.etiqueta}</strong>
            <span>Nota: {punto.calidad}/10</span>
        </div>
    );
}

const HistorialSuenoAtleta = ({ sleepData = [] }) => {
    const [periodo, setPeriodo] = useState('todo');
    const [pagina, setPagina] = useState(1);
    const desde = desdeDelPeriodo(periodo);
    // Registros del período, del más reciente al más antiguo. Todo (promedio, gráfico y lista) sigue al filtro.
    const records = (Array.isArray(sleepData) ? sleepData : [])
        .filter((item) => item.date && (!desde || String(item.date).slice(0, 10) >= desde))
        .sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const paginas = Math.max(1, Math.ceil(records.length / POR_PAGINA));
    const paginaActual = Math.min(pagina, paginas);
    const visibles = records.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);
    const average = records.length
        ? (records.reduce((acc, item) => acc + (item.calidad || 0), 0) / records.length).toFixed(1)
        : '--';
    // Noches del período, de la más antigua a la más reciente (como máximo las últimas 60 para que se lea).
    const tendencia = records
        .filter((item) => item.calidad !== null && item.calidad !== undefined)
        .map((item) => ({ fecha: String(item.date).slice(0, 10), calidad: Number(item.calidad) }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
        .slice(-60)
        .map((punto) => ({ ...punto, etiqueta: fechaCorta(punto.fecha) }));

    return (
        <div className="sleep-dashboard-wrapper">
            <main className="main-content" style={{ padding: '1rem' }}>
                <div className="historial-sueno__cabecera">
                    <h2 className="historial-sueno__pagina-titulo">Mi análisis de sueño</h2>
                    <select
                        className="historial-sueno__periodo"
                        value={periodo}
                        onChange={(event) => { setPeriodo(event.target.value); setPagina(1); }}
                        aria-label="Filtrar por período"
                    >
                        {PERIODOS.map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
                    </select>
                </div>
                <div className="dashboard-grid">
                    <div className="col-stats">
                        {/* TARJETA: PROMEDIO */}
                        <div className="card stat-card historial-sueno__kpi">
                            <div>
                                <h3 className="stat-label">Mi Calidad de Sueño</h3>
                                <p className="stat-context">Promedio del período</p>
                            </div>
                            <div className="stat-value">
                                <span>{average}</span><span className="historial-sueno__sobre">/10</span>
                            </div>
                        </div>
                    </div>

                    {/* TARJETA: TENDENCIA */}
                    {tendencia.length > 1 && (
                        <div className="card col-history">
                            <h3 className="historial-sueno__titulo">Tendencia de tu descanso</h3>
                            <p className="stat-context">Tus últimas {tendencia.length} noches. La línea punteada es la meta (7).</p>
                            <div className="historial-sueno__grafico" role="img" aria-label="Tendencia de la calidad de sueño">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={tendencia} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
                                        <XAxis dataKey="etiqueta" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={16} />
                                        <YAxis domain={[0, 10]} ticks={[0, 5, 10]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<TooltipNoche />} />
                                        <ReferenceLine y={7} stroke="var(--text-muted)" strokeDasharray="4 4" />
                                        <Line type="monotone" dataKey="calidad" stroke="var(--func-primary)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* TARJETA: HISTORIAL */}
                    <div className="card col-history">
                        <h3 className="historial-sueno__titulo">Historial de Sueño</h3>
                        <p className="stat-context">Tus registros, del más reciente al más antiguo</p>
                        <div className="history-list">
                            {records.length > 0 ? (
                                <>
                                <Paginacion total={records.length} pagina={paginaActual} setPagina={setPagina} clase="historial-sueno" />
                                <ul className="historial-sueno__lista">
                                    {visibles.map((item) => (
                                        <li key={item.date} className="history-item">
                                            <span className="history-date">{formatFecha(item.date)}</span>
                                            <strong className="history-score">{item.calidad}/10</strong>
                                        </li>
                                    ))}
                                </ul>
                                </>
                            ) : (
                                <p className="stat-context">No hay registros en este período.</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HistorialSuenoAtleta;
