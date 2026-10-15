import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  LogIn,
  UserPlus,
  Target,
  Trophy,
  MapPin,
  X,
  Sun,
  Moon
} from 'lucide-react';

import { useTheme } from '../../../context/ThemeContext';
import '../../../styles/layouts/SidebarPublic.css';

export default function SidebarPublic({
  isOpen,
  toggleSidebar
}) {
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();

  const currentPath =
    location.pathname.toLowerCase().replace(/\/$/, '') || '/';

  const isHomePage = currentPath === '/';
  const isLoginPage = currentPath === '/login';
  const isRegisterPage = currentPath === '/register';

  /* CERRAR CON ESCAPE */
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        toggleSidebar();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, toggleSidebar]);

  /* BLOQUEAR SCROLL CUANDO EL SIDEBAR MÓVIL ESTÁ ABIERTO */
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('sidebar-public-open');
    } else {
      document.body.classList.remove('sidebar-public-open');
    }

    return () => {
      document.body.classList.remove('sidebar-public-open');
    };
  }, [isOpen]);

  const handleItemClick = () => {
    if (toggleSidebar) {
      toggleSidebar();
    }
  };

  const handleOverlayClick = () => {
    if (isOpen) {
      toggleSidebar();
    }
  };

  const handleSidebarClick = (event) => {
    event.stopPropagation();
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${
          isOpen ? 'sidebar-overlay-active' : ''
        }`}
        onClick={handleOverlayClick}
        aria-hidden={!isOpen}
      />

      <aside
        className={`sidebar ${isOpen ? 'mobile-open' : ''}`}
        onClick={handleSidebarClick}
      >
        <div className="sidebar-header">
          <span className="sidebar-title">
            Menú
          </span>

          <button
            type="button"
            className="sidebar-close-btn"
            onClick={toggleSidebar}
            aria-label="Cerrar menú"
            title="Cerrar menú"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/"
            className={`nav-item ${
              isHomePage ? 'active' : ''
            }`}
            onClick={handleItemClick}
          >
            <Home size={20} />
            <span className="nav-label">
              Inicio
            </span>
          </Link>

          {isHomePage && (
            <>
              <a
                href="#mision"
                className="nav-item"
                onClick={handleItemClick}
              >
                <Target size={20} />
                <span className="nav-label">
                  Misión
                </span>
              </a>

              <a
                href="#disciplinas"
                className="nav-item"
                onClick={handleItemClick}
              >
                <Trophy size={20} />
                <span className="nav-label">
                  Disciplinas
                </span>
              </a>

              <a
                href="#ubicacion"
                className="nav-item"
                onClick={handleItemClick}
              >
                <MapPin size={20} />
                <span className="nav-label">
                  Ubicación
                </span>
              </a>
            </>
          )}

          <div className="sidebar-divider" />

          {!isLoginPage && (
            <Link
              to="/login"
              className={`nav-item ${
                isLoginPage ? 'active' : ''
              }`}
              onClick={handleItemClick}
            >
              <LogIn size={20} />
              <span className="nav-label">
                Acceder
              </span>
            </Link>
          )}

          {!isRegisterPage && (
            <Link
              to="/register"
              className={`nav-item ${
                isRegisterPage ? 'active' : ''
              }`}
              onClick={handleItemClick}
            >
              <UserPlus size={20} />
              <span className="nav-label">
                Registrarse
              </span>
            </Link>
          )}
        </nav>

        <div className="sidebar-footer">
          <div
            onClick={toggleTheme}
            className="nav-item theme-toggle"
          >
            {isDarkMode ? (
              <Sun size={20} />
            ) : (
              <Moon size={20} />
            )}

            <span className="nav-label">
              {isDarkMode
                ? 'Modo Claro'
                : 'Modo Oscuro'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}