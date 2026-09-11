import React, { useState, useEffect } from 'react';
import podApi from '../../../api/podApi';

const AntropometriaAtletaView = ({ athleteId, athleteName }) => {
  const [antropometria, setAntropometria] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAntropometria = async () => {
      try {
        setIsLoading(true);
        const storedId = athleteId || localStorage.getItem("user_id") || localStorage.getItem("userId");
        if (storedId) {
          const response = await podApi.get(`/v1/antropometria/atleta/${storedId}/`);
          if (response.data && response.data.status === 'success') {
            setAntropometria(response.data.registros || response.data.data || []);
          } else if (Array.isArray(response.data)) {
            setAntropometria(response.data);
          }
        }
      } catch (error) {
        console.error("Error al consultar antropometría:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAntropometria();
  }, [athleteId]);

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
        Cargando historial antropométrico y composición corporal...
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '12px' }}>
      
      {/* HEADER */}
      <div style={{ borderBottom: '2px solid #2A6BFF', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#111827', fontWeight: '800' }}>
          Perfil Cineantropométrico
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#6B7280', fontSize: '0.9rem' }}>
          Evolución de mediciones corporales, pliegues cutáneos y somatocarta
        </p>
      </div>

      {/* RESULTADOS / TABLA */}
      {antropometria.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '12px 16px' }}>Fecha</th>
                <th style={{ padding: '12px 16px' }}>Peso (kg)</th>
                <th style={{ padding: '12px 16px' }}>Talla (cm)</th>
                <th style={{ padding: '12px 16px' }}>% Grasa</th>
                <th style={{ padding: '12px 16px' }}>% Músculo</th>
                <th style={{ padding: '12px 16px' }}>Evaluador</th>
              </tr>
            </thead>
            <tbody>
              {antropometria.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '600' }}>{item.fecha || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>{item.peso || '-'} kg</td>
                  <td style={{ padding: '12px 16px' }}>{item.talla || '-'} cm</td>
                  <td style={{ padding: '12px 16px', color: '#EF4444', fontWeight: '600' }}>{item.porcentaje_grasa || '-'}%</td>
                  <td style={{ padding: '12px 16px', color: '#10B981', fontWeight: '600' }}>{item.porcentaje_musculo || '-'}%</td>
                  <td style={{ padding: '12px 16px', color: '#4B5563' }}>{item.evaluador || 'Cuerpo Técnico'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: '3rem 1.5rem', textAlign: 'center', border: '1px dashed #D1D5DB', borderRadius: '12px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📏</div>
          <h3 style={{ margin: 0, color: '#374151', fontSize: '1.1rem' }}>No posees registros antropométricos</h3>
          <p style={{ color: '#9CA3AF', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Las evaluaciones de pliegues, peso, talla y somatotipo cargadas por el especialista aparecerán reflejadas aquí.
          </p>
        </div>
      )}

    </div>
  );
};

export default AntropometriaAtletaView;