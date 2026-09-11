import React, { useState, useEffect } from 'react';

const ConnectivityBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null; // Si hay internet, el componente es invisible

  return (
    <div style={bannerStyle}>
      <div style={contentStyle}>
        <span style={{ fontSize: '20px' }}>📡</span>
        <div>
          <strong style={{ display: 'block' }}>Conexión interrumpida</strong>
          <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.9 }}>
            No se preocupe, puede seguir trabajando normalmente. 
            Sus datos se guardarán en el equipo y se enviarán al sistema automáticamente cuando vuelva la señal. 
            <strong> Por favor, no recargue la página.</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

// Estilos elegantes y llamativos pero no alarmistas
const bannerStyle = {
  position: 'fixed',
  top: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: '#f39c12', // Naranja preventivo
  color: 'white',
  padding: '15px 25px',
  borderRadius: '10px',
  boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
  zIndex: 9999,
  width: '90%',
  maxWidth: '500px',
  animation: 'slideDown 0.4s ease-out'
};

const contentStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '15px'
};

export default ConnectivityBanner;