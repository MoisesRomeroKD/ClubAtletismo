import React, { useState } from 'react';
import { useAtletas } from '../../hook/useAtletas'; 
import PasswordToggleButton from './PasswordToggleButton';

export default function PasswordCreate({ onFinish, setStatus, setErrorMsg, userEmail, cedula }) {
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const { registrarAtleta, isLoading } = useAtletas();

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // 1. Validación de coincidencia en cliente
    if (pass !== confirmPass) {
      setStatus('error');
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    // 2. Ejecución del registro unificado en el Backend
    setStatus('loading');
    const resultado = await registrarAtleta({
      email: userEmail,
      password: pass,
      cedula: cedula, 
    });

    if (resultado.ok) {
      setStatus('idle');
      onFinish(); // Navegación final al éxito (Dashboard / Login)
    } else {
      setStatus('error');
      setErrorMsg(resultado.mensaje || 'Error al crear la cuenta.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', width: '100%' }}>
      <h3>Crea tu contraseña</h3>
      <p style={{ fontSize: '12px', color: '#666' }}>Mínimo 12 caracteres, incluya números y una mayúscula.</p>
      
      <div className="password-input-wrapper" style={{ width: '90%' }}>
        <input 
          type={showPass ? 'text' : 'password'} 
          placeholder="Nueva Contraseña" 
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          disabled={isLoading}
          className="password-input-with-toggle"
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <PasswordToggleButton
          isVisible={showPass}
          onToggle={() => setShowPass((visible) => !visible)}
        />
      </div>
      <div className="password-input-wrapper" style={{ width: '90%' }}>
        <input 
          type={showConfirmPass ? 'text' : 'password'} 
          placeholder="Confirmar Contraseña" 
          value={confirmPass}
          onChange={(e) => setConfirmPass(e.target.value)}
          disabled={isLoading}
          className="password-input-with-toggle"
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <PasswordToggleButton
          isVisible={showConfirmPass}
          onToggle={() => setShowConfirmPass((visible) => !visible)}
        />
      </div>
      
      <button 
        onClick={handleSave}
        disabled={isLoading || !pass}
        style={{ 
          backgroundColor: isLoading ? '#cccccc' : '#0000FF', 
          color: 'white', 
          padding: '12px 40px', 
          borderRadius: '25px', 
          border: 'none', 
          fontWeight: 'bold', 
          cursor: isLoading ? 'not-allowed' : 'pointer' 
        }}
      >
        {isLoading ? 'Guardando...' : 'Finalizar Registro'}
      </button>
    </div>
  );
}