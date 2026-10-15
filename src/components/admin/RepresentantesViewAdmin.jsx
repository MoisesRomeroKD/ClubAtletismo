import React, { useEffect, useState } from 'react';
import UserService from '../../api/services/Userservice';
import '../../styles/components/admin/RepresentantesViewAdmin.css';

const RepresentantesViewAdmin = () => {
  const [representantes, setRepresentantes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRepresentantes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await UserService.getRepresentatives();
        setRepresentantes(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error('Error al cargar representantes:', err);
        setError('No se pudo cargar la lista de representantes. Inténtalo de nuevo más tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepresentantes();
  }, []);

  if (isLoading) {
    return <div className="representantes-admin-estado">Cargando representantes...</div>;
  }

  if (error) {
    return <div role="alert" className="representantes-admin-estado representantes-admin-estado--error">{error}</div>;
  }

  if (representantes.length === 0) {
    return <div className="representantes-admin-estado">No hay representantes registrados en el sistema.</div>;
  }

  return (
    <div className="responsive-list">
    <div className="responsive-list__table representantes-admin-wrap">
      <table className="representantes-admin-tabla">
        <thead>
          <tr>
            <th>Cédula / DNI</th>
            <th>Nombre del Representante</th>
            <th>Teléfono</th>
            <th>Atleta(s) a cargo</th>
          </tr>
        </thead>
        <tbody>
          {representantes.map((representante) => (
            <tr key={representante.id}>
              <td className="representantes-admin-cedula">{representante.cedula || '—'}</td>
              <td className="representantes-admin-nombre">{representante.nombre_completo || `${representante.nombre} ${representante.apellido}`.trim()}</td>
              <td className="representantes-admin-dato">{representante.tlf || '—'}</td>
              <td>
                {representante.atletas?.length
                  ? representante.atletas.map((atleta) => atleta.nombre).join(', ')
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="responsive-list__cards">
      <div className="representantes-admin-cards">
        {representantes.map((representante) => (
          <article className="representantes-admin-card" key={representante.id}>
            <h3 className="representantes-admin-nombre">{representante.nombre_completo || `${representante.nombre} ${representante.apellido}`.trim()}</h3>
            <dl>
              <div><dt>Cédula / DNI</dt><dd className="representantes-admin-cedula">{representante.cedula || '—'}</dd></div>
              <div><dt>Teléfono</dt><dd>{representante.tlf || '—'}</dd></div>
              <div>
                <dt>Atleta(s) a cargo</dt>
                <dd>
                  {representante.atletas?.length
                    ? representante.atletas.map((atleta) => atleta.nombre).join(', ')
                    : '—'}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </div>
    </div>
  );
};

export default RepresentantesViewAdmin;
