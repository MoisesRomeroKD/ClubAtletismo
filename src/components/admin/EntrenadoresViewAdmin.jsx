import React, { useEffect, useState } from 'react';
import UserService from '../../api/services/Userservice';
import '../../styles/components/admin/EntrenadoresViewAdmin.css';

const EntrenadoresViewAdmin = () => {
  const [entrenadores, setEntrenadores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEntrenadores = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await UserService.getTrainers();
        setEntrenadores(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error('Error al cargar entrenadores:', err);
        setError('No se pudo cargar la lista de entrenadores. Inténtalo de nuevo más tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntrenadores();
  }, []);

  if (isLoading) {
    return <div className="entrenadores-admin-estado">Cargando entrenadores...</div>;
  }

  if (error) {
    return <div role="alert" className="entrenadores-admin-estado entrenadores-admin-estado--error">{error}</div>;
  }

  if (entrenadores.length === 0) {
    return <div className="entrenadores-admin-estado">No hay entrenadores registrados en el sistema.</div>;
  }

  return (
    <div className="responsive-list">
    <div className="responsive-list__table entrenadores-admin-wrap">
      <table className="entrenadores-admin-tabla">
        <thead>
          <tr>
            <th>Cédula</th>
            <th>Nombre Completo</th>
            <th>Correo Electrónico</th>
            <th>Teléfono</th>
          </tr>
        </thead>
        <tbody>
          {entrenadores.map((entrenador) => (
            <tr key={entrenador.user_id}>
              <td className="entrenadores-admin-cedula">{entrenador.cedula || '—'}</td>
              <td className="entrenadores-admin-nombre">{entrenador.nombre_completo || `${entrenador.name} ${entrenador.lastname}`.trim()}</td>
              <td className="entrenadores-admin-dato">{entrenador.email || '—'}</td>
              <td className="entrenadores-admin-dato">{entrenador.tlf || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="responsive-list__cards">
      <div className="entrenadores-admin-cards">
        {entrenadores.map((entrenador) => (
          <article className="entrenadores-admin-card" key={entrenador.user_id}>
            <h3 className="entrenadores-admin-nombre">{entrenador.nombre_completo || `${entrenador.name} ${entrenador.lastname}`.trim()}</h3>
            <dl>
              <div><dt>Cédula</dt><dd className="entrenadores-admin-cedula">{entrenador.cedula || '—'}</dd></div>
              <div><dt>Correo</dt><dd>{entrenador.email || '—'}</dd></div>
              <div><dt>Teléfono</dt><dd>{entrenador.tlf || '—'}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </div>
    </div>
  );
};

export default EntrenadoresViewAdmin;
