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
  }
};

export default CineantropometriaService;