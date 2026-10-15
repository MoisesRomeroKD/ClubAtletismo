import podApi from '../podApi';
import { registrarSueno } from './suenoPendientes';

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

  // ============================================================
  // REPRESENTANTES
  // GET /api/v1/users/representantes/
  // ============================================================

  getRepresentatives: async (params = {}) => {
    const response = await podApi.get(
      '/v1/users/representantes',
      { params }
    );

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

  getTrainerDashboardSummary: async (params = {}) => {
    const response = await podApi.get(
      '/v1/users/entrenador/dashboard/summary',
      { params }
    );

    return response.data;
  },

  // Si no hay conexión, el registro queda guardado en el dispositivo y se envía al volver internet.
  registerSleep: async (athleteId, quality) => registrarSueno(athleteId, quality),

  getAttendanceHistoryByCedula: async (cedula) => {
    const response = await podApi.get('/v1/asistencias/atletas/historial', {
      params: { cedula },
    });
    return response.data;
  },

  getSleepHistoryByAthlete: async (athleteId) => {
    const response = await podApi.get(
      `/v1/descanso/sueno/consultar/${athleteId}`
    );
    return response.data;
  },

  getAdminSleepDashboard: async (params = {}) => {
    const response = await podApi.get(
      '/v1/descanso/sueno/dashboard-admin',
      { params }
    );
    return response.data;
  },

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
    return response.data;
  },

  getMyEvaluaciones: async () => {
    const response = await podApi.get('/v1/evaluacion/mis-evaluaciones/');
    return response.data;
  },
};

export default UserService;