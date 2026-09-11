import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from '../components/auth/ProtectedRoute';

const Home             = lazy(() => import('../pages/Home'));
const Login            = lazy(() => import('../pages/Login'));
const Register         = lazy(() => import('../pages/Register'));
const AdminDashboard   = lazy(() => import('../pages/AdminDashboard'));
const TrainerDashboard = lazy(() => import('../pages/TrainerDashboard'));
const AthleteDashboard = lazy(() => import('../pages/AthleteDashboard'));

export default function AppRoutes({ 
  role, 
  setRole, 
  currentAction, 
  setCurrentAction, 
  handleLogout, 
  isDarkMode, 
  toggleTheme 
}) {
  const location = useLocation();

  // Normalizar el rol para evitar fallos por mayúsculas o espacios
  const normalizedRole = role ? String(role).toLowerCase().trim() : null;

  // Helper para resolver la ruta según el rol activo
  const getRoleRedirect = () => {
    if (normalizedRole === 'gestion' || normalizedRole === 'admin') return '/admin';
    if (normalizedRole === 'entrenador') return '/entrenador';
    if (normalizedRole === 'atleta') return '/atleta';
    return '/';
  };

  return (
    <Suspense fallback={<div className="loading-container">Iniciando entorno seguro...</div>}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          
          {/* ----------------- Rutas Públicas ----------------- */}
          <Route
            path="/"
            element={
              normalizedRole ? <Navigate to={getRoleRedirect()} replace /> : <Home />
            }
          />
          
          <Route
            path="/login"
            element={
              normalizedRole ? (
                <Navigate to={getRoleRedirect()} replace />
              ) : (
                <Login
                  setRole={(r) => {
                    setRole(r ? String(r).toLowerCase().trim() : null);
                  }}
                />
              )
            }
          />

          <Route
            path="/register"
            element={
              normalizedRole ? (
                <Navigate to={getRoleRedirect()} replace />
              ) : (
                <Register
                  setRole={(r) => {
                    setRole(r ? String(r).toLowerCase().trim() : null);
                  }}
                />
              )
            }
          />

          {/* ----------------- Rutas Protegidas (con /* para subrutas) ----------------- */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin', 'gestion']} role={normalizedRole}>
                <AdminDashboard 
                  currentAction={currentAction} 
                  setCurrentAction={setCurrentAction}
                  onLogout={handleLogout}
                  isDarkMode={isDarkMode}
                  onToggleTheme={toggleTheme}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gestion/*"
            element={<Navigate to="/admin" replace />}
          />

          <Route
            path="/entrenador/*"
            element={
              <ProtectedRoute allowedRoles={['entrenador']} role={normalizedRole}>
                <TrainerDashboard 
                  currentAction={currentAction} 
                  setCurrentAction={setCurrentAction}
                  onLogout={handleLogout}
                  isDarkMode={isDarkMode}
                  onToggleTheme={toggleTheme}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/atleta/*"
            element={
              <ProtectedRoute allowedRoles={['atleta']} role={normalizedRole}>
                <AthleteDashboard 
                  currentAction={currentAction} 
                  setCurrentAction={setCurrentAction}
                  onLogout={handleLogout}
                  isDarkMode={isDarkMode}
                  onToggleTheme={toggleTheme}
                />
              </ProtectedRoute>
            }
          />

          {/* ----------------- Redirecciones de Consistencia ----------------- */}
          <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />
          <Route path="/AdminDashboard" element={<Navigate to="/admin" replace />} />
          <Route path="/administrador" element={<Navigate to="/admin" replace />} />
          <Route path="/gestion-dashboard" element={<Navigate to="/admin" replace />} />
          <Route path="/trainer" element={<Navigate to="/entrenador" replace />} />
          <Route path="/trainer-dashboard" element={<Navigate to="/entrenador" replace />} />
          <Route path="/entrenador-dashboard" element={<Navigate to="/entrenador" replace />} />
          <Route path="/athlete" element={<Navigate to="/atleta" replace />} />
          <Route path="/athlete-dashboard" element={<Navigate to="/atleta" replace />} />
          <Route path="/atleta-dashboard" element={<Navigate to="/atleta" replace />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}