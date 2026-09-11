import React, { useState, useEffect } from 'react';
import MainNav from '../components/layout/user/MainNav';
import podApi from '../api/podApi';
import '../styles/pages/AthleteDashboard.css';

import SleepQualityDashboard from '../components/atleta/AthleteSleep/SleepQualityDashboard'; 
import AsistenciaAtletaView from '../components/atleta/asistencia/AsistenciaAtletaView';
import EvaluacionesAtletaView from '../components/atleta/evaluacion/EvaluacionesAtletaView';
import AntropometriaAtletaView from '../components/atleta/antropometria/AntropometriaAtletaView';

export default function AthleteDashboard({ currentAction, onActionChange, onLogout, isDarkMode, onToggleTheme }) {
  const [activeAction, setActiveAction] = useState(currentAction || 'home');

  useEffect(() => {
    if (currentAction) {
      setActiveAction(currentAction);
    }
  }, [currentAction]);

  const handleTabChange = (newTab) => {
    setActiveAction(newTab);
    if (onActionChange && typeof onActionChange === 'function') {
      onActionChange(newTab);
    }
  };

  const [userData, setUserData] = useState({ name: '', id: null });
  const [sleepData, setSleepData] = useState([]);
  const [routine, setRoutine] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedName = localStorage.getItem("user_name") || localStorage.getItem("userName");
    const storedId = localStorage.getItem("user_id") || localStorage.getItem("userId");

    if (!storedName || !storedId) {
      console.warn("Advertencia: No se encontraron las credenciales en localStorage.");
      setIsLoading(false);
      return;
    }

    setUserData({ name: storedName, id: storedId });

    const fetchAthleteData = async () => {
      try {
        setIsLoading(true);
        const [sleepRes, routineRes] = await Promise.allSettled([
          podApi.get(`/v1/descanso/sueno/consultar/${storedId}/`),
          podApi.get(`/v1/rutinas/planes/`)
        ]);

        if (sleepRes.status === 'fulfilled' && sleepRes.value?.data) {
          const sleepHistorial = sleepRes.value.data.historial || sleepRes.value.data;
          setSleepData(Array.isArray(sleepHistorial) ? sleepHistorial : []);
        }

        if (routineRes.status === 'fulfilled' && routineRes.value?.data) {
          setRoutine(routineRes.value.data);
        }
      } catch (error) {
        console.error("Error de sincronización:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAthleteData();
  }, []);

  if (isLoading) {
    return <div className="loading-container" style={{ padding: '2rem', textAlign: 'center' }}>Cargando datos de rendimiento...</div>;
  }

  return (
    <MainNav
      role="atleta"
      roleTitle="Atleta"
      activeTab={activeAction}
      onTabChange={handleTabChange}
      onLogout={onLogout}
      isDarkMode={isDarkMode}
      onToggleTheme={onToggleTheme}
    >
      <div className="dashboard-page" style={{ padding: '1.5rem', backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
        <div className="dashboard-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* VISTA HOME */}
          {activeAction === 'home' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* BANNER PRINCIPAL DE BIENVENIDA */}
              <div style={{ 
                padding: '1.75rem', 
                backgroundColor: '#ffffff', 
                borderRadius: '12px', 
                borderLeft: '6px solid #2A6BFF',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#111827', fontWeight: '800' }}>
                      Bienvenido, {userData.name || 'Atleta'} 👋
                    </h1>
                    <p style={{ color: '#6B7280', marginTop: '0.3rem', fontSize: '0.95rem' }}>
                      Plataforma de Optimización Deportiva | Estado Biológico y Rendimiento
                    </p>
                  </div>
                  <span style={{ 
                    backgroundColor: '#E0E7FF', 
                    color: '#3730A3', 
                    padding: '6px 14px', 
                    borderRadius: '20px', 
                    fontWeight: '600', 
                    fontSize: '0.85rem' 
                  }}>
                    Temporada 2026
                  </span>
                </div>
              </div>

              {/* TARJETAS DE INDICADORES RÁPIDOS (KPIs) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                
                {/* KPI 1: Sueño / Descanso */}
                <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Descanso Biológico</span>
                  <div style={{ fontSize: '2rem', fontWeight: '800', margin: '0.4rem 0', color: sleepData.length > 0 && sleepData[0].calidad < 5 ? '#EF4444' : '#10B981' }}>
                    {sleepData.length > 0 ? `${sleepData[0].calidad} / 10` : 'Sin registros'}
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleTabChange('sueno')}
                    style={{ background: 'none', border: 'none', color: '#2A6BFF', padding: 0, cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
                  >
                    Registrar o ver historial →
                  </button>
                </div>

                {/* KPI 2: Rutinas */}
                <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Plan Semanal</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0.8rem 0', color: '#111827' }}>
                    {routine ? 'Rutina Asignada' : 'Sin plan activo'}
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleTabChange('rutina')}
                    style={{ background: 'none', border: 'none', color: '#10B981', padding: 0, cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
                  >
                    Ver ejercicios de hoy →
                  </button>
                </div>

                {/* KPI 3: Asistencia */}
                <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Asistencia</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', margin: '0.8rem 0', color: '#111827' }}>
                    Sincronizada
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleTabChange('asistencia')}
                    style={{ background: 'none', border: 'none', color: '#F59E0B', padding: 0, cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
                  >
                    Consultar registro →
                  </button>
                </div>

              </div>

              {/* SECCIÓN INFERIOR: GRÁFICA DE EVOLUCIÓN + PERFIL */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                
                {/* BLOQUE GRÁFICA DE RECUPERACIÓN (BARRA VISUAL SIMPLE) */}
                <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#111827' }}>📈 Tendencia de Descanso Reciente</h3>
                  
                  {sleepData.length > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '140px', padding: '10px 0', borderBottom: '1px solid #E5E7EB' }}>
                      {sleepData.slice(0, 7).reverse().map((item, idx) => (
                        <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <div 
                            style={{ 
                              width: '100%', 
                              height: `${item.calidad * 12}px`, 
                              backgroundColor: item.calidad >= 7 ? '#10B981' : item.calidad >= 5 ? '#F59E0B' : '#EF4444',
                              borderRadius: '4px 4px 0 0',
                              transition: 'height 0.3s ease'
                            }} 
                            title={`Fecha: ${item.date} - Nota: ${item.calidad}/10`}
                          />
                          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{item.calidad}/10</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '2rem 0', textAlign: 'center', color: '#9CA3AF', fontSize: '0.9rem' }}>
                      Registra tu sueño para generar la gráfica de tendencia biológica.
                    </div>
                  )}
                  <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.8rem', color: '#6B7280' }}>
                    * Gráfica calculada con base en la escala psicométrica de fatiga.
                  </p>
                </div>

                {/* BLOQUE ESTADO CINEANTROPOMÉTRICO / EVALUACIÓN */}
                <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#111827' }}>🏃‍♂️ Datos Biológicos y Composición</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#F3F4F6', borderRadius: '6px' }}>
                      <span style={{ color: '#4B5563', fontSize: '0.9rem' }}>Estado Biológico:</span>
                      <strong style={{ color: '#111827', fontSize: '0.9rem' }}>En Monitoreo</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#F3F4F6', borderRadius: '6px' }}>
                      <span style={{ color: '#4B5563', fontSize: '0.9rem' }}>Evaluación Antropométrica:</span>
                      <strong style={{ color: '#2A6BFF', fontSize: '0.9rem' }}>Al Día</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#F3F4F6', borderRadius: '6px' }}>
                      <span style={{ color: '#4B5563', fontSize: '0.9rem' }}>Especialidad / Prueba:</span>
                      <strong style={{ color: '#111827', fontSize: '0.9rem' }}>Asignada en Admin</strong>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* VISTA RUTINA */}
          {activeAction === 'rutina' && (
            <div className="dashboard-card max-w-mid" style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '12px' }}>
              <h3 className="section-title" style={{ borderBottom: '2px solid #2A6BFF', display: 'inline-block', paddingBottom: '5px' }}>
                Mi Plan Semanal
              </h3>
              {routine ? (
                <ul className="routine-list" style={{ marginTop: '1rem' }}>
                  {Object.entries(routine).map(([dia, tarea]) => (
                    <li key={dia} className="routine-item" style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                      <span className="day-label" style={{ fontWeight: 'bold', marginRight: '10px' }}>{dia}:</span>
                      <span className="task-text">{tarea}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state" style={{ marginTop: '1rem', color: '#6B7280' }}>No tienes rutinas asignadas aún.</div>
              )}
            </div>
          )}

          {/* VISTA SUEÑO */}
          {activeAction === 'sueno' && (
            <SleepQualityDashboard 
              athleteName={userData.name} 
              sleepData={sleepData} 
            />
          )}

          {/* VISTA ASISTENCIA */}
          {(activeAction === 'asistencia' || activeAction === 'asistencias') && (
            <div className="dashboard-card width-full" style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '12px' }}>
              <AsistenciaAtletaView 
                athleteId={userData.id} 
                athleteName={userData.name} 
              />
            </div>
          )}

          {/* VISTA EVALUACIONES */}
{(activeAction === 'evaluaciones' || activeAction === 'evaluacion' || activeAction === 'mis-evaluaciones') && (
  <div className="dashboard-card width-full" style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '12px' }}>
    <EvaluacionesAtletaView 
      athleteId={userData.id} 
      athleteName={userData.name} 
    />
  </div>
)}

{/* VISTA ANTROPOMETRÍA */}
{(activeAction === 'antropometria' || activeAction === 'antropometría') && (
  <div className="dashboard-card width-full" style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '12px' }}>
    <AntropometriaAtletaView 
      athleteId={userData.id} 
      athleteName={userData.name} 
    />
  </div>
)}
        </div>
      </div>
    </MainNav>
  );
}