import React, { useState, useMemo, useEffect, memo } from 'react';
import { Search, CheckCircle, AlertCircle, X, ArrowLeft, MoonStar, Filter, Check } from 'lucide-react';
import SleepRegistrationView from './SleepRegistrationView';
import '../../../styles/components/trainer/SleepModuleTheme.css';
import '../../../styles/components/trainer/SleepPendingView.css';

const cleanDigits = (val) => String(val || '').replace(/\D/g, '');
const cleanText = (val) => String(val || '').trim().toLowerCase();

const matchCedula = (athleteCedula, query) => {
  if (!athleteCedula || !query) return false;
  const aText = cleanText(athleteCedula);
  const qText = cleanText(query);
  if (aText === qText) return true;
  const aDigits = cleanDigits(athleteCedula);
  const qDigits = cleanDigits(query);
  if (qDigits && aDigits === qDigits) return true;
  return false;
};

// Búsqueda de personas: cédula (con o sin V/E, puntos o guiones) o nombre completo en cualquier orden,
// sin importar mayúsculas ni acentos ("moises romero" encuentra "Moisés Arturo Romero").
const normalizarTexto = (valor) => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const coincidePersona = (texto, nombre, cedula) => {
  const buscado = String(texto || '').trim();
  if (!buscado) return true;
  const digitos = buscado.replace(/[\s.\-_]/g, '').replace(/^[vVeE]/, '');
  if (/^\d+$/.test(digitos)) return String(cedula || '').replace(/\D/g, '').includes(digitos);
  const nombreNormalizado = normalizarTexto(nombre);
  return normalizarTexto(buscado).split(/\s+/).every((palabra) => nombreNormalizado.includes(palabra));
};

const getAthleteInfo = (athlete) => {
  const firstName = athlete?.first_name || athlete?.nombres || (athlete?.name ? athlete.name.split(' ')[0] : '') || '-';
  const lastName = athlete?.last_name || athlete?.apellidos || athlete?.lastname || (athlete?.name ? athlete.name.split(' ').slice(1).join(' ') : '') || '-';
  const fullName = athlete?.name || `${firstName} ${lastName}`.trim();
  const cedula = athlete?.cedula || '-';
  const area = athlete?.area || athlete?.assignments?.[0]?.area || 'Sin área asignada';
  const subarea = athlete?.subarea || (Array.isArray(athlete?.subareas) ? athlete.subareas.join(', ') : athlete?.subarea) || '-';
  return { firstName, lastName, fullName, cedula, area, subarea };
};

