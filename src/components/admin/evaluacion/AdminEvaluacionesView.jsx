import React, { useState, useEffect } from 'react';
import podApi from '../../../api/podApi';
import '../../../styles/components/admin/evaluacion/AdminEvaluacionesView.css';

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
    <div className="admin-evaluaciones">

      {/* HEADER DE ADMINISTRACIÓN */}
      <div className="admin-evaluaciones-header">
        <div>
          <h2 className="admin-evaluaciones-titulo">Gestión Global de Evaluaciones</h2>
          <p className="admin-evaluaciones-subtitulo">Consola centralizada para revisión de pruebas físicas y técnicas</p>
        </div>

        {/* BÚSQUEDA Y FILTRO */}
        <input
          type="text"
          className="admin-evaluaciones-buscar"
          placeholder="Buscar por atleta o prueba..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      {/* TABLA DE REGISTROS */}
      {isLoading ? (
        <div className="admin-evaluaciones-cargando">Cargando expediente general de evaluaciones...</div>
      ) : evaluacionesFiltradas.length > 0 ? (
        <div className="responsive-list">
        <div className="responsive-list__table admin-evaluaciones-tabla-wrap">
          <table className="admin-evaluaciones-tabla">
            <thead>
              <tr>
                <th>Atleta</th>
                <th>Fecha</th>
                <th>Prueba / Test</th>
                <th>Resultado</th>
                <th>Evaluador</th>
              </tr>
            </thead>
            <tbody>
              {evaluacionesFiltradas.map((item, idx) => (
                <tr key={idx}>
                  <td className="admin-evaluaciones-atleta">{item.atleta_nombre || item.atleta || 'Atleta'}</td>
                  <td>{item.fecha || item.date || '-'}</td>
                  <td className="admin-evaluaciones-prueba">{item.nombre_prueba || item.prueba || 'Test Físico'}</td>
                  <td className="admin-evaluaciones-resultado">{item.resultado || '-'}</td>
                  <td className="admin-evaluaciones-evaluador">{item.evaluador || 'Entrenador'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="responsive-list__cards">
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
        </div>
        </div>
      ) : (
        <div className="admin-evaluaciones-vacio">
          <div className="admin-evaluaciones-vacio-icono">📋</div>
          <h3>No se encontraron evaluaciones</h3>
          <p>No hay test ni pruebas registradas aún en el sistema.</p>
        </div>
      )}

    </div>
  );
};

export default AdminEvaluacionesView;