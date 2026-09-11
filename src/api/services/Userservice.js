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

  // ============================================================
  // ENTRENADORES
  // GET /api/v1/users/entrenadores/
  // ============================================================

  getTrainers: async () => {
    const response = await podApi.get(
      '/v1/users/entrenadores'
    );

    return response.data;
  },

  // ============================================================
  // MIS ATLETAS
  // GET /api/v1/users/entrenador/mis-atletas/
  // ============================================================

  getMyAthletes: async () => {
    const response = await podApi.get(
      '/v1/users/entrenador/mis-atletas'
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

  getTrainerDashboardSummary: async () => {
    const response = await podApi.get(
      '/v1/users/entrenador/dashboard/summary'
    );

    return response.data;
  },

  registerSleep: async (athleteId, quality) => {
    const response = await podApi.post('/v1/descanso/sueno/registrar', {
      atleta_id: athleteId,
      calidad: quality
    });
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
  }
};

export default UserService;