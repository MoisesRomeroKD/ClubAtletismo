import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  ClipboardList,
  Clock3,
  Activity,
  History,
  MoonStar,
  PenLine,
  Dumbbell,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

import '../../../styles/layouts/sidebar.css';

/*
 * Menú del atleta con el mismo orden que el del administrador (Principal y Rendimiento),
 * pero con las secciones del atleta.
 */
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

const principalItems = [
  { id: 'home', label: 'Home', icon: Home },
];

// Rendimiento, en el orden del administrador: Tests, Cineantropometría, Sueño y Descanso, Asistencia.
const rendimiento = [
  { id: 'tests', label: 'Tests', icon: ClipboardList },
  { id: 'antropometria', label: 'Cineantropometría', icon: Activity },
  {
    id: 'grupo_sueno',
    label: 'Sueño y Descanso',
    icon: MoonStar,
    items: [
      { id: 'sueno', label: 'Registrar sueño', icon: PenLine },
      { id: 'sueno_historial', label: 'Mi análisis de sueño', icon: History },
    ],
  },
  { id: 'asistencias', label: 'Mi análisis de asistencia', icon: Clock3 },
  { id: 'rutina', label: 'Mi rutina', icon: Dumbbell },
];

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
  const [suenoAbierto, setSuenoAbierto] = useState(
    () => ['/atleta/sueno', '/atleta/sueno-historial'].includes(window.location.pathname),
  );

  const handleNavigation = (tab) => {
    const path = athleteRoutePaths[tab];
    if (path) navigate(path);
    onTabChange(tab);
    if (isOpen && window.innerWidth < 1024) {
      toggleSidebar();
    }
  };

  const renderItem = (item) => {
    const Icon = item.icon;
    return (
      <div
        key={item.id}
        onClick={() => handleNavigation(item.id)}
        className={`user-sidebar__nav-item ${selectedTab === item.id ? 'is-active' : ''}`}
      >
        <Icon size={20} />
        <span className="user-sidebar__nav-label">{item.label}</span>
      </div>
    );
  };

  const renderGrupo = (grupo) => {
    const GroupIcon = grupo.icon;
    return (
      <div className="user-sidebar__group" key={grupo.id}>
        <button
          type="button"
          className={`user-sidebar__nav-item user-sidebar__button user-sidebar__group-header ${suenoAbierto ? 'is-open' : ''}`}
          onClick={() => setSuenoAbierto((abierto) => !abierto)}
        >
          <div className="user-sidebar__group-title-wrapper">
            <GroupIcon size={20} />
            <span className="user-sidebar__nav-label">{grupo.label}</span>
          </div>
          {suenoAbierto ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {suenoAbierto && (
          <div className="user-sidebar__submenu">
            {grupo.items.map((item) => {
              const ItemIcon = item.icon;
              return (
                <button
                  type="button"
                  key={item.id}
                  className={`user-sidebar__sub-btn ${selectedTab === item.id ? 'is-active' : ''}`}
                  onClick={() => handleNavigation(item.id)}
                >
                  <ItemIcon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {isOpen && (
        <div className="user-sidebar-backdrop" onClick={toggleSidebar} />
      )}

      <aside className={`user-sidebar ${isOpen ? 'user-sidebar--mobile-open' : ''}`}>
        <nav className="user-sidebar__nav">
          {/* PRINCIPAL */}
          <div className="user-sidebar__group-title">Principal</div>
          {principalItems.map(renderItem)}

          {/* RENDIMIENTO */}
          <div className="user-sidebar__group-title">Rendimiento</div>
          {rendimiento.map((item) => (item.items ? renderGrupo(item) : renderItem(item)))}
        </nav>
      </aside>
    </>
  );
}
