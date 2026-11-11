import podApi from '../podApi';

/*
 * Servicio para apps.users.
 *
 * Base real del backend:
 * /api/v1/users/
 *
 * podApi ya contiene:
 * /api
 *
 * Por eso aquí usamos:
 * /v1/users/...
 */

const UserService = {

  // ============================================================
  // NÓMINA COMPLETA DE ATLETAS
  // GET /api/v1/users/atletas/
  // ============================================================

  getAllAthletes: async (params = {}) => {
    const response = await podApi.get(
      '/v1/users/atletas',
      { params }
    );

    return response.data;
  },

  // Editar datos personales del atleta y de su representante (solo con permiso editar_usuarios).
  updateAthlete: async (athleteId, data) => {
    const response = await podApi.patch(`/v1/users/atletas/${athleteId}/`, data);
    return response.data;
  },

  updateAthleteStatus: async (athleteId, data) => {
    const response = await podApi.patch(
      `/v1/users/atletas/${athleteId}/estado`,
      data
    );
    return response.data;
  },

  getAdminReport: async (params = {}) => {
    const response = await podApi.get('/v1/users/reportes/admin', { params });
    return response.data;
  },

  getAthleteReportDetail: async (athleteId, params = {}) => {
    const response = await podApi.get(`/v1/users/reportes/atletas/${athleteId}/detalle`, { params });
    return response.data;
  },

  getTrainerReport: async (params = {}) => {
    const response = await podApi.get('/v1/users/reportes/entrenador', { params });
    return response.data;
  },

  getTrainerAthleteFocus: async (athleteId) => {
    const response = await podApi.get(`/v1/users/reportes/entrenador/atletas/${athleteId}/`);
    return response.data;
  },

  getAthleteCategories: async () => {
    const response = await podApi.get('/v1/users/categorias-deportivas');
    return response.data;
  },

  createAthleteCategory: async (data) => {
    const response = await podApi.post('/v1/users/categorias-deportivas', data);
    return response.data;
  },

  updateAthleteCategory: async (categoryId, data) => {
    const response = await podApi.patch(
      `/v1/users/categorias-deportivas/${categoryId}`,
      data
    );
    return response.data;
  },

  deleteAthleteCategory: async (categoryId) => {
    const response = await podApi.delete(
      `/v1/users/categorias-deportivas/${categoryId}`
    );
    return response.data;
  },

  getSubareas: async () => {
    const response = await podApi.get('/v1/atletismo/subareas');
    return response.data;
  },

  getAreas: async () => {
    const response = await podApi.get('/v1/atletismo/areas');
    return response.data;
  },

  createArea: async (data) => {
    const response = await podApi.post('/v1/atletismo/areas', data);
    return response.data;
  },

  createSubarea: async (data) => {
    const response = await podApi.post('/v1/atletismo/subareas', data);
    return response.data;
  },

  // Cambiar el nombre o eliminar (permiso gestionar_areas). Solo se elimina lo que nada usa.
  updateArea: async (id, data) => (await podApi.patch(`/v1/atletismo/areas/${id}/`, data)).data,
  deleteArea: async (id) => { await podApi.delete(`/v1/atletismo/areas/${id}/`); },
  updateSubarea: async (id, data) => (await podApi.patch(`/v1/atletismo/subareas/${id}/`, data)).data,
  deleteSubarea: async (id) => { await podApi.delete(`/v1/atletismo/subareas/${id}/`); },

  // Corregir registros ya guardados (hasta una semana después de su fecha).
  // Asistencia: { status, detail } con editar_asistencia. Sueño: calidad 1-10 con editar_descanso.
  corregirAsistencia: async (id, data) => (await podApi.patch(`/v1/asistencias/asistencia/${id}/`, data)).data,
  corregirSueno: async (id, calidad) => (await podApi.patch(`/v1/descanso/sueno/${id}/`, { calidad })).data,

  // ============================================================
  // ENTRENADORES
  // GET /api/v1/users/entrenadores/
  // ============================================================

  getTrainers: async (params = {}) => {
    const response = await podApi.get(
      '/v1/users/entrenadores',
      { params }
    );

    return response.data;
  },

  // Guardar las subáreas de un atleta / de un entrenador: se envía la lista completa de ids elegidos.
  getAthleteSubareas: async (athleteId) => {
    const response = await podApi.get(`/v1/users/atletas/${athleteId}/subareas/`);
    return response.data;
  },

  setAthleteSubareas: async (athleteId, subareas) => {
    const response = await podApi.put(`/v1/users/atletas/${athleteId}/subareas/`, { subareas });
    return response.data;
  },

  setTrainerSubareas: async (trainerId, subareas) => {
    const response = await podApi.put(`/v1/users/entrenadores/${trainerId}/subareas/`, { subareas });
    return response.data;
  },

  // Editar un entrenador (solo con permiso editar_usuarios).
  updateTrainer: async (trainerId, data) => {
    const response = await podApi.patch(`/v1/users/entrenadores/${trainerId}/`, data);
    return response.data;
  },

  // ============================================================
  // REPRESENTANTES
  // GET /api/v1/users/representantes/
  // ============================================================

  getRepresentative: async (representativeId) => {
    const response = await podApi.get(`/v1/users/representantes/${representativeId}/`);
    return response.data;
  },

  // Paso del representante: si la cédula es de un entrenador o administrador devuelve sus datos.
  getPersonalPorCedula: async (cedula) => (await podApi.get('/v1/users/preregistro/personal-por-cedula/', { params: { cedula } })).data,

  getRepresentatives: async (params = {}) => {
    const response = await podApi.get(
      '/v1/users/representantes',
      { params }
    );

    return response.data;
  },

  // Editar un representante (solo con permiso editar_usuarios).
  updateRepresentative: async (representativeId, data) => {
    const response = await podApi.patch(`/v1/users/representantes/${representativeId}/`, data);
    return response.data;
  },

  // ============================================================
  // MIS ATLETAS
  // GET /api/v1/users/entrenador/mis-atletas/
  // ============================================================

  getMyAthletes: async (params = {}) => {
    const response = await podApi.get(
      '/v1/users/entrenador/mis-atletas',
      { params }
    );

    return response.data;
  },

  // ============================================================
  // DISCAPACIDADES
  // GET /api/v1/users/catalogos/discapacidades/
  // ============================================================

  getDiscapacidades: async () => {
    const response = await podApi.get(
      '/v1/users/catalogos/discapacidades'
    );

    return response.data;
  },

  // Catálogo (permiso gestionar_discapacidades): { nombre, observacion }.
  createDiscapacidad: async (data) => (await podApi.post('/v1/users/catalogos/discapacidades/', data)).data,
  updateDiscapacidad: async (id, data) => (await podApi.patch(`/v1/users/catalogos/discapacidades/${id}/`, data)).data,
  deleteDiscapacidad: async (id) => { await podApi.delete(`/v1/users/catalogos/discapacidades/${id}/`); },

  // ============================================================
  // SUBÁREAS DEL ENTRENADOR
  // GET /api/v1/users/entrenador/mis-subareas/
  // ============================================================

  getMySubareas: async () => {
    const response = await podApi.get(
      '/v1/users/entrenador/mis-subareas'
    );

    return response.data;
  },

  // Preregistro: ¿la cédula del atleta ya está en el sistema? estado: no_existe, preregistrado, registrado u otro_rol.
  consultarCedulaPreregistro: async (cedula) => (await podApi.get('/v1/users/preregistro/consultar-cedula/', { params: { cedula } })).data,

  // Gestión de Constancias: buscar un atleta por cédula y pedir los datos de varias constancias a la vez
  // (el PDF se arma en constanciaPdf.js).
  buscarAtletaConstancia: async (cedula) => (await podApi.get('/v1/users/constancias/buscar/', { params: { cedula } })).data,
  generarDatosConstancias: async (atletas) => (await podApi.post('/v1/users/constancias/generar/', { atletas })).data,

  // Perfil del atleta autenticado: sus datos, subáreas, entrenadores y representantes.
  getMiPerfilAtleta: async () => {
    const response = await podApi.get('/v1/users/atleta/perfil/');
    return response.data;
  },

  // Análisis de asistencia del administrador (todos los atletas registrados, solo lectura).
  getAnalisisAsistenciaAdmin: async () => {
    const response = await podApi.get('/v1/asistencias/analisis/');
    return response.data;
  },

  getTrainerDashboardSummary: async (params = {}) => {
    const response = await podApi.get(
      '/v1/users/entrenador/dashboard/summary',
      { params }
    );

    return response.data;
  },

  // Solo se registra el sueño de hoy: el backend pone la fecha.
  registerSleep: async (athleteId, quality) => {
    const response = await podApi.post('/v1/descanso/sueno/registrar/', { atleta_id: athleteId, calidad: quality });
    return response.data;
  },

  getSleepHistoryByAthlete: async (athleteId) => {
    const response = await podApi.get(
      `/v1/descanso/sueno/consultar/${athleteId}`
    );
    return response.data;
  },

  // Dashboard principal del administrador (datos reales). params: { area }
  getAdminDashboard: async (params = {}) => {
    const response = await podApi.get('/v1/users/dashboard-admin/', { params });
    return response.data;
  },

  // Home del entrenador y del atleta (datos reales), una petición cada uno.
  getHomeEntrenador: async () => (await podApi.get('/v1/users/entrenador/home/')).data,
  getHomeAtleta: async () => (await podApi.get('/v1/users/atleta/home/')).data,

  // Pendientes de sueño de hoy del administrador, en una sola petición.
  // params: { cedula, area, subarea, despues_de, antes_de } — el backend devuelve 15 por página.
  getPendientesSuenoHoy: async (params = {}) => {
    const response = await podApi.get('/v1/descanso/sueno/pendientes-hoy/', { params });
    return response.data;
  },

  // Sueño del administrador calculado en el servidor (permiso ver_descanso).
  getSuenoAdminResumen: async (periodo) => (await podApi.get('/v1/descanso/sueno/admin/resumen/', { params: { periodo } })).data,
  getSuenoAdminAtletas: async (params = {}) => (await podApi.get('/v1/descanso/sueno/admin/atletas/', { params })).data,

  getTrainerSleepHistory: async (params = {}) => {
    const response = await podApi.get(
      '/v1/descanso/sueno/historial-entrenador',
      { params }
    );
    return response.data;
  },

  // ============================================================
  // PERFIL DEL ADMINISTRADOR AUTENTICADO
  // GET /api/v1/users/administrador/perfil/
  // ============================================================

  getAdminProfile: async () => {
    const response = await podApi.get('/v1/users/administrador/perfil');
    return response.data;
  },

  // ============================================================
  // PERFIL DEL ENTRENADOR AUTENTICADO
  // GET /api/v1/users/entrenador/perfil/
  // ============================================================

  getTrainerProfile: async () => {
    const response = await podApi.get(
      '/v1/users/entrenador/perfil'
    );

    return response.data;
  },

  // ============================================================
  // CAMBIO DE CONTRASEÑA CON OTP
  // POST /api/v1/auth/recuperar-password/
  // POST /api/v1/auth/confirmar-password/
  // ============================================================

  requestPasswordOTP: async (email) => {
    const response = await podApi.post('/v1/auth/recuperar-password/', {
      email
    });
    return response.data;
  },

  confirmPasswordOTP: async (email, codigo, password, confirm_password) => {
    const response = await podApi.post('/v1/auth/confirmar-password/', {
      email,
      codigo,
      password,
      confirm_password
    });
    // Módulo 9.7.3: los tokens anteriores quedan invalidados; se guardan los nuevos.
    if (response.data?.access) localStorage.setItem('token', response.data.access);
    if (response.data?.refresh) localStorage.setItem('refresh_token', response.data.refresh);
    return response.data;
  },

  getMyEvaluaciones: async () => {
    const response = await podApi.get('/v1/evaluacion/mis-evaluaciones/');
    return response.data;
  },
};

export default UserService;