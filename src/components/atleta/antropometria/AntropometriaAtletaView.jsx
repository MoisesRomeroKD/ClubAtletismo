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
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--clr-gris-base)' }}>
        Cargando historial antropométrico y composición corporal...
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', backgroundColor: 'var(--clr-blanco-pura)', borderRadius: '12px' }}>
      
      {/* HEADER */}
      <div style={{ borderBottom: '2px solid var(--func-primary)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)', fontWeight: '800' }}>
          Perfil Cineantropométrico
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--clr-gris-base)', fontSize: '0.9rem' }}>
          Evolución de mediciones corporales, pliegues cutáneos y somatocarta
        </p>
      </div>

      {/* RESULTADOS / TABLA */}
      {antropometria.length > 0 ? (
        <>
        <style>{`
          .antropometria-tabla-wrap { display: none; overflow-x: auto; }
          .antropometria-cards-wrap { display: grid; gap: 1rem; }
          .antropometria-card { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 8px; padding: 1rem; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
          .antropometria-card-label { color: var(--text-muted); font-size: .75rem; }
          .antropometria-card-value { color: var(--text-main); font-weight: 600; }
          @media (min-width: 870px) { .antropometria-tabla-wrap { display: block; } .antropometria-cards-wrap { display: none; } }
        `}</style>
        <div className="antropometria-tabla-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-main)' }}>
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
                <tr key={idx} style={{ borderBottom: '1px solid var(--bg-surface)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '600' }}>{item.fecha || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>{item.peso || '-'} kg</td>
                  <td style={{ padding: '12px 16px' }}>{item.talla || '-'} cm</td>
                  <td style={{ padding: '12px 16px', color: '#EF4444', fontWeight: '600' }}>{item.porcentaje_grasa || '-'}%</td>
                  <td style={{ padding: '12px 16px', color: '#10B981', fontWeight: '600' }}>{item.porcentaje_musculo || '-'}%</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{item.evaluador || 'Cuerpo Técnico'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="antropometria-cards-wrap">
          {antropometria.map((item, idx) => (
            <article className="antropometria-card" key={idx}>
              <div><div className="antropometria-card-label">Fecha</div><div className="antropometria-card-value">{item.fecha || '-'}</div></div>
              <div><div className="antropometria-card-label">Evaluador</div><div className="antropometria-card-value">{item.evaluador || 'Cuerpo Técnico'}</div></div>
              <div><div className="antropometria-card-label">Peso</div><div className="antropometria-card-value">{item.peso || '-'} kg</div></div>
              <div><div className="antropometria-card-label">Talla</div><div className="antropometria-card-value">{item.talla || '-'} cm</div></div>
              <div><div className="antropometria-card-label">% Grasa</div><div className="antropometria-card-value">{item.porcentaje_grasa || '-'}%</div></div>
              <div><div className="antropometria-card-label">% Músculo</div><div className="antropometria-card-value">{item.porcentaje_musculo || '-'}%</div></div>
            </article>
          ))}
        </div>
        </>
      ) : (
        <div style={{ padding: '3rem 1.5rem', textAlign: 'center', border: '1px dashed var(--border-main)', borderRadius: '12px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📏</div>
          <h3 style={{ margin: 0, color: 'var(--clr-gris-dark)', fontSize: '1.1rem' }}>No posees registros antropométricos</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Las evaluaciones de pliegues, peso, talla y somatotipo cargadas por el especialista aparecerán reflejadas aquí.
          </p>
        </div>
      )}

    </div>
  );
};

export default AntropometriaAtletaView;