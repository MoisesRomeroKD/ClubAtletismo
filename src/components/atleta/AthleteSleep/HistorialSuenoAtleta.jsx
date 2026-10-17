import React from 'react';
import '../../../styles/components/atleta/AthleteSleep/SleepQualityDashboardAthlete.css';

/*
 * HISTORIAL DE SUEÑO DEL ATLETA (solo consulta)
 * Promedio de calidad y lista de sus registros. El registro del día está en "Sueño y Fatiga".
 */
const HistorialSuenoAtleta = ({ sleepData = [] }) => {
    const records = Array.isArray(sleepData) ? sleepData : [];
    const average = records.length
        ? (records.reduce((acc, item) => acc + (item.calidad || 0), 0) / records.length).toFixed(1)
        : '--';

    return (
        <div className="sleep-dashboard-wrapper">
            <main className="main-content" style={{ padding: '1rem' }}>
                <div className="dashboard-grid">
                    <div className="col-stats">
                        {/* TARJETA: PROMEDIO */}
                        <div className="card stat-card">
                            <h3 className="stat-label">Mi Calidad de Sueño</h3>
                            <div className="stat-value">
                                <span>{average}</span><span className="historial-sueno__sobre">/10</span>
                            </div>
                            <p className="stat-context">Promedio registrado</p>
                        </div>
                    </div>

                    {/* TARJETA: HISTORIAL */}
                    <div className="card col-history">
                        <h3 className="historial-sueno__titulo">Historial de Sueño</h3>
                        <p className="stat-context">Tus registros recientes</p>
                        <div className="history-list">
                            {records.length > 0 ? (
                                <ul className="historial-sueno__lista">
                                    {records.map((item, idx) => (
                                        <li key={idx} className="history-item">
                                            <span className="history-date">{item.date}</span>
                                            <strong className="history-score">{item.calidad}/10</strong>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="stat-context">No hay registros anteriores.</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HistorialSuenoAtleta;
