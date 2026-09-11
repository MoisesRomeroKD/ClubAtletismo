/**
 * ============================================================
 * COMPONENTE: DashboardHeader
 * ============================================================
 *
 * Propósito:
 * Renderiza el encabezado principal del Dashboard administrativo.
 *
 * Responsabilidades:
 * - Mostrar el título de la página.
 * - Mostrar el subtítulo o descripción del Dashboard.
 * - Mostrar la fecha actual o fecha de referencia.
 *
 * Props:
 * - title       → Título principal del Dashboard.
 * - subtitle    → Descripción o contexto del panel.
 * - currentDate → Fecha mostrada en el indicador superior.
 *
 * Dependencias:
 * - No utiliza lógica externa ni estado propio.
 * - Recibe toda la información mediante props.
 *
 * ============================================================
 */

import React from 'react';

export const DashboardHeader = ({ title, subtitle, currentDate }) => {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>

      <div className="date-badge">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>

        <span>{currentDate}</span>
      </div>
    </div>
  );
};

export default DashboardHeader;