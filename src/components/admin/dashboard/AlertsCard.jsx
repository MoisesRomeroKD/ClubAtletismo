import React, { useState } from 'react';
import { AlertDetailsModal } from './AlertDetailsModal';
import '../../../styles/components/admin/dashboard/AlertsCard.css';

export const AlertsCard = ({ alerts = [] }) => {
  const [selectedAlert, setSelectedAlert] = useState(null);

  return (
    <div className="alerts-card-container">
      <div className="alerts-header">
        <h3>Alertas Críticas</h3>
        <span className="alerts-badge">{alerts?.length || 0} Pendientes</span>
      </div>

      <div className="alerts-list">
        {alerts && alerts.length > 0 ? (
          alerts.map((alert) => (
            <div key={alert.id || Math.random()} className={`alert-item alert-${alert.type || 'info'}`}>
              <div className="alert-content">
                <span className="alert-icon">{alert.icon || '⚠️'}</span>
                <div className="alert-info">
                  <h4>{alert.title || 'Sin Título'}</h4>
                  <p>{alert.description || ''}</p>
                </div>
              </div>
              
              <button 
                type="button"
                className="btn-alert-details"
                onClick={() => setSelectedAlert(alert)}
              >
                Ver Afectados
              </button>
            </div>
          ))
        ) : (
          <p className="no-alerts">No hay alertas registradas actualmente.</p>
        )}
      </div>

      {/* Renderizado condicional seguro del Modal */}
      {selectedAlert && (
        <AlertDetailsModal 
          alert={selectedAlert} 
          onClose={() => setSelectedAlert(null)} 
        />
      )}
    </div>
  );
};

export default AlertsCard;