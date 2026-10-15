import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  Home,
  Users,
  Zap,
  LogOut,
  ChevronDown,
  ChevronRight,
  UserCheck,
  ShieldCheck,
  ClipboardList,
  Clock3,
  Activity,
  FileText,
  Settings,
  Sun,
  Moon,
  Tag,
  Grid3x3,
  Dumbbell,
  MoonStar,
  LayoutDashboard,
  AlertCircle,
  UserRound,
  CalendarClock,
  ListChecks,
  Trophy,
  SlidersHorizontal,
} from 'lucide-react';

import '../../../styles/layouts/sidebar.css';
import { useApplicationPermissions } from '../../../context/ApplicationPermissionsContext';

const navItems = [
  {
    id: 'home',
    label: 'Dashboard',
    icon: Home,
    category: 'principal',
  },
  {
    id: 'reportes',
    label: 'Reportes',
    icon: FileText,
    category: 'info',
  },
  {
    id: 'auditoria',
    label: 'Auditoría',
    icon: ShieldCheck,
    category: 'info',
  },
  {
    id: 'mi-perfil',
    label: 'Mi perfil',
    icon: UserRound,
    category: 'profile',
  },
];

const attendanceGroup = {
  id: 'asistencia',
  label: 'Asistencia',
  icon: Clock3,
  items: [
    { id: 'asistencias', label: 'Análisis de asistencia', icon: Clock3 },
    { id: 'registro-asistencia', label: 'Registro de asistencia', icon: ClipboardList },
  ],
};

const testsGroup = {
  id: 'testsAdmin',
  label: 'Tests',
  icon: ClipboardList,
  items: [
    { id: 'tests-programados', label: 'Tests programados', icon: CalendarClock },
    { id: 'tests-pruebas', label: 'Creación de pruebas', icon: ListChecks },
    { id: 'tests-ranking', label: 'Ranking', icon: Trophy },
  ],
};

const antropometriaGroup = {
  id: 'antropometriaAdmin',
  label: 'Antropometría',
  icon: Activity,
  items: [
    { id: 'antropometria-programar', label: 'Programar medición', icon: CalendarClock },
    { id: 'antropometria-datos', label: 'Datos registrados', icon: ListChecks },
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
        id: 'ejercicios',
        label: 'Ejercicios',
        icon: Dumbbell,
      },
      {
        id: 'parametros-antropometria',
        label: 'Parámetros de antropometría',
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
    ...navItems.filter((item) => item.category === 'info'),
    ...collapsibleGroups[2].items,
    ...navItems.filter((item) => item.category === 'profile'),
  ];

  return menuItems.filter(
    (item) => (
      (item.id !== 'roles-permisos' || hasPermission('gestionar_permisos'))
      && (item.id !== 'categorias' || hasPermission('ver_categorias_deportivas') || hasPermission('gestionar_categorias_deportivas'))
    )
  );
};

export default function SidebarAdmin({
  isOpen,
  toggleSidebar,
  activeTab,
  onTabChange,
  onLogout,
  isDarkMode,
  onToggleTheme,
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
    if (currentPath === '/admin/categorias' || currentPath === '/admin/configuracion/antropometria') {
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
    if (activeTab?.startsWith('sueño_')) {
      return { suenoAdmin: true };
    }
    return {};
  });
  const location = useLocation();
  const navigate = useNavigate();
  const routePaths = {
    home: '/admin/dashboard',
    asistencias: '/admin/asistencias',
    'registro-asistencia': '/admin/asistencias/registro',
    'tests-programados': '/admin/tests/programados',
    'tests-pruebas': '/admin/tests/pruebas',
    'tests-ranking': '/admin/tests/ranking',
    athletes: '/admin/atletas',
    'antropometria-programar': '/admin/antropometria/programar',
    'antropometria-datos': '/admin/antropometria/datos',
    'parametros-antropometria': '/admin/configuracion/antropometria',
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

  const handleLogoutClick = () => {
    localStorage.clear();

    if (onLogout && typeof onLogout === 'function') {
      onLogout();
    } else {
      window.location.href = '/login';
    }
  };

  const handleThemeClick = () => {
    if (
      onToggleTheme &&
      typeof onToggleTheme === 'function'
    ) {
      onToggleTheme();
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

  const renderCollapsibleGroup = (group) => {
    const visibleItems = group.items.filter(
      (item) => (
        (item.id !== 'roles-permisos' || hasPermission('gestionar_permisos'))
        && (item.id !== 'categorias' || hasPermission('ver_categorias_deportivas') || hasPermission('gestionar_categorias_deportivas'))
      )
    );
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
          <div className="user-sidebar__group-title">
            Rendimiento
          </div>

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

          {/* =================================================
              INFORMACIÓN Y CONTROL
          ================================================= */}
          <div className="user-sidebar__group-title">
            Información y Control
          </div>

          {renderNavGroup(
            navItems.filter(
              (item) =>
                item.category === 'info'
            )
          )}

          {/* =================================================
              CONFIGURACIÓN
          ================================================= */}
          <div className="user-sidebar__group-title">
            Configuración
          </div>

          {renderCollapsibleGroup(
            collapsibleGroups[2]
          )}

          {renderNavGroup(
            navItems.filter((item) => item.category === 'profile')
          )}

        </nav>

        {/* ===================================================
            FOOTER
        =================================================== */}
        <div className="user-sidebar__footer">

          {/* CAMBIO DE TEMA */}
          <button
            type="button"
            onClick={handleThemeClick}
            className="user-sidebar__nav-item user-sidebar__button user-sidebar__theme-toggle"
          >
            {isDarkMode ? (
              <Sun size={20} />
            ) : (
              <Moon size={20} />
            )}

            <span className="user-sidebar__nav-label">
              {isDarkMode
                ? 'Modo Claro'
                : 'Modo Oscuro'}
            </span>
          </button>

          {/* CERRAR SESIÓN */}
          <button
            type="button"
            onClick={handleLogoutClick}
            className="user-sidebar__nav-item user-sidebar__button user-sidebar__nav-item--logout"
          >
            <LogOut size={20} />

            <span className="user-sidebar__nav-label">
              Cerrar sesión
            </span>
          </button>

        </div>
      </aside>
    </>
  );
}