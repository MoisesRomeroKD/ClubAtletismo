import podApi from '../podApi';

// Registros de sueño hechos sin conexión: se guardan en este dispositivo y se envían al volver internet.
const CLAVE = 'pod_sueno_pendientes';
export const EVENTO_PENDIENTES = 'sueno:pendientes-cambio';
const URL_REGISTRO = '/v1/descanso/sueno/registrar/';

export const MENSAJE_PENDIENTE = 'Sin conexión: tu registro quedó guardado en este dispositivo y se enviará cuando vuelva internet.';

const fechaLocal = () => {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
};

const usuarioActual = () => {
  try {
    return localStorage.getItem('user_id') || localStorage.getItem('userId') || '';
  } catch {
    return '';
  }
};

const leer = () => {
  try {
    const lista = JSON.parse(localStorage.getItem(CLAVE) || '[]');
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
};

const guardar = (lista) => {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
  } catch {
    // Sin almacenamiento disponible: no hay dónde guardar el respaldo.
  }
  window.dispatchEvent(new Event(EVENTO_PENDIENTES));
};

// Sin respuesta (sin internet), falla del servidor o sesión vencida: vale la pena reintentar después.
const esReintentable = (error) => !error?.response || error.response.status >= 500 || error.response.status === 401;

export const contarPendientes = () => leer().filter((registro) => registro.usuario === usuarioActual()).length;

export async function registrarSueno(atletaId, calidad) {
  const fecha = fechaLocal();
  try {
    const respuesta = await podApi.post(URL_REGISTRO, { atleta_id: atletaId, calidad, fecha });
    return respuesta.data;
  } catch (error) {
    if (!esReintentable(error)) throw error;
    const lista = leer().filter((registro) => !(String(registro.atleta_id) === String(atletaId) && registro.fecha === fecha));
    lista.push({ atleta_id: atletaId, calidad, fecha, usuario: usuarioActual(), creado: Date.now() });
    guardar(lista);
    return { status: 'success', pendiente: true, message: MENSAJE_PENDIENTE };
  }
}

export async function sincronizarPendientes() {
  const usuario = usuarioActual();
  const lista = leer();
  const mios = lista.filter((registro) => registro.usuario === usuario);
  if (!usuario || !mios.length) return { guardados: 0, rechazados: 0 };

  const restantes = lista.filter((registro) => registro.usuario !== usuario);
  let guardados = 0;
  let rechazados = 0;
  let sinConexion = false;

  for (const registro of mios) {
    if (sinConexion) {
      restantes.push(registro);
      continue;
    }
    try {
      await podApi.post(URL_REGISTRO, { atleta_id: registro.atleta_id, calidad: registro.calidad, fecha: registro.fecha });
      guardados += 1;
    } catch (error) {
      if (esReintentable(error)) {
        sinConexion = true;
        restantes.push(registro);
      } else {
        rechazados += 1;
      }
    }
  }

  guardar(restantes);
  return { guardados, rechazados };
}
