import React, { useMemo, memo } from 'react';
import '../../../styles/components/trainer/SleepAuditView.css';

const SleepAuditView = ({
  sleepRecords = [],
  pendingAthletes = [],
  openRegistrationModal,
  onOpenPanel, // 🆕 abre el panel lateral de detalle para un atleta
  athletes = [],
  systemDate,
}) => {
  // Memorización de mapeo de registros históricos
  const auditRecords = useMemo(() => {
    const athleteMap = new Map(athletes.map((a) => [a.id, a.name]));

    return (sleepRecords || [])
      .map((record) => ({
        ...record,
        athleteName: athleteMap.get(record?.athleteId) || 'Desconocido'
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sleepRecords, athletes]);

  // 🆕 Mapa id -> objeto atleta completo, para poder abrir el panel desde cualquier fila
  const athleteById = useMemo(() => {
    return new Map(athletes.map((a) => [a.id, a]));
  }, [athletes]);

  return (
    <div className="sl-audit-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Panel de Acción: Pendientes del Día */}
      <div className="sl-card" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
        <div className="sl-card-header">
          <div className="sl-card-title" style={{ color: '#991b1b', fontSize: '1rem', fontWeight: 600 }}>
            Atletas sin registro hoy ({pendingAthletes.length})
          </div>
        </div>
        <ul className="sl-pending-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {pendingAthletes.length > 0 ? (
            pendingAthletes.map((athlete) => (
              <li className="sl-pending-item" key={athlete.id}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                  onClick={() => onOpenPanel?.(athlete)}
                >
                  <div className="sl-avatar" style={{ fontSize: '.8rem', background: '#fca5a5', color: '#991b1b' }}>
                    {athlete.name?.charAt(0) ?? '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '.875rem', color: '#991b1b' }}>
                      {athlete.name}
                    </div>
                    <div style={{ fontSize: '.75rem', color: '#b91c1c' }}>
                      {athlete.subarea}
                    </div>
                  </div>
                </div>
                <button
                  className="sl-btn sl-btn-sm"
                  type="button"
                  style={{ background: 'white', color: '#991b1b', border: '1px solid #fca5a5' }}
                  onClick={(e) => { e.stopPropagation(); openRegistrationModal?.(athlete); }}
                >
                  Registrar
                </button>
              </li>
            ))
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--sl-success)', fontWeight: 500, fontSize: '.875rem', padding: 20 }}>
              ¡Excelente! Todos los atletas del grupo seleccionado han registrado hoy. 🎉
            </div>
          )}
        </ul>
      </div>

      {/* Tabla de Auditoría Histórica */}
      <div className="sl-card">
        <div className="sl-card-header">
          <h3 className="sl-card-title">Auditoría Histórica de Registros</h3>
        </div>
        <div className="sl-table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <table className="sl-table">
            <thead>
              <tr>
                <th>Atleta</th>
                <th>Fecha</th>
                <th>Calidad</th>
                <th>Registrado por</th>
              </tr>
            </thead>
            <tbody>
              {auditRecords.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: 'var(--sl-text-muted)', padding: 24 }}>
                    Sin registros históricos.
                  </td>
                </tr>
              ) : (
                auditRecords.map((record, index) => {
                  const isCoach = record.registrarRole === 'Entrenador';
                  const recordKey = record.id || `${record.athleteId}-${record.date}-${index}`;
                  const athlete = athleteById.get(record.athleteId);

                  return (
                    <tr
                      key={recordKey}
                      style={{ cursor: athlete ? 'pointer' : 'default' }}
                      onClick={() => athlete && onOpenPanel?.(athlete)}
                    >
                      <td style={{ fontWeight: 500 }}>{record.athleteName}</td>
                      <td>
                        {record.date} {record.date === systemDate ? '(Hoy)' : ''}
                      </td>
                      <td style={{ fontWeight: 600 }}>{record.quality} / 10</td>
                      <td>
                        <div className="sl-registrar-info">
                          <span className="sl-registrar-name">
                            {isCoach ? '🛡️' : '👤'} {record.registrarName}
                          </span>
                          <span className="sl-registrar-role">{record.registrarRole}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default memo(SleepAuditView);
