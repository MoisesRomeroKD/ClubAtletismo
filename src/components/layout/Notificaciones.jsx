import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { EVENTO_NOTIFICAR } from '../../utils/notificar';
import '../../styles/layouts/Notificaciones.css';

/*
 * NOTIFICACIONES (reemplazan a alert): se apilan arriba a la derecha, debajo del topbar.
 * Cada una tiene botón ✕ y se cierra sola a los 5 segundos. Si trae alCerrar, se ejecuta al cerrarse.
 */
const DURACION_MS = 5000;
const ICONOS = { exito: CheckCircle2, error: AlertCircle, aviso: AlertTriangle, info: Info };

function Notificacion({ notificacion, onCerrar }) {
  const Icono = ICONOS[notificacion.tipo] || Info;

  useEffect(() => {
    const temporizador = setTimeout(() => onCerrar(notificacion), DURACION_MS);
    return () => clearTimeout(temporizador);
  }, [notificacion, onCerrar]);

  return (
    <div
      className={`notificacion notificacion--${notificacion.tipo}`}
      role={notificacion.tipo === 'error' ? 'alert' : 'status'}
    >
      <Icono size={20} aria-hidden="true" className="notificacion__icono" />
      <p className="notificacion__texto">{notificacion.mensaje}</p>
      <button type="button" className="notificacion__cerrar" onClick={() => onCerrar(notificacion)} aria-label="Cerrar notificación">
        <X size={16} />
      </button>
      <span className="notificacion__tiempo" style={{ animationDuration: `${DURACION_MS}ms` }} aria-hidden="true" />
    </div>
  );
}

export default function Notificaciones() {
  const [lista, setLista] = useState([]);
  const cerradas = useRef(new Set());

  useEffect(() => {
    const alNotificar = (evento) => setLista((actual) => [...actual, evento.detail].slice(-5));
    window.addEventListener(EVENTO_NOTIFICAR, alNotificar);
    return () => window.removeEventListener(EVENTO_NOTIFICAR, alNotificar);
  }, []);

  const cerrar = useCallback((notificacion) => {
    // Solo una vez (por si coinciden la ✕ y el cierre automático).
    if (cerradas.current.has(notificacion.id)) return;
    cerradas.current.add(notificacion.id);
    setLista((actual) => actual.filter((item) => item.id !== notificacion.id));
    notificacion.alCerrar?.();
  }, []);

  if (!lista.length) return null;

  return (
    <div className="notificaciones" aria-live="polite">
      {lista.map((notificacion) => (
        <Notificacion key={notificacion.id} notificacion={notificacion} onCerrar={cerrar} />
      ))}
    </div>
  );
}
