import podApi from '../podApi';

const BASE = '/v1/rutinas/planes';

const routineService = {
  list: async () => (await podApi.get(BASE)).data,
  create: async (data) => (await podApi.post(BASE, data)).data,
  update: async (id, data) => (await podApi.patch(`${BASE}/${id}`, data)).data,
  publish: async (id) => (await podApi.post(`${BASE}/${id}/publicar`)).data,
  // Consulta del administrador: con page devuelve { count, results }; filtros: entrenador, subarea, estado, buscar.
  listAdmin: async (params = {}) => (await podApi.get(BASE, { params })).data,
  getPlan: async (id) => (await podApi.get(`${BASE}/${id}/`)).data,
  getDestinatarios: async (entrenador) => (await podApi.get(`${BASE}/destinatarios/`, { params: { entrenador } })).data,
  getFiltrosAdmin: async () => (await podApi.get(`${BASE}/filtros/`)).data,
};

export default routineService;