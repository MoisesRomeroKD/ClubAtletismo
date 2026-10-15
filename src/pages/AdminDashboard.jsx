import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

import MainNav from '../components/layout/user/MainNav';
import DashboardView from '../components/admin/dashboard/DashboardView';
import SleepQualityDashboard from '../components/admin/sleep/SleepQualityDashboard';
import AsistenciaAdminView from '../components/admin/asistencia/AsistenciaAdminView';
import RegistroAsistencia from '../components/RegistroAsistencia';
import AtletasViewAdmin from '../components/admin/AtletasViewAdmin';
import EntrenadoresViewAdmin from '../components/admin/EntrenadoresViewAdmin';
import RepresentantesViewAdmin from '../components/admin/RepresentantesViewAdmin';
import AreasSubareasAdmin from '../components/admin/AreasSubareasAdmin';
import PrerregistrosPendientes from '../components/admin/PrerregistrosPendientes';
import Preregistro from '../components/admin/Preregistro';
import RolesPermisos from '../components/admin/RolesPermisos';
import AdministradoresView from '../components/admin/AdministradoresView';
import TestsAdmin from '../components/admin/tests/TestsAdmin';
import MiPerfilViewAdmin from '../components/admin/MiPerfilViewAdmin';
import ExercisesAdmin from '../components/admin/ExercisesAdmin';
import CategoriasDeportivasAdmin from '../components/admin/CategoriasDeportivasAdmin';
import ReporteAdmin from '../components/admin/ReporteAdmin';
import AuditoriaAdmin from '../components/admin/AuditoriaAdmin';

// COMPONENTE DE ANTROPOMETRÍA
import AntropometriaAdmin from '../components/admin/antropometria/AntropometriaAdmin';
import ParametrosAntropometria from '../components/admin/antropometria/ParametrosAntropometria';

import '../styles/pages/AdminDashboard.css';
import { useApplicationPermissions } from '../context/ApplicationPermissionsContext';

const TESTS_SECCIONES = {
  'tests-programados': 'tests',
  'tests-pruebas': 'catalogo',
  'tests-ranking': 'ranking',
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
  const routeActiveTab = {
    '/admin/dashboard': 'home',
    '/admin/asistencias': 'asistencias',
    '/admin/asistencias/registro': 'registro-asistencia',
    '/admin/evaluaciones': 'tests-programados',
    '/admin/tests/programados': 'tests-programados',
    '/admin/tests/pruebas': 'tests-pruebas',
    '/admin/tests/ranking': 'tests-ranking',
    '/admin/atletas': 'athletes',
    '/admin/antropometria/programar': 'antropometria-programar',
    '/admin/antropometria/datos': 'antropometria-datos',
    '/admin/configuracion/antropometria': 'parametros-antropometria',
    '/admin/prerregistro': 'prerregistro',
    '/admin/prerregistros-pendientes': 'prerregistros-pendientes',
    '/admin/roles-permisos': 'roles-permisos',
    '/admin/administradores': 'administradores',
    '/admin/entrenadores': 'entrenadores',
    '/admin/representantes': 'representantes',
    '/admin/areas-subareas': 'areas-subareas',
    '/admin/categorias': 'categorias',
    '/admin/mi-perfil': 'mi-perfil',
    '/admin/ejercicios': 'ejercicios',
    '/admin/reportes': 'reportes',
    '/admin/auditoria': 'auditoria',
  }[location.pathname];
  const effectiveTab = routeActiveTab || activeTab;

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
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

        {/* DASHBOARD HOME */}
        {effectiveTab === 'home' && (
          <DashboardView />
        )}

        {/* EVALUACIONES DEPORTIVAS */}
        {TESTS_SECCIONES[effectiveTab] && (
          <section className="dashboard-section">
            <TestsAdmin seccion={TESTS_SECCIONES[effectiveTab]} />
          </section>
        )}

        {/* CONTROL DE SUEÑO */}
        {(effectiveTab === 'sueño' || effectiveTab.startsWith('sueño_')) && (
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

        {/* EXCEL / CARGA MASIVA */}
        {effectiveTab === 'excel' && (
          <section className="dashboard-section">
            <h2>Cargar Datos desde Excel</h2>
          </section>
        )}

        {/* DISCIPLINAS */}
        {effectiveTab === 'disciplinas' && (
          <section className="dashboard-section">
            <h2>Gestión de Disciplinas</h2>
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
        {effectiveTab === 'roles-permisos' && (
          permissionsLoading ? (
            <section className="dashboard-section">Cargando permisos...</section>
          ) : hasPermission('gestionar_permisos') ? (
            <RolesPermisos />
          ) : (
            <section className="dashboard-section" role="alert">
              No tienes permiso para gestionar permisos.
            </section>
          )
        )}

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

              <div className="admin-gestion-acciones">
                <button
                  type="button"
                  className="admin-gestion-btn"
                  onClick={() => alert("Formulario para registrar nuevo entrenador")}
                >
                  <span>+</span> Registrar Entrenador
                </button>
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

              <div className="admin-gestion-acciones">
                <button
                  type="button"
                  className="admin-gestion-btn"
                  onClick={() => alert("Formulario para registrar nuevo representante")}
                >
                  <span>+</span> Registrar Representante
                </button>
              </div>
            </div>

            <RepresentantesViewAdmin />
          </section>
        )}

        {/* SECCIONES COMPLEMENTARIAS */}
        {effectiveTab === 'reportes' && <ReporteAdmin />}
        {effectiveTab === 'auditoria' && <AuditoriaAdmin />}
        {effectiveTab === 'areas-subareas' && (
          <section className="dashboard-section">
            <AreasSubareasAdmin />
          </section>
        )}
        {effectiveTab === 'mi-perfil' && <MiPerfilViewAdmin />}
        {effectiveTab === 'categorias' && <CategoriasDeportivasAdmin />}
        {effectiveTab === 'ejercicios' && <ExercisesAdmin />}

      </div>
    </MainNav>
  );
}