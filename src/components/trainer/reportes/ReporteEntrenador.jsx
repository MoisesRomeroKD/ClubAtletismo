import { useEffect, useState } from 'react';
import { Timer, TrendingUp, Users } from 'lucide-react';
import UserService from '../../../api/services/Userservice';
import { exportToExcel, exportToPdf } from '../../../api/services/reportExport';
import { ESTADO_LABELS, errorMessage, formatDate, formatMonth, formatNumber } from '../../reportes/reportUtils';
import { ExportButtons, ReportSection, ReportTable, StatusBadge, TrafficLight } from '../../reportes/ReportShared';
import '../../../styles/components/admin/ReporteAdmin.css';
import '../../../styles/components/trainer/ReporteEntrenador.css';

const PAGE_SIZE = 15;

const GROUP_COLUMNS = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'apellido', label: 'Apellido' },
  { key: 'categoria', label: 'Categoría' },
  {
    key: 'estado',
    label: 'Estado',
    exportValue: (row) => {
      const label = ESTADO_LABELS[row.estado] || row.estado;
      return row.estado === 'justificado' && row.estado_motivo ? `${label} (${row.estado_motivo})` : label;
    },
  },
  {
    key: 'asistencia',
    label: 'Asistencia (30 días)',
    exportValue: (row) => formatNumber(row.asistencia.porcentaje, '%'),
  },
  {
    key: 'sueno',
    label: 'Último sueño',
    exportValue: (row) => (row.sueno.calidad ? `${row.sueno.calidad}/10 (${formatDate(row.sueno.fecha)})` : '—'),
  },
  {
    key: 'evaluacion',
    label: 'Última evaluación',
    exportValue: (row) => (row.evaluacion.fecha ? `${formatDate(row.evaluacion.fecha)} · prom. ${formatNumber(row.evaluacion.promedio)}` : '—'),
  },
];

