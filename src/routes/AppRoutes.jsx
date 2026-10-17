import React, { lazy, Suspense } from 'react';
import CargaCircular from '../components/layout/CargaCircular';
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
    if (normalizedRole === 'admin') return '/admin/home';
    if (normalizedRole === 'entrenador') return '/entrenador/home';
    if (normalizedRole === 'atleta') return '/atleta/home';
    return '/';
  };

  const trainerDashboardElement = (
    <ProtectedRoute allowedRoles={['entrenador']} role={normalizedRole}>
      <TrainerDashboard
        currentAction={currentAction}
        setCurrentAction={setCurrentAction}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />
    </ProtectedRoute>
  );

  const adminDashboardElement = (
    <ProtectedRoute allowedRoles={['admin']} role={normalizedRole}>
      <AdminDashboard
        currentAction={currentAction}
        setCurrentAction={setCurrentAction}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />
    </ProtectedRoute>
  );

  const athleteDashboardElement = (
    <ProtectedRoute allowedRoles={['atleta']} role={normalizedRole}>
      <AthleteDashboard
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />
    </ProtectedRoute>
  );

  return (
    <Suspense fallback={<CargaCircular texto="Iniciando" pantallaCompleta />}>
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
          <Route path="/admin" element={<Navigate to="/admin/home" replace />} />
          <Route path="/admin/home" element={adminDashboardElement} />
          <Route path="/admin/dashboard" element={<Navigate to="/admin/home" replace />} />
          <Route path="/admin/asistencias/registro" element={adminDashboardElement} />
          <Route path="/admin/asistencias" element={adminDashboardElement} />
          <Route path="/admin/evaluaciones" element={<Navigate to="/admin/tests/programados" replace />} />
          <Route path="/admin/tests" element={<Navigate to="/admin/tests/programados" replace />} />
          <Route path="/admin/tests/programados" element={adminDashboardElement} />
          <Route path="/admin/tests/resultados" element={adminDashboardElement} />
          <Route path="/admin/atletas" element={adminDashboardElement} />
          <Route path="/admin/cineantropometria" element={<Navigate to="/admin/antropometria/programar" replace />} />
          <Route path="/admin/antropometria" element={<Navigate to="/admin/antropometria/programar" replace />} />
          <Route path="/admin/antropometria/programar" element={adminDashboardElement} />
          <Route path="/admin/antropometria/datos" element={adminDashboardElement} />
          <Route path="/admin/configuracion/antropometria" element={adminDashboardElement} />
          <Route path="/admin/prerregistro" element={adminDashboardElement} />
          <Route path="/admin/prerregistros-pendientes" element={adminDashboardElement} />
          <Route path="/admin/roles-permisos" element={adminDashboardElement} />
          <Route path="/admin/ejercicios" element={adminDashboardElement} />
          <Route path="/admin/reportes" element={adminDashboardElement} />
          <Route path="/admin/auditoria" element={adminDashboardElement} />
          <Route path="/admin/*" element={adminDashboardElement} />

          <Route path="/entrenador" element={<Navigate to="/entrenador/home" replace />} />
          <Route path="/entrenador/home" element={trainerDashboardElement} />
          <Route path="/entrenador/perfil" element={trainerDashboardElement} />
          <Route path="/entrenador/mis-atletas" element={trainerDashboardElement} />
          <Route path="/entrenador/asistencias" element={trainerDashboardElement} />
          <Route path="/entrenador/mis-tests" element={trainerDashboardElement} />
          <Route path="/entrenador/crear-test" element={trainerDashboardElement} />
          <Route path="/entrenador/tests-resultados" element={trainerDashboardElement} />
          <Route path="/entrenador/asignar-test" element={<Navigate to="/entrenador/mis-tests" replace />} />
          <Route path="/entrenador/cineantropometria" element={trainerDashboardElement} />
          <Route path="/entrenador/cineantropometria/programar" element={trainerDashboardElement} />
          <Route path="/entrenador/cineantropometria/datos" element={trainerDashboardElement} />
          <Route path="/entrenador/sueno-general" element={trainerDashboardElement} />
          <Route path="/entrenador/sueno-individual" element={trainerDashboardElement} />
          <Route path="/entrenador/sueno-pendientes" element={trainerDashboardElement} />
          <Route path="/entrenador/rutina" element={trainerDashboardElement} />
          <Route path="/entrenador/gestion-rutinas" element={trainerDashboardElement} />
          <Route path="/entrenador/reportes" element={trainerDashboardElement} />
          <Route path="/entrenador/dashboard" element={<Navigate to="/entrenador/home" replace />} />
          <Route path="/entrenador/entrenamientos" element={<Navigate to="/entrenador/rutina" replace />} />
          <Route path="/entrenador/*" element={<Navigate to="/entrenador/home" replace />} />

          <Route path="/atleta" element={<Navigate to="/atleta/home" replace />} />
          <Route path="/atleta/home" element={athleteDashboardElement} />
          <Route path="/atleta/evaluaciones" element={<Navigate to="/atleta/tests" replace />} />
          <Route path="/atleta/tests" element={athleteDashboardElement} />
          <Route path="/atleta/asistencias" element={athleteDashboardElement} />
          <Route path="/atleta/antropometria" element={athleteDashboardElement} />
          <Route path="/atleta/sueno" element={athleteDashboardElement} />
          <Route path="/atleta/sueno-historial" element={athleteDashboardElement} />
          <Route path="/atleta/reportes" element={<Navigate to="/atleta/home" replace />} />
          <Route path="/atleta/perfil" element={athleteDashboardElement} />
          <Route path="/atleta/configuracion" element={<Navigate to="/atleta/perfil" replace />} />
          <Route path="/atleta/rutina" element={athleteDashboardElement} />
          <Route path="/atleta/dashboard" element={<Navigate to="/atleta/home" replace />} />
          <Route path="/atleta/asistencia" element={<Navigate to="/atleta/asistencias" replace />} />
          <Route path="/atleta/*" element={<Navigate to="/atleta/home" replace />} />

          {/* ----------------- Redirecciones de Consistencia ----------------- */}
          <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />
          <Route path="/AdminDashboard" element={<Navigate to="/admin" replace />} />
          <Route path="/administrador" element={<Navigate to="/admin" replace />} />
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