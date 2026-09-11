import React, { useState } from 'react';
import DashboardHeader from './DashboardHeader';
import KpiSection from './KpiSection';
import AthletesTable from './AthletesTable.jsx';
import AlertsCard from './AlertsCard.jsx';
import ChartCard from './ChartCard';
import DashboardTabs from './DashboardTabs.jsx';
import DashboardRadarChart from './charts/DashboardRadarChart.jsx';
import DashboardBarChart from './charts/DashboardBarChart.jsx';
import DashboardPieChart from './charts/DashboardPieChart.jsx';
import { DASHBOARD_MOCK_DATA } from './dashboardMock.js';
import '../../../styles/components/admin/DashboardView.css';

export const DashboardView = () => {
  // Estado para la navegación entre áreas
  const [activeGroup, setActiveGroup] = useState('all');

  // Fallback seguro por si la llave no existe en el mock data
  const currentData =
    DASHBOARD_MOCK_DATA[activeGroup] ||
    DASHBOARD_MOCK_DATA.all;

  return (
    <div className="app-container">
      <div className="main-wrapper">
        <main className="content-area">

          <DashboardHeader
            title="Panel de Control General"
            subtitle="Monitoreo biométrico y de rendimiento deportivo en tiempo real."
            currentDate="Lunes, 27 de Julio 2026"
          />

          {/* NAVEGACIÓN ENTRE GLOBAL Y ÁREAS */}
          <DashboardTabs
            activeGroup={activeGroup}
            onTabChange={setActiveGroup}
          />

          <KpiSection data={currentData.kpis} />

          <section className="dashboard-grid-main">
            <AlertsCard alerts={currentData.alerts} />
          </section>

          {/* GRÁFICOS */}
          <section className="dashboard-grid-secondary">

            {/* RADAR */}
            <ChartCard
              title={`Perfil Biomotor - ${
                activeGroup === 'all'
                  ? 'Global'
                  : activeGroup.toUpperCase()
              }`}
              size="sm"
            >
              <DashboardRadarChart
                metrics={currentData.charts.radar.metrics}
              />
            </ChartCard>

            {/* BARRAS */}
            <ChartCard
              title="Nivel de Asistencia"
              size="sm"
            >
              <DashboardBarChart
                labels={currentData.charts.bar.labels}
                data={currentData.charts.bar.data}
              />
            </ChartCard>

            {/* PIE / DONUT */}
            <ChartCard
              title={
                activeGroup === 'all'
                  ? 'Distribución por Disciplina'
                  : 'Distribución por Especialidad'
              }
              size="sm"
            >
              <DashboardPieChart
                labels={currentData.charts.pie.labels}
                data={currentData.charts.pie.data}
                colors={currentData.charts.pie.colors}
              />
            </ChartCard>

          </section>

          <AthletesTable
            athletes={currentData.athletes}
          />

        </main>
      </div>
    </div>
  );
};

export default DashboardView;