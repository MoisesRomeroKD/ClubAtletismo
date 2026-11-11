// Permiso que necesita cada sección del administrador (basta con tener uno de la lista).
// Lo usan el menú lateral (para ocultar la opción) y el panel (para no dibujar la pantalla si se entra
// por la dirección). El backend valida lo mismo. Las secciones que no están aquí son de cualquier
// administrador (Home, Mi perfil, Áreas y Subáreas y Ejercicios).
export const PERMISOS_SECCION_ADMIN = {
  athletes: ['ver_atletas'],
  administradores: ['ver_personal'],
  entrenadores: ['ver_personal'],
  representantes: ['ver_personal'],
  prerregistro: ['gestionar_preregistros'],
  'prerregistros-pendientes': ['ver_preregistros', 'gestionar_preregistros'],
  'roles-permisos': ['gestionar_permisos'],
  asistencias: ['ver_asistencia'],
  asistencia_general: ['ver_asistencia'],
  asistencia_individual: ['ver_asistencia'],
  'registro-asistencia': ['registrar_asistencia'],
  'tests-programados': ['ver_test'],
  'tests-crear': ['asignar_test'],
  'tests-analisis': ['ver_test'],
  evaluaciones: ['ver_test'],
  evaluacion: ['ver_test'],
  'antropometria-programar': ['ver_cineantropometria', 'registrar_cineantropometria'],
  'antropometria-datos': ['ver_cineantropometria', 'registrar_cineantropometria'],
  'antropometria-analisis': ['ver_cineantropometria'],
  'parametros-antropometria': ['ver_cineantropometria'],
  reportes: ['ver_reportes'],
  auditoria: ['ver_auditoria'],
  constancias: ['emitir_constancias'],
  categorias: ['ver_categorias_deportivas', 'gestionar_categorias_deportivas'],
  discapacidades: ['gestionar_discapacidades'],
};

// Las secciones de sueño (sueño, sueño_general, sueño_individual, sueño_pendientes...) piden ver_descanso.
export const permisosDeSeccionAdmin = (seccion) => (
  String(seccion || '').startsWith('sueño') ? ['ver_descanso'] : PERMISOS_SECCION_ADMIN[seccion] || null
);

export const puedeVerSeccionAdmin = (seccion, hasPermission) => {
  const permisos = permisosDeSeccionAdmin(seccion);
  return !permisos || permisos.some(hasPermission);
};
