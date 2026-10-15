import React from 'react';

const VerificationFeedback = ({ status, errorMessage }) => {
  if (status === 'idle') return null;

  return (
    <div className="feedback-container">
      {status === 'loading' && (
        <div id="right-veri" className="veri bg-green">
          <p className="text">Verificando...</p>
        </div>
      )}

      {status === 'error' && (
        <div id="wrong-veri" className="veri bg-red">
          <p className="text">{errorMessage || "Ocurrió un error inesperado"}</p>
        </div>
      )}
    </div>
  );
};

export default VerificationFeedback;