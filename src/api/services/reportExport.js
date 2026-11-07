import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const CLUB = 'C.E.T.D. Club Atletismo Liceo Caracas';
const LOGO_URL = '/assets/logo.png';
const ROLES = { administrador: 'Administrador', entrenador: 'Entrenador', atleta: 'Atleta' };

const cellValue = (column, row) => {
  const value = column.exportValue ? column.exportValue(row) : row[column.key];
  return value === null || value === undefined || value === '' ? '—' : value;
};

const dos = (n) => String(n).padStart(2, '0');

// Quién genera el reporte (el usuario en sesión) y cuándo.
function autoria() {
  let nombre = '';
  let rol = '';
  try {
    nombre = localStorage.getItem('user_name') || '';
    rol = localStorage.getItem('user_role') || '';
  } catch {
    // Sin acceso al almacenamiento: el reporte sale sin autor.
  }
  const ahora = new Date();
  const rolTexto = ROLES[(rol || '').toLowerCase()] || rol;
  return {
    generadoPor: nombre ? `${nombre}${rolTexto ? ` (${rolTexto})` : ''}` : 'Usuario del sistema',
    fechaHora: ahora.toLocaleString('es-VE', { dateStyle: 'long', timeStyle: 'short' }),
    sello: `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}_${dos(ahora.getHours())}${dos(ahora.getMinutes())}`,
  };
}

const slug = (texto) => String(texto || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase().slice(0, 60);

// Nombre del archivo: tipo de reporte + de quién es + fecha y hora de generación.
const nombreArchivo = (fileName, meta, sello) => [slug(fileName), slug(meta?.sujeto), sello].filter(Boolean).join('_');

// Líneas de la cabecera: de quién es, quién lo generó, cuándo y con qué filtros.
function cabecera(meta, info) {
  const lineas = [];
  if (meta?.sujeto) lineas.push(['Reporte de', meta.sujeto]);
  lineas.push(['Generado por', info.generadoPor]);
  lineas.push(['Fecha y hora', info.fechaHora]);
  (meta?.filtros || []).forEach(([etiqueta, valor]) => {
    if (valor) lineas.push([etiqueta, valor]);
  });
  return lineas;
}

// sections: [{ title, columns: [{ key, label, exportValue? }], rows }]
// meta (opcional): { sujeto: 'de quién es el reporte', filtros: [['Período', '...'], ...] }
export function exportToExcel(fileName, sections, meta = {}, documentTitle = '') {
  const info = autoria();
  const workbook = XLSX.utils.book_new();
  const portada = [
    [CLUB],
    [documentTitle || fileName.replace(/_/g, ' ')],
    [],
    ...cabecera(meta, info),
  ];
  const hojaPortada = XLSX.utils.aoa_to_sheet(portada);
  hojaPortada['!cols'] = [{ wch: 18 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(workbook, hojaPortada, 'Información');

  sections.forEach(({ title, columns, rows }, index) => {
    const data = [
      columns.map((column) => column.label),
      ...(rows.length ? rows.map((row) => columns.map((column) => cellValue(column, row))) : [['Sin registros']]),
    ];
    const sheet = XLSX.utils.aoa_to_sheet(data);
    sheet['!cols'] = columns.map((column) => ({ wch: Math.max(column.label.length + 2, 14) }));
    // Nombres de hoja únicos y de máximo 31 caracteres (límite de Excel).
    const nombre = `${index + 1}. ${title}`.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, sheet, nombre);
  });
  XLSX.writeFile(workbook, `${nombreArchivo(fileName, meta, info.sello)}.xlsx`);
}

function cargarLogo() {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Reducido a 160 px de alto: suficiente para la cabecera y deja el PDF liviano.
        const escala = Math.min(1, 160 / img.naturalHeight);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * escala);
        canvas.height = Math.round(img.naturalHeight * escala);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve({ data: canvas.toDataURL('image/png'), ancho: canvas.width, alto: canvas.height });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = LOGO_URL;
  });
}

export async function exportToPdf(fileName, documentTitle, sections, meta = {}) {
  const info = autoria();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const anchoPagina = doc.internal.pageSize.getWidth();
  const altoPagina = doc.internal.pageSize.getHeight();

  // ---- Cabecera: logo, club, título y datos del reporte
  const logo = await cargarLogo();
  let x = 40;
  if (logo) {
    const alto = 46;
    const ancho = (logo.ancho / logo.alto) * alto;
    doc.addImage(logo.data, 'PNG', 40, 28, ancho, alto);
    x = 40 + ancho + 14;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(CLUB, x, 40);
  doc.setFontSize(15);
  doc.setTextColor(20);
  doc.text(documentTitle, x, 60);

  let y = 92;
  doc.setFontSize(9);
  cabecera(meta, info).forEach(([etiqueta, valor]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${etiqueta}:`, 40, y);
    doc.setFont('helvetica', 'normal');
    const lineas = doc.splitTextToSize(String(valor), anchoPagina - 160);
    doc.text(lineas, 130, y);
    y += 12 * lineas.length;
  });
  doc.setDrawColor(200);
  doc.line(40, y, anchoPagina - 40, y);

  // ---- Secciones
  let startY = y + 22;
  sections.forEach(({ title, columns, rows }) => {
    if (startY > altoPagina - 90) {
      doc.addPage();
      startY = 40;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(title, 40, startY);
    autoTable(doc, {
      startY: startY + 8,
      head: [columns.map((column) => column.label)],
      body: rows.length
        ? rows.map((row) => columns.map((column) => String(cellValue(column, row))))
        : [[{ content: 'Sin registros', colSpan: columns.length }]],
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [30, 41, 59] },
      rowPageBreak: 'avoid', // una fila nunca queda partida entre dos páginas
      margin: { left: 40, right: 40, bottom: 40 },
    });
    startY = doc.lastAutoTable.finalY + 28;
  });

  // ---- Pie de página en todas las hojas
  const paginas = doc.getNumberOfPages();
  for (let pagina = 1; pagina <= paginas; pagina += 1) {
    doc.setPage(pagina);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`${CLUB} · ${documentTitle} · Generado por ${info.generadoPor} el ${info.fechaHora}`, 40, altoPagina - 20);
    doc.text(`Página ${pagina} de ${paginas}`, anchoPagina - 40, altoPagina - 20, { align: 'right' });
  }

  doc.save(`${nombreArchivo(fileName, meta, info.sello)}.pdf`);
}