const SleepPendingView = ({
  pendingAthletes = [],
  allAthletes = [],
  onSaveSleep,
  systemDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Caracas' }),
  openRegistrationModal, // Prop de compatibilidad retroactiva si algún padre la envía
}) => {
  // Sin una forma de guardar (admin sin permiso registrar_descanso) no se ofrece registrar.
  const puedeRegistrar = Boolean(onSaveSleep || openRegistrationModal);
  const [localPending, setLocalPending] = useState(pendingAthletes);
  const [selectedAthleteForReg, setSelectedAthleteForReg] = useState(null);
  const [searchCedula, setSearchCedula] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [successFeedback, setSuccessFeedback] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');
  const [isSaving, setIsSaving] = useState(false);

  // Sincronizar estado local si cambian los props externos
  useEffect(() => {
    setLocalPending(pendingAthletes);
  }, [pendingAthletes]);

  // Universo de todos los atletas disponibles para la búsqueda por cédula
  const athleteUniverse = useMemo(() => {
    if (allAthletes && allAthletes.length > 0) return allAthletes;
    return localPending;
  }, [allAthletes, localPending]);

  // Filtro de áreas para la lista general de pendientes
  const areaOptions = useMemo(() => {
    return [
      ...new Set(
        localPending.map((athlete) => getAthleteInfo(athlete).area)
      ),
    ].filter(Boolean);
  }, [localPending]);

  // Lista de pendientes filtrada por área (cuando no hay búsqueda activa por cédula)
  const filteredPending = useMemo(() => {
    return localPending.filter((athlete) => {
      const { area } = getAthleteInfo(athlete);
      return selectedArea === 'all' || area === selectedArea;
    });
  }, [localPending, selectedArea]);

  // Manejo de la búsqueda por cédula
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const query = searchCedula.trim();

    if (!query) {
      setSearchResult(null);
      return;
    }

    setSuccessFeedback('');

    // Cédula exacta primero; si no, cédula parcial o nombre completo.
    const exacto = athleteUniverse.find((a) => matchCedula(a.cedula, query));
    const coincidencias = exacto
      ? [exacto]
      : athleteUniverse.filter((a) => coincidePersona(query, getAthleteInfo(a).fullName, a.cedula));
    if (coincidencias.length !== 1) {
      setSearchResult({ status: 'not_found', coincidencias: coincidencias.length });
      return;
    }
    const found = coincidencias[0];

    const isPending = localPending.some((p) => p.id === found.id);
    if (isPending) {
      setSearchResult({ status: 'pending', athlete: found });
    } else {
      setSearchResult({ status: 'registered', athlete: found });
    }
  };

  const handleClearSearch = () => {
    setSearchCedula('');
    setSearchResult(null);
  };

  // Al pulsar "Registrar" / "Registrar sueño"
  const handleStartRegistration = (athlete) => {
    if (openRegistrationModal) {
      // Si el componente padre maneja el modal externamente
      openRegistrationModal(athlete);
    }
    // Mostramos el formulario reutilizable integrado en Pendientes
    setSelectedAthleteForReg(athlete);
  };

  // Guardar registro mediante el componente reutilizable
  const handleSaveRegistration = async (athleteId, quality) => {
    setIsSaving(true);
    try {
      if (onSaveSleep) {
        await onSaveSleep(athleteId, quality);
      }
      const athleteName = selectedAthleteForReg?.name || 'el atleta';
      setSuccessFeedback(`¡Registro de sueño guardado exitosamente para ${athleteName}!`);

      // 4. El atleta registrado debe desaparecer inmediatamente de Pendientes
      // 5. Actualizar el contador de pendientes
      setLocalPending((prev) => prev.filter((a) => a.id !== athleteId));

      // Si había una búsqueda activa sobre este atleta, actualizar su estado a 'registered'
      setSearchResult((prev) => {
        if (prev && prev.athlete && prev.athlete.id === athleteId) {
          return { status: 'registered', athlete: prev.athlete };
        }
        return prev;
      });

      // 6. Mantener al administrador dentro del flujo de Pendientes
      setSelectedAthleteForReg(null);
    } finally {
      setIsSaving(false);
    }
  };

  // Si se ha seleccionado un atleta para registrar, mostrar el FORMULARIO REUTILIZABLE
  if (selectedAthleteForReg) {
    return (
      <SleepRegistrationView
        athlete={selectedAthleteForReg}
        onSave={handleSaveRegistration}
        onCancel={() => setSelectedAthleteForReg(null)}
        isSaving={isSaving}
        systemDate={systemDate}
      />
    );
  }

  return (
    <div className="sleep-pending-view">
      {/* Cabecera del Módulo */}
      <header className="sl-module-heading">
        <span className="sl-module-heading__eyebrow">SUEÑO Y DESCANSO</span>
        <h2>Pendientes ({localPending.length})</h2>
        <p>Atletas que todavía no cuentan con registro de sueño en el período actual.</p>
      </header>

      {/* Banner de Mensaje de Éxito tras Guardar */}
      {successFeedback && (
        <div className="sl-alert-banner sl-alert-banner--success" role="status">
          <div className="sl-alert-banner__content">
            <CheckCircle size={20} className="sl-icon--success" />
            <span>{successFeedback}</span>
          </div>
          <button
            type="button"
            className="sl-alert-banner__close"
            onClick={() => setSuccessFeedback('')}
            aria-label="Cerrar notificación"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* BUSCADOR POR CÉDULA O NOMBRE */}
      <div className="sl-card sl-cedula-search-card">
        <label className="sl-cedula-search-label" htmlFor="search-cedula-input">
          Buscar atleta por cédula o nombre
        </label>
        <form onSubmit={handleSearch} className="sl-cedula-search-form">
          <div className="sl-cedula-input-wrapper">
            <Search size={18} className="sl-cedula-search-icon" />
            <input
              id="search-cedula-input"
              className="sl-cedula-search-input"
              type="text"
              placeholder="Cédula o nombre del atleta..."
              value={searchCedula}
              onChange={(e) => {
                setSearchCedula(e.target.value);
                if (!e.target.value.trim()) {
                  setSearchResult(null);
                }
              }}
              autoComplete="off"
            />
            {searchCedula && (
              <button
                type="button"
                className="sl-cedula-clear-btn"
                onClick={handleClearSearch}
                aria-label="Borrar texto de búsqueda"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button type="submit" className="sl-btn sl-btn-primary sl-cedula-search-btn">
            Buscar
          </button>
          {searchResult && (
            <button
              type="button"
              className="sl-btn sl-btn-secondary"
              onClick={handleClearSearch}
            >
              Ver todos
            </button>
          )}
        </form>
      </div>

      {/* RESULTADO DE LA BÚSQUEDA POR CÉDULA */}
      {searchResult && (
        <div className="sl-search-result-wrapper">
          {/* CASO 1: Atleta existe y está PENDIENTE */}
          {searchResult.status === 'pending' && (() => {
            const { fullName, cedula, area, subarea } = getAthleteInfo(searchResult.athlete);
            return (
              <div className="sl-card sl-search-result-card sl-search-result-card--pending">
                <div className="sl-result-card-header">
                  <div className="sl-result-identity">
                    <span className="sl-avatar sl-avatar--alert">
                      {fullName.charAt(0) || '?'}
                    </span>
                    <div>
                      <h3 className="sl-result-name">{fullName}</h3>
                      <p className="sl-result-meta-line">
                        <strong>Cédula:</strong> {cedula}
                      </p>
                    </div>
                  </div>
                  <span className="sl-tag sl-tag--pending">Pendiente de registro</span>
                </div>

                <div className="sl-result-info-grid">
                  <div className="sl-result-info-item">
                    <span className="sl-info-label">Área:</span>
                    <span className="sl-info-val">{area}</span>
                  </div>
                  <div className="sl-result-info-item">
                    <span className="sl-info-label">Sub área:</span>
                    <span className="sl-info-val">{subarea}</span>
                  </div>
                </div>

                {puedeRegistrar && (
                  <div className="sl-result-actions">
                    <button
                      type="button"
                      className="sl-btn sl-btn-primary"
                      onClick={() => handleStartRegistration(searchResult.athlete)}
                    >
                      Registrar sueño
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* CASO 2: Atleta existe pero NO está pendiente (Ya tiene registrado su sueño) */}
          {searchResult.status === 'registered' && (() => {
            const { fullName, cedula, area, subarea } = getAthleteInfo(searchResult.athlete);
            return (
              <div className="sl-card sl-search-result-card sl-search-result-card--registered">
                <div className="sl-result-card-header">
                  <div className="sl-result-identity">
                    <span className="sl-avatar sl-avatar--success">
                      <Check size={18} />
                    </span>
                    <div>
                      <h3 className="sl-result-name">{fullName}</h3>
                      <p className="sl-result-meta-line">
                        <strong>Cédula:</strong> {cedula}
                      </p>
                    </div>
                  </div>
                  <span className="sl-tag sl-tag--registered">Sueño Asentado</span>
                </div>

                <div className="sl-result-info-grid">
                  <div className="sl-result-info-item">
                    <span className="sl-info-label">Área:</span>
                    <span className="sl-info-val">{area}</span>
                  </div>
                  <div className="sl-result-info-item">
                    <span className="sl-info-label">Sub área:</span>
                    <span className="sl-info-val">{subarea}</span>
                  </div>
                </div>

                <div className="sl-registered-notice">
                  <CheckCircle size={18} className="sl-icon--success" />
                  <span>Este atleta ya tiene registrado su sueño.</span>
                </div>
              </div>
            );
          })()}

          {/* CASO 3: ningún atleta (o varios) coincide con la búsqueda */}
          {searchResult.status === 'not_found' && (
            <div className="sl-card sl-search-result-card sl-search-result-card--notfound">
              <div className="sl-notfound-content">
                <AlertCircle size={28} className="sl-icon--warning" />
                <p className="sl-notfound-text">
                  {searchResult.coincidencias > 1
                    ? `Hay ${searchResult.coincidencias} atletas que coinciden: escriba el nombre completo o la cédula.`
                    : 'No se encontró ningún atleta con esa cédula o nombre.'}
                </p>
                <button
                  type="button"
                  className="sl-btn sl-btn-sm sl-btn-secondary"
                  onClick={handleClearSearch}
                >
                  Volver a la lista de pendientes
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LISTA COMPLETA DE ATLETAS PENDIENTES (Visible cuando no hay búsqueda activa) */}
      {!searchResult && (
        <div className="sl-tracking-grid">
          <div className="sl-card sl-card--alert">
            <div className="sl-card-header">
              <h3 className="sl-card-title sl-card-title--alert">
                Atletas pendientes ({filteredPending.length})
              </h3>

              {areaOptions.length > 0 && (
                <div className="sl-area-filter-wrapper">
                  <Filter size={15} className="sl-filter-icon" />
                  <select
                    className="sl-select sl-select-compact"
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    aria-label="Filtrar atletas por área"
                  >
                    <option value="all">Todas las áreas ({localPending.length})</option>
                    {areaOptions.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Listado de atletas pendientes */}
            <ul className="sl-pending-list" aria-label="Lista de atletas pendientes">
              {filteredPending.length > 0 ? (
                filteredPending.map((athlete) => {
                  const { fullName, cedula, subarea } = getAthleteInfo(athlete);
                  return (
                    <li className="sl-pending-item" key={athlete.id}>
                      <span className="sl-avatar sl-avatar--alert">
                        {fullName.charAt(0) || '?'}
                      </span>
                      <div className="sl-pending-item__text">
                        <div className="sl-pending-item__header-row">
                          <span className="sl-pending-item__name">{fullName}</span>
                          <span className="sl-pending-item__cedula">Cédula: {cedula} · <span className="ref-usuario">Ref. {athlete.id}</span></span>
                        </div>
                        <div className="sl-pending-item__badges">
                          <span className="sl-badge-subarea">
                            <strong>Sub área:</strong> {subarea}
                          </span>
                        </div>
                      </div>
                      {puedeRegistrar && (
                        <button
                          type="button"
                          className="sl-btn sl-btn-primary sl-btn-sm sl-btn-register"
                          onClick={() => handleStartRegistration(athlete)}
                        >
                          Registrar
                        </button>
                      )}
                    </li>
                  );
                })
              ) : (
                <div className="sl-empty-card sl-empty-card--success">
                  <CheckCircle size={24} style={{ marginBottom: '8px' }} />
                  <div>
                    {selectedArea === 'all'
                      ? '¡Excelente! No hay atletas pendientes con registro de sueño para este período.'
                      : `¡Excelente! No hay atletas pendientes en el área "${selectedArea}".`}
                  </div>
                </div>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(SleepPendingView);