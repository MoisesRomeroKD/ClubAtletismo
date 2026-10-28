import axios from 'axios';

// Estado del servidor: cuando está apagado por inactividad tarda en encenderse.
// La pantalla "Iniciando servidor" (ServidorIniciando.jsx) escucha este evento y revisa /salud/.
export const EVENTO_REVISAR_SERVIDOR = 'servidor:revisar';

export const pedirRevisionServidor = () => {
  window.dispatchEvent(new Event(EVENTO_REVISAR_SERVIDOR));
};

// true si el servidor respondió a tiempo. Usa axios directo (sin token ni los interceptores de podApi).
export async function servidorResponde(baseURL, timeoutMs) {
  try {
    const { data } = await axios.get(`${baseURL}/v1/salud/`, { timeout: timeoutMs });
    return data?.ok === true;
  } catch {
    return false;
  }
}
