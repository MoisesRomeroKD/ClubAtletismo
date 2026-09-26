import React, { useMemo, memo, useState, useEffect } from 'react';
import { Shield, User } from 'lucide-react';
import '../../../styles/components/trainer/SleepAuditView.css';
import UserService from '../../../api/services/Userservice';

const SleepAuditView = ({
  pendingAthletes = [],
  openRegistrationModal,
  onOpenPanel,
  athletes = [],
  systemDate,
}) => {
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyNumPages, setHistoryNumPages] = useState(1);
  const [historyHasNext, setHistoryHasNext] = useState(false);
  const [historyHasPrevious, setHistoryHasPrevious] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedAthleteFilter, setSelectedAthleteFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const fetchHistory = async (page = 1) => {
    setHistoryLoading(true);
    try {
      const params = {
        page,
        page_size: 20,
      };
      if (selectedAthleteFilter) {
        params.athlete_id = selectedAthleteFilter;
      }
      if (startDateFilter) {
        params.start_date = startDateFilter;
      }
      if (endDateFilter) {
        params.end_date = endDateFilter;
      }

      const response = await UserService.getTrainerSleepHistory(params);
      if (response.status === 'success') {
        setHistoryRecords(response.data || []);
        setHistoryPage(response.pagination.page);
        setHistoryNumPages(response.pagination.num_pages);
        setHistoryHasNext(response.pagination.has_next);
        setHistoryHasPrevious(response.pagination.has_previous);
      }
    } catch (error) {
      console.error('Error fetching sleep history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAthleteFilter, startDateFilter, endDateFilter]);

  const handleHistoryPageChange = (newPage) => {
    fetchHistory(newPage);
  };

  const auditRecords = useMemo(() => {
    const athleteMap = new Map(athletes.map((a) => [a.id, a.name]));
    return (historyRecords || [])
      .map((record) => ({
        ...record,
        athleteName: athleteMap.get(record?.athleteId) || 'Desconocido',
      }));
  }, [historyRecords, athletes]);

  const athleteById = useMemo(
    () => new Map(athletes.map((a) => [a.id, a])),
    [athletes]
  );

  return (
    <div className="sleep-audit-view">
      {/* Auditoría histórica: tabla ↔ cards vía .responsive-list */}
      <div className="sl-card">
        <div className="sl-card-header">
          <h3 className="sl-card-title">Auditoría Histórica de Registros</h3>
        </div>

        {/* Filtros de historial */}
        <div className="sl-history-filters">
          <div className="sl-filter-group">
            <label>Filtrar por atleta:</label>
            <select
              value={selectedAthleteFilter}
              onChange={(e) => setSelectedAthleteFilter(e.target.value)}
              className="sl-select"
            >
              <option value="">Todos los atletas</option>
              {athletes.map((athlete) => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sl-filter-group">
            <label>Fecha inicio:</label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="sl-input"
            />
          </div>
          <div className="sl-filter-group">
            <label>Fecha fin:</label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="sl-input"
            />
          </div>
        </div>

        <div className="responsive-list">
          <div className="responsive-list__table">
            <div className="sl-table-container">
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
                  {historyLoading ? (
                    <tr><td colSpan="4" className="sl-table__empty">Cargando historial...</td></tr>
                  ) : auditRecords.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="sl-table__empty">
                        Sin registros históricos.
                      </td>
                    </tr>
                  ) : (
                    auditRecords.map((record, index) => {
                      const isCoach = record.registrarRole === 'Entrenador';
                      const key =
                        record.id || `${record.athleteId}-${record.date}-${index}`;
                      const athlete = athleteById.get(record.athleteId);

                      return (
                        <tr
                          key={key}
                          className={
                            athlete ? 'sl-table__row--clickable' : undefined
                          }
                          onClick={() => athlete && onOpenPanel?.(athlete)}
                        >
                          <td className="sl-table__cell--strong">
                            {record.athleteName}
                          </td>
                          <td>
                            {record.date}
                            {record.date === systemDate ? ' (Hoy)' : ''}
                          </td>
                          <td className="sl-table__cell--strong">
                            {record.quality} / 10
                          </td>
                          <td>
                            <div className="sl-registrar-info">
                              <span className="sl-registrar-name sl-registrar-name--with-icon">
                                {isCoach ? <Shield size={14} /> : <User size={14} />}
                                {record.registrarName}
                              </span>
                              <span className="sl-registrar-role">
                                {record.registrarRole}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              {!historyLoading && historyNumPages > 1 && (
                <div className="sl-history-pagination">
                  <button type="button" disabled={!historyHasPrevious} onClick={() => handleHistoryPageChange(historyPage - 1)}>Anterior</button>
                  <span>Página {historyPage} de {historyNumPages}</span>
                  <button type="button" disabled={!historyHasNext} onClick={() => handleHistoryPageChange(historyPage + 1)}>Siguiente</button>
                </div>
              )}
            </div>
          </div>

          <div className="responsive-list__cards">
            <div className="sl-sleep-cards-wrap">
              {auditRecords.length === 0 ? (
                <div className="sl-empty-card">Sin registros históricos.</div>
              ) : (
                auditRecords.map((record, index) => {
                  const athlete = athleteById.get(record.athleteId);
                  const isCoach = record.registrarRole === 'Entrenador';
                  return (
                    <article
                      key={record.id || `${record.athleteId}-${record.date}-${index}`}
                      className="sl-sleep-card"
                      onClick={() => athlete && onOpenPanel?.(athlete)}
                    >
                      <div className="sl-sleep-card-header">
                        <strong>{record.athleteName}</strong>
                        <b>{record.quality} / 10</b>
                      </div>
                      <div className="sl-sleep-card-meta">
                        {record.date}
                        {record.date === systemDate ? ' (Hoy)' : ''}
                      </div>
                      <div className="sl-sleep-card-meta sl-sleep-card-meta--with-icon">
                        {isCoach ? <Shield size={12} /> : <User size={12} />}
                        {record.registrarName} ({record.registrarRole})
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(SleepAuditView);