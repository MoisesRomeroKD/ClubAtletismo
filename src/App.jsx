import React, { useState, useEffect } from "react";
import { revocarSesionEnServidor } from './api/cerrarSesion.js';
import { BrowserRouter as Router, useNavigate } from "react-router-dom";

import { ThemeProvider } from "./context/ThemeContext";
import {
  LayoutProvider,
  useLayout
} from "./context/LayoutContext";
import { useTheme } from "./context/ThemeContext";
import { ApplicationPermissionsProvider } from "./context/ApplicationPermissionsContext";

import AppRoutes from "./routes/AppRoutes";
import ConnectivityBanner from "./components/layout/ConnectivityBanner";
import ServidorIniciando from "./components/layout/ServidorIniciando";
import Notificaciones from "./components/layout/Notificaciones";

import TopbarPublic from "./components/layout/public/TopbarPublic";
import SidebarPublic from "./components/layout/public/SidebarPublic";

import "./App.css";

function AppContent({
  role,
  setRole,
  currentAction,
  setCurrentAction,
  handleLogout
}) {
  const navigate = useNavigate();
  const {
    isSidebarOpen,
    toggleSidebar
  } = useLayout();
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    const handleSessionExpired = () => {
      handleLogout();
      navigate('/login', {
        replace: true,
        state: { sessionExpired: true },
      });
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, [handleLogout, navigate]);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        margin: 0,
        padding: 0
      }}
    >
      {/* TOPBAR PÚBLICO */}
      {!role && (
        <TopbarPublic
          role={role}
          toggleSidebar={toggleSidebar}
        />
      )}

      {/* SIDEBAR PÚBLICO */}
      {!role && (
        <SidebarPublic
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />
      )}

      {/* CONTENIDO PRINCIPAL */}
      <div
        className={
          role
            ? 'private-layout-container'
            : 'landing-layout'
        }
        style={{
          display: 'flex',
          flex: 1,
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <div
          className="main-content-wrapper"
          style={{
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            flex: 1
          }}
        >
          <AppRoutes
            role={role}
            setRole={setRole}
            currentAction={currentAction}
            setCurrentAction={setCurrentAction}
            handleLogout={handleLogout}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
          />
        </div>
      </div>
    </div>
  );
}

// Los únicos roles con panel. Cualquier otro valor guardado se descarta (no se asume ninguno).
const ROLES_VALIDOS = ['admin', 'entrenador', 'atleta'];
const rolValido = (valor) => {
  const rol = String(valor || '').toLowerCase().trim();
  return ROLES_VALIDOS.includes(rol) ? rol : null;
};

export default function App() {
  /* ==========================================================
     INICIALIZACIÓN DEL ROL NORMALIZADO
     ========================================================== */
  const [role, setRoleState] = useState(() => {
    const savedRole = localStorage.getItem('user_role');
    const savedToken = localStorage.getItem('token');

    if (!rolValido(savedRole) || !savedToken) {
      if (savedRole) localStorage.removeItem('user_role');
      if (savedToken) localStorage.removeItem('token');
      return null;
    }

    return rolValido(savedRole);
  });

  const [currentAction, setCurrentAction] = useState("home");

  /* ==========================================================
     SETTER GARANTIZADO EN MINÚSCULAS
     ========================================================== */
  const setRole = (newRole) => {
    setRoleState(rolValido(newRole));
  };

  /* ==========================================================
     SINCRONIZACIÓN DEL ROL (EVENTO STORAGE MULTI-PESTAÑA)
     ========================================================== */
  useEffect(() => {
    const syncRole = () => {
      const stored = localStorage.getItem('user_role');
      const storedToken = localStorage.getItem('token');

      if (!rolValido(stored) || !storedToken) {
        if (stored) localStorage.removeItem('user_role');
        if (storedToken) localStorage.removeItem('token');
        setRoleState(null);
        setCurrentAction("home");
        return;
      }

      setRoleState(rolValido(stored));
      setCurrentAction("home");
    };

    window.addEventListener('storage', syncRole);

    return () => {
      window.removeEventListener('storage', syncRole);
    };
  }, []);

  /* ==========================================================
     LOGOUT COMPLETO
     ========================================================== */
  const handleLogout = () => {
    revocarSesionEnServidor();
    [
      'token',
      'refresh_token',
      'user_role',
      'user_name',
      'user_id'
    ].forEach(
      key => localStorage.removeItem(key)
    );

    setRoleState(null);
    setCurrentAction("home");
  };

  /* ==========================================================
     RENDER
     ========================================================== */
  return (
    <ThemeProvider>
      <LayoutProvider>
        <ConnectivityBanner />
        <ServidorIniciando />
        <Notificaciones />
        <Router>
          <ApplicationPermissionsProvider role={role}>
            <AppContent
              role={role}
              setRole={setRole}
              currentAction={currentAction}
              setCurrentAction={setCurrentAction}
              handleLogout={handleLogout}
            />
          </ApplicationPermissionsProvider>
        </Router>
      </LayoutProvider>
    </ThemeProvider>
  );
}