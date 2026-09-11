import React from 'react';

export const AlertDetailsModal = ({ alert, onClose }) => {
  if (!alert) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* stopPropagation evita que el evento de clic dentro del modal lo cierre */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div className="title-container">
            <span className="modal-icon">{alert.icon}</span>
            <h3>{alert.title}</h3>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Cerrar modal">
            &times;
          </button>
        </header>

        <div className="modal-body">
          <p className="modal-description">{alert.description}</p>
          
          <h4 className="list-title">Atletas Afectados:</h4>
          
          <ul className="athletes-list">
            {alert.affectedAthletes && alert.affectedAthletes.length > 0 ? (
              alert.affectedAthletes.map((athlete) => (
                <li key={athlete.id} className="athlete-item">
                  <div className="athlete-info">
                    <strong>{athlete.name}</strong>
                    {athlete.group && (
                      <span className="athlete-group">{athlete.group}</span>
                    )}
                  </div>
                  <span className="athlete-detail">{athlete.detail}</span>
                </li>
              ))
            ) : (
              <li className="no-athletes">No hay detalle de atletas registrados.</li>
            )}
          </ul>
        </div>

        <footer className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AlertDetailsModal;