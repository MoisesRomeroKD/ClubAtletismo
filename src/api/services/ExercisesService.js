import podApi from '../podApi';

const exercisesService = {
  // Listar ejercicios (filtrados por entrenador o todos si es admin)
  list: async () => {
    const response = await podApi.get('/v1/rutinas/ejercicios/');
    return response.data;
  },

  // Crear ejercicio
  create: async (data) => {
    const response = await podApi.post('/v1/rutinas/ejercicios/', data);
    return response.data;
  },

  // Actualizar ejercicio
  update: async (id, data) => {
    const response = await podApi.put(`/v1/rutinas/ejercicios/${id}/`, data);
    return response.data;
  },

  // Eliminar ejercicio
  delete: async (id) => {
    const response = await podApi.delete(`/v1/rutinas/ejercicios/${id}/`);
    return response.data;
  },
};

export default exercisesService;
