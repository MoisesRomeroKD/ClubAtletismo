import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import './NotificationOverlay.css';

const NotificationOverlay = ({ 
  message = "Actualizando sistema...", 
  durationInSeconds = 5, 
  onTimeout 
}) => {
  const [timeLeft, setTimeLeft] = useState(durationInSeconds);

  useEffect(() => {
  if (timeLeft <= 0) {
    if (onTimeout) {
      onTimeout(); // ⚡ Aquí se dispara la orden de destrucción
    }
    return;
  }

  const timer = setTimeout(() => {
    setTimeLeft(prev => prev - 1);
  }, 1000);

  return () => clearTimeout(timer);
}, [timeLeft, onTimeout]);

  return (
    <div className="notification-overlay-backdrop">
      <div className="glass-panel notification-overlay-card">
        <div className="notification-icon-wrapper">
          <ShieldAlert size={32} className="text-accent" />
        </div>
        <div className="notification-content">
          <p className="notification-message">{message}</p>
          <div className="notification-timer-wrapper">
            <span>Redireccionando en </span>
            <strong className="notification-countdown">{timeLeft}s</strong>
          </div>
        </div>
        {/* Barra de progreso visual estática o animada según el tiempo */}
        <div className="notification-progress-bar">
          <div 
            className="notification-progress-fill" 
            style={{ width: `${(timeLeft / durationInSeconds) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default NotificationOverlay;