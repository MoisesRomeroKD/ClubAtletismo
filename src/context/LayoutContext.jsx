import React, { createContext, useState, useContext } from 'react';

// Creación del canal de comunicación centralizado
const LayoutContext = createContext();

export const LayoutProvider = ({ children }) => {
  // El sidebar comienza cerrado
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <LayoutContext.Provider
      value={{
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

// Hook personalizado para que cualquier componente detecte
// el estado del sidebar al instante
export const useLayout = () => {
  const context = useContext(LayoutContext);

  if (!context) {
    throw new Error(
      'useLayout debe ser usado dentro de un LayoutProvider'
    );
  }

  return context;
};