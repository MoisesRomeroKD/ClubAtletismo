import React, { useEffect, useState } from 'react';
import { ShieldCheck, UserCheck, UserMinus, Users } from 'lucide-react';
import UserService from '../../../api/services/Userservice';
import DashboardHeader from './DashboardHeader';
import KpiSection from './KpiSection';
import ChartCard from './ChartCard';
import DashboardTabs from './DashboardTabs.jsx';
import DashboardBarChart from './charts/DashboardBarChart.jsx';
import DashboardDistribucionChart from './charts/DashboardDistribucionChart.jsx';
import AntropometriaResumen from './AntropometriaResumen.jsx';
import '../../../styles/components/admin/dashboard/DashboardView.css';
import CargaCircular from '../../layout/CargaCircular';

const fechaLarga = (iso) => {
  if (!iso) return '';
  const texto = new Date(`${iso}T12:00:00`).toLocaleDateString('es-VE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

const armarKpis = (kpis) => [
  {
    id: 'atletas-totales', type: 'atletas', title: 'Atletas Totales', value: kpis.atletas_totales, icon: Users,
    activeText: 'Registrados en el sistema',
  },
  {
    id: 'atletas-activos', type: 'atletas', title: 'Atletas Activos', value: kpis.atletas_activos, icon: UserCheck,
    activeText: kpis.atletas_totales
      ? `${Math.round((kpis.atletas_activos * 100) / kpis.atletas_totales)}% del plantel total`
      : 'Sin atletas registrados',
  },
  {
    id: 'atletas-justificados', type: 'atletas', title: 'Atletas Justificados', value: kpis.atletas_justificados, icon: UserMinus,
    activeText: `${kpis.atletas_inactivos} inactivo(s)`,
  },
  {
    id: 'entrenadores', type: 'staff', title: 'Entrenadores', value: kpis.entrenadores, icon: ShieldCheck,
    caption: 'Entrenadores con acceso al sistema',
  },
];

const mensajeError = (error) => error.response?.data?.detail || 'No se pudieron cargar los datos del dashboard.';

export const DashboardView = () => {
  // Estado para la navegación entre áreas ('all' o el id del área)
  const [activeGroup, setActiveGroup] = useState('all');
  const [resultado, setResultado] = useState({ grupo: null, data: null, error: '' });

  useEffect(() => {
    let activo = true;
    UserService.getAdminDashboard(activeGroup === 'all' ? {} : { area: activeGroup })
      .then((data) => { if (activo) setResultado({ grupo: activeGroup, data, error: '' }); })
      .catch((error) => { if (activo) setResultado({ grupo: activeGroup, data: null, error: mensajeError(error) }); });
    return () => { activo = false; };
  }, [activeGroup]);

  const cargando = resultado.grupo !== activeGroup;
  const data = resultado.data;
  const torta = data?.graficos.torta;

  return (
    <div className="app-container">
      <div className="main-wrapper">
        <main className="content-area">

          <DashboardHeader
            title="Panel de Control General"
            currentDate={fechaLarga(data?.fecha)}
          />

          {/* NAVEGACIÓN ENTRE GLOBAL Y ÁREAS */}
          <DashboardTabs
            areas={data?.areas || []}
            activeGroup={activeGroup}
            onTabChange={setActiveGroup}
          />

          {resultado.error && !cargando && <p className="dashboard-estado dashboard-estado--error" role="alert">{resultado.error}</p>}
          {cargando && !data && <CargaCircular texto="Cargando Home" />}

          {data && (
            <div className={cargando ? 'dashboard-cargando' : undefined}>
              <KpiSection data={armarKpis(data.kpis)} />

              <AntropometriaResumen />

              {/* GRÁFICOS */}
              <section className="dashboard-grid-secondary">

                {/* BARRAS */}
                <ChartCard title={`Nivel de Asistencia (últimos ${data.dias_asistencia} días)`} size="sm">
                  {data.graficos.barras.labels.length
                    ? <DashboardBarChart labels={data.graficos.barras.labels} data={data.graficos.barras.data} />
                    : <p className="dashboard-estado">Sin registros de asistencia.</p>}
                </ChartCard>

                {/* ATLETAS POR ÁREA (o por subárea dentro de un área) */}
                <ChartCard
                  title={data.area ? 'Atletas por Subárea' : 'Atletas por Área'}
                  size="sm"
                >
                  {torta.labels.length
                    ? <DashboardDistribucionChart labels={torta.labels} data={torta.data} />
                    : <p className="dashboard-estado">Sin atletas en este grupo.</p>}
                </ChartCard>

              </section>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default DashboardView;
