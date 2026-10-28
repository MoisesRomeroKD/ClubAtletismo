import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../api/services/authService';
import PasswordToggleButton from '../components/auth/PasswordToggleButton';
import '../styles/pages/Register.css';

/*
 * OLVIDÉ MI CONTRASEÑA (desde el login)
 * Mismos 3 pasos y mismo diseño que el registro:
 *   1. Correo o cédula → se envía un código al correo de la cuenta.
 *   2. Código de verificación (OTP).
 *   3. Contraseña nueva. Al guardarla también se desbloquea la cuenta.
 */

const doorVariantsLeft = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
  exit: { x: '-100%', opacity: 0, transition: { duration: 0.45, ease: [0.7, 0, 0.84, 0] } },
};

const doorVariantsRight = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.45, ease: [0.7, 0, 0.84, 0] } },
};

// Cédula: de 1.000.000 a 49.999.999. Correo: con @ y dominio.
const CEDULA_REGEX = /^(?:[1-9]\d{6}|[1-4]\d{7})$/;
const CORREO_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
// Código: 6 letras o números.
const OTP_REGEX = /^[A-Za-z0-9]{6}$/;

const QUOTES = [
  { text: 'El secreto es nunca rendirse, es seguir luchando por lo que quieres, por tus sueños.', author: 'Yulimar Rojas' },
  { text: 'No pienso en los límites. No me pongo límites.', author: 'Usain Bolt' },
  { text: 'No human is limited.', author: 'Eliud Kipchoge' },
  { text: 'Cada milésima de segundo en la pista se gana en las horas de silencio del gimnasio.', author: 'C.E.T.D. "Caracas"' },
];

const columna = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };

