import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  Home,
  Users,
  Zap,
  ChevronDown,
  ChevronRight,
  UserCheck,
  ShieldCheck,
  ClipboardList,
  Clock3,
  Activity,
  FileText,
  Settings,
  Tag,
  Grid3x3,
  Dumbbell,
  MoonStar,
  LayoutDashboard,
  ChartColumn,
  AlertCircle,
  CalendarClock,
  SlidersHorizontal,
  FileSignature,
  Accessibility,
  PlusCircle,
} from 'lucide-react';

import '../../../styles/layouts/sidebar.css';
import { useApplicationPermissions } from '../../../context/ApplicationPermissionsContext';
import { puedeVerSeccionAdmin } from './permisosAdmin';

const navItems = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    category: 'principal',
  },
  {
    id: 'auditoria',
    label: 'Auditoría',
    icon: ShieldCheck,
    category: 'info',
  },
];

// Reportería: reportes y constancias de entrenamiento (estas, con el permiso emitir_constancias).
const reporteriaGroup = {
  id: 'reporteria',
  label: 'Reportería',
  icon: FileText,
  items: [
    { id: 'reportes', label: 'Reportes', icon: FileText },
    { id: 'constancias', label: 'Gestión de Constancias', icon: FileSignature },
  ],
};

// Planes de entrenamiento de los entrenadores (solo consulta), al final de Rendimiento como en el entrenador.
const planesItems = [
  { id: 'planes-entrenamiento', label: 'Planes de entrenamiento', icon: Dumbbell },
];

const attendanceGroup = {
  id: 'asistencia',
  label: 'Asistencia',
  icon: Clock3,
  items: [
    { id: 'asistencia_general', label: 'Vista General', icon: LayoutDashboard },
    { id: 'asistencia_individual', label: 'Detalle Individual', icon: Users },
    { id: 'registro-asistencia', label: 'Registro de asistencia', icon: ClipboardList },
  ],
};

const testsGroup = {
  id: 'testsAdmin',
  label: 'Tests',
  icon: ClipboardList,
  items: [
    { id: 'tests-programados', label: 'Tests programados', icon: CalendarClock },
    { id: 'tests-crear', label: 'Crear test', icon: PlusCircle },
    { id: 'tests-analisis', label: 'Análisis', icon: ChartColumn },
  ],
};

const antropometriaGroup = {
  id: 'antropometriaAdmin',
  label: 'Cineantropometría',
  icon: Activity,
  items: [
    { id: 'antropometria-programar', label: 'Mediciones', icon: CalendarClock },
    { id: 'antropometria-datos', label: 'Análisis', icon: ChartColumn },
  ],
};

const sleepGroup = {
  id: 'suenoAdmin',
  label: 'Sueño y Descanso',
  icon: MoonStar,
  items: [
    { id: 'sueño_general', label: 'Vista General', icon: LayoutDashboard },
    { id: 'sueño_individual', label: 'Detalle Individual', icon: Users },
    { id: 'sueño_pendientes', label: 'Pendientes', icon: AlertCircle },
  ],
};

const collapsibleGroups = [
  // =====================================================
  // PANEL DE USUARIOS
  // =====================================================
  {
    id: 'panelUsuarios',
    label: 'Panel de Usuarios',
    icon: Users,
    items: [
      {
        id: 'prerregistro',
        label: 'Nuevo Prerregistro',
        icon: UserCheck,
      },
      {
        id: 'prerregistros-pendientes',
        label: 'Prerregistros Pendientes',
        icon: ClipboardList,
      },
      {
        id: 'roles-permisos',
        label: 'Roles y Permisos',
        icon: ShieldCheck,
      },
    ],
  },

  // =====================================================
  // GESTIÓN DE PERSONAL
  // =====================================================
  {
    id: 'gestionPersonal',
    label: 'Gestión de Personal',
    icon: UserCheck,
    items: [
      {
        id: 'administradores',
        label: 'Administradores',
        icon: ShieldCheck,
      },
      {
        id: 'athletes',
        label: 'Atletas',
        icon: Zap,
      },
      {
        id: 'entrenadores',
        label: 'Entrenadores',
        icon: UserCheck,
      },
      {
        id: 'representantes',
        label: 'Representantes',
        icon: Users,
      },
    ],
  },

  // =====================================================
  // CONFIGURACIÓN
  // =====================================================
  {
    id: 'configuracion',
    label: 'Configuración',
    icon: Settings,
    items: [
      {
        id: 'areas-subareas',
        label: 'Áreas y Subáreas',
        icon: Grid3x3,
      },
      {
        id: 'categorias',
        label: 'Categorías',
        icon: Tag,
      },
      {
        // Catálogo de discapacidades (permiso gestionar_discapacidades).
        id: 'discapacidades',
        label: 'Discapacidades',
        icon: Accessibility,
      },
      {
        id: 'ejercicios',
        label: 'Ejercicios',
        icon: Dumbbell,
      },
      {
        id: 'parametros-antropometria',
        label: 'Parámetros de cineantropometría',
        icon: SlidersHorizontal,
      },
    ],
  },
];

