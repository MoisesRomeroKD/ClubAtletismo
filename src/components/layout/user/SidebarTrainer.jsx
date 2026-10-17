import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  UserCheck,
  ClipboardList,
  ListChecks,
  PlusCircle,
  Award,
  Dumbbell,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  MoonStar,
  LayoutDashboard,
  Users,
  AlertCircle,
  Activity,
  CalendarClock,
  Database,
  User,
  FileText,
} from 'lucide-react';

import '../../../styles/layouts/sidebar.css';
import { useApplicationPermissions } from '../../../context/ApplicationPermissionsContext';

const trainerRoutePaths = {
  home: '/entrenador/home',
  perfil: '/entrenador/perfil',
  mis_atletas: '/entrenador/mis-atletas',
  asistencias: '/entrenador/asistencias',
  mis_tests: '/entrenador/mis-tests',
  crear_test: '/entrenador/crear-test',
  tests_resultados: '/entrenador/tests-resultados',
  cineantropometria: '/entrenador/cineantropometria',
  cine_programar: '/entrenador/cineantropometria/programar',
  cine_datos: '/entrenador/cineantropometria/datos',
  sueño_general: '/entrenador/sueno-general',
  sueño_individual: '/entrenador/sueno-individual',
  sueño_pendientes: '/entrenador/sueno-pendientes',
  rutina: '/entrenador/rutina',
  gestion_rutinas: '/entrenador/gestion-rutinas',
  reportes: '/entrenador/reportes',
};

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'mis_atletas', label: 'Mis Atletas', icon: Users },
  { id: 'asistencias', label: 'Análisis de asistencia', icon: UserCheck },
  {
    id: 'tests', label: 'Tests', icon: ClipboardList,
    grupo: [
      { id: 'mis_tests', label: 'Mis tests', icon: ListChecks },
      { id: 'crear_test', label: 'Crear test', icon: PlusCircle },
      { id: 'tests_resultados', label: 'Resultados', icon: Award },
    ],
  },
  {
    id: 'cine', label: 'Cineantropometría', icon: Activity,
    grupo: [
      { id: 'cineantropometria', label: 'Panel', icon: Activity },
      { id: 'cine_programar', label: 'Programar medición', icon: CalendarClock },
      { id: 'cine_datos', label: 'Datos registrados', icon: Database },
    ],
  },
  { id: 'reportes', label: 'Reportes', icon: FileText },
];

export default function SidebarTrainer({
  isOpen,
  toggleSidebar,
  activeTab,
  onTabChange,
}) {
  const [isRoutinesOpen, setIsRoutinesOpen] = useState(() => {
    const path = window.location.pathname;
    return path.includes('/entrenador/rutina') || path.includes('/entrenador/gestion-rutinas');
  });
  const [gruposAbiertos, setGruposAbiertos] = useState(() => ({
    tests: ['/entrenador/mis-tests', '/entrenador/crear-test', '/entrenador/tests-resultados'].includes(window.location.pathname),
    cine: window.location.pathname.startsWith('/entrenador/cineantropometria'),
  }));
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

  return (
    <>
      {isOpen && <div className="user-sidebar-backdrop" onClick={toggleSidebar} />}

      <aside className={`user-sidebar ${isOpen ? 'user-sidebar--mobile-open' : ''}`}>
        <nav className="user-sidebar__nav">
          <div className="user-sidebar__group-title">Principal</div>
          {visibleNavItems.map((navItem) => {
            const NavIcon = navItem.icon;
            // Tests y Cineantropometría son grupos desplegables con sus opciones.
            if (navItem.grupo) {
              const isGroupOpen = Boolean(gruposAbiertos[navItem.id]);
              return (
                <div key={navItem.id} className="user-sidebar__group">
                  <button
                    type="button"
                    className={`user-sidebar__nav-item ${isGroupOpen ? 'is-open' : ''}`}
                    onClick={() => setGruposAbiertos((abiertos) => ({ ...abiertos, [navItem.id]: !abiertos[navItem.id] }))}
                    style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <NavIcon size={20} />
                      <span className="user-sidebar__nav-label">{navItem.label}</span>
                    </div>
                    {isGroupOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  {isGroupOpen && (
                    <div className="user-sidebar__submenu" style={{ paddingLeft: '40px', display: 'flex', flexDirection: 'column' }}>
                      {navItem.grupo.map((subItem) => {
                        const SubIcon = subItem.icon;
                        return (
                          <button
                            key={subItem.id}
                            type="button"
                            className={`user-sidebar__sub-btn ${selectedTab === subItem.id ? 'is-active' : ''}`}
                            onClick={() => handleNavigation(subItem.id)}
                          >
                            <SubIcon size={16} /><span>{subItem.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
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

      </aside>
    </>
  );
}