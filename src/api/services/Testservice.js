import podApi from '../podApi';

// Módulo de Tests (pruebas físicas/técnicas) — /api/v1/evaluacion/
const BASE = '/v1/evaluacion';

const TestService = {
  getPruebas: async (params = {}) => (await podApi.get(`${BASE}/pruebas/`, { params })).data,
  createPrueba: async (data) => (await podApi.post(`${BASE}/pruebas/`, data)).data,
  updatePrueba: async (id, data) => (await podApi.patch(`${BASE}/pruebas/${id}/`, data)).data,
  getAplicacionesPrueba: async (id) => (await podApi.get(`${BASE}/pruebas/${id}/aplicaciones/`)).data,

  getTests: async (params = {}) => (await podApi.get(`${BASE}/tests/`, { params })).data,
  createTest: async (data) => (await podApi.post(`${BASE}/tests/`, data)).data,
  updateTest: async (id, data) => (await podApi.patch(`${BASE}/tests/${id}/`, data)).data,
  getTest: async (id) => (await podApi.get(`${BASE}/tests/${id}/`)).data,
  saveResultados: async (id, data) => (await podApi.put(`${BASE}/tests/${id}/resultados/`, data)).data,

  getRanking: async (params = {}) => (await podApi.get(`${BASE}/ranking/`, { params })).data,
  getMisResultados: async () => (await podApi.get(`${BASE}/mis-resultados/`)).data,
};

export default TestService;
