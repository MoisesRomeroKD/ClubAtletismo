import React, { useEffect, useMemo, useState } from 'react';
import { X, Pencil } from 'lucide-react';
import '../../../styles/components/trainer/SleepModuleTheme.css';
import '../../../styles/components/trainer/SleepAthleteDetailPanel.css';

const DAYS_IN_WINDOW = 30;
// Un registro de sueño se puede corregir hasta una semana después de su fecha.
const DIAS_PARA_CORREGIR = 7;

function diasDesde(dateStr, systemDate) {
  return Math.round((new Date(systemDate) - new Date(dateStr)) / 86400000);
}

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
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  });
}

export default function SleepAthleteDetailPanel({
  athlete,
  onClose,
  getAthleteStats,
  onRegistrar,
  onCorregir,
  qualityColor,
  systemDate,
}) {
  const isOpen = Boolean(athlete);
  // Corrección en la misma fila: { id, calidad, guardando, error }.
  const [corrigiendo, setCorrigiendo] = useState(null);
  const { records = [], todayRecord } = athlete ? getAthleteStats(athlete.id) : {};

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const windowStats = useMemo(() => {
    if (!athlete) return { avg: 0, missingDays: 0 };
    const windowDates = new Set(getLastNDates(systemDate, DAYS_IN_WINDOW));
    const windowRecords = records.filter((r) => windowDates.has(r.date));
    const avg = windowRecords.length
      ? Math.round(
          (windowRecords.reduce((sum, r) => sum + r.quality, 0) / windowRecords.length) * 10
        ) / 10
      : 0;
    return { avg, missingDays: DAYS_IN_WINDOW - windowRecords.length };
  }, [athlete, records, systemDate]);

  const history = useMemo(
    () => [...records].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
    [records]
  );

  if (!athlete) return null;

  const idDe = (record) => record.registroId ?? record.id;
  const sePuedeCorregir = (record) => Boolean(onCorregir)
    && Number.isInteger(idDe(record))
    && diasDesde(record.date, systemDate) <= DIAS_PARA_CORREGIR;
  const empezar = (record) => setCorrigiendo({ id: idDe(record), calidad: record.quality, guardando: false, error: '' });
  const guardar = async () => {
    setCorrigiendo((actual) => ({ ...actual, guardando: true, error: '' }));
    try {
      await onCorregir(corrigiendo.id, corrigiendo.calidad);
      setCorrigiendo(null);
    } catch (error) {
      setCorrigiendo((actual) => ({
        ...actual,
        guardando: false,
        error: error.response?.data?.message || 'No se pudo corregir el registro.',
      }));
    }
  };
  const editando = (record) => corrigiendo?.id === idDe(record);
  const deslizador = (
    <input
      type="range"
      min="1"
      max="10"
      step="1"
      className="sl-correccion__slider"
      value={corrigiendo?.calidad ?? 1}
      onChange={(e) => setCorrigiendo((actual) => ({ ...actual, calidad: Number(e.target.value) }))}
      aria-label="Calidad corregida"
    />
  );
  const botonesCorreccion = (
    <span className="sl-correccion__acciones">
      <button type="button" className="sl-btn sl-btn-primary" onClick={guardar} disabled={corrigiendo?.guardando}>
        {corrigiendo?.guardando ? 'Guardando...' : 'Guardar'}
      </button>
      <button type="button" className="sl-btn" onClick={() => setCorrigiendo(null)} disabled={corrigiendo?.guardando}>
        Cancelar
      </button>
    </span>
  );
  const botonLapiz = (record) => (
    <button
      type="button"
      className="sl-correccion__lapiz"
      onClick={() => empezar(record)}
      aria-label={`Corregir el sueño del ${record.date}`}
      title="Corregir"
    >
      <Pencil size={16} />
    </button>
  );

  return (
    <div className="sleep-athlete-detail-panel">
      <div
        className={`sl-panel-overlay ${isOpen ? 'is-open' : ''}`}
        onClick={onClose}
      />
      <aside
        className={`sl-detail-panel ${isOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de sueño de ${athlete.name}`}
      >
        <div className="sl-detail-panel-header">
          <div className="sl-detail-panel-avatar">
            {athlete.name?.charAt(0) ?? '?'}
          </div>
          <div className="sl-detail-panel-identity">
            <h3 className="sl-detail-panel-name">{athlete.name}</h3>
            <p className="sl-detail-panel-role">
              {athlete.area} · {athlete.subarea}
            </p>
          </div>
          <button
            type="button"
            className="sl-panel-close-btn"
            onClick={onClose}
            aria-label="Cerrar panel"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sl-detail-panel-body">
          {/* El registro se hace en la pantalla "Registrar Sueño" (la misma de Pendientes). */}
          {onRegistrar && (
            <section className="sl-quick-register">
              <div className="sl-quick-register-title">
                <Pencil size={18} />
                {todayRecord ? `Hoy ya tiene registro: ${todayRecord.quality}/10` : 'Sin registro de sueño hoy'}
              </div>
              <button
                type="button"
                className="sl-btn sl-btn-primary sl-btn--block"
                onClick={() => onRegistrar(athlete)}
              >
                {todayRecord ? 'Actualizar registro de hoy' : 'Registrar sueño de hoy'}
              </button>
            </section>
          )}

          {/* KPIs */}
          <div className="sl-detail-stats-grid">
            <div className="sl-detail-stat-card">
              <p className="sl-detail-stat-label">Media 30d</p>
              <p className="sl-detail-stat-value sl-detail-stat-value--primary">
                {windowStats.avg} <span className="sl-detail-stat-unit">/10</span>
              </p>
            </div>
            <div className="sl-detail-stat-card">
              <p className="sl-detail-stat-label">Días sin registrar</p>
              <p className="sl-detail-stat-value sl-detail-stat-value--danger">
                {windowStats.missingDays}{' '}
                <span className="sl-detail-stat-unit">/ 30</span>
              </p>
            </div>
          </div>

          {/* Historial */}
          <section>
            <h4 className="sl-detail-section-title">Historial de registros</h4>
            {corrigiendo?.error && <p className="sl-correccion__error" role="alert">{corrigiendo.error}</p>}

            <div className="responsive-list">
              <div className="responsive-list__table">
                <div className="sl-detail-history-table-wrap">
                  <table className="sl-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th className="sl-table__th--center">Calidad</th>
                        <th>Registrado por</th>
                        {onCorregir && <th aria-label="Corregir" />}
                      </tr>
                    </thead>
                    <tbody>
                      {history.length === 0 ? (
                        <tr>
                          <td colSpan={onCorregir ? 4 : 3} className="sl-table__empty">
                            Sin registros aún.
                          </td>
                        </tr>
                      ) : (
                        history.map((record) => (
                          <tr key={`${record.athleteId}-${record.date}`}>
                            <td>{formatRelativeDate(record.date, systemDate)}</td>
                            <td
                              className="sl-table__td--center-strong"
                              style={{ color: qualityColor(editando(record) ? corrigiendo.calidad : record.quality) }}
                            >
                              {editando(record) ? (
                                <span className="sl-correccion">{deslizador}{corrigiendo.calidad}</span>
                              ) : record.quality}
                            </td>
                            <td>
                              <span className="sl-badge">{record.registrarRole}</span>
                            </td>
                            {onCorregir && (
                              <td>
                                {editando(record) ? botonesCorreccion : sePuedeCorregir(record) && botonLapiz(record)}
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="responsive-list__cards">
                <div className="sl-detail-history-cards-wrap">
                  {history.length === 0 ? (
                    <div className="sl-empty-card">Sin registros aún.</div>
                  ) : (
                    history.map((record) => (
                      <article
                        className="sl-sleep-card"
                        key={`${record.athleteId}-${record.date}`}
                      >
                        <div className="sl-sleep-card-header">
                          <strong>{formatRelativeDate(record.date, systemDate)}</strong>
                          <span className="sl-correccion">
                            <b>{editando(record) ? corrigiendo.calidad : record.quality}</b>
                            {!editando(record) && sePuedeCorregir(record) && botonLapiz(record)}
                          </span>
                        </div>
                        {editando(record) && (
                          <div className="sl-correccion sl-correccion--tarjeta">{deslizador}{botonesCorreccion}</div>
                        )}
                        <div className="sl-sleep-card-meta">
                          Registrado por: {record.registrarRole}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}