import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const cellValue = (column, row) => {
  const value = column.exportValue ? column.exportValue(row) : row[column.key];
  return value === null || value === undefined || value === '' ? '—' : value;
};

const stamp = () => new Date().toISOString().slice(0, 10);

// sections: [{ title, columns: [{ key, label, exportValue? }], rows }]
export function exportToExcel(fileName, sections) {
  const workbook = XLSX.utils.book_new();
  sections.forEach(({ title, columns, rows }) => {
    const data = [
      columns.map((column) => column.label),
      ...rows.map((row) => columns.map((column) => cellValue(column, row))),
    ];
    const sheet = XLSX.utils.aoa_to_sheet(data);
    sheet['!cols'] = columns.map((column) => ({ wch: Math.max(column.label.length + 2, 14) }));
    XLSX.utils.book_append_sheet(workbook, sheet, title.slice(0, 31));
  });
  XLSX.writeFile(workbook, `${fileName}_${stamp()}.xlsx`);
}

export function exportToPdf(fileName, documentTitle, sections) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFontSize(14);
  doc.text(documentTitle, 40, 40);
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString('es-VE')}`, 40, 56);

  let startY = 76;
  sections.forEach(({ title, columns, rows }) => {
    if (startY > doc.internal.pageSize.getHeight() - 80) {
      doc.addPage();
      startY = 40;
    }
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
      margin: { left: 40, right: 40 },
    });
    startY = doc.lastAutoTable.finalY + 28;
  });

  doc.save(`${fileName}_${stamp()}.pdf`);
}
