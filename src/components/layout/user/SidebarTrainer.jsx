import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  UserCheck,
  ClipboardList,
  ClipboardCheck,
  ListChecks,
  PlusCircle,
  ChartColumn,
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
  FileText,
} from 'lucide-react';

import '../../../styles/layouts/sidebar.css';
import { useApplicationPermissions } from '../../../context/ApplicationPermissionsContext';
import { puedeVerSeccionEntrenador } from './permisosEntrenador';

/*
 * Menú del entrenador con el mismo orden que el del administrador (Principal, Rendimiento e
 * Información y Control), pero con las secciones del entrenador.
 */
const trainerRoutePaths = {
  home: '/entrenador/home',
  perfil: '/entrenador/perfil',
  mis_atletas: '/entrenador/mis-atletas',
  asistencias: '/entrenador/asistencias',
  registro_asistencia: '/entrenador/asistencias/registro',
  mis_tests: '/entrenador/mis-tests',
  crear_test: '/entrenador/crear-test',
  tests_analisis: '/entrenador/tests-analisis',
  cine_programar: '/entrenador/cineantropometria/programar',
  cine_datos: '/entrenador/cineantropometria/datos',
  sueño_general: '/entrenador/sueno-general',
  sueño_individual: '/entrenador/sueno-individual',
  sueño_pendientes: '/entrenador/sueno-pendientes',
  rutina: '/entrenador/rutina',
  gestion_rutinas: '/entrenador/gestion-rutinas',
  reportes: '/entrenador/reportes',
};

const principalItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'mis_atletas', label: 'Mis Atletas', icon: Users },
];

const testsGroup = {
  id: 'tests',
  label: 'Tests',
  icon: ClipboardList,
  items: [
    { id: 'mis_tests', label: 'Mis tests', icon: ListChecks },
    { id: 'crear_test', label: 'Crear test', icon: PlusCircle },
    { id: 'tests_analisis', label: 'Análisis', icon: ChartColumn },
  ],
};

const cineGroup = {
  id: 'cine',
  label: 'Cineantropometría',
  icon: Activity,
  items: [
    { id: 'cine_programar', label: 'Programar medición', icon: CalendarClock },
    { id: 'cine_datos', label: 'Análisis', icon: ChartColumn },
  ],
};

const sleepGroup = {
  id: 'sueno',
  label: 'Sueño y Descanso',
  icon: MoonStar,
  items: [
    { id: 'sueño_general', label: 'Vista General', icon: LayoutDashboard },
    { id: 'sueño_individual', label: 'Detalle Individual', icon: Users },
    { id: 'sueño_pendientes', label: 'Pendientes', icon: AlertCircle },
  ],
};

const attendanceGroup = {
  id: 'asistencia',
  label: 'Asistencia',
  icon: UserCheck,
  items: [
    { id: 'asistencias', label: 'Análisis de asistencia', icon: UserCheck },
    { id: 'registro_asistencia', label: 'Registro de asistencia', icon: ClipboardCheck },
  ],
};

const routinesGroup = {
  id: 'rutinas',
  label: 'Rutinas',
  icon: Dumbbell,
  items: [
    { id: 'rutina', label: 'Crear Rutinas', icon: Dumbbell },
    { id: 'gestion_rutinas', label: 'Ver Rutinas Asignadas', icon: FolderOpen },
  ],
};

const infoItems = [
  { id: 'reportes', label: 'Reportes', icon: FileText },
];

const rendimientoGroups = [testsGroup, cineGroup, sleepGroup, attendanceGroup, routinesGroup];

// Grupo que se abre solo según la página actual.
const grupoDeRuta = (path) => {
  const tab = Object.entries(trainerRoutePaths).find(([, ruta]) => ruta === path)?.[0];
  return rendimientoGroups.find((group) => group.items.some((item) => item.id === tab))?.id;
};

export default function SidebarTrainer({
  isOpen,
  toggleSidebar,
  activeTab,
  onTabChange,
}) {
  const [openGroups, setOpenGroups] = useState(() => {
    const grupo = grupoDeRuta(window.location.pathname);
    return grupo ? { [grupo]: true } : {};
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = useApplicationPermissions();
  // Cada opción pide el permiso de su sección (permisosEntrenador.js); los grupos vacíos se ocultan.
  const conPermiso = (item) => puedeVerSeccionEntrenador(item.id, hasPermission);
  const routeActiveTab = Object.entries(trainerRoutePaths)
    .find(([, path]) => path === location.pathname)?.[0];
  const selectedTab = routeActiveTab || activeTab;

  const handleNavigation = (tab) => {
    const path = trainerRoutePaths[tab];
    if (path) navigate(path);
    onTabChange(tab);
    if (isOpen) toggleSidebar();
  };

  const toggleGroup = (groupId) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const renderNavGroup = (items) =>
    items.filter(conPermiso).map((item) => {
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
    });

  const renderCollapsibleGroup = (group) => {
    const visibleItems = group.items.filter(conPermiso);
    if (visibleItems.length === 0) return null;
    const isGroupOpen = Boolean(openGroups[group.id]);
    const GroupIcon = group.icon;

    return (
      <div className="user-sidebar__group" key={group.id}>
        <button
          type="button"
          className={`user-sidebar__nav-item user-sidebar__button user-sidebar__group-header ${isGroupOpen ? 'is-open' : ''}`}
          onClick={() => toggleGroup(group.id)}
        >
          <div className="user-sidebar__group-title-wrapper">
            <GroupIcon size={20} />
            <span className="user-sidebar__nav-label">{group.label}</span>
          </div>
          {isGroupOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {isGroupOpen && (
          <div className="user-sidebar__submenu">
            {visibleItems.map((item) => {
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

  const rendimientoVisible = rendimientoGroups.some((group) => group.items.some(conPermiso));
  const informacionVisible = infoItems.some(conPermiso);

  return (
    <>
      {isOpen && <div className="user-sidebar-backdrop" onClick={toggleSidebar} />}

      <aside className={`user-sidebar ${isOpen ? 'user-sidebar--mobile-open' : ''}`}>
        <nav className="user-sidebar__nav">
          {/* PRINCIPAL */}
          <div className="user-sidebar__group-title">Principal</div>
          {renderNavGroup(principalItems)}

          {/* RENDIMIENTO */}
          {rendimientoVisible && <div className="user-sidebar__group-title">Rendimiento</div>}
          {rendimientoGroups.map(renderCollapsibleGroup)}

          {/* INFORMACIÓN Y CONTROL */}
          {informacionVisible && <div className="user-sidebar__group-title">Información y Control</div>}
          {renderNavGroup(infoItems)}
        </nav>
      </aside>
    </>
  );
}
