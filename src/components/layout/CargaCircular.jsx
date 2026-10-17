import { useEffect, useState } from 'react';
import '../../styles/layouts/CargaCircular.css';

const RADIO = 80;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;
const PASO_MS = 50;
const TOPE_SIN_DURACION = 95;
// Si un anillo aparece dentro de este tiempo después de que otro desapareció, es la misma carga:
// sigue desde el porcentaje anterior en vez de volver a 0 % (ej. login → panel → sección → Home).
const CONTINUAR_SI_MS = 1500;

const progresoCompartido = { valor: 0, desaparecioEn: 0 };

const porcentajeInicial = () => (
  Date.now() - progresoCompartido.desaparecioEn < CONTINUAR_SI_MS ? progresoCompartido.valor : 0
);

/**
 * Anillo de progreso para las esperas de carga.
 * - Con `duracion` (ms) avanza hasta `meta` % en ese tiempo (ej. la entrada del login).
 * - Sin `duracion` no se sabe cuánto falta: avanza rápido al principio y frena cerca del 95 %
 *   hasta que termina la carga y el componente desaparece.
 */
// enLinea: dentro de una lista o tarjeta (no ocupa todo el alto visible).
export default function CargaCircular({ duracion = null, meta = 100, texto = 'Cargando', pantallaCompleta = false, enLinea = false }) {
  const [porcentaje, setPorcentaje] = useState(porcentajeInicial);

  useEffect(() => {
    const inicio = Date.now();
    const desde = porcentajeInicial();
    const intervalo = setInterval(() => {
      setPorcentaje((actual) => {
        const siguiente = duracion
          ? Math.round(desde + (meta - desde) * Math.min(1, (Date.now() - inicio) / duracion))
          : Math.min(TOPE_SIN_DURACION, actual + Math.max(1, Math.round((TOPE_SIN_DURACION - actual) * 0.06)));
        const valor = Math.max(actual, siguiente);
        progresoCompartido.valor = valor;
        return valor;
      });
    }, PASO_MS);
    return () => {
      clearInterval(intervalo);
      progresoCompartido.desaparecioEn = Date.now();
    };
  }, [duracion, meta]);

  const desplazamiento = CIRCUNFERENCIA - (porcentaje / 100) * CIRCUNFERENCIA;

  const anillo = (
    <div className={`carga-circular${enLinea ? ' carga-circular--en-linea' : ''}`} role="status" aria-live="polite" aria-label={`${texto}: ${porcentaje}%`}>
      <div className="carga-circular__anillo">
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <circle className="carga-circular__pista" cx="100" cy="100" r={RADIO} />
          <circle
            className="carga-circular__progreso"
            cx="100"
            cy="100"
            r={RADIO}
            strokeDasharray={`${CIRCUNFERENCIA} ${CIRCUNFERENCIA}`}
            strokeDashoffset={desplazamiento}
          />
        </svg>
        <div className="carga-circular__centro">
          <span className="carga-circular__porcentaje">{porcentaje}%</span>
          <span className="carga-circular__texto">{texto}</span>
        </div>
      </div>
    </div>
  );

  if (!pantallaCompleta) return anillo;
  return <div className="carga-circular-pantalla">{anillo}</div>;
}
