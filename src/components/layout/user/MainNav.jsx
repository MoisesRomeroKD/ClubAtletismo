import React from 'react';
import TopbarUser from './TopbarUser';
import SidebarAdmin from './SidebarAdmin';
import SidebarAthlete from './SidebarAthlete';
import SidebarTrainer from './SidebarTrainer';
import { useLayout } from '../../../context/LayoutContext';

const MainNav = ({ 
  children, 
  role, 
  roleTitle, 
  activeTab, 
  onTabChange, 
  onLogout, 
  isDarkMode, 
  onToggleTheme 
}) => {
  const { isSidebarOpen, toggleSidebar } = useLayout();

  const userRole = role?.toLowerCase();
  const isTrainer = userRole === 'entrenador' || userRole === 'trainer';
  const isAdmin = userRole === 'administrador' || userRole === 'admin';

  // Props comunes para todos los Sidebars
  const commonSidebarProps = {
    isOpen: isSidebarOpen,
    toggleSidebar,
    activeTab,
    onTabChange,
    onLogout,
    isDarkMode,
    onToggleTheme,
  };

  // Renderizado dinámico según el rol
  const renderSidebar = () => {
    if (isTrainer) return <SidebarTrainer {...commonSidebarProps} />;
    if (isAdmin) return <SidebarAdmin {...commonSidebarProps} />;
    return <SidebarAthlete {...commonSidebarProps} />;
  };

  return (
    <div className={`main-nav-layout ${isSidebarOpen ? 'sidebar-visible' : 'sidebar-hidden'}`}>
      <TopbarUser 
        role={role} 
        roleTitle={roleTitle} 
        toggleSidebar={toggleSidebar} 
        isSidebarOpen={isSidebarOpen}
        onLogout={onLogout}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
      />

      <div className="main-nav-body" style={{ display: 'flex', flex: 1 }}>
        {renderSidebar()}

        <main className="main-content-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainNav;
