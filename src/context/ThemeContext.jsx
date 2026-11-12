import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// Tema por defecto: oscuro. Solo se guarda lo que la persona elige con el botón (clave propia: la vieja
// 'theme' se guardaba sola con el claro y dejaría a todos en claro).
const CLAVE_TEMA = 'tema_elegido';

const leerTemaElegido = () => {
  try {
    return localStorage.getItem(CLAVE_TEMA);
  } catch {
    return null;
  }
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => leerTemaElegido() !== 'light');

  useEffect(() => {
    const body = document.body;
    body.classList.toggle('dark-mode', isDarkMode);
    body.classList.toggle('light-mode', !isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const siguiente = !prev;
      try {
        localStorage.setItem(CLAVE_TEMA, siguiente ? 'dark' : 'light');
      } catch {
        // Sin acceso al almacenamiento: el cambio vale solo mientras la página esté abierta.
      }
      return siguiente;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider');
  }
  return context;
};
