import React, { lazy, Suspense, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import MainNav from '../components/layout/user/MainNav';

// Cada pantalla se descarga solo cuando se abre desde el sidebar, no todas al entrar al panel.
const DashboardView = lazy(() => import('../components/admin/dashboard/DashboardView'));
const SleepQualityDashboard = lazy(() => import('../components/admin/sleep/SleepQualityDashboard'));
const PendientesSuenoAdmin = lazy(() => import('../components/admin/sleep/PendientesSuenoAdmin'));
const AsistenciaAdminView = lazy(() => import('../components/admin/asistencia/AsistenciaAdminView'));
const RegistroAsistencia = lazy(() => import('../components/RegistroAsistencia'));
const AtletasViewAdmin = lazy(() => import('../components/admin/AtletasViewAdmin'));
const EntrenadoresViewAdmin = lazy(() => import('../components/admin/EntrenadoresViewAdmin'));
const RepresentantesViewAdmin = lazy(() => import('../components/admin/RepresentantesViewAdmin'));
const AreasSubareasAdmin = lazy(() => import('../components/admin/AreasSubareasAdmin'));
const PrerregistrosPendientes = lazy(() => import('../components/admin/PrerregistrosPendientes'));
const Preregistro = lazy(() => import('../components/admin/Preregistro'));
const RolesPermisos = lazy(() => import('../components/admin/RolesPermisos'));
const AdministradoresView = lazy(() => import('../components/admin/AdministradoresView'));
const TestsAdmin = lazy(() => import('../components/admin/tests/TestsAdmin'));
const AdminEvaluacionesView = lazy(() => import('../components/admin/evaluacion/AdminEvaluacionesView'));
const MiPerfilViewAdmin = lazy(() => import('../components/admin/MiPerfilViewAdmin'));
const ExercisesAdmin = lazy(() => import('../components/admin/ExercisesAdmin'));
const CategoriasDeportivasAdmin = lazy(() => import('../components/admin/CategoriasDeportivasAdmin'));
const ReporteAdmin = lazy(() => import('../components/admin/ReporteAdmin'));
const AuditoriaAdmin = lazy(() => import('../components/admin/AuditoriaAdmin'));
const GestionConstancias = lazy(() => import('../components/admin/GestionConstancias'));
const DiscapacidadesAdmin = lazy(() => import('../components/admin/DiscapacidadesAdmin'));

// COMPONENTE DE ANTROPOMETRÍA
const AntropometriaAdmin = lazy(() => import('../components/admin/antropometria/AntropometriaAdmin'));
const ParametrosAntropometria = lazy(() => import('../components/admin/antropometria/ParametrosAntropometria'));
const AnalisisCineAdmin = lazy(() => import('../components/admin/antropometria/AnalisisCineAdmin'));
const AnalisisTestsAdmin = lazy(() => import('../components/admin/tests/AnalisisTestsAdmin'));

import '../styles/pages/AdminDashboard.css';
import { useApplicationPermissions } from '../context/ApplicationPermissionsContext';
import { permisosDeSeccionAdmin } from '../components/layout/user/permisosAdmin';
import CargaCircular from '../components/layout/CargaCircular';

const TESTS_SECCIONES = {
  'tests-programados': 'tests',
  evaluaciones: 'tests',
  evaluacion: 'tests',
};

export default function AdminDashboard({
  currentAction,
  isDarkMode,
  onToggleTheme,
}) {
  const [activeTab, setActiveTab] = useState(currentAction || 'home');
  const { hasPermission, isLoading: permissionsLoading } = useApplicationPermissions();
  const location = useLocation();
  const navigate = useNavigate();
  const rutas = {
    '/admin/home': 'home',
    '/admin/asistencias': 'asistencias',
    '/admin/asistencias/registro': 'registro-asistencia',
    '/admin/evaluaciones': 'tests-programados',
    '/admin/tests/programados': 'tests-programados',
    '/admin/tests/resultados': 'tests-resultados',
    '/admin/tests/analisis': 'tests-analisis',
    '/admin/atletas': 'athletes',
    '/admin/antropometria/programar': 'antropometria-programar',
    '/admin/antropometria/datos': 'antropometria-datos',
    '/admin/antropometria/analisis': 'antropometria-analisis',
    '/admin/configuracion/antropometria': 'parametros-antropometria',
    '/admin/sueno/general': 'sueño_general',
    '/admin/sueno/individual': 'sueño_individual',
    '/admin/sueno/pendientes': 'sueño_pendientes',
    '/admin/prerregistro': 'prerregistro',
    '/admin/prerregistros-pendientes': 'prerregistros-pendientes',
    '/admin/roles-permisos': 'roles-permisos',
    '/admin/administradores': 'administradores',
    '/admin/entrenadores': 'entrenadores',
    '/admin/representantes': 'representantes',
    '/admin/areas-subareas': 'areas-subareas',
    '/admin/categorias': 'categorias',
    '/admin/discapacidades': 'discapacidades',
    '/admin/mi-perfil': 'mi-perfil',
    '/admin/ejercicios': 'ejercicios',
    '/admin/reportes': 'reportes',
    '/admin/auditoria': 'auditoria',
    '/admin/constancias': 'constancias',
  };
  const routeActiveTab = rutas[location.pathname];
  const effectiveTab = routeActiveTab || activeTab;
  // Sin el permiso de la sección no se dibuja su pantalla (aunque se entre por la dirección).
  const permisosSeccion = permisosDeSeccionAdmin(effectiveTab);
  const seccionBloqueada = Boolean(permisosSeccion) && !permisosSeccion.some(hasPermission);

  // Si la sección tiene URL propia se navega a ella; si no, solo se cambia la sección.
  const handleTabChange = (tabId) => {
    const ruta = Object.keys(rutas).find((path) => rutas[path] === tabId && path !== '/admin/evaluaciones');
    if (ruta) navigate(ruta);
    else setActiveTab(tabId);
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  };

  return (
    <MainNav
      role="administrador"
      roleTitle="Administrador"
      activeTab={effectiveTab}
      onTabChange={handleTabChange}
      onLogout={handleLogout}
      isDarkMode={isDarkMode}
      onToggleTheme={onToggleTheme}
    >
      <div className="admin-dashboard-container">
        <Suspense fallback={<CargaCircular texto="Cargando sección" />}>

        {permisosSeccion && permissionsLoading ? (
          <CargaCircular texto="Cargando" />
        ) : seccionBloqueada ? (
          <section className="dashboard-section" role="alert">
            No tienes permiso para ver esta sección.
          </section>
        ) : (
        <>
        {/* DASHBOARD HOME */}
        {effectiveTab === 'home' && (
          <DashboardView />
        )}

        {/* ANÁLISIS (dashboards de tests y de cineantropometría) */}
        {effectiveTab === 'tests-analisis' && (
          <section className="dashboard-section">
            <AnalisisTestsAdmin />
          </section>
        )}
        {effectiveTab === 'antropometria-analisis' && (
          <section className="dashboard-section">
            <AnalisisCineAdmin />
          </section>
        )}

        {/* RESULTADOS DE TESTS: rendimiento de cada atleta */}
        {effectiveTab === 'tests-resultados' && (
          <section className="dashboard-section">
            <AdminEvaluacionesView />
          </section>
        )}

        {/* EVALUACIONES DEPORTIVAS */}
        {TESTS_SECCIONES[effectiveTab] && (
          <section className="dashboard-section">
            <TestsAdmin seccion={TESTS_SECCIONES[effectiveTab]} />
          </section>
        )}

        {/* CONTROL DE SUEÑO */}
        {(effectiveTab === 'sueño_pendientes' || effectiveTab === 'sueño_registro') && <PendientesSuenoAdmin />}
        {(effectiveTab === 'sueño' || effectiveTab.startsWith('sueño_'))
          && effectiveTab !== 'sueño_pendientes' && effectiveTab !== 'sueño_registro' && (
          <SleepQualityDashboard
            activeSection={effectiveTab}
            onSectionChange={handleTabChange}
          />
        )}

        {/* ANTROPOMETRÍA / CINEANTROPOMETRÍA */}
        {(effectiveTab === 'antropometria-programar' || effectiveTab === 'antropometria-datos') && (
          <section className="dashboard-section">
            <AntropometriaAdmin seccion={effectiveTab === 'antropometria-datos' ? 'datos' : 'programar'} />
          </section>
        )}
        {effectiveTab === 'parametros-antropometria' && (
          <section className="dashboard-section">
            <ParametrosAntropometria />
          </section>
        )}

        {/* ASISTENCIA */}
        {effectiveTab === 'asistencias' && (
          <AsistenciaAdminView />
        )}
        {effectiveTab === 'registro-asistencia' && (
          <RegistroAsistencia />
        )}

        {/* ATLETAS */}
        {effectiveTab === 'athletes' && (
          <AtletasViewAdmin />
        )}

        {/* NUEVO PRERREGISTRO */}
        {effectiveTab === 'prerregistro' && (
          <Preregistro />
        )}

        {/* PRERREGISTROS PENDIENTES */}
        {effectiveTab === 'prerregistros-pendientes' && (
          <PrerregistrosPendientes />
        )}

        {/* ROLES Y PERMISOS */}
        {effectiveTab === 'roles-permisos' && <RolesPermisos />}

        {/* GESTIÓN DE ADMINISTRADORES */}
        {effectiveTab === 'administradores' && (
          <section className="dashboard-section admin-gestion-section">
            <div className="admin-gestion-header">
              <div>
                <h2 className="admin-gestion-titulo">Gestión de Administradores</h2>
                <p className="admin-gestion-subtitulo">Personal con acceso y permisos de administración del sistema</p>
              </div>
            </div>
            <AdministradoresView />
          </section>
        )}

        {/* GESTIÓN DE ENTRENADORES */}
        {effectiveTab === 'entrenadores' && (
          <section className="dashboard-section admin-gestion-section admin-gestion-section--sombra">
            <div className="admin-gestion-header">
              <div>
                <h2 className="admin-gestion-titulo">Gestión de Entrenadores</h2>
                <p className="admin-gestion-subtitulo">Directorio del cuerpo técnico, especialidades asignadas y atletas a cargo</p>
              </div>
            </div>

            <EntrenadoresViewAdmin />
          </section>
        )}

        {/* GESTIÓN DE REPRESENTANTES */}
        {effectiveTab === 'representantes' && (
          <section className="dashboard-section admin-gestion-section admin-gestion-section--sombra">
            <div className="admin-gestion-header">
              <div>
                <h2 className="admin-gestion-titulo">Gestión de Representantes</h2>
                <p className="admin-gestion-subtitulo">Directorio de padres, tutores legales y vinculación con atletas menores de edad</p>
              </div>

            </div>

            <RepresentantesViewAdmin />
          </section>
        )}

        {/* SECCIONES COMPLEMENTARIAS */}
        {effectiveTab === 'reportes' && <ReporteAdmin />}
        {effectiveTab === 'auditoria' && <AuditoriaAdmin />}
        {effectiveTab === 'constancias' && <GestionConstancias />}
        {effectiveTab === 'areas-subareas' && (
          <section className="dashboard-section">
            <AreasSubareasAdmin />
          </section>
        )}
        {effectiveTab === 'mi-perfil' && <MiPerfilViewAdmin />}
        {effectiveTab === 'categorias' && <CategoriasDeportivasAdmin />}
        {effectiveTab === 'discapacidades' && <DiscapacidadesAdmin />}
        {effectiveTab === 'ejercicios' && <ExercisesAdmin />}
        </>
        )}

        </Suspense>
      </div>
    </MainNav>
  );
}