export default function RecuperarPassword() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [identificador, setIdentificador] = useState('');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notificacion, setNotificacion] = useState('');
  const [currentQuote, setCurrentQuote] = useState(0);
  const temporizadorAviso = useRef(null);

  const identificadorLimpio = identificador.trim();
  const esIdentificadorValido = CEDULA_REGEX.test(identificadorLimpio) || CORREO_REGEX.test(identificadorLimpio);
  const esCodigoValido = OTP_REGEX.test(codigo);

  useEffect(() => {
    const intervalo = setInterval(() => setCurrentQuote((prev) => (prev + 1) % QUOTES.length), 6000);
    return () => {
      clearInterval(intervalo);
      clearTimeout(temporizadorAviso.current);
    };
  }, []);

  const avisar = (mensaje) => {
    setNotificacion(mensaje);
    clearTimeout(temporizadorAviso.current);
    temporizadorAviso.current = setTimeout(() => setNotificacion(''), 4500);
  };

  const errorDe = (error, porDefecto) => error.response?.data?.message || porDefecto;

  // Si escribe solo números se trata como cédula (máximo 8); si no, como correo (sin espacios).
  const cambiarIdentificador = (valor) => {
    const sinEspacios = valor.replace(/\s/g, '');
    setIdentificador(/^[0-9]*$/.test(sinEspacios) ? sinEspacios.slice(0, 8) : sinEspacios);
  };

  const cambiarCodigo = (valor) => setCodigo(valor.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase());

  // PASO 1: pedir el código
  const solicitarCodigo = async () => {
    if (!esIdentificadorValido) {
      avisar('⚠️ Escribe tu correo o tu cédula (un número entre 1.000.000 y 49.999.999).');
      return;
    }
    try {
      setIsLoading(true);
      const respuesta = await authService.solicitarRecuperacion(identificadorLimpio);
      avisar(respuesta.message || 'Si los datos son correctos, enviamos un código a tu correo.');
      setCodigo('');
      setPaso(2);
    } catch (error) {
      avisar(`⚠️ ${errorDe(error, 'No se pudo conectar con el servidor.')}`);
    } finally {
      setIsLoading(false);
    }
  };

  // PASO 2: verificar el código (no lo gasta)
  const verificarCodigo = async () => {
    if (!esCodigoValido) {
      avisar('⚠️ El código tiene 6 letras o números.');
      return;
    }
    try {
      setIsLoading(true);
      await authService.verificarRecuperacion(identificadorLimpio, codigo);
      avisar('✅ Código verificado. Ahora crea tu contraseña nueva.');
      setPaso(3);
    } catch (error) {
      avisar(`⚠️ ${errorDe(error, 'El código es inválido o venció.')}`);
    } finally {
      setIsLoading(false);
    }
  };

  // PASO 3: contraseña nueva (gasta el código y desbloquea la cuenta)
  const guardarPassword = async (event) => {
    event.preventDefault();
    if (paso !== 3) return;
    if (!password || !confirmPassword) {
      avisar('⚠️ Completa los dos campos de contraseña.');
      return;
    }
    if (password !== confirmPassword) {
      avisar('⚠️ Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 8) {
      avisar('⚠️ La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    try {
      setIsLoading(true);
      const respuesta = await authService.confirmarRecuperacion({ identificador: identificadorLimpio, codigo, password, confirmPassword });
      avisar(respuesta.message || 'Tu contraseña se cambió. Ya puedes iniciar sesión.');
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (error) {
      avisar(`⚠️ ${errorDe(error, 'No se pudo cambiar la contraseña.')}`);
      setIsLoading(false);
    }
  };

  const reenviarCodigo = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      setCodigo('');
      const respuesta = await authService.solicitarRecuperacion(identificadorLimpio);
      avisar(respuesta.message || 'Si los datos son correctos, enviamos un código nuevo.');
    } catch (error) {
      avisar(`⚠️ ${errorDe(error, 'No se pudo reenviar el código.')}`);
    } finally {
      setIsLoading(false);
    }
  };

  const estiloBoton = (habilitado, flex) => ({
    ...(flex ? { flex } : { marginTop: '1.5rem' }),
    opacity: habilitado ? 1 : 0.5,
    cursor: habilitado ? 'pointer' : 'not-allowed',
  });

  return (
    <div className="auth-fullscreen-container">
      <motion.div className="auth-hype-column" variants={doorVariantsLeft} initial="initial" animate="animate" exit="exit">
        <div className="hype-quote-box">
          <p className="hype-quote">"{QUOTES[currentQuote].text}"</p>
          <p className="hype-author">// {QUOTES[currentQuote].author}</p>
        </div>
        <div className="hype-footer">
          <div className="hype-inst">C.E.T.D. &quot;CARACAS&quot;</div>
        </div>
      </motion.div>

      <motion.div className="auth-form-column" variants={doorVariantsRight} initial="initial" animate="animate" exit="exit">
        <div className="form-card-wrapper">
          <div className="auth-switcher">
            <span className="switch-tab active">RECUPERAR CONTRASEÑA</span>
          </div>

          <form onSubmit={guardarPassword} style={columna}>
            {/* PASO 1 */}
            {paso === 1 && (
              <div style={columna}>
                <div className="register-step-indicator">PASO 1 DE 3 // IDENTIFICA TU CUENTA</div>
                <div className="auth-form-group">
                  <label className="auth-form-label" htmlFor="recuperar-identificador">Correo o cédula</label>
                  <input
                    id="recuperar-identificador"
                    type="text"
                    autoComplete="username"
                    value={identificador}
                    onChange={(event) => cambiarIdentificador(event.target.value)}
                    onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); solicitarCodigo(); } }}
                    className="auth-input-line"
                    placeholder="nombre@gmail.com o 12345678"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="button"
                  onClick={solicitarCodigo}
                  disabled={!esIdentificadorValido || isLoading}
                  className="auth-btn-skew"
                  style={estiloBoton(esIdentificadorValido && !isLoading)}
                >
                  <span className="auth-btn-text">{isLoading ? 'ENVIANDO...' : 'ENVIAR CÓDIGO ➔'}</span>
                </button>
              </div>
            )}

            {/* PASO 2 */}
            {paso === 2 && (
              <div style={columna}>
                <div className="register-step-indicator">PASO 2 DE 3 // VERIFICACIÓN DE SEGURIDAD (OTP)</div>
                <p className="auth-form-label" style={{ textTransform: 'none', color: 'var(--clr-gris-base)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                  Si los datos corresponden a una cuenta, enviamos un código a su correo (revisa también el spam).
                  El código vence en 10 minutos y tiene 5 intentos.
                </p>
                <div className="auth-form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="auth-form-label" htmlFor="recuperar-codigo">Código de verificación (OTP)</label>
                  <input
                    id="recuperar-codigo"
                    type="text"
                    maxLength={6}
                    autoComplete="one-time-code"
                    value={codigo}
                    onChange={(event) => cambiarCodigo(event.target.value)}
                    className="auth-input-line"
                    style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
                    placeholder="ABC123"
                    disabled={isLoading}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                  <button
                    type="button"
                    onClick={reenviarCodigo}
                    disabled={isLoading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--auth-secondary, #ff3b30)',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      textDecoration: 'underline',
                      opacity: isLoading ? 0.5 : 1,
                    }}
                  >
                    ¿No recibiste el código? Reenviar
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" onClick={() => setPaso(1)} disabled={isLoading} className="auth-btn-skew auth-btn-secondary" style={estiloBoton(!isLoading, 1)}>
                    <span className="auth-btn-text">ATRÁS</span>
                  </button>
                  <button type="button" onClick={verificarCodigo} disabled={!esCodigoValido || isLoading} className="auth-btn-skew" style={estiloBoton(esCodigoValido && !isLoading, 1.5)}>
                    <span className="auth-btn-text">{isLoading ? 'VERIFICANDO...' : 'VERIFICAR CÓDIGO ➔'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3 */}
            {paso === 3 && (
              <div style={columna}>
                <div className="register-step-indicator">PASO 3 DE 3 // CONTRASEÑA NUEVA</div>
                <div className="auth-form-group">
                  <label className="auth-form-label" htmlFor="recuperar-password">Contraseña nueva</label>
                  <div className="password-input-wrapper">
                    <input
                      id="recuperar-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="auth-input-line password-input-with-toggle"
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                      disabled={isLoading}
                    />
                    <PasswordToggleButton isVisible={showPassword} onToggle={() => setShowPassword((visible) => !visible)} />
                  </div>
                </div>
                <div className="auth-form-group" style={{ marginBottom: '2rem' }}>
                  <label className="auth-form-label" htmlFor="recuperar-confirmar">Confirmar contraseña</label>
                  <div className="password-input-wrapper">
                    <input
                      id="recuperar-confirmar"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="auth-input-line password-input-with-toggle"
                      placeholder="Repita la contraseña"
                      autoComplete="new-password"
                      disabled={isLoading}
                    />
                    <PasswordToggleButton isVisible={showConfirmPassword} onToggle={() => setShowConfirmPassword((visible) => !visible)} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" onClick={() => setPaso(2)} disabled={isLoading} className="auth-btn-skew auth-btn-secondary" style={estiloBoton(!isLoading, 1)}>
                    <span className="auth-btn-text">ATRÁS</span>
                  </button>
                  <button type="submit" disabled={isLoading} className="auth-btn-skew" style={estiloBoton(!isLoading, 1.5)}>
                    <span className="auth-btn-text">{isLoading ? 'GUARDANDO...' : 'CAMBIAR CONTRASEÑA'}</span>
                  </button>
                </div>
              </div>
            )}
          </form>

          <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
            <Link to="/login" style={{ color: 'var(--auth-slate)' }}>← Volver a iniciar sesión</Link>
          </p>
        </div>
      </motion.div>

      {notificacion && (
        <div className="hud-toast" role="status">
          <span className="material-symbols-outlined" style={{ color: 'var(--auth-secondary, #ff3b30)' }}>info</span>
          <span>{notificacion}</span>
        </div>
      )}
    </div>
  );
}
