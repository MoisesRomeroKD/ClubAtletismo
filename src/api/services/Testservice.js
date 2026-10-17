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
  // Planilla del entrenador: cada fila se guarda al momento y luego se finaliza el test.
  saveResultadoAtleta: async (id, atletaId, data) => (await podApi.put(`${BASE}/tests/${id}/resultados/${atletaId}/`, data)).data,
  finalizarTest: async (id) => (await podApi.post(`${BASE}/tests/${id}/finalizar/`)).data,
  getAtletasDisponibles: async (params = {}) => (await podApi.get(`${BASE}/tests/atletas-disponibles/`, { params })).data,
  getFiltrosTests: async () => (await podApi.get(`${BASE}/tests/filtros/`)).data,

  getMisResultados: async () => (await podApi.get(`${BASE}/mis-resultados/`)).data,

  // Rendimiento en tests por atleta (admin: todos; entrenador: sus tests). Filtros: buscar, prueba, subarea, desde, hasta, page.
  getResultados: async (params = {}) => (await podApi.get(`${BASE}/resultados/`, { params })).data,
};

export default TestService;
