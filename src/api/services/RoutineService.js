import podApi from '../podApi';

const BASE = '/v1/rutinas/planes';

const routineService = {
  list: async () => (await podApi.get(BASE)).data,
  create: async (data) => (await podApi.post(BASE, data)).data,
  update: async (id, data) => (await podApi.patch(`${BASE}/${id}`, data)).data,
  publish: async (id) => (await podApi.post(`${BASE}/${id}/publicar`)).data,
};

export default routineService;