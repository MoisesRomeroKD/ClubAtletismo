// src/components/layouts/TopbarUser.jsx

import React, { useEffect, useRef, useState } from "react";

import {
  Link
} from "react-router-dom";

import {
  LogOut,
  Menu,
  Moon,
  Sun,
  X
} from "lucide-react";

import "../../../styles/layouts/TopbarUser.css";


const TopbarUser = ({
  role,
  roleTitle,
  toggleSidebar,
  isSidebarOpen,
  onLogout,
  isDarkMode,
  onToggleTheme
}) => {

  // ==========================================================
  // ESTADO DEL USUARIO
  // ==========================================================

  const [userData] = useState(() => ({
    name: localStorage.getItem("user_name") || "",
    role_name: localStorage.getItem("user_role") || "",
    id: localStorage.getItem("user_id") || null,
  }));


  // ==========================================================
  // MENÚ DEL PERFIL: cambio de tema y cierre de sesión
  // ==========================================================

  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuAbierto) return undefined;
    const cerrarAlTocarFuera = (evento) => {
      if (menuRef.current && !menuRef.current.contains(evento.target)) setMenuAbierto(false);
    };
    const cerrarConEscape = (evento) => {
      if (evento.key === "Escape") setMenuAbierto(false);
    };
    document.addEventListener("mousedown", cerrarAlTocarFuera);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("mousedown", cerrarAlTocarFuera);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [menuAbierto]);

  const cambiarTema = () => {
    onToggleTheme?.();
  };

  const cerrarSesion = () => {
    setMenuAbierto(false);
    localStorage.clear();
    if (typeof onLogout === "function") onLogout();
    else window.location.href = "/login";
  };


  // ==========================================================
  // OBTENER NOMBRE COMPLETO
  //
  // Ejemplo:
  //
  // "Moisés Arguello"
  //
  // No usamos username.
  // ==========================================================

  const getFullName = () => {

    const fullName =
      userData?.name ||
      localStorage.getItem("user_name") ||
      "";

    return fullName.trim();

  };


  // ==========================================================
  // INICIALES DEL USUARIO
  //
  // "Moisés Arguello" -> "MA"
  //
  // "Juan Pérez" -> "JP"
  // ==========================================================

  const getInitials = () => {

    const fullName =
      getFullName();


    if (!fullName) {

      return "--";

    }


    const parts =
      fullName
        .split(/\s+/)
        .filter(Boolean);


    // Nombre + apellido

    if (parts.length >= 2) {

      return (
        parts[0].charAt(0) +
        parts[parts.length - 1].charAt(0)
      ).toUpperCase();

    }


    // Solo una palabra

    return fullName
      .substring(0, 2)
      .toUpperCase();

  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <nav className="topbar-user">

      <div className="topbar-container">


        {/* ====================================================
            SECCIÓN IZQUIERDA
            ==================================================== */}

        <div className="topbar-left-section">


          {/* ==================================================
              MENÚ
              ================================================== */}

          <button
            className="topbar-menu-btn"
            onClick={toggleSidebar}
            title="Alternar Menú"
            aria-label="Alternar Menú"
          >

            {isSidebarOpen ? (

              <X size={24} />

            ) : (

              <Menu size={24} />

            )}

          </button>


          {/* ==================================================
              LOGO
              ================================================== */}

          <Link
            to="#"
            className="topbar-logo"
          >

            <span className="logo-highlight">

              <img
                src="/assets/logo.png"
                alt="Liceo Caracas Logo"
                className="topbar-logo-img"
              />

            </span>


            <div className="topbar-title-group">

              <h1 className="topbar-main-title">
                C.E.T.D. Club Atletismo
              </h1>

            </div>

          </Link>

        </div>


        {/* ====================================================
            SECCIÓN DERECHA
            ==================================================== */}

        <div className="topbar-right-section">

          <div className="user-profile-menu" ref={menuRef}>

          <button
            type="button"
            className="user-profile-group"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            aria-haspopup="menu"
            aria-expanded={menuAbierto}
            title="Opciones de la cuenta"
          >


            {/* ==================================================
                DATOS DEL USUARIO
                ================================================== */}

            <div className="user-text-info">

              <p className="user-fullname">

                {getFullName() ||
                  "Cargando..."}

              </p>


              <p className="user-role-label">

                {userData?.role_name ||
                  roleTitle ||
                  role ||
                  "Cargando..."}

              </p>

            </div>


            {/* ==================================================
                AVATAR
                ================================================== */}

            <div className="user-avatar-circle">

              {getInitials()}

            </div>


          </button>

          {menuAbierto && (
            <div className="user-profile-dropdown" role="menu">
              <button type="button" role="menuitem" className="user-profile-dropdown__item" onClick={cambiarTema}>
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                <span>{isDarkMode ? "Modo claro" : "Modo oscuro"}</span>
              </button>
              <button type="button" role="menuitem" className="user-profile-dropdown__item user-profile-dropdown__item--salir" onClick={cerrarSesion}>
                <LogOut size={18} />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}

          </div>

        </div>


      </div>

    </nav>

  );

};


export {
  TopbarUser
};

export default TopbarUser;
