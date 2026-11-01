import { jsPDF } from 'jspdf';

/*
 * CONSTANCIA DE ENTRENAMIENTO (PDF) — formato del U.E.T.D. "Liceo Caracas".
 *
 * Los datos vienen de POST /api/v1/users/constancias/generar/ (Gestión de Constancias) y aquí solo se
 * arma el documento: membrete, logo, título, cuerpo, expedición, firma y pie. Varias constancias van en
 * un solo PDF, una por página.
 *
 *   - PLANTILLA: hoja, márgenes, letra y textos fijos del formato.
 *   - membrete(), titulo(), cuerpo(), expedicion(), firma() y pie(): cada parte del documento.
 */
const PLANTILLA = {
  formato: 'letter',
  margen: 90,
  fuente: 'times',
  letra: { membrete: 11, titulo: 13, texto: 12 },
  interlineado: 1.6,
  sangria: 40,
  titulo: 'CONSTANCIA DE ASISTENCIA A PRÁCTICA',
  logo: { ruta: '/assets/logo.png', ancho: 46, alto: 54 },
};

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const partesFecha = (iso) => {
  const [anio, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  return { anio, mes: MESES[mes - 1], dia };
};

// 30000001 -> 30.000.001
const cedulaConPuntos = (cedula) => String(cedula || '').replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const nombreCompleto = (persona) => `${persona?.nombres || ''} ${persona?.apellidos || ''}`.trim();

const listaEnTexto = (items) => {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
};

const anchoUtil = (doc) => doc.internal.pageSize.getWidth() - PLANTILLA.margen * 2;

function membrete(doc, datos, y) {
  doc.setFont(PLANTILLA.fuente, 'normal');
  doc.setFontSize(PLANTILLA.letra.membrete);
  datos.membrete.forEach((linea, indice) => doc.text(linea, PLANTILLA.margen, y + indice * 13));
  return y + datos.membrete.length * 13;
}

function logo(doc, imagen, y) {
  if (!imagen) return y + 10;
  const { ancho, alto } = PLANTILLA.logo;
  doc.addImage(imagen, 'PNG', PLANTILLA.margen + 6, y + 4, ancho, alto, undefined, 'FAST');
  return y + alto + 12;
}

function titulo(doc, y) {
  const centro = doc.internal.pageSize.getWidth() / 2;
  doc.setFont(PLANTILLA.fuente, 'bolditalic');
  doc.setFontSize(PLANTILLA.letra.titulo);
  doc.text(PLANTILLA.titulo, centro, y, { align: 'center' });
  const ancho = doc.getTextWidth(PLANTILLA.titulo);
  doc.setLineWidth(0.7);
  doc.line(centro - ancho / 2, y + 2, centro + ancho / 2, y + 2);
  return y + 34;
}

// Párrafo justificado con sangría en la primera línea.
function parrafo(doc, texto, y) {
  doc.setFont(PLANTILLA.fuente, 'normal');
  doc.setFontSize(PLANTILLA.letra.texto);
  const relleno = ' '.repeat(Math.ceil(PLANTILLA.sangria / doc.getTextWidth(' ')));
  const opciones = { align: 'justify', maxWidth: anchoUtil(doc), lineHeightFactor: PLANTILLA.interlineado };
  doc.text(relleno + texto, PLANTILLA.margen, y, opciones);
  const lineas = doc.splitTextToSize(relleno + texto, anchoUtil(doc)).length;
  return y + lineas * PLANTILLA.letra.texto * PLANTILLA.interlineado + 6;
}

// "en horas de la mañana (08:00 a 11:30) a las prácticas de 100m con el Prof. ..." por cada subárea.
function practica(fila) {
  const profesores = fila.entrenadores.map(nombreCompleto).filter(Boolean);
  const con = profesores.length
    ? ` con ${profesores.length === 1 ? 'el Prof.' : 'los Profs.'} ${listaEnTexto(profesores)}`
    : '';
  const horario = fila.horario ? ` (${fila.horario})` : '';
  return `en horas de la ${fila.turno.toLowerCase()}${horario} a las prácticas de ${fila.subarea}${con}`;
}

function cuerpo(doc, datos, y) {
  const { atleta } = datos;
  const articulo = atleta.sexo === 'F' ? 'la atleta' : 'el atleta';
  const practicas = datos.subareas.map(practica);
  return parrafo(
    doc,
    `Quien suscribe, hace constar que ${articulo} ${nombreCompleto(atleta)}, titular de la Cédula `
    + `N.º ${cedulaConPuntos(atleta.cedula)}, estará asistiendo a este plantel ${listaEnTexto(practicas)}.`,
    y,
  );
}

function expedicion(doc, datos, y) {
  const { anio, mes, dia } = partesFecha(datos.fecha_emision);
  const dias = dia === 1 ? 'al primer día' : `a los ${dia} días`;
  return parrafo(
    doc,
    `Constancia que se expide a solicitud de la parte interesada en ${datos.ciudad}, ${dias} del mes de ${mes} del año ${anio}.`,
    y,
  );
}

// Nombre y cargo de quien emite; el espacio de arriba es para la firma.
function firma(doc, datos, y) {
  const centro = doc.internal.pageSize.getWidth() / 2;
  const nombreY = y + 70;
  doc.setFont(PLANTILLA.fuente, 'normal');
  doc.setFontSize(PLANTILLA.letra.texto);
  doc.text(nombreCompleto(datos.emitida_por), centro, nombreY, { align: 'center' });
  doc.text(datos.emitida_por.cargo, centro, nombreY + 15, { align: 'center' });
  return nombreY + 15;
}

// Pie: mes y año de emisión, como en el formato.
function pie(doc, datos, y) {
  const { anio, mes } = partesFecha(datos.fecha_emision);
  doc.setFont(PLANTILLA.fuente, 'normal');
  doc.setFontSize(PLANTILLA.letra.texto);
  doc.text(`${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${anio}`, PLANTILLA.margen - 20, y + 40);
}

// Dibuja una constancia en la página actual del documento.
function dibujarConstancia(doc, datos, imagenLogo) {
  let y = membrete(doc, datos, 70);
  y = logo(doc, imagenLogo, y);
  y = titulo(doc, y + 10);
  y = cuerpo(doc, datos, y);
  y = expedicion(doc, datos, y + 4);
  y = firma(doc, datos, y);
  pie(doc, datos, y);
}

// Arma un solo PDF (sin descargarlo) con una constancia por página, en el orden de la lista: cada página
// usa solo los datos de su atleta. imagenLogo: data URL del logo (o null).
export function construirConstancias(lista, imagenLogo) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: PLANTILLA.formato });
  lista.forEach((datos, indice) => {
    if (indice > 0) doc.addPage(PLANTILLA.formato, 'portrait');
    dibujarConstancia(doc, datos, imagenLogo);
  });
  return doc;
}

const cargarLogo = async () => {
  try {
    const respuesta = await fetch(PLANTILLA.logo.ruta);
    if (!respuesta.ok) return null;
    const blob = await respuesta.blob();
    return await new Promise((resolve) => {
      const lector = new FileReader();
      lector.onload = () => resolve(lector.result);
      lector.onerror = () => resolve(null);
      lector.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

// Descarga un solo PDF con todas las constancias (una por página), listo para imprimir de una vez.
export async function generarConstancias(lista) {
  if (!lista.length) return;
  const doc = construirConstancias(lista, await cargarLogo());
  const fecha = lista[0].fecha_emision;
  const nombre = lista.length === 1
    ? `constancia_entrenamiento_${String(lista[0].atleta.cedula || '').replace(/\D/g, '')}_${fecha}.pdf`
    : `constancias_entrenamiento_${lista.length}_atletas_${fecha}.pdf`;
  doc.save(nombre);
}
