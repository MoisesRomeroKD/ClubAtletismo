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
 * - currentDate → Fecha mostrada en el indicador superior.
 *
 * Dependencias:
 * - No utiliza lógica externa ni estado propio.
 * - Recibe toda la información mediante props.
 *
 * ============================================================
 */

import React from 'react';
import { Calendar } from 'lucide-react';
import '../../../styles/components/admin/dashboard/DashboardHeader.css';

export const DashboardHeader = ({ title, currentDate }) => {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
      </div>

      <div className="date-badge">
        <Calendar size={16} aria-hidden="true" />

        <span>{currentDate}</span>
      </div>
    </div>
  );
};

export default DashboardHeader;