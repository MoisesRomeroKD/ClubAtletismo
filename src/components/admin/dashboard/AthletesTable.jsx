import React from 'react';

export const AthletesTable = ({ athletes = [] }) => {
  return (
    <section className="card table-card">
      <div className="card-header">
        <h3>Atletas Destacados / Monitoreo</h3>
        <a href="#atletas" className="link-action">Ver todos →</a>
      </div>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Atleta</th>
              <th>Disciplina</th>
              <th>Índice IGR</th>
              <th>Fatiga (ACWR)</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {athletes.map((athlete) => (
              <tr key={athlete.id}>
                <td>
                  <div className="athlete-cell">
                    <div className="athlete-avatar">{athlete.name.charAt(0)}</div>
                    <span className="athlete-name">{athlete.name}</span>
                  </div>
                </td>
                <td>{athlete.sport}</td>
                <td><strong>{athlete.igr}</strong></td>
                <td>{athlete.fatigue}</td>
                <td>
                  <span className={`status-pill ${athlete.statusClass}`}>
                    {athlete.status}
                  </span>
                </td>
                <td>
                  <button className="btn-icon" aria-label="Ver ficha del atleta">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AthletesTable;