import podApi from '../podApi';

// Auditoría del administrador — /api/v1/auditoria/
const AuditoriaService = {
  getEventos: async (params = {}) => (await podApi.get('/v1/auditoria/', { params })).data,
  // Toda la auditoría para descargarla; el backend anota hasta qué registro se exportó.
  exportarTodo: async () => (await podApi.post('/v1/auditoria/exportar/')).data,
  // Borra solo lo exportado; confirmacion debe ser "BORRAR".
  vaciar: async (exportacionId, confirmacion) => (
    await podApi.post('/v1/auditoria/vaciar/', { exportacion_id: exportacionId, confirmacion })
  ).data,
};

export default AuditoriaService;