export default function ReporteEntrenador() {
  const [subareaId, setSubareaId] = useState('');
  const [page, setPage] = useState(1);
  const [report, setReport] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let active = true;
    const params = { page };
    if (subareaId) params.subarea_id = subareaId;
    UserService.getTrainerReport(params)
      .then((data) => {
        if (!active) return;
        setReport(data);
        setSelectedId(data.atletas?.[0]?.id ?? null);
      })
      .catch((err) => {
        if (active) setError(errorMessage(err, 'No se pudo cargar el reporte del entrenador.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [subareaId, page]);

  const startLoading = () => {
    setLoading(true);
    setError('');
  };

  const athletes = report?.atletas || [];
  const selected = athletes.find((athlete) => athlete.id === selectedId) || null;
  const currentSubarea = report?.subareas?.find((subarea) => subarea.id === report?.subarea_id);
  const subareaLabel = currentSubarea ? `${currentSubarea.area} · ${currentSubarea.nombre}` : 'Sin subárea';

  const groupColumns = GROUP_COLUMNS.map((column) => {
    if (column.key === 'estado') {
      return {
        ...column,
        render: (row) => (
          <span className="report-estado-cell">
            <StatusBadge value={row.estado} />
            {row.estado === 'justificado' && row.estado_motivo && <small>{row.estado_motivo}</small>}
          </span>
        ),
      };
    }
    if (column.key === 'asistencia') {
      return { ...column, render: (row) => <TrafficLight value={row.asistencia.semaforo}>{formatNumber(row.asistencia.porcentaje, '%')}</TrafficLight> };
    }
    if (column.key === 'sueno') {
      return {
        ...column,
        render: (row) => (
          <TrafficLight value={row.sueno.semaforo}>
            {row.sueno.calidad ? `${row.sueno.calidad}/10 · ${formatDate(row.sueno.fecha)}` : 'Sin registro'}
          </TrafficLight>
        ),
      };
    }
    if (column.key === 'evaluacion') {
      return {
        ...column,
        render: (row) => (
          <TrafficLight value={row.evaluacion.semaforo}>
            {row.evaluacion.fecha ? `${formatDate(row.evaluacion.fecha)} · ${formatNumber(row.evaluacion.promedio)}` : 'Sin evaluación'}
          </TrafficLight>
        ),
      };
    }
    return column;
  });
  groupColumns.push({
    key: 'accion',
    label: 'Progresión',
    render: (row) => (
      <button
        type="button"
        className={`report-button report-button-small ${row.id === selectedId ? 'is-selected' : ''}`}
        onClick={() => setSelectedId(row.id)}
        aria-pressed={row.id === selectedId}
      >
        {row.id === selectedId ? 'Viendo' : 'Ver'}
      </button>
    ),
  });

  const progressionRows = selected
    ? selected.progresion_asistencia.map((item) => ({ ...item, id: item.mes, atleta: `${selected.nombre} ${selected.apellido}` }))
    : [];
  const progressionColumns = [
    { key: 'atleta', label: 'Atleta' },
    { key: 'mes', label: 'Mes', exportValue: (row) => formatMonth(row.mes) },
    { key: 'porcentaje', label: 'Asistencia', exportValue: (row) => formatNumber(row.porcentaje, '%') },
  ];
  const exportTitle = `Reporte de grupo — ${report?.entrenador?.nombre || ''} (${subareaLabel})`;
  const totalCount = report?.count ?? athletes.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const runExport = async (format) => {
    setExporting(true);
    setError('');
    try {
      const params = report?.subarea_id ? { subarea_id: report.subarea_id } : {};
      const full = await UserService.getTrainerReport(params);
      const exportSections = [
        { title: `Grupo ${subareaLabel}`, columns: GROUP_COLUMNS, rows: full.atletas || [] },
        ...(selected ? [{ title: 'Progresión de asistencia', columns: progressionColumns, rows: progressionRows }] : []),
      ];
      if (format === 'excel') exportToExcel('reporte_grupo', exportSections);
      else exportToPdf('reporte_grupo', exportTitle, exportSections);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo generar el archivo.'));
    } finally {
      setExporting(false);
    }
  };

  const changePage = (newPage) => {
    startLoading();
    setPage(newPage);
  };

  return (
    <div className="report-admin">
    <section className="report-role-panel" aria-label="Reportes del entrenador">
      <div className="report-panel report-coach-banner">
        <div>
          <div className="report-coach-title"><h2>Panel de grupo por subárea</h2><span>{subareaLabel}</span></div>
          <p>Entrenador: {report?.entrenador?.nombre || '—'} · Asistencia calculada sobre los últimos {report?.ventana_dias ?? 30} días</p>
        </div>
        <div className="report-coach-controls">
          <label className="report-filter">
            <span>Subárea:</span>
            <select
              value={report?.subarea_id ?? ''}
              onChange={(event) => { startLoading(); setSubareaId(event.target.value); setPage(1); }}
              disabled={!report?.subareas?.length}
            >
              {(report?.subareas || []).map((subarea) => (
                <option key={subarea.id} value={subarea.id}>{subarea.area} · {subarea.nombre}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && <div className="report-panel report-error" role="alert">{error}</div>}
      {loading && <div className="report-panel report-loading">Cargando grupo...</div>}

      {!loading && !error && (
        <>
          <ReportSection
            title="Estado del grupo"
            description="Verde: bien · Amarillo: atención · Rojo: crítico. Se excluyen atletas inactivos."
            icon={<Users className="report-icon-primary" size={20} />}
            actions={(
              <ExportButtons
                disabled={!athletes.length || exporting}
                onExcel={() => runExport('excel')}
                onPdf={() => runExport('pdf')}
              />
            )}
          >
            <div className="report-light-legend">
              <TrafficLight value="verde">Asist. ≥ 85% · Sueño ≥ 7 · Eval. ≤ 90 días</TrafficLight>
              <TrafficLight value="amarillo">Asist. 71–84% · Sueño 5–6 · Eval. ≤ 180 días</TrafficLight>
              <TrafficLight value="rojo">Asist. ≤ 70% · Sueño ≤ 4 · Eval. vencida</TrafficLight>
            </div>
            <ReportTable
              columns={groupColumns}
              rows={athletes}
              emptyText={report?.subareas?.length ? 'No hay atletas en esta subárea.' : 'El entrenador no tiene subáreas habilitadas.'}
            />
            {totalPages > 1 && (
              <div className="reporte-entrenador-paginacion">
                <button
                  type="button"
                  className="reporte-entrenador-paginacion-btn"
                  onClick={() => changePage(page - 1)}
                  disabled={page <= 1}
                >
                  ← Anterior
                </button>
                <span className="reporte-entrenador-paginacion-info">Página {page} de {totalPages} · {totalCount} atletas</span>
                <button
                  type="button"
                  className="reporte-entrenador-paginacion-btn"
                  onClick={() => changePage(page + 1)}
                  disabled={page >= totalPages}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </ReportSection>

          {selected && (
            <div className="report-progress-grid">
              <ReportSection
                title={`Progresión de asistencia — ${selected.nombre} ${selected.apellido}`}
                description="Porcentaje de asistencia mensual de los últimos 6 meses."
                icon={<TrendingUp className="report-icon-success" size={20} />}
              >
                <div className="report-progress-chart" role="img" aria-label={`Asistencia mensual de ${selected.nombre} ${selected.apellido}`}>
                  {selected.progresion_asistencia.map((item) => (
                    <div className="report-progress-col" key={item.mes}>
                      <span className="report-progress-value">{formatNumber(item.porcentaje, '%')}</span>
                      <div className="report-progress-track">
                        <i
                          className={`report-progress-bar ${item.porcentaje === null ? 'is-empty' : item.porcentaje <= 70 ? 'is-low' : item.porcentaje < 85 ? 'is-mid' : 'is-high'}`}
                          style={{ height: `${item.porcentaje ?? 3}%` }}
                        />
                      </div>
                      <small>{formatMonth(item.mes)}</small>
                    </div>
                  ))}
                </div>
              </ReportSection>
              <ReportSection
                title="Marcas"
                description="Tiempos y distancias del atleta."
                icon={<Timer className="report-icon-primary" size={20} />}
              >
                <p className="report-table-empty">El sistema aún no registra marcas (tiempos/distancias) de los atletas.</p>
              </ReportSection>
            </div>
          )}
        </>
      )}
    </section>
    </div>
  );
}
