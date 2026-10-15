import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  AlertCircle,
  Activity,
  User,
  FileText,
} from 'lucide-react';

import '../../../styles/layouts/sidebar.css';
import { useApplicationPermissions } from '../../../context/ApplicationPermissionsContext';

const trainerRoutePaths = {
  home: '/entrenador/home',
  perfil: '/entrenador/perfil',
  mis_atletas: '/entrenador/mis-atletas',
  subareas: '/entrenador/subareas',
  asistencias: '/entrenador/asistencias',
  asignar_test: '/entrenador/asignar-test',
  cineantropometria: '/entrenador/cineantropometria',
  sueño_general: '/entrenador/sueno-general',
  sueño_individual: '/entrenador/sueno-individual',
  sueño_pendientes: '/entrenador/sueno-pendientes',
  rutina: '/entrenador/rutina',
  gestion_rutinas: '/entrenador/gestion-rutinas',
  reportes: '/entrenador/reportes',
};

const navItems = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'mis_atletas', label: 'Mis Atletas', icon: Users },
  { id: 'subareas', label: 'SubÁreas', icon: FolderOpen },
  { id: 'asistencias', label: 'Análisis de asistencia', icon: UserCheck },
  { id: 'asignar_test', label: 'Tests', icon: ClipboardList },
  { id: 'cineantropometria', label: 'Cineantropometría', icon: Activity },
  { id: 'reportes', label: 'Reportes', icon: FileText, permission: 'ver_reportes' },
];

export default function SidebarTrainer({
  isOpen,
  toggleSidebar,
  activeTab,
  onTabChange,
  onLogout,
  isDarkMode,
  onToggleTheme,
}) {
  const [isRoutinesOpen, setIsRoutinesOpen] = useState(() => {
    const path = window.location.pathname;
    return path.includes('/entrenador/rutina') || path.includes('/entrenador/gestion-rutinas');
  });
  const [isSleepOpen, setIsSleepOpen] = useState(
    () => window.location.pathname.includes('/entrenador/sueno-')
  );
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = useApplicationPermissions();
  const visibleNavItems = navItems.filter((item) => !item.permission || hasPermission(item.permission));
  const routeActiveTab = Object.entries(trainerRoutePaths)
    .find(([, path]) => path === location.pathname)?.[0];
  const selectedTab = routeActiveTab || activeTab;

  const handleRouteNavigation = (path, tab) => {
    navigate(path);
    if (tab) onTabChange(tab);
    if (isOpen) toggleSidebar();
  };

  const handleNavigation = (tab) => {
    const path = trainerRoutePaths[tab];
    if (path) {
      handleRouteNavigation(path, tab);
      return;
    }
    onTabChange(tab);
    if (isOpen) toggleSidebar();
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
      {isOpen && <div className="user-sidebar-backdrop" onClick={toggleSidebar} />}

      <aside className={`user-sidebar ${isOpen ? 'user-sidebar--mobile-open' : ''}`}>
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

        <nav className="user-sidebar__nav">
          <div className="user-sidebar__group-title">Principal</div>
          {visibleNavItems.map((navItem) => {
            const NavIcon = navItem.icon;
            return (
              <div
                key={navItem.id}
                onClick={() => handleNavigation(navItem.id)}
                className={`user-sidebar__nav-item ${selectedTab === navItem.id ? 'is-active' : ''}`}
              >
                <NavIcon size={20} />
                <span className="user-sidebar__nav-label">{navItem.label}</span>
              </div>
            );
          })}

          <div className="user-sidebar__group">
            <button
              type="button"
              className={`user-sidebar__nav-item ${isSleepOpen ? 'is-open' : ''}`}
              onClick={() => setIsSleepOpen((isOpenNow) => !isOpenNow)}
              style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MoonStar size={20} />
                <span className="user-sidebar__nav-label">Sueño y Descanso</span>
              </div>
              {isSleepOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {isSleepOpen && (
              <div className="user-sidebar__submenu" style={{ paddingLeft: '40px', display: 'flex', flexDirection: 'column' }}>
                <button type="button" className={`user-sidebar__sub-btn ${selectedTab === 'sueño_general' ? 'is-active' : ''}`} onClick={() => handleNavigation('sueño_general')}>
                  <LayoutDashboard size={16} /><span>Vista General</span>
                </button>
                <button type="button" className={`user-sidebar__sub-btn ${selectedTab === 'sueño_individual' ? 'is-active' : ''}`} onClick={() => handleNavigation('sueño_individual')}>
                  <Users size={16} /><span>Detalle Individual</span>
                </button>
                <button type="button" className={`user-sidebar__sub-btn ${selectedTab === 'sueño_pendientes' ? 'is-active' : ''}`} onClick={() => handleNavigation('sueño_pendientes')}>
                  <AlertCircle size={16} /><span>Pendientes</span>
                </button>
              </div>
            )}
          </div>

          <div className="user-sidebar__group">
            <button
              type="button"
              className={`user-sidebar__nav-item ${isRoutinesOpen ? 'is-open' : ''}`}
              onClick={() => setIsRoutinesOpen((isOpenNow) => !isOpenNow)}
              style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Dumbbell size={20} />
                <span className="user-sidebar__nav-label">Rutinas</span>
              </div>
              {isRoutinesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {isRoutinesOpen && (
              <div className="user-sidebar__submenu" style={{ paddingLeft: '40px', display: 'flex', flexDirection: 'column' }}>
                <button type="button" className={`user-sidebar__sub-btn ${selectedTab === 'rutina' ? 'is-active' : ''}`} onClick={() => handleNavigation('rutina')}>
                  <Dumbbell size={16} /><span>Crear Rutinas</span>
                </button>
                <button type="button" className={`user-sidebar__sub-btn ${selectedTab === 'gestion_rutinas' ? 'is-active' : ''}`} onClick={() => handleNavigation('gestion_rutinas')}>
                  <FolderOpen size={16} /><span>Ver Rutinas Asignadas</span>
                </button>
              </div>
            )}
          </div>
        </nav>

        <div className="user-sidebar__footer">
          <div onClick={onToggleTheme} className="user-sidebar__nav-item user-sidebar__theme-toggle" style={{ marginBottom: '0.5rem' }}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span className="user-sidebar__nav-label">{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
          </div>
          <div onClick={handleLogoutClick} className="user-sidebar__nav-item" style={{ color: 'var(--accent-danger, #ff4d4d)' }}>
            <LogOut size={20} />
            <span className="user-sidebar__nav-label">Cerrar sesión</span>
          </div>
        </div>
      </aside>
    </>
  );
}