import React from "react";
import { useLocation, Link } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";
import "../../../styles/layouts/TopbarPublic.css";

const TopbarPublic = ({ role, toggleSidebar }) => {
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();

  // Normalizamos la ruta eliminando la barra final si existe
  const currentPath = location.pathname.toLowerCase().replace(/\/$/, "") || "/";

  const isHomePage = currentPath === "/";
  const isLoginPage = currentPath === "/login";
  const isRegisterPage = currentPath === "/register";

  const handleLogoClick = (e) => {
    if (toggleSidebar && window.innerWidth <= 1024) {
      e.preventDefault();
      toggleSidebar();
    }
  };

  return (
    <nav className="elite-topbar">
      <div className="topbar-container">
        {/* IZQUIERDA - LOGO / ACTIVADOR DE SIDEBAR */}
        <div className="topbar-left-section">
          <Link 
            to="/" 
            className="topbar-brand-link" 
            onClick={handleLogoClick}
          >
            <div className="topbar-logo-block">
              <img
                src="/assets/logo.png"
                alt="Club Atletismo Liceo Caracas Logo"
                className="topbar-logo-img"
              />
              <span className="topbar-brand-title">
                CLUB ATLETISMO LICEO CARACAS
              </span>
            </div>
          </Link>
        </div>

        {/* DERECHA - NAVEGACIÓN Y ACCIONES */}
        <div className="topbar-right-section">
          {/* Enlaces de ancla (Solo en la Home) */}
          {isHomePage && (
            <div className="nav-links">
              <a className="nav-link" href="#hero">
                Inicio
              </a>
              <a className="nav-link" href="#mision">
                Misión
              </a>
              <a className="nav-link" href="#disciplinas">
                Disciplinas
              </a>
              <a className="nav-link" href="#ubicacion">
                Ubicación
              </a>
            </div>
          )}

          {(isHomePage || isLoginPage || isRegisterPage) && (
            <div className="topbar-social-links" aria-label="Redes sociales oficiales">
              <a
                className="topbar-social-link"
                href="https://www.instagram.com/atletismoliceocaracas/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram oficial"
                title="Instagram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="20" height="20" x="2" y="2" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                </svg>
              </a>
              <a
                className="topbar-social-link"
                href="https://www.tiktok.com/@liceo.caracas"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok oficial"
                title="TikTok"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 18V5l10-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="16" cy="16" r="3" />
                  <path d="M19 3v4a4 4 0 0 0 4 4" />
                </svg>
              </a>
            </div>
          )}

          {/* Botón de Cambio de Modo Claro / Oscuro */}
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme}
            aria-label="Cambiar modo de color"
            title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
          >
            {isDarkMode ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

          <div className="topbar-actions-wrapper">
            {isHomePage &&
              (role ? (
                <Link className="btn-join-now" to={`/${role}`}>
                  <span className="btn-text-fix">IR AL PANEL</span>
                </Link>
              ) : (
                <>
                  <Link
                    className="nav-link register-nav-link"
                    to="/register"
                  >
                    REGISTRARSE
                  </Link>

                  <Link className="btn-join-now" to="/login">
                    <span className="btn-text-fix">ACCEDER</span>
                  </Link>
                </>
              ))}

            {isLoginPage && (
              <Link className="btn-join-now" to="/register">
                <span className="btn-text-fix">REGISTRARSE</span>
              </Link>
            )}

            {isRegisterPage && (
              <Link className="btn-join-now" to="/login">
                <span className="btn-text-fix">ACCEDER</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopbarPublic;