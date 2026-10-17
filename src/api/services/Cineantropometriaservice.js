import podApi from '../podApi';

const BASE = '/v1/cineantropometria/evaluations';

const CineantropometriaService = {

  // ============================================================
  // HISTORIAL DE UN ATLETA
  // GET /api/v1/cineantropometria/evaluations/?athlete=X
  // ============================================================

  getEvaluationsByAthlete: async (athleteId) => {
    const response = await podApi.get(BASE, {
      params: {
        athlete: athleteId
      }
    });

    return response.data;
  },

  // ============================================================
  // DETALLE
  // GET /api/v1/cineantropometria/evaluations/:id/
  // ============================================================

  getEvaluationDetail: async (evaluationId) => {
    const response = await podApi.get(
      `${BASE}/${evaluationId}`
    );

    return response.data;
  },

  // ============================================================
  // RADAR
  // GET /api/v1/cineantropometria/evaluations/:id/radar/
  // ============================================================

  getEvaluationRadar: async (evaluationId) => {
    const response = await podApi.get(
      `${BASE}/${evaluationId}/radar`
    );

    return response.data;
  },

  // ============================================================
  // COMPARACIÓN
  // GET /api/v1/cineantropometria/evaluations/:id/compare/:id2/
  // ============================================================

  compareEvaluations: async (currentId, previousId) => {
    const response = await podApi.get(
      `${BASE}/${currentId}/compare/${previousId}`
    );

    return response.data;
  },

  // ============================================================
  // CREAR EVALUACIÓN
  // POST /api/v1/cineantropometria/evaluations/
  // ============================================================

  createEvaluation: async ({
    athleteId,
    trainerId,
    areaId,
    subareaId,
    date,
    measurements
  }) => {

    const response = await podApi.post(BASE, {
      athlete: athleteId,
      trainer: trainerId,
      area: areaId,
      subarea: subareaId,
      date,
      measurements
    });

    return response.data;
  },

  // ============================================================
  // GESTIÓN (ADMIN): mediciones programadas, datos, resumen, configuración
  // ============================================================

  getMediciones: async (params = {}) => (await podApi.get('/v1/cineantropometria/mediciones/', { params })).data,
  createMedicion: async (data) => (await podApi.post('/v1/cineantropometria/mediciones/', data)).data,
  updateMedicion: async (id, data) => (await podApi.patch(`/v1/cineantropometria/mediciones/${id}/`, data)).data,
  getMedicion: async (id) => (await podApi.get(`/v1/cineantropometria/mediciones/${id}/`)).data,
  registrarMedicion: async (id, data) => (await podApi.post(`/v1/cineantropometria/mediciones/${id}/registrar/`, data)).data,

  getDatos: async (params = {}) => (await podApi.get('/v1/cineantropometria/datos/', { params })).data,
  getHistorialAtleta: async (athleteId) => (await podApi.get(`/v1/cineantropometria/datos/atletas/${athleteId}/`)).data,

  getResumen: async () => (await podApi.get('/v1/cineantropometria/resumen/')).data,

  getConfiguracion: async () => (await podApi.get('/v1/cineantropometria/configuracion/')).data,
  updateConfiguracion: async (axis, data) => (await podApi.patch(`/v1/cineantropometria/configuracion/${axis}/`, data)).data,
};

export default CineantropometriaService;