export const getAdminSidebarModules = (hasPermission) => {
  const menuItems = [
    ...navItems.filter((item) => item.category === 'principal'),
    ...collapsibleGroups[0].items,
    ...collapsibleGroups[1].items,
    ...testsGroup.items,
    ...antropometriaGroup.items,
    ...navItems.filter((item) => item.category === 'rendimiento'),
    ...sleepGroup.items,
    ...attendanceGroup.items,
    ...planesItems,
    ...reporteriaGroup.items,
    ...navItems.filter((item) => item.category === 'info'),
    ...collapsibleGroups[2].items,
  ];

  // Solo las secciones que el usuario puede ver (permisos en permisosAdmin.js).
  return menuItems.filter((item) => puedeVerSeccionAdmin(item.id, hasPermission));
};

export default function SidebarAdmin({
  isOpen,
  toggleSidebar,
  activeTab,
  onTabChange,
}) {
  const { hasPermission } = useApplicationPermissions();
  const [openGroups, setOpenGroups] = useState(() => {
    const currentPath = window.location.pathname;

    if (['/admin/prerregistro', '/admin/prerregistros-pendientes', '/admin/roles-permisos'].includes(currentPath)) {
      return { panelUsuarios: true };
    }
    if (['/admin/administradores', '/admin/entrenadores', '/admin/representantes'].includes(currentPath)) {
      return { gestionPersonal: true };
    }
    if (currentPath === '/admin/areas-subareas') {
      return { configuracion: true };
    }
    if (['/admin/categorias', '/admin/discapacidades', '/admin/configuracion/antropometria'].includes(currentPath)) {
      return { configuracion: true };
    }
    if (currentPath.startsWith('/admin/antropometria') || currentPath === '/admin/cineantropometria') {
      return { antropometriaAdmin: true };
    }
    if (currentPath.startsWith('/admin/tests') || currentPath === '/admin/evaluaciones') {
      return { testsAdmin: true };
    }
    if (currentPath.startsWith('/admin/asistencias')) {
      return { asistencia: true };
    }
    if (currentPath === '/admin/reportes' || currentPath === '/admin/constancias') {
      return { reporteria: true };
    }
    if (activeTab?.startsWith('sueño_')) {
      return { suenoAdmin: true };
    }
    return {};
  });
  const location = useLocation();
  const navigate = useNavigate();
  const routePaths = {
    home: '/admin/home',
    asistencia_general: '/admin/asistencias/general',
    asistencia_individual: '/admin/asistencias/individual',
    'registro-asistencia': '/admin/asistencias/registro',
    'tests-programados': '/admin/tests/programados',
    'tests-crear': '/admin/tests/crear',
    'planes-entrenamiento': '/admin/planes',
    'tests-analisis': '/admin/tests/analisis',
    athletes: '/admin/atletas',
    'antropometria-programar': '/admin/antropometria/programar',
    'antropometria-datos': '/admin/antropometria/datos',
    'parametros-antropometria': '/admin/configuracion/antropometria',
    'sueño_general': '/admin/sueno/general',
    'sueño_individual': '/admin/sueno/individual',
    'sueño_pendientes': '/admin/sueno/pendientes',
    categorias: '/admin/categorias',
    discapacidades: '/admin/discapacidades',
    prerregistro: '/admin/prerregistro',
    'prerregistros-pendientes': '/admin/prerregistros-pendientes',
    'roles-permisos': '/admin/roles-permisos',
    administradores: '/admin/administradores',
    entrenadores: '/admin/entrenadores',
    representantes: '/admin/representantes',
    'areas-subareas': '/admin/areas-subareas',
    'mi-perfil': '/admin/mi-perfil',
    ejercicios: '/admin/ejercicios',
    reportes: '/admin/reportes',
    auditoria: '/admin/auditoria',
    constancias: '/admin/constancias',
  };
  const routeActiveTab = Object.entries(routePaths).find(([, path]) => path === location.pathname)?.[0];
  const selectedTab = routeActiveTab || activeTab;

  useEffect(() => {
    if (activeTab?.startsWith('sueño_')) {
      setOpenGroups((prev) => ({ ...prev, suenoAdmin: true }));
    }
  }, [activeTab]);

  const toggleGroup = (groupId) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleNavigation = (tab) => {
    if (routeActiveTab) {
      navigate('/admin');
    }
    onTabChange(tab);

    if (isOpen) {
      toggleSidebar();
    }
  };

  const handleRouteNavigation = (path) => {
    navigate(path);
    if (isOpen) {
      toggleSidebar();
    }
  };

  const renderNavGroup = (items) =>
    items.map((item) => {
      const Icon = item.icon;

      return (
        <div
          key={item.id}
          onClick={() => routePaths[item.id]
            ? handleRouteNavigation(routePaths[item.id])
            : handleNavigation(item.id)}
          className={`user-sidebar__nav-item ${
            selectedTab === item.id ? 'is-active' : ''
          }`}
        >
          <Icon size={20} />

          <span className="user-sidebar__nav-label">
            {item.label}
          </span>
        </div>
      );
    });

  // Un título de sección solo se muestra si alguna de sus opciones es visible para el usuario.
  const algunaVisible = (...items) => items.some((item) => puedeVerSeccionAdmin(item.id, hasPermission));
  const rendimientoVisible = algunaVisible(
    ...testsGroup.items, ...antropometriaGroup.items, ...sleepGroup.items, ...attendanceGroup.items, ...planesItems,
    ...navItems.filter((item) => item.category === 'rendimiento'),
  );
  const informacionVisible = algunaVisible(...reporteriaGroup.items, ...navItems.filter((item) => item.category === 'info'));
  const configuracionVisible = algunaVisible(...collapsibleGroups[2].items);

  const renderCollapsibleGroup = (group) => {
    // Se ocultan las opciones sin permiso, y el grupo entero si no queda ninguna.
    const visibleItems = group.items.filter((item) => puedeVerSeccionAdmin(item.id, hasPermission));
    if (visibleItems.length === 0) return null;

    const isGroupOpen = !!openGroups[group.id];
    const GroupIcon = group.icon;

    return (
      <div
        className="user-sidebar__group"
        key={group.id}
      >
        <button
          type="button"
          className={`user-sidebar__nav-item user-sidebar__button user-sidebar__group-header ${
            isGroupOpen ? 'is-open' : ''
          }`}
          onClick={() => toggleGroup(group.id)}
        >
          <div className="user-sidebar__group-title-wrapper">
            <GroupIcon size={20} />

            <span className="user-sidebar__nav-label">
              {group.label}
            </span>
          </div>

          {isGroupOpen ? (
            <ChevronDown size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
        </button>

        {isGroupOpen && (
          <div className="user-sidebar__submenu">
            {visibleItems.map((item) => {
              const ItemIcon = item.icon;

              return (
                <button
                  type="button"
                  key={item.id}
                  className={`user-sidebar__sub-btn ${
                    selectedTab === item.id ? 'is-active' : ''
                  }`}
                  onClick={() => routePaths[item.id]
                    ? handleRouteNavigation(routePaths[item.id])
                    : handleNavigation(item.id)}
                >
                  <ItemIcon size={16} />

                  <span>
                    {item.label}
                  </span>
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
        <div
          className="user-sidebar-backdrop"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`user-sidebar ${
          isOpen
            ? 'user-sidebar--mobile-open'
            : ''
        }`}
      >
        <nav className="user-sidebar__nav">

          {/* =================================================
              PRINCIPAL
          ================================================= */}
          <div className="user-sidebar__group-title">
            Principal
          </div>

          {renderNavGroup(
            navItems.filter(
              (item) =>
                item.category === 'principal'
            )
          )}

          {/* =================================================
              PANEL DE USUARIOS
          ================================================= */}
          {renderCollapsibleGroup(
            collapsibleGroups[0]
          )}

          {/* =================================================
              GESTIÓN DE PERSONAL
          ================================================= */}
          {renderCollapsibleGroup(
            collapsibleGroups[1]
          )}

          {/* =================================================
              RENDIMIENTO
          ================================================= */}
          {rendimientoVisible && (
          <div className="user-sidebar__group-title">
            Rendimiento
          </div>
          )}

          {renderCollapsibleGroup(testsGroup)}
          {renderCollapsibleGroup(antropometriaGroup)}
          {renderNavGroup(
            navItems.filter(
              (item) =>
                item.category === 'rendimiento'
            )
          )}
          {renderCollapsibleGroup(sleepGroup)}
          {renderCollapsibleGroup(attendanceGroup)}
          {renderNavGroup(planesItems)}

          {/* =================================================
              INFORMACIÓN Y CONTROL
          ================================================= */}
          {informacionVisible && (
          <div className="user-sidebar__group-title">
            Información y Control
          </div>
          )}

          {renderCollapsibleGroup(reporteriaGroup)}

          {renderNavGroup(
            navItems.filter(
              (item) =>
                item.category === 'info' && puedeVerSeccionAdmin(item.id, hasPermission)
            )
          )}

          {/* =================================================
              CONFIGURACIÓN
          ================================================= */}
          {configuracionVisible && (
          <div className="user-sidebar__group-title">
            Configuración
          </div>
          )}

          {renderCollapsibleGroup(
            collapsibleGroups[2]
          )}

        </nav>

      </aside>
    </>
  );
}