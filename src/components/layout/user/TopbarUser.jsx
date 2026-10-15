// src/components/layouts/TopbarUser.jsx

import React, { useState } from "react";

import {
  Link
} from "react-router-dom";

import {
  Menu,
  X
} from "lucide-react";

import "../../../styles/layouts/TopbarUser.css";


const TopbarUser = ({
  role,
  roleTitle,
  toggleSidebar,
  isSidebarOpen
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
                U.E.T.D. Club Atletismo
              </h1>

            </div>

          </Link>

        </div>


        {/* ====================================================
            SECCIÓN DERECHA
            ==================================================== */}

        <div className="topbar-right-section">

          <div className="user-profile-group">


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
