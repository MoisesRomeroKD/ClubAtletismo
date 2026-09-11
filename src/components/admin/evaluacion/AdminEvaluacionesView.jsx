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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '2px solid #2A6BFF', paddingBottom: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#111827', fontWeight: '800' }}>
            Gestión Global de Evaluaciones
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#6B7280', fontSize: '0.9rem' }}>
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
            border: '1px solid #D1D5DB',
            fontSize: '0.9rem',
            width: '260px'
          }}
        />
      </div>

      {/* TABLA DE REGISTROS */}
      {isLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>Cargando expediente general de evaluaciones...</div>
      ) : evaluacionesFiltradas.length > 0 ? (
        <div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#374151' }}>
                <th style={{ padding: '12px 16px' }}>Atleta</th>
                <th style={{ padding: '12px 16px' }}>Fecha</th>
                <th style={{ padding: '12px 16px' }}>Prueba / Test</th>
                <th style={{ padding: '12px 16px' }}>Resultado</th>
                <th style={{ padding: '12px 16px' }}>Evaluador</th>
              </tr>
            </thead>
            <tbody>
              {evaluacionesFiltradas.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#111827' }}>{item.atleta_nombre || item.atleta || 'Atleta'}</td>
                  <td style={{ padding: '12px 16px' }}>{item.fecha || item.date || '-'}</td>
                  <td style={{ padding: '12px 16px', color: '#2A6BFF', fontWeight: '600' }}>{item.nombre_prueba || item.prueba || 'Test Físico'}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '700' }}>{item.resultado || '-'}</td>
                  <td style={{ padding: '12px 16px', color: '#4B5563' }}>{item.evaluador || 'Entrenador'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: '3rem 1.5rem', backgroundColor: '#ffffff', borderRadius: '12px', textAlign: 'center', border: '1px dashed #D1D5DB' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
          <h3 style={{ margin: 0, color: '#374151', fontSize: '1.1rem' }}>No se encontraron evaluaciones</h3>
          <p style={{ color: '#9CA3AF', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            No hay test ni pruebas registradas aún en el sistema.
          </p>
        </div>
      )}

    </div>
  );
};

export default AdminEvaluacionesView;