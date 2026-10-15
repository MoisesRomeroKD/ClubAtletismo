import React, { useState, useEffect } from 'react';
import podApi from '../../api/podApi';
import '../../styles/components/admin/AdministradoresView.css';

const AdministradoresView = () => {
  const [administradores, setAdministradores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdministradores = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await podApi.get('/v1/users/administradores/');
        setAdministradores(response.data);
      } catch (err) {
        console.error('Error al cargar administradores:', err);
        setError('No se pudo cargar la lista de administradores.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdministradores();
  }, []);

  if (isLoading) {
    return <div className="administradores-estado">Cargando administradores...</div>;
  }

  if (error) {
    return <div className="administradores-estado administradores-estado--error">{error}</div>;
  }

  if (administradores.length === 0) {
    return <div className="administradores-estado">No hay administradores registrados en el sistema.</div>;
  }

  return (
    <div className="responsive-list">
    <div className="responsive-list__table administradores-wrap">
      <table className="administradores-tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo Electrónico</th>
            <th>Rol</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {administradores.map((admin) => (
            <tr key={admin.id}>
              <td className="administradores-nombre">{admin.nombre_completo}</td>
              <td className="administradores-email">{admin.email}</td>
              <td>
                <span className="administradores-rol">{admin.rol || 'Administrador'}</span>
              </td>
              <td>
                <span className={`administradores-activo ${admin.is_active ? '' : 'administradores-activo--no'}`}>
                  {admin.is_active ? '● Activo' : '● Inactivo'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="responsive-list__cards">
      <div className="administradores-cards">
        {administradores.map((admin) => (
          <article className="administradores-card" key={admin.id}>
            <div className="administradores-card-head">
              <h3 className="administradores-nombre">{admin.nombre_completo}</h3>
              <span className={`administradores-activo ${admin.is_active ? '' : 'administradores-activo--no'}`}>
                {admin.is_active ? '● Activo' : '● Inactivo'}
              </span>
            </div>
            <dl>
              <div><dt>Correo</dt><dd>{admin.email}</dd></div>
              <div><dt>Rol</dt><dd><span className="administradores-rol">{admin.rol || 'Administrador'}</span></dd></div>
            </dl>
          </article>
        ))}
      </div>
    </div>
    </div>
  );
};

export default AdministradoresView;
