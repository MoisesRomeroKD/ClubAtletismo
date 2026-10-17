import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Zap,
  ClipboardList,
  Clock3,
  Activity,
  UserRound,
  History,
} from 'lucide-react';

import '../../../styles/layouts/sidebar.css';

const athleteRoutePaths = {
  home: '/atleta/home',
  tests: '/atleta/tests',
  asistencias: '/atleta/asistencias',
  antropometria: '/atleta/antropometria',
  sueno: '/atleta/sueno',
  sueno_historial: '/atleta/sueno-historial',
  perfil: '/atleta/perfil',
  rutina: '/atleta/rutina',
};

export default function SidebarAthlete({
  isOpen,
  toggleSidebar,
  activeTab,
  onTabChange,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const routeActiveTab = Object.entries(athleteRoutePaths)
    .find(([, path]) => path === location.pathname)?.[0];
  const selectedTab = routeActiveTab || activeTab;
  const navItems = [
    { id: 'home', label: 'Home', icon: Home, category: 'principal' },
    { id: 'tests', label: 'Tests', icon: ClipboardList, category: 'rendimiento' },
    { id: 'asistencias', label: 'Mis asistencias', icon: Clock3, category: 'rendimiento' },
    { id: 'antropometria', label: 'Antropometría', icon: Activity, category: 'rendimiento' },
    { id: 'sueno', label: 'Sueño y Fatiga', icon: Zap, category: 'rendimiento' }, // ID corregido
    { id: 'sueno_historial', label: 'Historial de sueño', icon: History, category: 'rendimiento' },
    { id: 'perfil', label: 'Mi perfil', icon: UserRound, category: 'info' },
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

      </aside>
    </>
  );
}