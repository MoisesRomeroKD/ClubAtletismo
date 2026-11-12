// Permiso que necesita cada sección del entrenador (basta con tener uno de la lista). Lo usan el menú
// lateral (para ocultar la opción) y el panel (para no dibujar la pantalla si se entra por la dirección).
// Las consultas del entrenador son siempre de sus propios atletas. Las secciones que no están aquí son
// de cualquier entrenador (Home, Mi perfil, Mis atletas y Rutinas).
export const PERMISOS_SECCION_ENTRENADOR = {
  asistencias: ['ver_asistencia'],
  asistencia: ['ver_asistencia'],
  registro_asistencia: ['registrar_asistencia'],
  mis_tests: ['registrar_test', 'editar_test', 'corregir_resultados_test'],
  crear_test: ['registrar_test'],
  tests_analisis: ['ver_test'],
  cine_programar: ['registrar_cineantropometria'],
  cine_datos: ['ver_cineantropometria'],
  reportes: ['ver_reportes'],
  sueno: ['ver_descanso'],
};

// Las secciones de sueño (sueño_general, sueño_individual, sueño_pendientes) piden ver_descanso.
export const permisosDeSeccionEntrenador = (seccion) => (
  String(seccion || '').startsWith('sueño') ? ['ver_descanso'] : PERMISOS_SECCION_ENTRENADOR[seccion] || null
);

export const puedeVerSeccionEntrenador = (seccion, hasPermission) => {
  const permisos = permisosDeSeccionEntrenador(seccion);
  return !permisos || permisos.some(hasPermission);
};
