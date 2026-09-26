import React, { useState, useMemo, memo } from 'react';
import { Search } from 'lucide-react';
import '../../../styles/components/trainer/SleepPendingView.css';

const SleepPendingView = ({ pendingAthletes = [], openRegistrationModal, sleepPeriod, setSleepPeriod }) => {
  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');

  const periodOptions = [
    { key: 'hoy', label: 'Hoy' },
    { key: 'ayer', label: 'Ayer' },
    { key: 'semana', label: 'Esta semana' },
    { key: 'mes', label: 'Este mes' },
    { key: '3meses', label: 'Últimos 3 meses' },
    { key: '6meses', label: 'Últimos 6 meses' },
    { key: 'anio', label: 'Último año' },
    { key: 'historico', label: 'Todo / histórico' },
  ];

  const filteredPending = useMemo(
    () =>
      pendingAthletes.filter((athlete) => {
        const matchesSearch = athlete.name.toLowerCase().includes(search.toLowerCase());
        const matchesArea = selectedArea === 'all' || athlete.area === selectedArea;
        return matchesSearch && matchesArea;
      }),
    [pendingAthletes, search, selectedArea]
  );

  const areaOptions = useMemo(
    () =>
      [
        ...new Set(
          pendingAthletes.flatMap((athlete) =>
            (athlete.assignments || []).map((assignment) => assignment.area)
          )
        ),
      ].filter(Boolean),
    [pendingAthletes]
  );

  return (
    <div className="sleep-pending-view">
      <div className="sl-tracking-grid">
        <div className="sl-card sl-card--alert">
          <div className="sl-card-header">
            <h3 className="sl-card-title sl-card-title--alert">
              Atletas pendientes ({filteredPending.length})
            </h3>
          </div>

          {/* Filtro de período */}
          <div className="sl-period-filter-bar">
            {periodOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`sl-period-btn ${sleepPeriod === opt.key ? 'active' : ''}`}
                onClick={() => setSleepPeriod && setSleepPeriod(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Controles */}
          <div className="sl-table-controls">
            <div className="sl-search-box">
              <Search size={16} />
              <input
                className="sl-search-input"
                type="text"
                placeholder="Buscar atleta pendiente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="sl-filter-group">
              <select
                className="sl-select"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
              >
                <option value="all">Todas las áreas</option>
                {areaOptions.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista de pendientes */}
          <ul className="sl-pending-list">
            {filteredPending.length > 0 ? (
              filteredPending.map((athlete) => (
                <li className="sl-pending-item" key={athlete.id}>
                  <span className="sl-avatar sl-avatar--alert">
                    {athlete.name?.charAt(0) ?? '?'}
                  </span>
                  <span className="sl-pending-item__text">
                    <span className="sl-pending-item__name">{athlete.name}</span>
                    <span className="sl-pending-item__sub">{Array.isArray(athlete.subareas) ? athlete.subareas.join(', ') : '-'}</span>
                  </span>
                  <button
                    type="button"
                    className="sl-btn sl-btn-sm"
                    onClick={() => openRegistrationModal(athlete)}
                  >
                    Registrar
                  </button>
                </li>
              ))
            ) : (
              <div className="sl-empty-card sl-empty-card--success">
                ¡Excelente! No hay atletas pendientes con los filtros seleccionados.
              </div>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default memo(SleepPendingView);