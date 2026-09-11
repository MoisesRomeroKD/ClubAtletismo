// src/pages/Login.jsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { authService } from '../api/services/authService';
import PasswordToggleButton from '../components/auth/PasswordToggleButton';
import '../styles/pages/Login.css';

// ============================================================
// ANIMACIONES - DOBLE PUERTA
// ============================================================

const doorVariantsLeft = {
  initial: {
    x: '-100%',
    opacity: 0
  },

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
  initial: {
    x: '100%',
    opacity: 0
  },

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


// ============================================================
// COMPONENTE LOGIN
// ============================================================

export default function Login() {

  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");

  const [currentQuote, setCurrentQuote] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });


  // ==========================================================
  // FRASES
  // ==========================================================

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


  // ==========================================================
  // ROTACIÓN DE FRASES
  // ==========================================================

  useEffect(() => {

    const interval = setInterval(() => {

      setCurrentQuote(
        prev => (prev + 1) % quotes.length
      );

    }, 6000);

    return () => clearInterval(interval);

  }, [quotes.length]);


  // ==========================================================
  // CAMBIO DE INPUT
  // ==========================================================

  const handleLoginChange = (e) => {

    const {
      name,
      value
    } = e.target;

    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));

  };


  // ==========================================================
  // NOTIFICACIONES
  // ==========================================================

  const triggerNotification = (msg) => {

    setNotificationMsg(msg);

    setShowNotification(true);

    setTimeout(() => {
      setShowNotification(false);
    }, 4000);

  };


  // ==========================================================
  // LOGIN
  // ==========================================================

  const handleLoginSubmit = async (e) => {

    e.preventDefault();

    if (isLoading) {
      return;
    }

    setIsLoading(true);

    triggerNotification(
      "Validando credenciales en el portal de Elite Track Club..."
    );


    try {

      // ======================================================
      // LOGIN REAL
      // Endpoint utilizado internamente:
      //
      // POST /api/v1/auth/login/
      //
      // ======================================================

      const data = await authService.login(
        loginData.username.trim(),
        loginData.password
      );


      // ======================================================
      // VALIDACIÓN BÁSICA DE RESPUESTA
      // ======================================================

      if (!data || !data.access) {

        throw new Error(
          "El servidor no devolvió un token de acceso válido."
        );

      }


      // ======================================================
      // authService YA GUARDA:
      //
      // token
      // refresh_token
      // user_role
      // user_name
      // user_id
      //
      // No necesitamos volver a guardarlos aquí.
      // ======================================================


      triggerNotification(
        `¡Acceso concedido! Bienvenido, ${data.name || loginData.username}.`
      );


      // ======================================================
      // REDIRECCIÓN SEGÚN ROL
      // ======================================================

      setTimeout(() => {

        switch (data.role) {

          case 'admin':
            window.location.href = '/admin';
            break;

          case 'entrenador':
            window.location.href = '/entrenador';
            break;

          case 'gestion':
            window.location.href = '/admin';
            break;

          case 'atleta':
            window.location.href = '/atleta';
            break;

          case 'superadmin':

            // El superusuario NO debe acceder al frontend.
            // El backend debe bloquearlo antes de llegar aquí.
            localStorage.clear();

            triggerNotification(
              "Acceso no permitido para SuperAdmin desde este portal."
            );

            window.location.href = '/login';

            break;

          default:

            localStorage.clear();

            triggerNotification(
              "Rol de usuario no reconocido."
            );

            window.location.href = '/login';

            break;
        }

      }, 1500);


    } catch (error) {

      console.error(
        "Error durante el inicio de sesión:",
        error
      );


      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        "La combinación de credenciales no es válida.";


      triggerNotification(
        `Error: ${errorMsg}`
      );


    } finally {

      setIsLoading(false);

    }

  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="auth-fullscreen-container">


      {/* ======================================================
          PUERTA IZQUIERDA
          ====================================================== */}

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

          <div className="hype-telemetry"></div>

        </div>

      </motion.div>



      {/* ======================================================
          PUERTA DERECHA
          ====================================================== */}

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
              ACCEDER
            </span>

          </div>


          <form
            onSubmit={handleLoginSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >


            {/* ==================================================
                USUARIO
                ================================================== */}

            <div className="auth-form-group">

              <label className="auth-form-label">
                Nombre de Usuario
              </label>

              <input
                type="text"
                name="username"
                required
                disabled={isLoading}
                value={loginData.username}
                onChange={handleLoginChange}
                className="auth-input-line"
                placeholder="Ingrese su usuario de control"
                autoComplete="username"
              />

            </div>



            {/* ==================================================
                CONTRASEÑA
                ================================================== */}

            <div className="auth-form-group">

              <label className="auth-form-label">
                Contraseña de Control
              </label>

              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  disabled={isLoading}
                  value={loginData.password}
                  onChange={handleLoginChange}
                  className="auth-input-line password-input-with-toggle"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <PasswordToggleButton
                  isVisible={showPassword}
                  onToggle={() => setShowPassword((visible) => !visible)}
                />
              </div>

            </div>



            {/* ==================================================
                RECUPERACIÓN
                ================================================== */}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                margin: '0.5rem 0 1.5rem 0'
              }}
            >

              <a
                href="#recuperar"
                style={{
                  color: 'var(--auth-slate)',
                  fontSize: '11px',
                  textDecoration: 'none',
                  fontFamily: 'JetBrains Mono, monospace'
                }}
              >
                ¿OLVIDASTE TU CONTRASEÑA?
              </a>

            </div>



            {/* ==================================================
                BOTÓN
                ================================================== */}

            <button
              type="submit"
              className="auth-btn-skew"
              disabled={isLoading}
            >

              <span className="auth-btn-text">

                {isLoading
                  ? "CONECTANDO..."
                  : "ACCEDER AL PORTAL"}

              </span>

            </button>


          </form>

        </div>

      </motion.div>



      {/* ======================================================
          TOAST
          ====================================================== */}

      {showNotification && (

        <div className="hud-toast">

          <span
            className="material-symbols-outlined"
            style={{
              color: 'var(--auth-secondary)'
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