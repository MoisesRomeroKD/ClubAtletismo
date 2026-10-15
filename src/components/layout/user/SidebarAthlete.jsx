import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Zap,
  LogOut,
  ClipboardList,
  Clock3,
  Activity,
  FileText,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';

import '../../../styles/layouts/sidebar.css';

const athleteRoutePaths = {
  home: '/atleta/home',
  evaluaciones: '/atleta/evaluaciones',
  asistencias: '/atleta/asistencias',
  antropometria: '/atleta/antropometria',
  sueno: '/atleta/sueno',
  reportes: '/atleta/reportes',
  configuracion: '/atleta/configuracion',
  rutina: '/atleta/rutina',
};

export default function SidebarAthlete({
  isOpen,
  toggleSidebar,
  activeTab,
  onTabChange,
  onLogout,
  isDarkMode,
  onToggleTheme,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const routeActiveTab = Object.entries(athleteRoutePaths)
    .find(([, path]) => path === location.pathname)?.[0];
  const selectedTab = routeActiveTab || activeTab;
  const navItems = [
    { id: 'home', label: 'Mi Dashboard', icon: Home, category: 'principal' },
    { id: 'evaluaciones', label: 'Mis Evaluaciones', icon: ClipboardList, category: 'rendimiento' },
    { id: 'asistencias', label: 'Mis asistencias', icon: Clock3, category: 'rendimiento' },
    { id: 'antropometria', label: 'Antropometría', icon: Activity, category: 'rendimiento' },
    { id: 'sueno', label: 'Sueño y Fatiga', icon: Zap, category: 'rendimiento' }, // ID corregido
    { id: 'reportes', label: 'Mis Reportes', icon: FileText, category: 'info' },
    { id: 'configuracion', label: 'Configuración', icon: Settings, category: 'info' },
  ];

  const handleNavigation = (tab) => {
    const path = athleteRoutePaths[tab];
    if (path) {
      handleRouteNavigation(path, tab);
      return;
    }
    onTabChange(tab);
    if (isOpen && window.innerWidth < 1024) {
      toggleSidebar();
    }
  };

  const handleRouteNavigation = (path, tab) => {
    navigate(path);
    if (tab) onTabChange(tab);
    if (isOpen && window.innerWidth < 1024) {
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

  const renderNavGroup = (items) =>
    items.map((item) => {
      const Icon = item.icon;
      return (
        <div
          key={item.id}
          onClick={() => handleNavigation(item.id)}
          className={`user-sidebar__nav-item ${
            selectedTab === item.id ? 'is-active' : ''
          }`}
        >
          <Icon size={20} />
          <span className="user-sidebar__nav-label">{item.label}</span>
        </div>
      );
    });

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
        <nav className="user-sidebar__nav">
          <div className="user-sidebar__group-title">Principal</div>
          {renderNavGroup(navItems.filter((item) => item.category === 'principal'))}

          <div className="user-sidebar__group-title">Rendimiento</div>
          {renderNavGroup(navItems.filter((item) => item.category === 'rendimiento'))}

          <div className="user-sidebar__group-title">Información</div>
          {renderNavGroup(navItems.filter((item) => item.category === 'info'))}
        </nav>

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
            <span className="user-sidebar__nav-label">Cerrar sesión</span>
          </div>
        </div>
      </aside>
    </>
  );
}