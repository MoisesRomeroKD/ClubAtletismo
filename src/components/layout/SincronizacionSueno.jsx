import { useEffect, useRef, useState } from 'react';
import { contarPendientes, EVENTO_PENDIENTES, sincronizarPendientes } from '../../api/services/suenoPendientes';
import '../../styles/layouts/SincronizacionSueno.css';

const REINTENTO_MS = 60000;
const DURACION_AVISO_MS = 7000;

// Envía los registros de sueño guardados sin conexión cuando vuelve internet y avisa al usuario.
export default function SincronizacionSueno() {
  const [aviso, setAviso] = useState(null);
  const sincronizando = useRef(false);

  useEffect(() => {
    let temporizadorAviso;

    const intentar = async () => {
      if (sincronizando.current || !navigator.onLine || !localStorage.getItem('token') || !contarPendientes()) return;
      sincronizando.current = true;
      try {
        const { guardados, rechazados } = await sincronizarPendientes();
        if (guardados || rechazados) {
          const partes = [];
          if (guardados) partes.push(`Se guardaron ${guardados} registro${guardados !== 1 ? 's' : ''} de sueño que estaban pendientes.`);
          if (rechazados) partes.push(`${rechazados} no se pudo${rechazados !== 1 ? 'ieron' : ''} guardar porque ya existía o no era válido.`);
          setAviso({ tipo: rechazados && !guardados ? 'error' : 'ok', texto: partes.join(' ') });
          clearTimeout(temporizadorAviso);
          temporizadorAviso = setTimeout(() => setAviso(null), DURACION_AVISO_MS);
        }
      } finally {
        sincronizando.current = false;
      }
    };

    intentar();
    window.addEventListener('online', intentar);
    window.addEventListener(EVENTO_PENDIENTES, intentar);
    const intervalo = setInterval(intentar, REINTENTO_MS);
    return () => {
      window.removeEventListener('online', intentar);
      window.removeEventListener(EVENTO_PENDIENTES, intentar);
      clearInterval(intervalo);
      clearTimeout(temporizadorAviso);
    };
  }, []);

  if (!aviso) return null;

  return (
    <div className={`sync-sueno sync-sueno--${aviso.tipo}`} role="status" aria-live="polite">
      <span>{aviso.texto}</span>
      <button type="button" onClick={() => setAviso(null)} aria-label="Cerrar aviso">✕</button>
    </div>
  );
}
