import { FileDown, FileSpreadsheet } from 'lucide-react';
import { ESTADO_LABELS, SEMAFORO_LABELS, formatNumber } from './reportUtils';

export function ReportTable({ columns, rows, emptyText = 'Sin registros.' }) {
  if (!rows.length) {
    return <p className="report-table-empty">{emptyText}</p>;
  }
  return (
    <div className="report-table-wrap">
      <table className="report-table">
        <thead>
          <tr>{columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id ?? row.user_id ?? index}>
              {columns.map((column) => (
                <td key={column.key} data-label={column.label}>
                  {column.render ? column.render(row) : formatNumber(row[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ExportButtons({ onExcel, onPdf, disabled }) {
  return (
    <div className="report-export-buttons">
      <button className="report-button report-button-export" type="button" onClick={onExcel} disabled={disabled}>
        <FileSpreadsheet size={15} aria-hidden="true" />Excel
      </button>
      <button className="report-button report-button-export" type="button" onClick={onPdf} disabled={disabled}>
        <FileDown size={15} aria-hidden="true" />PDF
      </button>
    </div>
  );
}

export function ReportSection({ title, description, icon, actions, children }) {
  return (
    <section className="report-panel report-data-section">
      <div className="report-data-heading">
        <div className="report-data-title">
          {icon}
          <div><h2>{title}</h2>{description && <p>{description}</p>}</div>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function StatusBadge({ value }) {
  return <span className={`report-status report-status-${value}`}>{ESTADO_LABELS[value] || value}</span>;
}

export function TrafficLight({ value, children }) {
  return (
    <span className={`report-light report-light-${value}`} title={SEMAFORO_LABELS[value]}>
      <i aria-hidden="true" />
      <span>{children}</span>
      <span className="report-sr-only">({SEMAFORO_LABELS[value]})</span>
    </span>
  );
}
