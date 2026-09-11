import React, { useState } from 'react';
import {
  Home,
  Zap,
  UserCheck,
  ClipboardList,
  Dumbbell,
  FolderOpen,
  X,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  MoonStar,
  LayoutDashboard,
  Users,
  FileText,
  PlusCircle,
  AlertCircle,
  Activity,
  User,
} from 'lucide-react';

import '../../../styles/layouts/sidebar.css';

export default function SidebarTrainer({
  isOpen,
  toggleSidebar,
  activeTab,
  onTabChange,
  onLogout,
  isDarkMode,
  onToggleTheme,
}) {
  const [isRoutinesOpen, setIsRoutinesOpen] = useState(false);
  const [isSleepOpen, setIsSleepOpen] = useState(false);

  // Items principales de navegación
  const navItems = [
    {
      id: 'home',
      label: 'Inicio',
      icon: Home,
    },
    {
      id: 'perfil',
      label: 'Perfil',
      icon: User,
    },
    {
      id: 'mis_atletas',
      label: 'Mis Atletas',
      icon: Users,
    },
    {
      id: 'subareas',
      label: 'SubÁreas',
      icon: FolderOpen,
    },
    {
      id: 'asistencias',
      label: 'Asistencias',
      icon: UserCheck,
    },
    {
      id: 'asignar_test',
      label: 'Tests',
      icon: ClipboardList,
    },
    {
      id: 'cineantropometria',
      label: 'Cineantropometría',
      icon: Activity,
    },
  ];

  const handleNavigation = (tab) => {
    onTabChange(tab);
    if (isOpen) {
      toggleSidebar();
    }
  };

  const handleLogoutClick = () => {
    localStorage.clear();
    if (onLogout && typeof onLogout === 'function') {
      onLogout();
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="user-sidebar-backdrop"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`user-sidebar ${
          isOpen ? 'user-sidebar--mobile-open' : ''
        }`}
      >
        {/* HEADER */}
        <div className="user-sidebar__header">
          <Zap className="user-sidebar__logo-icon" size={28} />
          <span className="user-sidebar__title">SportSync</span>
          <button
            type="button"
            className="user-sidebar__mobile-menu-btn"
            aria-label="Cerrar menú"
            onClick={toggleSidebar}
          >
            <X size={24} />
          </button>
        </div>

        {/* NAVEGACIÓN */}
        <nav className="user-sidebar__nav">
          <div className="user-sidebar__group-title">Principal</div>

          {/* Menú Principal Trainer */}
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`user-sidebar__nav-item ${
                  activeTab === item.id ? 'is-active' : ''
                }`}
              >
                <Icon size={20} />
                <span className="user-sidebar__nav-label">
                  {item.label}
                </span>
              </div>
            );
          })}

          {/* Submenú Desplegable: SUEÑO Y DESCANSO */}
          <div className="user-sidebar__group">
            <button
              type="button"
              className={`user-sidebar__nav-item ${
                isSleepOpen ? 'is-open' : ''
              }`}
              onClick={() => setIsSleepOpen(!isSleepOpen)}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <MoonStar size={20} />
                <span className="user-sidebar__nav-label">Sueño y Descanso</span>
              </div>

              {isSleepOpen ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>

            {isSleepOpen && (
              <div
                className="user-sidebar__submenu"
                style={{
                  paddingLeft: '40px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <button
                  type="button"
                  className={`user-sidebar__sub-btn ${
                    activeTab === 'sueño_general' ? 'is-active' : ''
                  }`}
                  onClick={() => handleNavigation('sueño_general')}
                >
                  <LayoutDashboard size={16} />
                  <span>Vista General</span>
                </button>

                <button
                  type="button"
                  className={`user-sidebar__sub-btn ${
                    activeTab === 'sueño_individual' ? 'is-active' : ''
                  }`}
                  onClick={() => handleNavigation('sueño_individual')}
                >
                  <Users size={16} />
                  <span>Detalle Individual</span>
                </button>

                <button
                  type="button"
                  className={`user-sidebar__sub-btn ${
                    activeTab === 'sueño_pendientes' ? 'is-active' : ''
                  }`}
                  onClick={() => handleNavigation('sueño_pendientes')}
                >
                  <AlertCircle size={16} />
                  <span>Pendientes de Hoy</span>
                </button>

                <button
                  type="button"
                  className={`user-sidebar__sub-btn ${
                    activeTab === 'sueño_auditoria' ? 'is-active' : ''
                  }`}
                  onClick={() => handleNavigation('sueño_auditoria')}
                >
                  <FileText size={16} />
                  <span>Historial y Autores</span>
                </button>

                <button
                  type="button"
                  className={`user-sidebar__sub-btn ${
                    activeTab === 'sueño_registro' ? 'is-active' : ''
                  }`}
                  onClick={() => handleNavigation('sueño_registro')}
                >
                  <PlusCircle size={16} />
                  <span>Registrar Sueño</span>
                </button>
              </div>
            )}
          </div>

          {/* Submenú Desplegable: RUTINAS */}
          <div className="user-sidebar__group">
            <button
              type="button"
              className={`user-sidebar__nav-item ${
                isRoutinesOpen ? 'is-open' : ''
              }`}
              onClick={() => setIsRoutinesOpen(!isRoutinesOpen)}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Dumbbell size={20} />
                <span className="user-sidebar__nav-label">Rutinas</span>
              </div>

              {isRoutinesOpen ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>

            {isRoutinesOpen && (
              <div
                className="user-sidebar__submenu"
                style={{
                  paddingLeft: '40px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <button
                  type="button"
                  className={`user-sidebar__sub-btn ${
                    activeTab === 'rutina' ? 'is-active' : ''
                  }`}
                  onClick={() => handleNavigation('rutina')}
                >
                  <Dumbbell size={16} />
                  <span>Crear Rutinas</span>
                </button>

                <button
                  type="button"
                  className={`user-sidebar__sub-btn ${
                    activeTab === 'gestion_rutinas' ? 'is-active' : ''
                  }`}
                  onClick={() => handleNavigation('gestion_rutinas')}
                >
                  <FolderOpen size={16} />
                  <span>Ver Rutinas Asignadas</span>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* FOOTER */}
        <div className="user-sidebar__footer">
          <div
            onClick={onToggleTheme}
            className="user-sidebar__nav-item user-sidebar__theme-toggle"
            style={{ marginBottom: '0.5rem' }}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span className="user-sidebar__nav-label">
              {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
            </span>
          </div>

          <div
            onClick={handleLogoutClick}
            className="user-sidebar__nav-item"
            style={{ color: 'var(--accent-danger, #ff4d4d)' }}
          >
            <LogOut size={20} />
            <span className="user-sidebar__nav-label">
              Cerrar sesión
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}