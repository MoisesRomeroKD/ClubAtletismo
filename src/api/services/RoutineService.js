import podApi from '../podApi';

const BASE = '/v1/rutinas/planes';

const routineService = {
  list: async () => (await podApi.get(BASE)).data,
  create: async (data) => (await podApi.post(BASE, data)).data,
  update: async (id, data) => (await podApi.patch(`${BASE}/${id}`, data)).data,
  publish: async (id) => (await podApi.post(`${BASE}/${id}/publicar`)).data,
  // Solo el administrador con el permiso eliminar_plan.
  eliminar: async (id) => { await podApi.delete(`${BASE}/${id}/`); },
  // Consulta del administrador: con page devuelve { count, results }; filtros: entrenador, subarea, estado, buscar.
  listAdmin: async (params = {}) => (await podApi.get(BASE, { params })).data,
  getPlan: async (id) => (await podApi.get(`${BASE}/${id}/`)).data,
  // Lista de planes de cualquier rol (resumen, paginada de a 10): { count, results }. Filtros según el rol:
  // buscar, subarea, atleta, entrenador, area, creado (mios/colegas), vigencia (en_curso/proximos/terminados),
  // desde y hasta.
  listar: async (params = {}) => (await podApi.get(BASE, { params: { resumen: 1, page_size: 10, ...params } })).data,
  // Opciones de los filtros de la lista, según el rol.
  getFiltros: async () => (await podApi.get(`${BASE}/filtros/`)).data,
  // A quién llega el plan (lista de atletas), para el administrador y el entrenador.
  getAsignados: async (id) => (await podApi.get(`${BASE}/${id}/asignados/`)).data,
  getDestinatarios: async (entrenador) => (await podApi.get(`${BASE}/destinatarios/`, { params: { entrenador } })).data,
  getFiltrosAdmin: async () => (await podApi.get(`${BASE}/filtros/`)).data,
};

export default routineService;