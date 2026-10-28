// Notificaciones del sistema (en vez de alert): las muestra <Notificaciones /> (montado en App.jsx).
// Uso: notificar('Guardado.', { tipo: 'exito', alCerrar: () => navigate('/ruta') })
// tipo: 'exito' | 'error' | 'aviso' | 'info'. Se cierran solas a los 5 segundos o con la ✕.
export const EVENTO_NOTIFICAR = 'app:notificar';

let siguienteId = 1;

export function notificar(mensaje, { tipo = 'info', alCerrar } = {}) {
  window.dispatchEvent(new CustomEvent(EVENTO_NOTIFICAR, {
    detail: { id: siguienteId++, mensaje: String(mensaje ?? ''), tipo, alCerrar },
  }));
}
