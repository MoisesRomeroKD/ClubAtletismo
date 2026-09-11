import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from './Icon';
import '../../../styles/components/trainer/SleepAthleteDetailPanel.css';

const DAYS_IN_WINDOW = 30;

// Devuelve un array de fechas 'YYYY-MM-DD' de los últimos N días (incluye la fecha de referencia)
function getLastNDates(referenceDate, days) {
  const dates = [];
  const ref = new Date(referenceDate);
  for (let i = 0; i < days; i++) {
    const d = new Date(ref);
    d.setDate(ref.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function formatRelativeDate(dateStr, systemDate) {
  if (dateStr === systemDate) return 'Hoy';
  const yesterday = new Date(systemDate);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === yesterday.toISOString().slice(0, 10)) return 'Ayer';
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

/**
 * Panel lateral derecho: detalle de un atleta + registro rápido de sueño + historial.
 * Se muestra/oculta según si `athlete` es truthy (controlado por el padre).
 */
export default function SleepAthleteDetailPanel({
  athlete,              // objeto atleta seleccionado, o null si el panel está cerrado
  onClose,              // () => void
  getAthleteStats,      // (athleteId) => { todayRecord, avgQuality, records }
  onQuickRegister,      // (athlete, quality) => void
  qualityColor,         // (quality) => string (color CSS)
  systemDate,
}) {
  const isOpen = Boolean(athlete);
  const { records = [], todayRecord } = athlete ? getAthleteStats(athlete.id) : {};

  const [quality, setQuality] = useState(todayRecord?.quality ?? 7);

  // Reinicia el slider cada vez que cambia el atleta seleccionado o su registro de hoy
  useEffect(() => {
    // The slider is local state and must reset when the selected athlete changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuality(todayRecord?.quality ?? 7);
  }, [athlete?.id, todayRecord?.quality]);

  // Cierra el panel con la tecla Escape
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Media y días sin registrar dentro de los últimos 30 días
  const windowStats = useMemo(() => {
    if (!athlete) return { avg: 0, missingDays: 0 };
    const windowDates = new Set(getLastNDates(systemDate, DAYS_IN_WINDOW));
    const windowRecords = records.filter((r) => windowDates.has(r.date));
    const avg = windowRecords.length
      ? Math.round((windowRecords.reduce((sum, r) => sum + r.quality, 0) / windowRecords.length) * 10) / 10
      : 0;
    return { avg, missingDays: DAYS_IN_WINDOW - windowRecords.length };
  }, [athlete, records, systemDate]);

  // Últimos 5 registros, del más reciente al más antiguo
  const history = useMemo(() => {
    return [...records].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  }, [records]);

  if (!athlete) return null;

  return (
    <>
      <div className={`sl-panel-overlay ${isOpen ? 'is-open' : ''}`} onClick={onClose} />
      <aside
        className={`sl-detail-panel ${isOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de sueño de ${athlete.name}`}
      >
        <div className="sl-detail-panel-header">
          <div className="sl-avatar" style={{ width: 48, height: 48, fontSize: '1rem' }}>
            {athlete.name?.charAt(0) ?? '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{athlete.name}</h3>
            <p style={{ margin: 0, fontSize: '.75rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              {athlete.area} · {athlete.subarea}
            </p>
          </div>
          <button type="button" className="sl-panel-close-btn" onClick={onClose} aria-label="Cerrar panel">
            <Icon size={20}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </Icon>
          </button>
        </div>

        <div className="sl-detail-panel-body">
          {/* Registro rápido */}
          <section className="sl-quick-register">
            <div className="sl-quick-register-title">
              <Icon size={18}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </Icon>
              Registrar calidad de sueño de hoy
            </div>

            <div className="sl-quick-register-slider-row">
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                style={{ accentColor: qualityColor(quality) }}
                aria-label="Calidad del sueño"
              />
              <span className="sl-quick-register-value" style={{ color: qualityColor(quality) }}>
                {quality}
              </span>
            </div>
            <div className="sl-quick-register-scale-labels">
              <span>Muy mala</span>
              <span>Excelente</span>
            </div>

            <button
              type="button"
              className="sl-btn sl-btn-primary"
              style={{ width: '100%', marginTop: 12 }}
              onClick={() => onQuickRegister?.(athlete, quality)}
            >
              {todayRecord ? 'Actualizar registro' : 'Guardar registro'}
            </button>
          </section>

          {/* KPIs rápidos */}
          <div className="sl-detail-stats-grid">
            <div className="sl-detail-stat-card">
              <p className="sl-detail-stat-label">Media 30d</p>
              <p className="sl-detail-stat-value" style={{ color: 'var(--sl-primary, #1d4ed8)' }}>
                {windowStats.avg} <span className="sl-detail-stat-unit">/10</span>
              </p>
            </div>
            <div className="sl-detail-stat-card">
              <p className="sl-detail-stat-label">Días sin registrar</p>
              <p className="sl-detail-stat-value" style={{ color: 'var(--sl-danger, #dc2626)' }}>
                {windowStats.missingDays} <span className="sl-detail-stat-unit">/ 30</span>
              </p>
            </div>
          </div>

          {/* Historial */}
          <section>
            <h4 className="sl-detail-section-title">Historial de registros</h4>
            <div className="sl-detail-history-table-wrap">
              <table className="sl-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th style={{ textAlign: 'center' }}>Calidad</th>
                    <th>Registrado por</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', color: 'var(--sl-text-muted)', padding: 16 }}>
                        Sin registros aún.
                      </td>
                    </tr>
                  ) : (
                    history.map((record) => (
                      <tr key={`${record.athleteId}-${record.date}`}>
                        <td>{formatRelativeDate(record.date, systemDate)}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: qualityColor(record.quality) }}>
                          {record.quality}
                        </td>
                        <td>
                          <span className="sl-badge">{record.registrarRole}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
