import React, { useState, useEffect } from 'react';
import podApi from '../../../api/podApi';

const EvaluacionesAtletaView = ({ athleteId, athleteName }) => {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvaluaciones = async () => {
      try {
        setIsLoading(true);
        const storedId = athleteId || localStorage.getItem("user_id") || localStorage.getItem("userId");
        if (storedId) {
          const response = await podApi.get(`/v1/evaluacion/atleta/${storedId}/`);
          if (response.data && response.data.status === 'success') {
            setEvaluaciones(response.data.evaluaciones || response.data.data || []);
          } else if (Array.isArray(response.data)) {
            setEvaluaciones(response.data);
          }
        }
      } catch (error) {
        console.error("Error al consultar evaluaciones:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Llamada con el nombre correcto de la función
    fetchEvaluaciones();
  }, [athleteId]);

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
        Cargando expediente de evaluaciones...
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '12px' }}>
      <div style={{ borderBottom: '2px solid #2A6BFF', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#111827', fontWeight: '800' }}>
          Mis Evaluaciones Físicas y Técnicas
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#6B7280', fontSize: '0.9rem' }}>
          Historial de pruebas de campo y test físicos registrados por el cuerpo técnico
        </p>
      </div>

      {evaluaciones.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '12px 16px' }}>Fecha</th>
                <th style={{ padding: '12px 16px' }}>Prueba</th>
                <th style={{ padding: '12px 16px' }}>Resultado</th>
                <th style={{ padding: '12px 16px' }}>Evaluador</th>
              </tr>
            </thead>
            <tbody>
              {evaluaciones.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 16px' }}>{item.fecha || '-'}</td>
                  <td style={{ padding: '12px 16px', color: '#2A6BFF', fontWeight: '600' }}>{item.nombre_prueba || 'Test Físico'}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '700' }}>{item.resultado || '-'}</td>
                  <td style={{ padding: '12px 16px', color: '#4B5563' }}>{item.evaluador || 'Entrenador'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: '3rem 1.5rem', textAlign: 'center', border: '1px dashed #D1D5DB', borderRadius: '12px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
          <h3 style={{ margin: 0, color: '#374151', fontSize: '1.1rem' }}>No posees evaluaciones registradas</h3>
          <p style={{ color: '#9CA3AF', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Los resultados de tus evaluaciones aplicadas por el entrenador aparecerán reflejados aquí.
          </p>
        </div>
      )}
    </div>
  );
};

export default EvaluacionesAtletaView;