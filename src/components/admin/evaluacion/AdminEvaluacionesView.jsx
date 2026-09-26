import React, { useState, useEffect } from 'react';
import podApi from '../../../api/podApi';

const AdminEvaluacionesView = () => {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    const fetchEvaluacionesGenerales = async () => {
      try {
        setIsLoading(true);
        const response = await podApi.get('/v1/evaluacion/listar/');
        if (response.data && response.data.status === 'success') {
          setEvaluaciones(response.data.evaluaciones || response.data.data || []);
        } else if (Array.isArray(response.data)) {
          setEvaluaciones(response.data);
        }
      } catch (error) {
        console.error("Error al obtener evaluaciones globales:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluacionesGenerales();
  }, []);

  const evaluacionesFiltradas = evaluaciones.filter(item => 
    (item.atleta_nombre || '').toLowerCase().includes(filtro.toLowerCase()) ||
    (item.nombre_prueba || '').toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      
      {/* HEADER DE ADMINISTRACIÓN */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '2px solid var(--func-primary)', paddingBottom: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: '800' }}>
            Gestión Global de Evaluaciones
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--clr-gris-base)', fontSize: '0.9rem' }}>
            Consola centralizada para revisión de pruebas físicas y técnicas
          </p>
        </div>

        {/* BÚSQUEDA Y FILTRO */}
        <input 
          type="text"
          placeholder="Buscar por atleta o prueba..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            border: '1px solid var(--border-main)',
            fontSize: '0.9rem',
            width: '260px'
          }}
        />
      </div>

      {/* TABLA DE REGISTROS */}
      {isLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--clr-gris-base)' }}>Cargando expediente general de evaluaciones...</div>
      ) : evaluacionesFiltradas.length > 0 ? (
        <>
        <style>{`
          .admin-evaluaciones-tabla-wrap { display: none; overflow-x: auto; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border-main); }
          .admin-evaluaciones-cards-wrap { display: grid; gap: 1rem; }
          .admin-evaluaciones-card { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 8px; padding: 1rem; display: grid; gap: .65rem; }
          .admin-evaluaciones-card-label { color: var(--text-muted); font-size: .75rem; }
          .admin-evaluaciones-card-value { color: var(--text-main); font-weight: 600; }
          @media (min-width: 870px) {
            .admin-evaluaciones-tabla-wrap { display: block; }
            .admin-evaluaciones-cards-wrap { display: none; }
          }
        `}</style>
        <div className="admin-evaluaciones-tabla-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-main)', color: 'var(--clr-gris-dark)' }}>
                <th style={{ padding: '12px 16px' }}>Atleta</th>
                <th style={{ padding: '12px 16px' }}>Fecha</th>
                <th style={{ padding: '12px 16px' }}>Prueba / Test</th>
                <th style={{ padding: '12px 16px' }}>Resultado</th>
                <th style={{ padding: '12px 16px' }}>Evaluador</th>
              </tr>
            </thead>
            <tbody>
              {evaluacionesFiltradas.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--bg-surface)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--text-main)' }}>{item.atleta_nombre || item.atleta || 'Atleta'}</td>
                  <td style={{ padding: '12px 16px' }}>{item.fecha || item.date || '-'}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--func-primary)', fontWeight: '600' }}>{item.nombre_prueba || item.prueba || 'Test Físico'}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '700' }}>{item.resultado || '-'}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{item.evaluador || 'Entrenador'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-evaluaciones-cards-wrap">
          {evaluacionesFiltradas.map((item, idx) => (
            <article className="admin-evaluaciones-card" key={idx}>
              <div><div className="admin-evaluaciones-card-label">Atleta</div><div className="admin-evaluaciones-card-value">{item.atleta_nombre || item.atleta || 'Atleta'}</div></div>
              <div><div className="admin-evaluaciones-card-label">Prueba / Test</div><div className="admin-evaluaciones-card-value">{item.nombre_prueba || item.prueba || 'Test Físico'}</div></div>
              <div><div className="admin-evaluaciones-card-label">Fecha</div><div className="admin-evaluaciones-card-value">{item.fecha || item.date || '-'}</div></div>
              <div><div className="admin-evaluaciones-card-label">Resultado</div><div className="admin-evaluaciones-card-value">{item.resultado || '-'}</div></div>
              <div><div className="admin-evaluaciones-card-label">Evaluador</div><div className="admin-evaluaciones-card-value">{item.evaluador || 'Entrenador'}</div></div>
            </article>
          ))}
        </div>
        </>
      ) : (
        <div style={{ padding: '3rem 1.5rem', backgroundColor: 'var(--clr-blanco-pura)', borderRadius: '12px', textAlign: 'center', border: '1px dashed var(--border-main)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
          <h3 style={{ margin: 0, color: 'var(--clr-gris-dark)', fontSize: '1.1rem' }}>No se encontraron evaluaciones</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            No hay test ni pruebas registradas aún en el sistema.
          </p>
        </div>
      )}

    </div>
  );
};

export default AdminEvaluacionesView;