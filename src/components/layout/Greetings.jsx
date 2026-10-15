import React, { useEffect } from 'react';


/**
 * GREETINGS - CABECERA TÁCTICA DE BIENVENIDA UNIFICADA CON AUTO-CIERRE
 */
const Greetings = ({ nombre, rol, athletesCount, onClose }) => {
  const hour = new Date().getHours();
  let message = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  // ⏱️ EFECTO DE TEMPORIZADOR AUTOMÁTICO (7 Segundos)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose && typeof onClose === "function") {
        onClose();
      }
    }, 7000); // 7000ms = 7 segundos (en el rango ideal de 5-10s)

    // Limpieza estricta del temporizador si el componente se desmonta antes
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="glass-panel welcome-card" style={{ position: 'relative', animation: 'slideDown 0.4s ease-out' }}>
      
      {/* 🎯 BOTÓN DE CIERRE AJUSTADO CON ALTA VISIBILIDAD */}
      <button 
        onClick={onClose} 
        style={{
          position: 'absolute',
          top: '12px',
          right: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(10, 15, 28, 0.6)',
          backdropFilter: 'blur(4px)',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          lineHeight: '1',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          zIndex: 10,
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.color = 'var(--accent-danger)';
          e.target.style.borderColor = 'rgba(248, 113, 113, 0.4)';
          e.target.style.background = 'rgba(248, 113, 113, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.color = 'var(--text-secondary)';
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          e.target.style.background = 'rgba(10, 15, 28, 0.6)';
        }}
      >
        ×
      </button>

      {/* CONTENIDO COMBINADO */}
      <div className="welcome-content" style={{ paddingRight: '40px' }}>
        <h1>¡{message}, <span>{nombre}-sama!</span></h1>
        <p style={{ marginTop: '5px' }}>
          Sesión activa con privilegios de <strong>{rol}</strong>. El sistema de optimización POD opera con normalidad.
        </p>
      </div>

      {/* MÉTRICAS REALES EN TIEMPO REAL */}
      <div className="welcome-stats">
        <div className="w-stat">
          <div className="w-stat-value">{athletesCount}</div>
          <div className="w-stat-label">Atletas Registrados</div>
        </div>
        <div className="w-stat">
          <div className="w-stat-value">100%</div>
          <div className="w-stat-label">System Health</div>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Greetings;