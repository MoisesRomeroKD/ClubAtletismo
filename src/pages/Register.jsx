import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { authService } from '../api/services/authService'; // Importación del servicio
import PasswordToggleButton from '../components/auth/PasswordToggleButton';
import '../styles/pages/Register.css';

// ==========================================================================
// VARIANTES PARA EL EFECTO DOBLE PUERTA
// ==========================================================================

const doorVariantsLeft = {
  initial: { x: '-100%', opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: {
      duration: 0.45,
      ease: [0.7, 0, 0.84, 0]
    }
  }
};

const doorVariantsRight = {
  initial: { x: '100%', opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: 0.45,
      ease: [0.7, 0, 0.84, 0]
    }
  }
};

// ==========================================================================
// REGLAS DE VALIDACIÓN
// ==========================================================================

// Cédula: únicamente números, entre 7 y 8 dígitos.
const CEDULA_REGEX = /^[0-9]{7,8}$/;

// OTP: exactamente 6 caracteres alfanuméricos.
const OTP_REGEX = /^[A-Za-z0-9]{6}$/;

// ==========================================================================
// LOCAL STORAGE
// ==========================================================================

const REGISTER_STORAGE_KEY = 'elite_track_register_state';
const REGISTER_ATTEMPTS_KEY = 'elite_track_register_attempts';

