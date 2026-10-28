import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';
import podApi from '../../api/podApi';
import { EVENTO_REVISAR_SERVIDOR, servidorResponde } from '../../api/servidorEstado';
import '../../styles/layouts/ServidorIniciando.css';

/*
 * SERVIDOR INICIANDO
 * El servidor se apaga cuando nadie lo usa y tarda cerca de un minuto en encenderse.
 * Esta pantalla aparece solo si el servidor no responde (se revisa /salud/), muestra lo que pasa
 * de verdad (cada intento) y entra sola cuando responde. No nombra dónde está alojado el sistema.
 */
const ESPERA_REVISION_MS = 3500;   // tiempo máximo de cada consulta a /salud/
const INTERVALO_MS = 5000;         // cada cuánto se reintenta
const INTERVALO_LENTO_MS = 10000;  // después de mucho tiempo se reintenta menos seguido
const ARRANQUE_TIPICO_S = 60;      // lo que suele tardar en encenderse (para la barra)
const LIMITE_S = 120;              // a partir de aquí se avisa que algo puede andar mal

const reloj = (segundos) => {
  const mins = String(Math.floor(segundos / 60)).padStart(2, '0');
  const segs = String(segundos % 60).padStart(2, '0');
  return `${mins}:${segs}`;
};

export default function ServidorIniciando() {
  // visible: se muestra la pantalla; desdeInicio: apareció al abrir la app (al estar listo se recarga).
  const [estado, setEstado] = useState({ visible: false, desdeInicio: false, inicio: 0, listo: false });
  const [segundos, setSegundos] = useState(0);
  const [registros, setRegistros] = useState([]);
  const [revisando, setRevisando] = useState(false);
  const [intentos, setIntentos] = useState(0);
  const revisandoRef = useRef(false);
  const intentosRef = useRef(0);
  const consolaRef = useRef(null);
  const visibleRef = useRef(false);

  const anotar = useCallback((texto, tipo = 'normal') => {
    setRegistros((lista) => [...lista, { id: `${Date.now()}-${lista.length}`, texto, tipo }]);
  }, []);

  // Muestra la pantalla solo si el servidor de verdad no responde (y hay internet en el equipo).
  const comprobarYMostrar = useCallback(async (desdeInicio) => {
    if (visibleRef.current || revisandoRef.current || !navigator.onLine) return;
    revisandoRef.current = true;
    const responde = await servidorResponde(podApi.defaults.baseURL, ESPERA_REVISION_MS);
    revisandoRef.current = false;
    if (responde || visibleRef.current) return;
    visibleRef.current = true;
    intentosRef.current = 0;
    setIntentos(0);
    setSegundos(0);
    setRegistros([{ id: 'inicio', texto: '[00:00] El servidor no respondió: se está encendiendo.', tipo: 'acento' }]);
    setEstado({ visible: true, desdeInicio, inicio: Date.now(), listo: false });
  }, []);

  // Al abrir la app se revisa una vez; después, cuando una petición tarda o falla.
  useEffect(() => {
    const alPedirRevision = () => comprobarYMostrar(false);
    const inicial = setTimeout(() => comprobarYMostrar(true), 0);
    window.addEventListener(EVENTO_REVISAR_SERVIDOR, alPedirRevision);
    return () => {
      clearTimeout(inicial);
      window.removeEventListener(EVENTO_REVISAR_SERVIDOR, alPedirRevision);
    };
  }, [comprobarYMostrar]);

  const intentar = useCallback(async () => {
    if (revisandoRef.current || !visibleRef.current) return;
    const transcurrido = reloj(Math.floor((Date.now() - estado.inicio) / 1000));
    if (!navigator.onLine) {
      anotar(`[${transcurrido}] Este equipo no tiene internet.`, 'error');
      return;
    }
    revisandoRef.current = true;
    setRevisando(true);
    intentosRef.current += 1;
    const intento = intentosRef.current;
    setIntentos(intento);
    const responde = await servidorResponde(podApi.defaults.baseURL, ESPERA_REVISION_MS);
    revisandoRef.current = false;
    setRevisando(false);
    if (!visibleRef.current) return;
    if (!responde) {
      anotar(`[${transcurrido}] Intento ${intento}: el servidor aún no responde.`);
      return;
    }
    anotar(`[${transcurrido}] ¡Servidor listo! Entrando...`, 'acento');
    setEstado((actual) => ({ ...actual, listo: true }));
  }, [anotar, estado.inicio]);

  // Reloj y reintentos mientras la pantalla está visible.
  useEffect(() => {
    if (!estado.visible || estado.listo) return undefined;
    const tic = setInterval(() => setSegundos(Math.floor((Date.now() - estado.inicio) / 1000)), 1000);
    let temporizador;
    const programar = () => {
      const largo = (Date.now() - estado.inicio) / 1000 > LIMITE_S;
      temporizador = setTimeout(async () => {
        await intentar();
        programar();
      }, largo ? INTERVALO_LENTO_MS : INTERVALO_MS);
    };
    programar();
    return () => {
      clearInterval(tic);
      clearTimeout(temporizador);
    };
  }, [estado.visible, estado.listo, estado.inicio, intentar]);

  // Servidor listo: al abrir la app se recarga (para cargar los datos); en medio del uso solo se cierra.
  useEffect(() => {
    if (!estado.listo) return undefined;
    const salida = setTimeout(() => {
      if (estado.desdeInicio) {
        window.location.reload();
        return;
      }
      visibleRef.current = false;
      setEstado({ visible: false, desdeInicio: false, inicio: 0, listo: false });
    }, 1500);
    return () => clearTimeout(salida);
  }, [estado.listo, estado.desdeInicio]);

  // La consola baja sola al último mensaje.
  useEffect(() => {
    if (consolaRef.current) consolaRef.current.scrollTop = consolaRef.current.scrollHeight;
  }, [registros]);

  if (!estado.visible) return null;

  const demorado = segundos > LIMITE_S && !estado.listo;
  const porcentaje = estado.listo ? 100 : Math.min(95, 5 + (segundos / ARRANQUE_TIPICO_S) * 90);
  const titulo = estado.listo
    ? '¡Servidor listo!'
    : demorado ? 'El servidor está tardando más de lo normal' : 'Conectando con el servidor...';
  const descripcion = estado.listo
    ? (estado.desdeInicio ? 'Entrando a la aplicación...' : 'Ya puedes continuar. Si algo no cargó, vuelve a intentarlo.')
    : demorado
      ? 'Sigue intentando cada 10 segundos. Revisa tu conexión o inténtalo de nuevo en unos minutos.'
      : 'El servidor se apaga cuando nadie lo usa y tarda cerca de un minuto en encenderse. Entrará solo cuando esté listo.';
  const etiquetaBarra = estado.listo
    ? 'Listo'
    : demorado ? 'Sin respuesta todavía' : `Intentos: ${intentos}`;

  return (
    <div className="servidor-iniciando" role="dialog" aria-modal="true" aria-labelledby="servidor-iniciando-titulo">
      <div className="servidor-iniciando__fondo" aria-hidden="true">
        <span className="servidor-iniciando__brillo servidor-iniciando__brillo--uno" />
        <span className="servidor-iniciando__brillo servidor-iniciando__brillo--dos" />
      </div>

      <div className="servidor-iniciando__tarjeta">
        <header className="servidor-iniciando__cabecera">
          <div className="servidor-iniciando__marca">
            <span className="servidor-iniciando__logo"><ShieldCheck size={22} aria-hidden="true" /></span>
            <div>
              <h1>Servidores Seguros</h1>
              <p>Encendido automático</p>
            </div>
          </div>
          <span className={`servidor-iniciando__insignia${demorado ? ' servidor-iniciando__insignia--alerta' : ''}`}>
            <i aria-hidden="true" />
            {estado.listo ? 'Conectado' : demorado ? 'Demorado' : 'Conectando...'}
          </span>
        </header>

        <div className="servidor-iniciando__estado">
          <div className={`servidor-iniciando__circulo${estado.listo ? ' servidor-iniciando__circulo--listo' : ''}`} aria-hidden="true">
            <ArrowRight size={36} />
          </div>
          <h2 id="servidor-iniciando-titulo">{titulo}</h2>
          <p aria-live="polite">{descripcion}</p>
        </div>

        <div className="servidor-iniciando__progreso">
          <div className="servidor-iniciando__progreso-textos">
            <span>{etiquetaBarra}</span>
            <span>Tiempo: {reloj(segundos)}</span>
          </div>
          <div className="servidor-iniciando__barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(porcentaje)}>
            <span style={{ width: `${porcentaje}%` }} />
          </div>
        </div>

        <div className="servidor-iniciando__consola" ref={consolaRef} aria-live="polite">
          {registros.map((registro) => (
            <div key={registro.id} className={`servidor-iniciando__linea servidor-iniciando__linea--${registro.tipo}`}>
              {registro.texto}
            </div>
          ))}
        </div>

        <button type="button" className="servidor-iniciando__boton" onClick={intentar} disabled={revisando || estado.listo}>
          <RefreshCw size={16} aria-hidden="true" className={revisando ? 'servidor-iniciando__girar' : undefined} />
          {revisando ? 'Verificando...' : 'Verificar estado de conexión'}
        </button>

        <p className="servidor-iniciando__nota">
          Para ahorrar recursos, el servidor se apaga cuando está inactivo y necesita encenderse otra vez.
          La página continuará sola.
        </p>
      </div>
    </div>
  );
}
