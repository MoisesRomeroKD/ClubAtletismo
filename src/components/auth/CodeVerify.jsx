import React, { useState, useEffect } from 'react';

export default function CodeVerify({ email, setStatus, setErrorMsg, onValidated }) {
  const [codigo, setCodigo] = useState('');
  const [timeLeft, setTimeLeft] = useState(900);
  const [isProcessing, setIsProcessing] = useState(false);

  const codigoCorrecto = "301126"; 

  // --- VALIDACIÓN (Aseguramos que esté declarada antes del return) ---
  const esAlfanumerico = /^[a-zA-Z0-9]*$/.test(codigo);
  const isValido = codigo.length === 6 && esAlfanumerico;

  useEffect(() => {
    if (timeLeft <= 0) {
      setStatus('error');
      setErrorMsg('El código ha expirado. Por favor, solicita uno nuevo.');
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, setStatus, setErrorMsg]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!isValido || isProcessing || timeLeft <= 0) return;

    setIsProcessing(true);
    setStatus('loading');
    setErrorMsg('');

    try {
        // Petición real al servidor
        const response = await podApi.post('/v1/auth/validar-codigo/', {
            email: email,
            codigo: codigo
        });

        if (response.status === 200) {
            setStatus('idle');
            onValidated(); // Avanza al paso 3: PasswordCreate
        }
    } catch (err) {
        setIsProcessing(false);
        setStatus('error');
        // El backend debería retornar si el código expiró o es inválido
        setErrorMsg(err.response?.data?.error || 'El código introducido no es válido.');
    } finally {
        setIsProcessing(false);
    }
};

  const handleChange = (e) => {
    const val = e.target.value;
    // Solo permitimos escribir si son alfanuméricos y máximo 6
    if (/^[a-zA-Z0-9]*$/.test(val) && val.length <= 6) {
      setCodigo(val.toUpperCase());
    }
  };

  const formatTime = () => {
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', width: '100%' }}>
      <p style={{ fontSize: '12px', color: '#555', textAlign: 'center' }}>
        Se ha enviado un código a: <br/> <strong>{email}</strong>
      </p>

      <div style={{ fontSize: '18px', fontWeight: 'bold', color: timeLeft < 60 ? 'red' : '#333' }}>
        ⏱️ {formatTime()}
      </div>
      
      <input 
        type="text" 
        placeholder="CÓDIGO" 
        value={codigo}
        onChange={handleChange}
        disabled={timeLeft <= 0 || isProcessing}
        autoFocus
        style={{ 
          width: '80%', 
          padding: '12px', 
          borderRadius: '4px', 
          border: isValido ? '2px solid #28a745' : '1px solid #ccc', 
          textAlign: 'center',
          fontSize: '20px',
          letterSpacing: '5px'
        }}
      />

      <button 
        type="submit"
        disabled={!isValido || isProcessing || timeLeft <= 0}
        style={{ 
          backgroundColor: (!isValido || isProcessing || timeLeft <= 0) ? '#cccccc' : '#0000FF', 
          color: 'white', 
          padding: '12px 40px', 
          borderRadius: '25px', 
          border: 'none', 
          fontWeight: 'bold', 
          cursor: (!isValido || isProcessing) ? 'not-allowed' : 'pointer'
        }}
      >
        Verificar Código
      </button>
    </form>
  );
}