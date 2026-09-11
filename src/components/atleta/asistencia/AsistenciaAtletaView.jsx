import React, { useState } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';
import "../../../styles/components/atleta/asistencia/AsistenciaAtletaView.css";

const AsistenciaAtletaView = () => {
    // --- ESTADOS ---
    const [activeContext, setActiveContext] = useState('global');
    const [period, setPeriod] = useState('3meses');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // --- MANEJO DE SELECCIÓN DE CONTEXTO ---
    const handleContextChange = (newContext) => {
        setActiveContext(newContext);
        simulateDataRefresh();
    };

    const simulateDataRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
        }, 300);
    };

    // --- DATOS PARA RECHARTS ---
    const donutData = [
        { name: 'Asistencia', value: 21, color: '#10B981' },
        { name: 'Inasistencia', value: 2, color: '#EF4444' },
        { name: 'Justificada', value: 1, color: '#3B82F6' }
    ];

    const trendData = [
        { month: 'Mar', pct: 91 },
        { month: 'Abr', pct: 89 },
        { month: 'May', pct: 94 },
        { month: 'Jun', pct: 87 },
        { month: 'Jul', pct: 92 },
        { month: 'Ago', pct: 87.5 }
    ];

    // Determina sub-navegadores visibles
    const isVelocidadActive = activeContext === 'velocidad' || activeContext === '100m' || activeContext === '200m';
    const isSaltosActive = activeContext === 'saltos' || activeContext === 'saltolargo';

    return (
        <div className="container">
            {/* HEADER */}
            <header className="app-header">
                <div>
                    <div className="brand">POD<span className="brand-dot">.</span></div>
                    <div className="page-title mt-2">
                        <h1>Asistencias</h1>
                        <p className="text-muted">Consulta y analiza tu historial de asistencia deportiva.</p>
                    </div>
                </div>

                {/* ATHLETE IDENTITY */}
                <div className="athlete-identity">
                    <div className="athlete-avatar">
                        <i className="fa-solid fa-user-astronaut"></i>
                    </div>
                    <div className="athlete-info">
                        <h2>Carlos Pérez</h2>
                        <div className="athlete-meta">
                            <span><i className="fa-regular fa-id-card"></i> 25.123.456</span>
                            <span><i className="fa-solid fa-medal"></i> U20</span>
                            <span><i className="fa-solid fa-running"></i> Velocidad · Saltos</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* CONTROLS */}
            <div className="controls-bar">
                <div className="context-nav">
                    <button 
                        className={`nav-btn ${activeContext === 'global' ? 'active' : ''}`}
                        onClick={() => handleContextChange('global')}
                    >
                        Global
                    </button>
                    
                    <button 
                        className={`nav-btn ${isVelocidadActive ? 'active' : ''}`}
                        onClick={() => handleContextChange('velocidad')}
                    >
                        Velocidad
                    </button>
                    
                    {/* Sub nav para Velocidad */}
                    <div className={`sub-nav ${isVelocidadActive ? 'active' : ''}`}>
                        <button 
                            className={`nav-btn text-sm ${activeContext === '100m' ? 'active' : ''}`}
                            onClick={() => handleContextChange('100m')}
                        >
                            100 m
                        </button>
                        <button 
                            className={`nav-btn text-sm ${activeContext === '200m' ? 'active' : ''}`}
                            onClick={() => handleContextChange('200m')}
                        >
                            200 m
                        </button>
                    </div>
                    
                    <button 
                        className={`nav-btn ${isSaltosActive ? 'active' : ''}`}
                        onClick={() => handleContextChange('saltos')}
                    >
                        Saltos
                    </button>

                    {/* Sub nav para Saltos */}
                    <div className={`sub-nav ${isSaltosActive ? 'active' : ''}`}>
                        <button 
                            className={`nav-btn text-sm ${activeContext === 'saltolargo' ? 'active' : ''}`}
                            onClick={() => handleContextChange('saltolargo')}
                        >
                            Salto largo
                        </button>
                    </div>
                </div>

                <div className="period-selector">
                    <select value={period} onChange={(e) => { setPeriod(e.target.value); simulateDataRefresh(); }}>
                        <option value="hoy">Hoy</option>
                        <option value="semana">Esta semana</option>
                        <option value="semana_ant">Semana anterior</option>
                        <option value="mes">Este mes</option>
                        <option value="mes_ant">Mes anterior</option>
                        <option value="3meses">Últimos 3 meses</option>
                        <option value="6meses">Últimos 6 meses</option>
                        <option value="ano">Este año</option>
                    </select>
                </div>
            </div>

            {/* KPIs */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <span className="kpi-label">Total Sesiones</span>
                    <span className="kpi-value">24</span>
                </div>
                <div className="kpi-card asis">
                    <span className="kpi-label">Asistencias</span>
                    <span className="kpi-value">21</span>
                </div>
                <div className="kpi-card inasis">
                    <span className="kpi-label">Inasistencias</span>
                    <span className="kpi-value">2</span>
                </div>
                <div className="kpi-card just">
                    <span className="kpi-label">Justificadas</span>
                    <span className="kpi-value">1</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">% Asistencia</span>
                    <span className="kpi-value">87.5<small>%</small></span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">% Inasistencia</span>
                    <span className="kpi-value">8.3<small>%</small></span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Últ. Asistencia</span>
                    <span className="kpi-value text-sm font-medium" style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>14 Ago 2026</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Últ. Inasistencia</span>
                    <span className="kpi-value text-sm font-medium" style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>11 Ago 2026</span>
                </div>
            </div>

            {/* MAIN DASHBOARD GRID */}
            <div className={`dashboard-grid ${isRefreshing ? 'refreshing' : ''}`}>
                
                {/* DONUT CHART (RECHARTS) */}
                <div className="card area-donut">
                    <div className="card-header">
                        <h3 className="card-title">Distribución de Sesiones</h3>
                    </div>
                    <div className="chart-container" style={{ position: 'relative', width: '100%', height: '220px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={donutData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="75%"
                                    outerRadius="95%"
                                    paddingAngle={0}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {donutData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1E293B', borderRadius: '8px', color: '#fff', border: 'none' }}
                                    formatter={(value, name) => [`${value} sesiones`, name]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="donut-center-text">
                            <div className="percent">87.5%</div>
                            <div className="label">Asistencia</div>
                        </div>
                    </div>
                    <div className="custom-legend">
                        <div className="legend-item"><span className="dot asis"></span> 21 Asistencias</div>
                        <div className="legend-item"><span className="dot inasis"></span> 2 Inasistencias</div>
                        <div className="legend-item"><span className="dot just"></span> 1 Justificada</div>
                    </div>
                </div>

                {/* BARS CHART */}
                <div className="card area-bars">
                    <div className="card-header">
                        <h3 className="card-title">Mi Asistencia</h3>
                    </div>
                    
                    {/* Área Velocidad */}
                    <div className="bar-group">
                        <div className="bar-group-title">Área: Velocidad</div>
                        <div className="progress-item">
                            <div className="progress-header">
                                <span>Velocidad (Global)</span>
                                <span className="font-bold">95%</span>
                            </div>
                            <div className="progress-track">
                                <div className="progress-fill excellent" style={{ width: '95%' }}></div>
                            </div>
                        </div>
                        <div className="subarea-indent">
                            <div className="progress-item">
                                <div className="progress-header text-muted">
                                    <span>100 m</span>
                                    <span>98%</span>
                                </div>
                                <div className="progress-track">
                                    <div className="progress-fill excellent" style={{ width: '98%' }}></div>
                                </div>
                            </div>
                            <div className="progress-item">
                                <div className="progress-header text-muted">
                                    <span>200 m</span>
                                    <span>91%</span>
                                </div>
                                <div className="progress-track">
                                    <div className="progress-fill excellent" style={{ width: '91%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Área Saltos */}
                    <div className="bar-group">
                        <div className="bar-group-title">Área: Saltos</div>
                        <div className="progress-item">
                            <div className="progress-header">
                                <span>Saltos (Global)</span>
                                <span className="font-bold">82%</span>
                            </div>
                            <div className="progress-track">
                                <div className="progress-fill warning" style={{ width: '82%' }}></div>
                            </div>
                        </div>
                        <div className="subarea-indent">
                            <div className="progress-item">
                                <div className="progress-header text-muted">
                                    <span>Salto largo</span>
                                    <span>82%</span>
                                </div>
                                <div className="progress-track">
                                    <div className="progress-fill warning" style={{ width: '82%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CALENDAR */}
                <div className="card area-cal">
                    <div className="calendar-wrapper">
                        <div className="calendar-header">
                            <h3 className="card-title">Agosto 2026</h3>
                            <div className="calendar-nav">
                                <button><i className="fa-solid fa-chevron-left"></i></button>
                                <button><i className="fa-solid fa-chevron-right"></i></button>
                            </div>
                        </div>
                        
                        <div className="calendar-grid">
                            <div className="calendar-day-header">L</div>
                            <div className="calendar-day-header">M</div>
                            <div className="calendar-day-header">X</div>
                            <div className="calendar-day-header">J</div>
                            <div className="calendar-day-header">V</div>
                            <div className="calendar-day-header">S</div>
                            <div className="calendar-day-header">D</div>
                            
                            <div className="calendar-day empty"></div>
                            <div className="calendar-day empty"></div>
                            <div className="calendar-day empty"></div>
                            <div className="calendar-day empty"></div>
                            <div className="calendar-day empty"></div>
                            
                            <div className="calendar-day"><span className="date-num">1</span></div>
                            <div className="calendar-day"><span className="date-num">2</span></div>
                            
                            <div className="calendar-day">
                                <span className="date-num">3</span>
                                <div className="session-dots"><span className="dot asis"></span></div>
                            </div>
                            <div className="calendar-day"><span className="date-num">4</span></div>
                            <div className="calendar-day">
                                <span className="date-num">5</span>
                                <div className="session-dots"><span className="dot asis"></span><span className="dot asis"></span></div>
                                <div className="cal-tooltip">
                                    <div className="tt-header">5 de agosto de 2026</div>
                                    <div className="tt-session">
                                        <span className="dot asis mt-1"></span>
                                        <div className="tt-session-info">
                                            <span className="tt-area">Velocidad</span>
                                            <span className="tt-sub">100 m · Entrenamiento</span>
                                            <span className="tt-status text-emerald-400">Asistencia</span>
                                        </div>
                                    </div>
                                    <div className="tt-session">
                                        <span className="dot asis mt-1"></span>
                                        <div className="tt-session-info">
                                            <span className="tt-area">Saltos</span>
                                            <span className="tt-sub">Salto largo · Entrenamiento</span>
                                            <span className="tt-status text-emerald-400">Asistencia</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="calendar-day"><span className="date-num">6</span></div>
                            <div className="calendar-day"><span className="date-num">7</span></div>
                            <div className="calendar-day"><span className="date-num">8</span></div>
                            <div className="calendar-day"><span className="date-num">9</span></div>
                            
                            <div className="calendar-day">
                                <span className="date-num">10</span>
                                <div className="session-dots"><span className="dot asis"></span></div>
                            </div>
                            <div className="calendar-day">
                                <span className="date-num">11</span>
                                <div className="session-dots"><span className="dot inasis"></span></div>
                                <div className="cal-tooltip">
                                    <div className="tt-header">11 de agosto de 2026</div>
                                    <div className="tt-session">
                                        <span className="dot inasis mt-1"></span>
                                        <div className="tt-session-info">
                                            <span className="tt-area">Velocidad</span>
                                            <span className="tt-sub">100 m · Entrenamiento</span>
                                            <span className="tt-status" style={{ color: '#FCA5A5' }}>Inasistencia</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="calendar-day">
                                <span className="date-num">12</span>
                                <div className="session-dots"><span className="dot asis"></span></div>
                            </div>
                            <div className="calendar-day">
                                <span className="date-num">13</span>
                                <div className="session-dots"><span className="dot just"></span></div>
                                <div className="cal-tooltip">
                                    <div className="tt-header">13 de agosto de 2026</div>
                                    <div className="tt-session">
                                        <span className="dot just mt-1"></span>
                                        <div className="tt-session-info">
                                            <span className="tt-area">Saltos</span>
                                            <span className="tt-sub">Salto largo · Entrenamiento</span>
                                            <span className="tt-status" style={{ color: '#93C5FD' }}>Justificada</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="calendar-day today">
                                <span className="date-num">14</span>
                                <div className="session-dots"><span className="dot asis"></span><span className="dot just"></span></div>
                                
                                <div className="cal-tooltip">
                                    <div className="tt-header">14 de agosto de 2026</div>
                                    <div className="tt-session">
                                        <span className="dot asis mt-1"></span>
                                        <div className="tt-session-info">
                                            <span className="tt-area">Velocidad</span>
                                            <span className="tt-sub">100 m · Entrenamiento</span>
                                            <span className="tt-status" style={{ color: '#34D399' }}>Asistencia</span>
                                        </div>
                                    </div>
                                    <div className="tt-session">
                                        <span className="dot just mt-1"></span>
                                        <div className="tt-session-info">
                                            <span className="tt-area">Saltos</span>
                                            <span className="tt-sub">Salto largo · Entrenamiento</span>
                                            <span className="tt-status" style={{ color: '#93C5FD' }}>Justificada</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {[...Array(17)].map((_, i) => (
                                <div key={i + 15} className="calendar-day">
                                    <span className="date-num">{i + 15}</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="calendar-legend">
                            <span><span className="dot asis"></span> Asistencia</span>
                            <span><span className="dot inasis"></span> Inasistencia</span>
                            <span><span className="dot just"></span> Justificada</span>
                            <span><span className="dot" style={{ backgroundColor: '#CBD5E1' }}></span> Sin sesión</span>
                        </div>
                    </div>
                </div>

                {/* HISTORY LIST */}
                <div className="card area-history">
                    <div className="card-header">
                        <h3 className="card-title">Historial Reciente</h3>
                    </div>
                    <div className="history-list">
                        
                        <div className="history-item asis">
                            <div className="hist-date">14 AGO</div>
                            <div className="hist-details">
                                <div className="hist-area">Velocidad</div>
                                <div className="hist-sub">100 m</div>
                            </div>
                            <div className="hist-badge asis">Asistencia</div>
                        </div>

                        <div className="history-item just">
                            <div className="hist-date">14 AGO</div>
                            <div className="hist-details">
                                <div className="hist-area">Saltos</div>
                                <div className="hist-sub">Salto largo</div>
                            </div>
                            <div className="hist-badge just">Justificada</div>
                        </div>

                        <div className="history-item asis">
                            <div className="hist-date">12 AGO</div>
                            <div className="hist-details">
                                <div className="hist-area">Velocidad</div>
                                <div className="hist-sub">200 m</div>
                            </div>
                            <div className="hist-badge asis">Asistencia</div>
                        </div>

                        <div className="history-item inasis">
                            <div className="hist-date">11 AGO</div>
                            <div className="hist-details">
                                <div className="hist-area">Velocidad</div>
                                <div className="hist-sub">100 m</div>
                            </div>
                            <div className="hist-badge inasis">Inasistencia</div>
                        </div>
                        
                        <div className="history-item asis">
                            <div className="hist-date">10 AGO</div>
                            <div className="hist-details">
                                <div className="hist-area">Velocidad</div>
                                <div className="hist-sub">100 m</div>
                            </div>
                            <div className="hist-badge asis">Asistencia</div>
                        </div>
                        
                        <div className="history-item asis">
                            <div className="hist-date">05 AGO</div>
                            <div className="hist-details">
                                <div className="hist-area">Saltos</div>
                                <div className="hist-sub">Salto largo</div>
                            </div>
                            <div className="hist-badge asis">Asistencia</div>
                        </div>
                        
                        <div className="history-item asis">
                            <div className="hist-date">05 AGO</div>
                            <div className="hist-details">
                                <div className="hist-area">Velocidad</div>
                                <div className="hist-sub">100 m</div>
                            </div>
                            <div className="hist-badge asis">Asistencia</div>
                        </div>

                    </div>
                </div>

                {/* TREND CHART (RECHARTS) */}
                <div className="card area-trend">
                    <div className="card-header">
                        <h3 className="card-title">Evolución de mi asistencia (Últimos 6 meses)</h3>
                    </div>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#1E293B" stopOpacity={0.2} />
                                        <stop offset="100%" stopColor="#1E293B" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#E2E8F0" />
                                <XAxis 
                                    dataKey="month" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748B', fontFamily: 'Inter' }} 
                                />
                                <YAxis 
                                    domain={[60, 100]} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#64748B', fontFamily: 'Inter' }} 
                                    tickFormatter={(val) => `${val}%`} 
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1E293B', borderRadius: '8px', color: '#fff', border: 'none' }}
                                    formatter={(value) => [`${value}% Asistencia`, '']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="pct"
                                    stroke="#1E293B"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#trendGradient)"
                                    dot={{ fill: '#1E293B', stroke: '#fff', strokeWidth: 2, r: 5 }}
                                    activeDot={{ r: 7 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AsistenciaAtletaView;