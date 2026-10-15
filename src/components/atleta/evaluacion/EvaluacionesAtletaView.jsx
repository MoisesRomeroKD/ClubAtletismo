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
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--clr-gris-base)' }}>
        Cargando expediente de evaluaciones...
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', backgroundColor: 'var(--clr-blanco-pura)', borderRadius: '12px' }}>
      <div style={{ borderBottom: '2px solid var(--func-primary)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)', fontWeight: '800' }}>
          Mis Evaluaciones Físicas y Técnicas
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--clr-gris-base)', fontSize: '0.9rem' }}>
          Historial de pruebas de campo y test físicos registrados por el cuerpo técnico
        </p>
      </div>

      {evaluaciones.length > 0 ? (
        <>
        <style>{`
          .evaluaciones-atleta-tabla-wrap { display: none; overflow-x: auto; }
          .evaluaciones-atleta-cards-wrap { display: grid; gap: 1rem; }
          .evaluaciones-atleta-card { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 8px; padding: 1rem; display: grid; gap: .65rem; }
          .evaluaciones-atleta-card-label { color: var(--text-muted); font-size: .75rem; }
          .evaluaciones-atleta-card-value { color: var(--text-main); font-weight: 600; }
          @media (min-width: 870px) { .evaluaciones-atleta-tabla-wrap { display: block; } .evaluaciones-atleta-cards-wrap { display: none; } }
        `}</style>
        <div className="evaluaciones-atleta-tabla-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-main)' }}>
                <th style={{ padding: '12px 16px' }}>Fecha</th>
                <th style={{ padding: '12px 16px' }}>Prueba</th>
                <th style={{ padding: '12px 16px' }}>Resultado</th>
                <th style={{ padding: '12px 16px' }}>Evaluador</th>
              </tr>
            </thead>
            <tbody>
              {evaluaciones.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--bg-surface)' }}>
                  <td style={{ padding: '12px 16px' }}>{item.fecha || '-'}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--func-primary)', fontWeight: '600' }}>{item.nombre_prueba || 'Test Físico'}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '700' }}>{item.resultado || '-'}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{item.evaluador || 'Entrenador'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="evaluaciones-atleta-cards-wrap">
          {evaluaciones.map((item, idx) => (
            <article className="evaluaciones-atleta-card" key={idx}>
              <div><div className="evaluaciones-atleta-card-label">Fecha</div><div className="evaluaciones-atleta-card-value">{item.fecha || '-'}</div></div>
              <div><div className="evaluaciones-atleta-card-label">Prueba</div><div className="evaluaciones-atleta-card-value">{item.nombre_prueba || 'Test Físico'}</div></div>
              <div><div className="evaluaciones-atleta-card-label">Resultado</div><div className="evaluaciones-atleta-card-value">{item.resultado || '-'}</div></div>
              <div><div className="evaluaciones-atleta-card-label">Evaluador</div><div className="evaluaciones-atleta-card-value">{item.evaluador || 'Entrenador'}</div></div>
            </article>
          ))}
        </div>
        </>
      ) : (
        <div style={{ padding: '3rem 1.5rem', textAlign: 'center', border: '1px dashed var(--border-main)', borderRadius: '12px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
          <h3 style={{ margin: 0, color: 'var(--clr-gris-dark)', fontSize: '1.1rem' }}>No posees evaluaciones registradas</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Los resultados de tus evaluaciones aplicadas por el entrenador aparecerán reflejados aquí.
          </p>
        </div>
      )}
    </div>
  );
};

export default EvaluacionesAtletaView;