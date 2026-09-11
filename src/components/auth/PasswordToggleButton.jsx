import React from 'react';
import '../../styles/components/PasswordToggleButton.css';

export default function PasswordToggleButton({ isVisible, onToggle }) {
  return (
    <button
      type="button"
      className="password-toggle-button"
      onClick={onToggle}
      aria-label={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      title={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
    >
      {isVisible ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 2l20 20" />
          <path d="M6.71 6.71C4.24 8.28 2.68 10.43 2 12c1.73 4 5.67 7 10 7 1.55 0 3.03-.37 4.33-1.02" />
          <path d="M9.88 9.88A3 3 0 0 0 14.12 14.12" />
          <path d="M9.9 4.24A10.8 10.8 0 0 1 12 4c4.33 0 8.27 3 10 8-.46 1.06-1.1 2.08-1.88 3" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}
