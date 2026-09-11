import React, { useState, useMemo, memo } from 'react';
import { Icon } from './Icon';
import '../../../styles/components/trainer/SleepIndividualView.css';

const SleepPendingView = ({ 
  pendingAthletes = [], 
  openRegistrationModal 
}) => {
  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');

  const filteredPending = useMemo(() => {
    return pendingAthletes.filter((athlete) => {
      const matchesSearch = athlete.name.toLowerCase().includes(search.toLowerCase());
      const matchesArea = selectedArea === 'all' || athlete.area === selectedArea;
      return matchesSearch && matchesArea;
    });
  }, [pendingAthletes, search, selectedArea]);

  return (
    <div className="sl-tracking-grid">
      <div className="sl-card" style={{ borderColor: '#fecaca' }}>
        <div className="sl-card-header" style={{ borderBottom: '1px solid #fee2e2', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div>
              <div className="sl-card-title" style={{ color: '#991b1b', fontSize: '1.125rem', fontWeight: 700 }}>
                Atletas sin Registro Hoy 🔴
              </div>
              <p style={{ fontSize: '.875rem', color: '#b91c1c', margin: '4px 0 0 0' }}>
                Atletas pendientes por ingresar su evaluación de calidad de sueño el día de hoy.
              </p>
            </div>
            <span className="sl-badge danger" style={{ fontSize: '.875rem', padding: '6px 12px' }}>
              {filteredPending.length} pendientes
            </span>
          </div>
        </div>

        {/* Filtros de Búsqueda de Pendientes */}
        <div className="sl-table-controls" style={{ marginTop: '1rem' }}>
          <div className="sl-search-box">
            <Icon size={16}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </Icon>
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
              {[...new Set(pendingAthletes.flatMap((athlete) => (athlete.assignments || []).map((assignment) => assignment.area)))].map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Listado de Pendientes */}
        <div className="sl-table-container">
          {filteredPending.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--sl-success)', fontWeight: 600, fontSize: '1rem', padding: '40px 20px' }}>
              ¡Excelente! No hay atletas pendientes con los filtros seleccionados. 🎉
            </div>
          ) : (
            <table className="sl-table">
              <thead>
                <tr>
                  <th>Atleta</th>
                  <th>Área / Subárea</th>
                  <th>Estado</th>
                  <th>Acción Rápida</th>
                </tr>
              </thead>
              <tbody>
                {filteredPending.map((athlete) => (
                  <tr key={athlete.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="sl-avatar" style={{ fontSize: '.8rem', background: '#fca5a5', color: '#991b1b', fontWeight: 700 }}>
                          {athlete.name?.charAt(0) ?? '?'}
                        </div>
                        <span style={{ fontWeight: 600 }}>{athlete.name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '.875rem' }}>{athlete.area}</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--sl-text-muted)' }}>{athlete.subarea}</div>
                    </td>
                    <td>
                      <div className="sl-badge danger">
                        <div className="sl-status-dot danger" />
                        Sin registro hoy
                      </div>
                    </td>
                    <td>
                      <button
                        className="sl-btn sl-btn-sm sl-btn-primary"
                        type="button"
                        onClick={() => openRegistrationModal(athlete)}
                      >
                        Registrar Sueño
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(SleepPendingView);