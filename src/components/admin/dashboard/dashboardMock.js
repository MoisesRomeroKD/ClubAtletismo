export const DASHBOARD_MOCK_DATA = {
  all: {
    kpis: [
      { id: "atletas-totales", title: 'Atletas Totales', value: '164', icon: 'fa-users', type: 'atletas', activeText: 'Matriculados en sistema' },
      { id: "atletas-disponibles", title: 'Atletas Disponibles', value: '150', icon: 'fa-user-check', type: 'atletas', activeText: '91.5% del plantel total' },
      { id: "atletas-justificados", title: 'Atletas Justificados', value: '14', icon: 'fa-user-clock', type: 'atletas' },
      { id: "staff-registrado", title: 'Staff Registrado', value: '24', icon: 'fa-id-badge', type: 'staff', caption: 'Entrenadores con acceso al sistema' }
    ],
    alerts: [
      {
        id: 1, type: 'danger', icon: '⚠️', title: 'Inasistencias Reiteradas',
        description: '3 atletas del grupo de Velocidad han acumulado más de 3 faltas no justificadas esta semana.',
        affectedAthletes: [
          { id: 101, name: 'Carlos Mendoza', detail: '4 inasistencias esta semana', group: 'Velocidad (100m)' },
          { id: 102, name: 'Jesús Morales', detail: '3 inasistencias esta semana', group: 'Velocidad (200m)' },
          { id: 103, name: 'Andrés López', detail: '5 inasistencias esta semana', group: 'Velocidad (100m)' }
        ]
      },
      {
        id: 2, type: 'warning', icon: '🌙', title: 'Calidad de Sueño Deficiente',
        description: '5 atletas reportaron una calidad de sueño crítica (menor a 5/10) en su último registro.',
        affectedAthletes: [
          { id: 201, name: 'Mariana Silva', detail: 'Calidad de sueño: 3/10', group: 'Resistencia (21k)' },
          { id: 202, name: 'Alejandro Rivas', detail: 'Calidad de sueño: 4/10', group: 'Lanzamiento (Disco)' },
          { id: 203, name: 'Sofia Torres', detail: 'Calidad de sueño: 2/10', group: 'Resistencia (42k)' }
        ]
      }
    ],
    athletes: [
      { id: 1, name: 'Carlos Mendoza', sport: 'Velocidad - 100m', igr: '92.4%', fatigue: 'Baja (0.95)', status: 'Óptimo', statusClass: 'status-optimal' },
      { id: 2, name: 'Mariana Silva', sport: 'Resistencia - 21k', igr: '88.1%', fatigue: 'Moderada (1.22)', status: 'Atención', statusClass: 'status-warning' },
      { id: 3, name: 'Alejandro Rivas', sport: 'Lanzamiento - Disco', igr: '76.5%', fatigue: 'Alta (1.42)', status: 'Riesgo', statusClass: 'status-danger' },
      { id: 4, name: 'Luis Gómez', sport: 'Saltos - Salto Largo', igr: '89.0%', fatigue: 'Baja (0.88)', status: 'Óptimo', statusClass: 'status-optimal' }
    ],
    charts: {
      radar: {
        metrics: [
          { label: 'Potencia (Salto)', rawValue: 55, min: 15.0, max: 85.0, isInverted: false, unit: 'cm' },
          { label: 'Velocidad (Sprint 30m)', rawValue: 4.1, min: 6.5, max: 3.6, isInverted: true, unit: 's' },
          { label: 'Resistencia (Navette)', rawValue: 12, min: 2.0, max: 18.0, isInverted: false, unit: 'Niv' },
          { label: 'Envergadura (Alcance)', rawValue: 8, min: -5.0, max: 15.0, isInverted: false, unit: 'cm' },
          { label: 'Fuerza (Sentadilla/Peso)', rawValue: 1.8, min: 0.5, max: 2.5, isInverted: false, unit: 'ratio' },
          { label: 'Flexibilidad (Wells)', rawValue: 15, min: -10.0, max: 25.0, isInverted: false, unit: 'cm' }
        ]
      },
      bar: {
        labels: ['Velocidad', 'Resistencia', 'Saltos', 'Lanzamiento'],
        // Refleja los promedios globales de asistencia por área (95%, 92%, 96%, 88%)
        data: [95, 92, 96, 88]
      },
      pie: {
        labels: ['Velocidad', 'Resistencia', 'Saltos', 'Lanzamiento'],
        data: [55, 45, 38, 26],
        colors: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b']
      }
    }
  },

  velocidad: {
    kpis: [
      { id: "atl-vel", title: 'Atletas (Velocidad)', value: '55', icon: 'fa-bolt', type: 'atletas' },
      { id: "vel-optimos", title: 'Estado Óptimo', value: '48', icon: 'fa-check-circle', type: 'atletas' },
      { id: "vel-lesiones", title: 'En Fisioterapia', value: '2', icon: 'fa-briefcase-medical', type: 'staff' },
      { id: "vel-asistencia", title: 'Asistencia Promedio', value: '95%', icon: 'fa-chart-line', type: 'staff' }
    ],
    alerts: [
      {
        id: 1, type: 'danger', icon: '⚠️', title: 'Inasistencias Reiteradas',
        description: '3 atletas del grupo de Velocidad han acumulado más de 3 faltas no justificadas esta semana.',
        affectedAthletes: [
          { id: 101, name: 'Carlos Mendoza', detail: '4 inasistencias esta semana', group: 'Velocidad (100m)' },
          { id: 102, name: 'Jesús Morales', detail: '3 inasistencias esta semana', group: 'Velocidad (200m)' },
          { id: 103, name: 'Andrés López', detail: '5 inasistencias esta semana', group: 'Velocidad (100m)' }
        ]
      }
    ],
    athletes: [
      { id: 1, name: 'Carlos Mendoza', sport: 'Velocidad - 100m', igr: '92.4%', fatigue: 'Baja (0.95)', status: 'Óptimo', statusClass: 'status-optimal' },
      { id: 102, name: 'Jesús Morales', sport: 'Velocidad - 200m', igr: '78.2%', fatigue: 'Alta (1.35)', status: 'Riesgo', statusClass: 'status-danger' }
    ],
    charts: {
      radar: {
        metrics: [
          { label: 'Potencia (Salto)', rawValue: 72, min: 15.0, max: 85.0, isInverted: false, unit: 'cm' },
          { label: 'Velocidad (Sprint 30m)', rawValue: 3.8, min: 6.5, max: 3.6, isInverted: true, unit: 's' },
          { label: 'Resistencia (Navette)', rawValue: 7, min: 2.0, max: 18.0, isInverted: false, unit: 'Niv' },
          { label: 'Envergadura (Alcance)', rawValue: 5, min: -5.0, max: 15.0, isInverted: false, unit: 'cm' },
          { label: 'Fuerza (Sentadilla/Peso)', rawValue: 1.6, min: 0.5, max: 2.5, isInverted: false, unit: 'ratio' },
          { label: 'Flexibilidad (Wells)', rawValue: 18, min: -10.0, max: 25.0, isInverted: false, unit: 'cm' }
        ]
      },
      bar: {
        labels: ['100m', '200m', '400m', 'Vallas'],
        // Promedio matemático = 95%
        data: [96, 94, 97, 93]
      },
      pie: {
        labels: ['100m', '200m', '400m', 'Vallas'],
        data: [20, 15, 12, 8],
        colors: ['#3b82f6', '#06b6d4', '#8b5cf6', '#6366f1']
      }
    }
  },

  resistencia: {
    kpis: [
      { id: "atl-res", title: 'Atletas (Resistencia)', value: '45', icon: 'fa-stopwatch', type: 'atletas' },
      { id: "res-optimos", title: 'Estado Óptimo', value: '40', icon: 'fa-check-circle', type: 'atletas' },
      { id: "res-lesiones", title: 'En Fisioterapia', value: '3', icon: 'fa-briefcase-medical', type: 'staff' },
      { id: "res-asistencia", title: 'Asistencia Promedio', value: '92%', icon: 'fa-chart-line', type: 'staff' }
    ],
    alerts: [
      {
        id: 2, type: 'warning', icon: '🌙', title: 'Calidad de Sueño Deficiente',
        description: 'Varios fondistas reportaron una calidad de sueño crítica (menor a 5/10) en su último registro.',
        affectedAthletes: [
          { id: 201, name: 'Mariana Silva', detail: 'Calidad de sueño: 3/10', group: 'Resistencia (21k)' },
          { id: 203, name: 'Sofia Torres', detail: 'Calidad de sueño: 2/10', group: 'Resistencia (42k)' }
        ]
      }
    ],
    athletes: [
      { id: 2, name: 'Mariana Silva', sport: 'Resistencia - 21k', igr: '88.1%', fatigue: 'Moderada (1.22)', status: 'Atención', statusClass: 'status-warning' },
      { id: 203, name: 'Sofia Torres', sport: 'Resistencia - 42k', igr: '75.0%', fatigue: 'Alta (1.50)', status: 'Riesgo', statusClass: 'status-danger' }
    ],
    charts: {
      radar: {
        metrics: [
          { label: 'Potencia (Salto)', rawValue: 35, min: 15.0, max: 85.0, isInverted: false, unit: 'cm' },
          { label: 'Velocidad (Sprint 30m)', rawValue: 4.8, min: 6.5, max: 3.6, isInverted: true, unit: 's' },
          { label: 'Resistencia (Navette)', rawValue: 16, min: 2.0, max: 18.0, isInverted: false, unit: 'Niv' },
          { label: 'Envergadura (Alcance)', rawValue: 2, min: -5.0, max: 15.0, isInverted: false, unit: 'cm' },
          { label: 'Fuerza (Sentadilla/Peso)', rawValue: 1.2, min: 0.5, max: 2.5, isInverted: false, unit: 'ratio' },
          { label: 'Flexibilidad (Wells)', rawValue: 14, min: -10.0, max: 25.0, isInverted: false, unit: 'cm' }
        ]
      },
      bar: {
        labels: ['800m', '1500m', '21k', '42k'],
        // Promedio matemático = 92%
        data: [93, 90, 94, 91]
      },
      pie: {
        labels: ['800m', '1500m', '21k', '42k'],
        data: [15, 12, 10, 8],
        colors: ['#10b981', '#059669', '#047857', '#064e3b']
      }
    }
  },

  lanzamiento: {
    kpis: [
      { id: "atl-lan", title: 'Atletas (Lanzamiento)', value: '26', icon: 'fa-dumbbell', type: 'atletas' },
      { id: "lan-optimos", title: 'Estado Óptimo', value: '20', icon: 'fa-check-circle', type: 'atletas' },
      { id: "lan-lesiones", title: 'En Fisioterapia', value: '4', icon: 'fa-briefcase-medical', type: 'staff' },
      { id: "lan-asistencia", title: 'Asistencia Promedio', value: '88%', icon: 'fa-chart-line', type: 'staff' }
    ],
    alerts: [
      {
        id: 3, type: 'warning', icon: '📉', title: 'Caída de Fuerza Absoluta',
        description: '2 atletas muestran un declive superior al 5% en sus marcas de fuerza máxima.',
        affectedAthletes: [
          { id: 301, name: 'Alejandro Rivas', detail: '-6% en sentadilla', group: 'Lanzamiento (Disco)' }
        ]
      }
    ],
    athletes: [
      { id: 3, name: 'Alejandro Rivas', sport: 'Lanzamiento - Disco', igr: '76.5%', fatigue: 'Alta (1.42)', status: 'Riesgo', statusClass: 'status-danger' }
    ],
    charts: {
      radar: {
        metrics: [
          { label: 'Potencia (Salto)', rawValue: 45, min: 15.0, max: 85.0, isInverted: false, unit: 'cm' },
          { label: 'Velocidad (Sprint 30m)', rawValue: 5.2, min: 6.5, max: 3.6, isInverted: true, unit: 's' },
          { label: 'Resistencia (Navette)', rawValue: 5, min: 2.0, max: 18.0, isInverted: false, unit: 'Niv' },
          { label: 'Envergadura (Alcance)', rawValue: 12, min: -5.0, max: 15.0, isInverted: false, unit: 'cm' },
          { label: 'Fuerza (Sentadilla/Peso)', rawValue: 2.3, min: 0.5, max: 2.5, isInverted: false, unit: 'ratio' },
          { label: 'Flexibilidad (Wells)', rawValue: 8, min: -10.0, max: 25.0, isInverted: false, unit: 'cm' }
        ]
      },
      bar: {
        labels: ['Bala', 'Disco', 'Martillo', 'Jabalina'],
        // Promedio matemático = 88%
        data: [89, 86, 85, 92]
      },
      pie: {
        labels: ['Bala', 'Disco', 'Martillo', 'Jabalina'],
        data: [8, 6, 5, 7],
        colors: ['#f59e0b', '#d97706', '#b45309', '#78350f']
      }
    }
  },

  saltos: {
    kpis: [
      { id: "atl-sal", title: 'Atletas (Saltos)', value: '38', icon: 'fa-arrow-up', type: 'atletas' },
      { id: "sal-optimos", title: 'Estado Óptimo', value: '35', icon: 'fa-check-circle', type: 'atletas' },
      { id: "sal-lesiones", title: 'En Fisioterapia', value: '1', icon: 'fa-briefcase-medical', type: 'staff' },
      { id: "sal-asistencia", title: 'Asistencia Promedio', value: '96%', icon: 'fa-chart-line', type: 'staff' }
    ],
    alerts: [],
    athletes: [
      { id: 4, name: 'Luis Gómez', sport: 'Saltos - Salto Largo', igr: '89.0%', fatigue: 'Baja (0.88)', status: 'Óptimo', statusClass: 'status-optimal' }
    ],
    charts: {
      radar: {
        metrics: [
          { label: 'Potencia (Salto)', rawValue: 82, min: 15.0, max: 85.0, isInverted: false, unit: 'cm' },
          { label: 'Velocidad (Sprint 30m)', rawValue: 4.2, min: 6.5, max: 3.6, isInverted: true, unit: 's' },
          { label: 'Resistencia (Navette)', rawValue: 9, min: 2.0, max: 18.0, isInverted: false, unit: 'Niv' },
          { label: 'Envergadura (Alcance)', rawValue: 10, min: -5.0, max: 15.0, isInverted: false, unit: 'cm' },
          { label: 'Fuerza (Sentadilla/Peso)', rawValue: 1.9, min: 0.5, max: 2.5, isInverted: false, unit: 'ratio' },
          { label: 'Flexibilidad (Wells)', rawValue: 20, min: -10.0, max: 25.0, isInverted: false, unit: 'cm' }
        ]
      },
      bar: {
        labels: ['Largo', 'Triple', 'Alto', 'Pértiga'],
        // Promedio matemático = 96%
        data: [97, 95, 98, 94]
      },
      pie: {
        labels: ['Largo', 'Triple', 'Alto', 'Pértiga'],
        data: [12, 10, 9, 7],
        colors: ['#8b5cf6', '#7c3aed', '#6d28d9', '#4c1d95']
      }
    }
  }
};