import React, { useState, useEffect } from 'react';
import podApi from '../../../api/podApi';
import '../../../styles/components/atleta/AthleteSleep/SleepQualityDashboard.css';

const SleepQualityDashboard = ({ athleteName, sleepData = [] }) => {
    const [selectedScore, setSelectedScore] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [records, setRecords] = useState(sleepData);
    const [average, setAverage] = useState('--');

    // Cargar historial y calcular promedio
    useEffect(() => {
        if (Array.isArray(sleepData) && sleepData.length > 0) {
            setRecords(sleepData);
            const total = sleepData.reduce((acc, item) => acc + (item.calidad || 0), 0);
            setAverage((total / sleepData.length).toFixed(1));
        }
    }, [sleepData]);

    // Función para guardar en la API (RegistrarSuenoView)
    const handleGuardarRegistro = async () => {
        if (!selectedScore) {
            alert("Por favor selecciona una puntuación de 1 a 10.");
            return;
        }

        const storedId = localStorage.getItem("user_id") || localStorage.getItem("userId");

        if (!storedId) {
            alert("Error: No se encontró la sesión del atleta.");
            return;
        }

        try {
            setIsSubmitting(true);

            // Petición POST directa a tu endpoint en Django
            const response = await podApi.post('/v1/descanso/sueno/registrar/', {
                atleta_id: storedId,
                calidad: selectedScore
            });

            if (response.data.status === 'success') {
                alert("¡Calidad de sueño registrada con éxito!");
                window.location.reload(); // Recarga la vista para refrescar gráficas
            }
        } catch (error) {
            console.error("Error al guardar:", error);
            const mensajeError = error.response?.data?.message || "No se pudo realizar el registro.";
            alert(mensajeError);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="sleep-dashboard-wrapper">
            <main className="main-content" style={{ padding: '1rem' }}>
                <div className="header-section">
                    <div>
                        <h1 className="page-title">Buenos días, {athleteName || 'Atleta'}</h1>
                        <p className="page-date">Control diario de recuperación biológica</p>
                    </div>
                </div>

                <div className="dashboard-grid">
                    
                    {/* TARJETA: REGISTRO DE HOY */}
                    <div className="card col-today">
                        <div className="sleep-form-container">
                            <div className="form-header">
                                <h2 className="form-title">Registro de Sueño de Hoy</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Selecciona tu calidad de descanso de anoche (1 al 10)</p>
                            </div>
                            
                            <div>
                                <div className="score-selector" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '1rem 0' }}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                        <button 
                                            key={num} 
                                            type="button"
                                            className={`score-btn ${selectedScore === num ? 'active' : ''}`}
                                            onClick={() => setSelectedScore(num)}
                                            style={{
                                                padding: '10px 14px',
                                                border: selectedScore === num ? '2px solid #2A6BFF' : '1px solid #ccc',
                                                backgroundColor: selectedScore === num ? '#2A6BFF' : '#fff',
                                                color: selectedScore === num ? '#fff' : '#000',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                                <div className="score-labels" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666' }}>
                                    <span>1 - Muy mala</span>
                                    <span>5 - Regular</span>
                                    <span>10 - Excelente</span>
                                </div>
                            </div>
                            
                            <button 
                                type="button"
                                className="btn-submit" 
                                disabled={!selectedScore || isSubmitting}
                                onClick={handleGuardarRegistro}
                                style={{
                                    marginTop: '1.5rem',
                                    padding: '12px 24px',
                                    backgroundColor: selectedScore && !isSubmitting ? '#2A6BFF' : '#cccccc',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: selectedScore && !isSubmitting ? 'pointer' : 'not-allowed',
                                    fontWeight: 'bold',
                                    width: '100%'
                                }}
                            >
                                {isSubmitting ? 'Guardando en Base de Datos...' : 'Guardar registro'}
                            </button>
                        </div>
                    </div>

                    <div className="col-stats">
                        {/* TARJETA: PROMEDIO */}
                        <div className="card stat-card">
                            <h3 className="stat-label">Mi Calidad de Sueño</h3>
                            <div className="stat-value" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                                <span>{average}</span><span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/10</span>
                            </div>
                            <p className="stat-context">Promedio registrado</p>
                        </div>
                    </div>

                    {/* TARJETA: HISTORIAL */}
                    <div className="card col-history">
                        <h3 className="stat-label" style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Historial de Sueño</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tus registros recientes en PostgreSQL</p>
                        <div className="history-list" style={{ marginTop: '1rem' }}>
                            {records.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {records.map((item, idx) => (
                                        <li key={idx} style={{ padding: '8px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>📅 {item.date}</span>
                                            <strong>Calificación: {item.calidad}/10</strong>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p style={{ fontSize: '0.9rem', color: '#888' }}>No hay registros anteriores.</p>
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default SleepQualityDashboard;