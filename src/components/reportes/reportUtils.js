export const CINE_AXES = [
  ['potencia', 'Potencia'],
  ['velocidad', 'Velocidad'],
  ['resistencia', 'Resistencia'],
  ['envergadura', 'Envergadura'],
  ['fuerza', 'Fuerza'],
  ['flexibilidad', 'Flexibilidad'],
];

export const ESTADO_LABELS = { activo: 'Activo', inactivo: 'Inactivo', justificado: 'Justificado' };

export const SEMAFORO_LABELS = { verde: 'Bien', amarillo: 'Atención', rojo: 'Crítico', sin_datos: 'Sin datos' };

export const formatNumber = (value, suffix = '') => (
  value === null || value === undefined ? '—' : `${value}${suffix}`
);

export const formatDate = (value) => (
  value ? new Date(`${value}T00:00:00`).toLocaleDateString('es-VE') : '—'
);

export const formatMonth = (value) => {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('es-VE', { month: 'short', year: '2-digit' });
};

export const errorMessage = (error, fallback) => error?.response?.data?.detail || fallback;
