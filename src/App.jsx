import React, { useState, useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";

import { ThemeProvider } from "./context/ThemeContext";
import {
  LayoutProvider,
  useLayout
} from "./context/LayoutContext";
import { useTheme } from "./context/ThemeContext";

import AppRoutes from "./routes/AppRoutes";
import ConnectivityBanner from "./components/layout/ConnectivityBanner";

import TopbarPublic from "./components/layout/public/TopbarPublic";
import SidebarPublic from "./components/layout/public/SidebarPublic";

function AppContent({
  role,
  setRole,
  currentAction,
  setCurrentAction,
  handleLogout
}) {
  const {
    isSidebarOpen,
    toggleSidebar
  } = useLayout();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div
      style={{
        width: '100vw',
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
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <div
          className="main-content-wrapper"
          style={{
            width: '100%',
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

export default function App() {
  /* ==========================================================
     INICIALIZACIÓN DEL ROL NORMALIZADO
     ========================================================== */
  const [role, setRoleState] = useState(() => {
    const savedRole = localStorage.getItem('user_role');
    const savedToken = localStorage.getItem('token');

    if (!savedRole || !savedToken) {
      if (savedRole) localStorage.removeItem('user_role');
      if (savedToken) localStorage.removeItem('token');
      return null;
    }

    return savedRole.toLowerCase().trim();
  });

  const [currentAction, setCurrentAction] = useState("home");

  /* ==========================================================
     SETTER GARANTIZADO EN MINÚSCULAS
     ========================================================== */
  const setRole = (newRole) => {
    if (!newRole) {
      setRoleState(null);
      return;
    }
    setRoleState(newRole.toLowerCase().trim());
  };

  /* ==========================================================
     SINCRONIZACIÓN DEL ROL (EVENTO STORAGE MULTI-PESTAÑA)
     ========================================================== */
  useEffect(() => {
    const syncRole = () => {
      const stored = localStorage.getItem('user_role');
      const storedToken = localStorage.getItem('token');

      if (!stored || !storedToken) {
        if (stored) localStorage.removeItem('user_role');
        if (storedToken) localStorage.removeItem('token');
        setRoleState(null);
        setCurrentAction("home");
        return;
      }

      setRoleState(stored.toLowerCase().trim());
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
        <Router>
          <AppContent
            role={role}
            setRole={setRole}
            currentAction={currentAction}
            setCurrentAction={setCurrentAction}
            handleLogout={handleLogout}
          />
        </Router>
      </LayoutProvider>
    </ThemeProvider>
  );
}