export default function Register() {
  const [registerStep, setRegisterStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false); // Estado de carga para la API
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");

  const [currentQuote, setCurrentQuote] = useState(0);

  // Código OTP ingresado
  const [enteredOtp, setEnteredOtp] = useState("");

  // Datos del formulario
  const [registerData, setRegisterData] = useState({
    cedula: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  // ==========================================================================
  // FRASES MOTIVACIONALES
  // ==========================================================================

  const quotes = [
    {
      text: "El secreto es nunca rendirse, es seguir luchando por lo que quieres, por tus sueños. Los sueños se hacen realidad, pero tienes que trabajar duro para conseguirlos.",
      author: "Yulimar Rojas"
    },
    {
      text: "La fe y la preparación no conocen límites fronterizos.",
      author: "Asnoldo Devonish"
    },
    {
      text: "Cada salto es un desafío personal; la garrocha no solo se trata de altura, se trata de confiar en tu preparación mental antes de despegar.",
      author: "Robeilys Peinado"
    },
    {
      text: "No pienso en los límites. No me pongo límites. Siempre trato de trabajar duro, creer en mí mismo y esforzarme al máximo.",
      author: "Usain Bolt"
    },
    {
      text: "Todos tenemos sueños. Pero para hacerlos realidad, se necesita una determinación increíble, dedicación, autodisciplina y esfuerzo.",
      author: "Jesse Owens"
    },
    {
      text: "No human is limited.",
      author: "Eliud Kipchoge"
    },
    {
      text: "Nunca subestimes el poder de los sueños y la influencia del espíritu humano. Todos tenemos el mismo potencial: el poder de hacer realidad nuestros sueños.",
      author: "Wilma Rudolph"
    },
    {
      text: "La vida es un juego. Si quieres ganar, tienes que jugar con el corazón.",
      author: "Carl Lewis"
    },
    {
      text: "Cada milésima de segundo en la pista se gana en las horas de silencio del gimnasio.",
      author: "U.E.T.D. Liceo Caracas"
    }
  ];

  // ==========================================================================
  // VALIDACIONES DE FORMATO
  // ==========================================================================

  const isCedulaValid = CEDULA_REGEX.test(registerData.cedula);
  const isOtpValid = OTP_REGEX.test(enteredOtp);

  // ==========================================================================
  // RESTAURAR PROGRESO DEL REGISTRO
  // ==========================================================================

  useEffect(() => {
    try {
      const savedRegister = localStorage.getItem(REGISTER_STORAGE_KEY);
      if (!savedRegister) return;

      const parsedRegister = JSON.parse(savedRegister);

      if (parsedRegister && typeof parsedRegister === 'object') {
        const savedStep = Number(parsedRegister.registerStep);

        if ([1, 2, 3].includes(savedStep)) {
          setRegisterStep(savedStep);
        }

        setRegisterData(prev => ({
          ...prev,
          cedula: typeof parsedRegister.cedula === 'string' ? parsedRegister.cedula : '',
          username: typeof parsedRegister.username === 'string' ? parsedRegister.username : ''
        }));
      }
    } catch (error) {
      console.error("No se pudo restaurar el progreso del registro:", error);
      localStorage.removeItem(REGISTER_STORAGE_KEY);
    }
  }, []);

  // ==========================================================================
  // GUARDAR PROGRESO DEL REGISTRO
  // ==========================================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        REGISTER_STORAGE_KEY,
        JSON.stringify({
          registerStep,
          cedula: registerData.cedula,
          username: registerData.username
        })
      );
    } catch (error) {
      console.error("No se pudo guardar el progreso del registro:", error);
    }
  }, [registerStep, registerData.cedula, registerData.username]);

  // ==========================================================================
  // CAMBIO DE FRASES
  // ==========================================================================

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote(prev => (prev + 1) % quotes.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [quotes.length]);

  // ==========================================================================
  // NOTIFICACIONES
  // ==========================================================================

  const triggerNotification = (msg) => {
    setNotificationMsg(msg);
    setShowNotification(true);

    setTimeout(() => {
      setShowNotification(false);
    }, 4000);
  };

  // ==========================================================================
  // OBTENER INTENTOS DE VALIDACIÓN
  // ==========================================================================

  const getValidationAttempts = () => {
    try {
      const attempts = Number(localStorage.getItem(REGISTER_ATTEMPTS_KEY) || '0');
      return Number.isFinite(attempts) && attempts >= 0 ? attempts : 0;
    } catch (error) {
      return 0;
    }
  };

  // ==========================================================================
  // CAMBIOS DEL FORMULARIO
  // ==========================================================================

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;

    if (name === 'cedula') {
      const numericValue = value.replace(/[^0-9]/g, '');

      if (numericValue.length > 8) {
        try {
          const currentAttempts = getValidationAttempts();
          localStorage.setItem(REGISTER_ATTEMPTS_KEY, String(currentAttempts + 1));
        } catch (error) {
          console.error("No se pudo registrar el intento:", error);
        }
        triggerNotification("⚠️ La cédula no puede superar los 8 dígitos.");
      }

      const limitedValue = numericValue.slice(0, 8);
      setRegisterData(prev => ({ ...prev, cedula: limitedValue }));
      return;
    }

    setRegisterData(prev => ({ ...prev, [name]: value }));
  };

  const handleOtpChange = (e) => {
    const value = e.target.value;
    const alphanumericValue = value.replace(/[^A-Za-z0-9]/g, '');
    const limitedValue = alphanumericValue.slice(0, 6);
    setEnteredOtp(limitedValue);
  };

  // ==========================================================================
  // PASO 1: VALIDACIÓN DE CÉDULA CON EL BACKEND
  // ==========================================================================

  const handleValidateCedula = async () => {
    const { cedula } = registerData;

    if (!cedula || !isCedulaValid) {
      triggerNotification("⚠️ Ingrese una cédula válida.");
      return;
    }

    const attempts = getValidationAttempts();
    if (attempts >= 3) {
      triggerNotification("🚫 Se alcanzó el límite de intentos de validación.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await authService.requestOtp(cedula);
      
      triggerNotification(response.message || "🔑 Código OTP enviado con éxito.");
      setRegisterStep(2);
      
    } catch (error) {
      localStorage.setItem(REGISTER_ATTEMPTS_KEY, String(attempts + 1));
      
      const errorMsg = error.response?.data?.message || "Error al conectar con el servidor.";
      triggerNotification(`⚠️ ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================================
  // PASO 2: VALIDACIÓN DEL OTP CON EL BACKEND
  // ==========================================================================

  const handleVerifyOtp = async () => {
    if (!enteredOtp || !isOtpValid) {
      triggerNotification("⚠️ Código OTP inválido.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await authService.verifyOtp(registerData.cedula, enteredOtp);
      
      triggerNotification(response.message || "✅ Verificación exitosa.");
      setRegisterStep(3);
      
    } catch (error) {
      const errorMsg = error.response?.data?.message || "El código OTP es inválido o expiró.";
      triggerNotification(`⚠️ ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================================
  // PASO 3: REGISTRO FINAL EN LA BASE DE DATOS
  // ==========================================================================

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (registerStep !== 3) return;

    if (!registerData.username.trim() || registerData.username.trim().length < 3) {
      triggerNotification("⚠️ El nombre de usuario debe tener al menos 3 caracteres.");
      return;
    }

    if (!registerData.password || !registerData.confirmPassword) {
      triggerNotification("⚠️ Por favor complete ambos campos de contraseña.");
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      triggerNotification("⚠️ Las contraseñas no coinciden.");
      return;
    }

    if (registerData.password.length < 8) {
      triggerNotification("⚠️ La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        cedula: registerData.cedula,
        codigo: enteredOtp,
        username: registerData.username,
        password: registerData.password,
        confirm_password: registerData.confirmPassword
      };

      const response = await authService.completeRegistration(payload);
      
      triggerNotification(response.message || "🏆 ¡Inscripción exitosa! Registro completado.");
      
      localStorage.removeItem(REGISTER_STORAGE_KEY);
      localStorage.removeItem(REGISTER_ATTEMPTS_KEY);

    } catch (error) {
      const errorMsg = error.response?.data?.message || "Error al completar el registro.";
      triggerNotification(`⚠️ ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================================
  // REENVIAR OTP
  // ==========================================================================

  const handleResendOtp = () => {
    if(isLoading) return;
    triggerNotification("🔄 Reenviando código OTP...");
    // Aquí puedes enlazar otra llamada a authService.requestOtp(registerData.cedula) si lo deseas
  };

  // ==========================================================================
  // CAMBIO DE PASO CONTROLADO
  // ==========================================================================

  const goToStep = (step) => {
    if (![1, 2, 3].includes(step)) return;
    setRegisterStep(step);
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="auth-fullscreen-container">

      {/* ======================================================================
          PUERTA IZQUIERDA: PISTA INMERSIVA
      ====================================================================== */}

      <motion.div
        className="auth-hype-column"
        variants={doorVariantsLeft}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="hype-quote-box">
          <p className="hype-quote">
            "{quotes[currentQuote].text}"
          </p>

          <p className="hype-author">
            // {quotes[currentQuote].author}
          </p>
        </div>

        <div className="hype-footer">
          <div className="hype-inst">
            U.E.T.D. LICEO CARACAS
          </div>
        </div>
      </motion.div>

      {/* ======================================================================
          PUERTA DERECHA: REGISTRO DINÁMICO
      ====================================================================== */}

      <motion.div
        className="auth-form-column"
        variants={doorVariantsRight}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="form-card-wrapper">

          <div className="auth-switcher">
            <span className="switch-tab active">
              REGISTRARSE
            </span>
          </div>

          <form
            onSubmit={handleRegisterSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >

            {/* ==================================================================
                PASO 1
            ================================================================== */}

            {registerStep === 1 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div className="register-step-indicator">
                  PASO 1 DE 3 // IDENTIFICACIÓN INSTITUCIONAL
                </div>

                <div className="auth-form-group">
                  <label className="auth-form-label">
                    Cédula de Identidad
                  </label>

                  <input
                    type="text"
                    name="cedula"
                    required
                    inputMode="numeric"
                    pattern="[0-9]{7,8}"
                    maxLength={8}
                    value={registerData.cedula}
                    onChange={handleRegisterChange}
                    className="auth-input-line"
                    placeholder="Ingrese su número de cédula"
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleValidateCedula}
                  disabled={!isCedulaValid || isLoading}
                  className="auth-btn-skew"
                  style={{
                    marginTop: '1.5rem',
                    opacity: isCedulaValid && !isLoading ? 1 : 0.5,
                    cursor: isCedulaValid && !isLoading ? 'pointer' : 'not-allowed'
                  }}
                >
                  <span className="auth-btn-text">
                    {isLoading ? 'VALIDANDO...' : 'VALIDAR CÉDULA ➔'}
                  </span>
                </button>
              </div>
            )}

            {/* ==================================================================
                PASO 2
            ================================================================== */}

            {registerStep === 2 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div className="register-step-indicator">
                  PASO 2 DE 3 // VERIFICACIÓN DE SEGURIDAD (OTP)
                </div>

                <p
                  className="auth-form-label"
                  style={{
                    textTransform: 'none',
                    color: '#ccc',
                    fontSize: '0.9rem',
                    marginBottom: '1rem',
                    lineHeight: '1.4'
                  }}
                >
                  Hemos enviado un código OTP de un solo uso
                  para autorizar la vinculación de la cédula{' '}
                  <strong>
                    {registerData.cedula}
                  </strong>.
                  Ingréselo a continuación.
                </p>

                <div
                  className="auth-form-group"
                  style={{
                    marginBottom: '1.5rem'
                  }}
                >
                  <label className="auth-form-label">
                    Código de Verificación (OTP)
                  </label>

                  <input
                    type="text"
                    maxLength={6}
                    inputMode="text"
                    autoComplete="one-time-code"
                    value={enteredOtp}
                    onChange={handleOtpChange}
                    className="auth-input-line"
                    style={{
                      letterSpacing: '4px',
                      textAlign: 'center',
                      fontSize: '1.2rem',
                      fontWeight: 'bold'
                    }}
                    placeholder="ABC123"
                    disabled={isLoading}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: '1.5rem'
                  }}
                >
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--auth-secondary, #ff3b30)',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      textDecoration: 'underline',
                      opacity: isLoading ? 0.5 : 1
                    }}
                  >
                    ¿No recibiste el código? Reenviar
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '1rem'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    disabled={isLoading}
                    className="auth-btn-skew auth-btn-secondary"
                    style={{ 
                      flex: 1, 
                      opacity: isLoading ? 0.5 : 1,
                      cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <span className="auth-btn-text">
                      ATRÁS
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={!isOtpValid || isLoading}
                    className="auth-btn-skew"
                    style={{
                      flex: 1.5,
                      opacity: isOtpValid && !isLoading ? 1 : 0.5,
                      cursor: isOtpValid && !isLoading ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <span className="auth-btn-text">
                      {isLoading ? 'VERIFICANDO...' : 'VERIFICAR CÓDIGO ➔'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* ==================================================================
                PASO 3
            ================================================================== */}

            {registerStep === 3 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div className="register-step-indicator">
                  PASO 3 DE 3 // CREDENCIALES DE ACCESO
                </div>

                {/* NOMBRE DE USUARIO */}
                <div className="auth-form-group">
                  <label className="auth-form-label">
                    Nombre de usuario
                  </label>

                  <input
                    type="text"
                    name="username"
                    required
                    value={registerData.username}
                    onChange={handleRegisterChange}
                    className="auth-input-line"
                    placeholder="Cree su nombre de usuario"
                    autoComplete="username"
                    disabled={isLoading}
                  />
                </div>

                {/* CONTRASEÑA */}
                <div className="auth-form-group">
                  <label className="auth-form-label">
                    Establecer Contraseña
                  </label>

                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      className="auth-input-line password-input-with-toggle"
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                      disabled={isLoading}
                    />
                    <PasswordToggleButton
                      isVisible={showPassword}
                      onToggle={() => setShowPassword((visible) => !visible)}
                    />
                  </div>
                </div>

                {/* CONFIRMAR CONTRASEÑA */}
                <div
                  className="auth-form-group"
                  style={{
                    marginBottom: '2rem'
                  }}
                >
                  <label className="auth-form-label">
                    Confirmar Contraseña
                  </label>

                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      required
                      value={registerData.confirmPassword}
                      onChange={handleRegisterChange}
                      className="auth-input-line password-input-with-toggle"
                      placeholder="Repita la contraseña"
                      autoComplete="new-password"
                      disabled={isLoading}
                    />
                    <PasswordToggleButton
                      isVisible={showConfirmPassword}
                      onToggle={() => setShowConfirmPassword((visible) => !visible)}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '1rem'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    disabled={isLoading}
                    className="auth-btn-skew auth-btn-secondary"
                    style={{ 
                      flex: 1,
                      opacity: isLoading ? 0.5 : 1,
                      cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <span className="auth-btn-text">
                      ATRÁS
                    </span>
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="auth-btn-skew"
                    style={{ 
                      flex: 1.5,
                      opacity: isLoading ? 0.5 : 1,
                      cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <span className="auth-btn-text">
                      {isLoading ? 'PROCESANDO...' : 'FINALIZAR INSCRIPCIÓN'}
                    </span>
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>
      </motion.div>

      {/* ======================================================================
          TOAST NOTIFICATION
      ====================================================================== */}

      {showNotification && (
        <div className="hud-toast">
          <span
            className="material-symbols-outlined"
            style={{
              color: 'var(--auth-secondary, #ff3b30)'
            }}
          >
            info
          </span>

          <span>
            {notificationMsg}
          </span>
        </div>
      )}

    </div>
  );
}