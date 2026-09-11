import React, { useState } from 'react';

import MainNav from '../components/layout/user/MainNav';
import DashboardView from '../components/admin/dashboard/DashboardView';
import SleepQualityDashboard from '../components/admin/sleep/SleepQualityDashboard';
import AsistenciaAdminView from '../components/admin/asistencia/AsistenciaAdminView';
import AtletasViewAdmin from '../components/admin/AtletasViewAdmin';
import PrerregistrosPendientes from '../components/admin/PrerregistrosPendientes';
import Preregistro from '../components/admin/Preregistro';
import RolesPermisos from '../components/admin/RolesPermisos';
import AdminEvaluacionesView from '../components/admin/evaluacion/AdminEvaluacionesView';

// COMPONENTE DE ANTROPOMETRÍA
import CineantropometriaAdmin from '../components/admin/cineantropometria/CineantropometriaAdmin';

import '../styles/pages/AdminDashboard.css';

export default function AdminDashboard({
  currentAction,
  isDarkMode,
  onToggleTheme,
}) {
  const [activeTab, setActiveTab] = useState(currentAction || 'home');

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
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onLogout={handleLogout}
      isDarkMode={isDarkMode}
      onToggleTheme={onToggleTheme}
    >
      <div className="admin-dashboard-container">

        {/* DASHBOARD HOME */}
        {activeTab === 'home' && (
          <DashboardView />
        )}

        {/* EVALUACIONES DEPORTIVAS */}
        {(activeTab === 'evaluaciones' || activeTab === 'evaluacion') && (
          <section className="dashboard-section">
            <AdminEvaluacionesView />
          </section>
        )}

        {/* CONTROL DE SUEÑO */}
        {activeTab === 'sueño' && (
          <SleepQualityDashboard />
        )}

        {/* ANTROPOMETRÍA / CINEANTROPOMETRÍA */}
        {(activeTab === 'cineantropometria' || activeTab === 'antropometria' || activeTab === 'antropometria-view') && (
          <section className="dashboard-section">
            <CineantropometriaAdmin />
          </section>
        )}

        {/* EXCEL / CARGA MASIVA */}
        {activeTab === 'excel' && (
          <section className="dashboard-section">
            <h2>Cargar Datos desde Excel</h2>
          </section>
        )}

        {/* DISCIPLINAS */}
        {activeTab === 'disciplinas' && (
          <section className="dashboard-section">
            <h2>Gestión de Disciplinas</h2>
          </section>
        )}

        {/* ASISTENCIA */}
        {activeTab === 'asistencias' && (
          <AsistenciaAdminView />
        )}

        {/* ATLETAS */}
        {activeTab === 'athletes' && (
          <AtletasViewAdmin />
        )}

        {/* NUEVO PRERREGISTRO */}
        {activeTab === 'prerregistro' && (
          <Preregistro />
        )}

        {/* PRERREGISTROS PENDIENTES */}
        {activeTab === 'prerregistros-pendientes' && (
          <PrerregistrosPendientes />
        )}

        {/* ROLES Y PERMISOS */}
        {activeTab === 'roles-permisos' && (
          <RolesPermisos />
        )}

        {/* GESTIÓN DE ADMINISTRADORES */}
        {activeTab === 'administradores' && (
          <section className="dashboard-section" style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '12px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '2px solid #2A6BFF', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#111827', fontWeight: '800' }}>
                  Gestión de Administradores
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#6B7280', fontSize: '0.9rem' }}>
                  Personal con acceso y permisos de administración del sistema
                </p>
              </div>

              <button 
                type="button"
                style={{ backgroundColor: '#2A6BFF', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}
                onClick={() => alert("Función para registrar nuevo administrador.")}
              >
                + Registrar Administrador
              </button>
            </div>

            <div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#374151' }}>
                    <th style={{ padding: '12px 16px' }}>Nombre</th>
                    <th style={{ padding: '12px 16px' }}>Correo Electrónico</th>
                    <th style={{ padding: '12px 16px' }}>Rol</th>
                    <th style={{ padding: '12px 16px' }}>Estado</th>
                    <th style={{ padding: '12px 16px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#111827' }}>
                      {localStorage.getItem("user_name") || "administrador admin"}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#4B5563' }}>admin@clubatletismo.com</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ backgroundColor: '#E0E7FF', color: '#3730A3', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600' }}>
                        Super Admin
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: '#10B981', fontWeight: '600' }}>● Activo</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button style={{ background: 'none', border: 'none', color: '#2A6BFF', cursor: 'pointer', fontWeight: '600', marginRight: '10px' }}>Editar</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* GESTIÓN DE ENTRENADORES */}
        {activeTab === 'entrenadores' && (
          <section className="dashboard-section" style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '12px', width: '100%', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '2px solid #2A6BFF', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#111827', fontWeight: '800' }}>
                  Gestión de Entrenadores
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#6B7280', fontSize: '0.9rem' }}>
                  Directorio del cuerpo técnico, especialidades asignadas y atletas a cargo
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button 
                  type="button"
                  style={{ backgroundColor: '#2A6BFF', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => alert("Formulario para registrar nuevo entrenador")}
                >
                  <span>+</span> Registrar Entrenador
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#374151' }}>
                    <th style={{ padding: '12px 16px' }}>Cédula / ID</th>
                    <th style={{ padding: '12px 16px' }}>Nombre Completo</th>
                    <th style={{ padding: '12px 16px' }}>Especialidad / Área</th>
                    <th style={{ padding: '12px 16px' }}>Contacto</th>
                    <th style={{ padding: '12px 16px' }}>Atletas a Cargo</th>
                    <th style={{ padding: '12px 16px' }}>Estado</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#374151' }}>V-12345678</td>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#111827' }}>Carlos Mendoza</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ backgroundColor: '#E0E7FF', color: '#3730A3', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}>
                        Velocidad / 100m - 200m
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6B7280' }}>carlos.entrenador@club.com</td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#111827' }}>12 Atletas</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600' }}>
                        Activo
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button style={{ backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB', color: '#374151', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                        Editar / Asignar
                      </button>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#374151' }}>V-18765432</td>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#111827' }}>María Rodríguez</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}>
                        Lanzamiento / Martillo
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6B7280' }}>maria.lanzamiento@club.com</td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#111827' }}>8 Atletas</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600' }}>
                        Activo
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button style={{ backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB', color: '#374151', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                        Editar / Asignar
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* GESTIÓN DE REPRESENTANTES */}
        {activeTab === 'representantes' && (
          <section className="dashboard-section" style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '12px', width: '100%', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '2px solid #2A6BFF', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#111827', fontWeight: '800' }}>
                  Gestión de Representantes
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#6B7280', fontSize: '0.9rem' }}>
                  Directorio de padres, tutores legales y vinculación con atletas menores de edad
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button 
                  type="button"
                  style={{ backgroundColor: '#2A6BFF', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => alert("Formulario para registrar nuevo representante")}
                >
                  <span>+</span> Registrar Representante
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#374151' }}>
                    <th style={{ padding: '12px 16px' }}>Cédula / DNI</th>
                    <th style={{ padding: '12px 16px' }}>Nombre del Representante</th>
                    <th style={{ padding: '12px 16px' }}>Contacto / Teléfono</th>
                    <th style={{ padding: '12px 16px' }}>Parentesco</th>
                    <th style={{ padding: '12px 16px' }}>Atleta(s) Asoc.</th>
                    <th style={{ padding: '12px 16px' }}>Estado</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#374151' }}>V-14222333</td>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#111827' }}>José Pérez</td>
                    <td style={{ padding: '12px 16px', color: '#6B7280' }}>0414-1234567 | jose.perez@email.com</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ backgroundColor: '#F3F4F6', color: '#374151', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}>
                        Padre
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#2A6BFF' }}>Pedro Saltarín (Infantil)</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600' }}>
                        Activo
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button style={{ backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB', color: '#374151', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                        Editar / Vincular
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* SECCIONES COMPLEMENTARIAS */}
        {activeTab === 'reportes' && <section className="dashboard-section"><h2>Reportes</h2></section>}
        {activeTab === 'auditoria' && <section className="dashboard-section"><h2>Auditoría</h2></section>}
        {activeTab === 'areas-subareas' && <section className="dashboard-section"><h2>Áreas y Subáreas</h2></section>}
        {activeTab === 'categorias' && <section className="dashboard-section"><h2>Categorías</h2></section>}
        {activeTab === 'ejercicios' && <section className="dashboard-section"><h2>Ejercicios</h2></section>}

      </div>
    </MainNav>
  );
}