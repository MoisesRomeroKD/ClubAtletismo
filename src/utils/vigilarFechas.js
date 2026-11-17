import { notificar } from './notificar';

/*
 * Fechas escritas a mano fuera de rango (todos los <input type="date"> de la app).
 *
 * El calendario respeta min y max, pero si la fecha se escribe con el teclado el navegador la acepta
 * igual (por ejemplo 13/10/2022 cuando el mínimo es hoy). Aquí, al salir del campo, si la fecha queda
 * antes del mínimo o después del máximo, se vacía el campo y se avisa por qué.
 *
 * Se revisa al salir del campo y no al escribir: al teclear el año los dígitos llegan uno por uno
 * (0002, 0020, 0202, 2022...) y revisarlos en cada tecla no dejaría escribir la fecha.
 */

const hoyCaracas = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Caracas' });

const formatear = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

// Cambia el valor como si lo hubiera hecho la persona, para que React (onChange) se entere.
const vaciar = (input) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(input, '');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

const revisar = (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.type !== 'date' || !input.value) return;
  const { value, min, max } = input;
  let mensaje = '';
  if (min && value < min) {
    mensaje = min === hoyCaracas()
      ? `La fecha no puede ser anterior a hoy (${formatear(min)}).`
      : `La fecha no puede ser anterior al ${formatear(min)}.`;
  } else if (max && value > max) {
    mensaje = max === hoyCaracas()
      ? `La fecha no puede ser posterior a hoy (${formatear(max)}).`
      : `La fecha no puede ser posterior al ${formatear(max)}.`;
  }
  if (!mensaje) return;
  vaciar(input);
  notificar(`${mensaje} Escribiste ${formatear(value)}.`, { tipo: 'aviso' });
};

/** Activa la revisión en toda la app. Devuelve la función para desactivarla. */
export function vigilarFechas() {
  document.addEventListener('focusout', revisar, true);
  return () => document.removeEventListener('focusout', revisar, true);
}
