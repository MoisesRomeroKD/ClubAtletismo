import React from 'react';

const PrerregistrosPendientes = () => {
  return (
    <section className="preregistro-card">

      <div className="preregistro-card-header">
        <h2>Prerregistros Pendientes</h2>

        <p>
          Usuarios registrados pendientes de revisión.
        </p>
      </div>

      <div className="preregistro-table-wrapper">

        <table className="preregistro-table">

          <thead>
            <tr>
              <th>Identificación</th>
              <th>Nombre Completo</th>
              <th>Rol Solicitado</th>
              <th>Fecha</th>
              <th>Acción</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td
                colSpan="5"
                className="preregistro-empty"
              >
                No hay prerregistros pendientes.
              </td>
            </tr>
          </tbody>

        </table>

      </div>

    </section>
  );
};

export default PrerregistrosPendientes;