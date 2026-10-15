import React, { useEffect, useState } from 'react';
import podApi from '../../../api/podApi';
import "../../../styles/components/atleta/asistencia/AsistenciaAtletaView.css";

export default function AsistenciaAtletaView() {
    const [attendances, setAttendances] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isCurrent = true;

        const loadAttendances = async () => {
            try {
                const response = await podApi.get('/v1/asistencias/atletas/mi-asistencia/');
                if (isCurrent) setAttendances(response.data);
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

    const attendanceCounts = attendances.reduce((counts, attendance) => {
        counts[attendance.status] = (counts[attendance.status] || 0) + 1;
        return counts;
    }, {});

    return (
        <div className="container">
            <header className="app-header">
                <div>
                    <div className="brand">POD<span className="brand-dot">.</span></div>
                    <div className="page-title mt-2">
                        <h1>Mis asistencias</h1>
                        <p className="text-muted">Consulta tu historial personal de asistencia.</p>
                    </div>
                </div>
            </header>

            {!isLoading && !error && (
                <div className="kpi-grid">
                    <div className="kpi-card">
                        <span className="kpi-label">Registros</span>
                        <span className="kpi-value">{attendances.length}</span>
                    </div>
                    <div className="kpi-card asis">
                        <span className="kpi-label">Presentes</span>
                        <span className="kpi-value">{attendanceCounts.Presente || 0}</span>
                    </div>
                    <div className="kpi-card inasis">
                        <span className="kpi-label">Ausentes</span>
                        <span className="kpi-value">{attendanceCounts.Ausente || 0}</span>
                    </div>
                    <div className="kpi-card just">
                        <span className="kpi-label">Justificados</span>
                        <span className="kpi-value">{attendanceCounts.Justificado || 0}</span>
                    </div>
                </div>
            )}

            {isLoading && <p role="status">Cargando tus asistencias...</p>}
            {error && <p role="alert">{error}</p>}
            {!isLoading && !error && attendances.length === 0 && (
                <p>Aún no tienes asistencias registradas.</p>
            )}

            {!isLoading && !error && attendances.length > 0 && (
                <section aria-label="Historial de mis asistencias">
                    <h2>Historial</h2>
                    <div className="kpi-grid">
                        {attendances.map((attendance) => (
                            <article className="kpi-card" key={`${attendance.date}-${attendance.status}`}>
                                <span className="kpi-label">{attendance.date}</span>
                                <span className="kpi-value">{attendance.status}</span>
                                {attendance.status === 'Justificado' && attendance.detail && (
                                    <span className="text-muted">
                                        Detalle de la justificación: {attendance.detail}
                                    </span>
                                )}
                                <span className="text-muted">
                                    Registrado por: {attendance.registered_by}
                                </span>
                            </article>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
