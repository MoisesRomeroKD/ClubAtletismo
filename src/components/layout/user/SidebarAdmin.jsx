import React, { useState } from 'react';

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
  Upload,
} from 'lucide-react';

import '../../../styles/layouts/sidebar.css';

const navItems = [
  {
    id: 'home',
    label: 'Dashboard',
    icon: Home,
    category: 'principal',
  },
  {
    id: 'evaluaciones',
    label: 'Evaluaciones',
    icon: ClipboardList,
    category: 'rendimiento',
  },
  {
    id: 'asistencias',
    label: 'Asistencia',
    icon: Clock3,
    category: 'rendimiento',
  },
  {
    id: 'antropometria',
    label: 'Antropometría',
    icon: Activity,
    category: 'rendimiento',
  },
  {
    id: 'sueño',
    label: 'Sueño y Fatiga',
    icon: Zap,
    category: 'rendimiento',
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
];

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
        id: 'carga-masiva',
        label: 'Carga Masiva',
        icon: Upload,
      },
    ],
  },
];

export default function SidebarAdmin({
  isOpen,
  toggleSidebar,
  activeTab,
  onTabChange,
  onLogout,
  isDarkMode,
  onToggleTheme,
}) {
  const [openGroups, setOpenGroups] = useState({});

  const toggleGroup = (groupId) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

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
    });

  const renderCollapsibleGroup = (group) => {
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
            {group.items.map((item) => {
              const ItemIcon = item.icon;

              return (
                <button
                  type="button"
                  key={item.id}
                  className={`user-sidebar__sub-btn ${
                    activeTab === item.id ? 'is-active' : ''
                  }`}
                  onClick={() => handleNavigation(item.id)}
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

          {renderNavGroup(
            navItems.filter(
              (item) =>
                item.category === 'rendimiento'
            )
          )}

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