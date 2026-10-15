import React, { useEffect, useRef, useState } from 'react';
import podApi from '../api/podApi';
import '../styles/components/admin/asistencia/RegistroAsistencia.css';

const attendanceApi = '/v1/asistencias/';
const PAGE_SIZE = 20;

const emptyPage = {
  results: [],
  total_resultados: 0,
  pagina_actual: 1,
  cantidad_por_pagina: PAGE_SIZE,
  total_paginas: 0,
};

export default function RegistroAsistencia() {
  const [areas, setAreas] = useState([]);
  const [subareas, setSubareas] = useState([]);
  const [draftFilters, setDraftFilters] = useState({
    area_id: '',
    subarea_id: '',
    cedula: '',
  });
  const [filters, setFilters] = useState({
    area_id: '',
    subarea_id: '',
    cedula: '',
  });
  const [pageData, setPageData] = useState(emptyPage);
  const [attendanceStatuses, setAttendanceStatuses] = useState({});
  const [justificationDetails, setJustificationDetails] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubareas, setIsLoadingSubareas] = useState(false);
  const [savingAthleteId, setSavingAthleteId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    let active = true;
    podApi.get('/v1/atletismo/areas/').then((response) => {
      if (active) setAreas(response.data);
    }).catch((error) => {
      if (active) {
        setMessage({
          text: error.response?.data?.detail || 'No se pudieron cargar las áreas.',
          type: 'error',
        });
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoadingSubareas(true);
    podApi.get('/v1/atletismo/subareas/', {
      params: draftFilters.area_id ? { area_id: draftFilters.area_id } : {},
    }).then((response) => {
      if (active) setSubareas(response.data);
    }).catch((error) => {
      if (active) {
        setMessage({
          text: error.response?.data?.detail || 'No se pudieron cargar las subáreas.',
          type: 'error',
        });
      }
    }).finally(() => {
      if (active) setIsLoadingSubareas(false);
    });

    return () => {
      active = false;
    };
  }, [draftFilters.area_id]);

  useEffect(() => {
    const currentRequestId = ++requestId.current;
    setIsLoading(true);

    const params = {
      page: pageData.pagina_actual,
      page_size: PAGE_SIZE,
    };
    if (filters.area_id) params.area_id = filters.area_id;
    if (filters.subarea_id) params.subarea_id = filters.subarea_id;
    if (filters.cedula) params.cedula = filters.cedula;

    podApi.get(`${attendanceApi}atletas/buscar/`, { params })
      .then((response) => {
        if (currentRequestId !== requestId.current) return;
        setPageData(response.data);
        setAttendanceStatuses(
          Object.fromEntries(
            response.data.results.map((athlete) => [
              athlete.id,
              athlete.estado_asistencia_hoy || 'Presente',
            ])
          )
        );
        setMessage({ text: '', type: '' });
      })
      .catch((error) => {
        if (currentRequestId !== requestId.current) return;
        setPageData(emptyPage);
        setMessage({
          text: error.response?.data?.error
            || error.response?.data?.detail
            || error.response?.data?.message
            || 'No se pudo cargar la lista de atletas.',
          type: 'error',
        });
      })
      .finally(() => {
        if (currentRequestId === requestId.current) setIsLoading(false);
      });
  }, [filters, pageData.pagina_actual, refreshKey]);

  const applyFilters = (event) => {
    event.preventDefault();
    setMessage({ text: '', type: '' });
    setPageData((current) => ({ ...current, pagina_actual: 1 }));
    setFilters({
      ...draftFilters,
      cedula: draftFilters.cedula.trim(),
    });
  };

  const clearFilters = () => {
    const cleared = { area_id: '', subarea_id: '', cedula: '' };
    setDraftFilters(cleared);
    setFilters(cleared);
    setPageData((current) => ({ ...current, pagina_actual: 1 }));
    setMessage({ text: '', type: '' });
    setRefreshKey((key) => key + 1);
  };

  const registerAttendance = async (athlete) => {
    const status = attendanceStatuses[athlete.id] || 'Presente';
    const detail = justificationDetails[athlete.id] || '';
    if (status === 'Justificado' && !detail.trim()) {
      setMessage({ text: 'El detalle de la justificación es obligatorio.', type: 'error' });
      return;
    }

    setMessage({ text: '', type: '' });
    setSavingAthleteId(athlete.id);

    try {
      const response = await podApi.post(`${attendanceApi}asistencia/registrar/`, {
        cedula: athlete.cedula,
        status,
        detail: status === 'Justificado' ? detail.trim() : '',
      });
      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'El backend no confirmó el registro de asistencia.');
      }
      setMessage({ text: response.data.message, type: 'success' });
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setMessage({
        text: error.response?.data?.error || error.message || 'No se pudo registrar la asistencia. Intente nuevamente.',
        type: 'error',
      });
    } finally {
      setSavingAthleteId(null);
    }
  };

  const changePage = (nextPage) => {
    setPageData((current) => ({ ...current, pagina_actual: nextPage }));
  };

  return (
    <section className="registro-asistencia">
      <header className="registro-asistencia__header">
        <div>
          <span className="registro-asistencia__eyebrow">ASISTENCIA</span>
          <h1>Registro de asistencia</h1>
          <p>Filtre la nómina y registre el estado de asistencia de hoy.</p>
        </div>
      </header>

      <form className="registro-asistencia__search" onSubmit={applyFilters}>
        <div className="registro-asistencia__filters">
          <div className="registro-asistencia__field">
            <label htmlFor="attendance-area">Área</label>
            <select
              id="attendance-area"
              value={draftFilters.area_id}
              onChange={(event) => setDraftFilters((current) => ({
                ...current,
                area_id: event.target.value,
                subarea_id: '',
              }))}
            >
              <option value="">Todas las áreas</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>{area.nombre}</option>
              ))}
            </select>
          </div>

          <div className="registro-asistencia__field">
            <label htmlFor="attendance-subarea">Subárea</label>
            <select
              id="attendance-subarea"
              value={draftFilters.subarea_id}
              disabled={isLoadingSubareas}
              onChange={(event) => setDraftFilters((current) => ({
                ...current,
                subarea_id: event.target.value,
              }))}
            >
              <option value="">Todas las subáreas</option>
              {subareas.map((subarea) => (
                <option key={subarea.id} value={subarea.id}>{subarea.nombre}</option>
              ))}
            </select>
          </div>

          <div className="registro-asistencia__field registro-asistencia__field--cedula">
            <label htmlFor="attendance-cedula">Cédula exacta</label>
            <input
              id="attendance-cedula"
              type="search"
              inputMode="numeric"
              value={draftFilters.cedula}
              onChange={(event) => setDraftFilters((current) => ({
                ...current,
                cedula: event.target.value,
              }))}
              placeholder="Buscar por cédula"
            />
          </div>
        </div>

        <div className="registro-asistencia__filter-actions">
          <button
            className="registro-asistencia__button registro-asistencia__button--primary"
            type="submit"
            disabled={isLoading}
          >
            Aplicar filtros
          </button>
          <button
            className="registro-asistencia__button registro-asistencia__button--secondary"
            type="button"
            onClick={clearFilters}
            disabled={isLoading}
          >
            Limpiar
          </button>
        </div>
        <p className="registro-asistencia__category-note">
          El filtro de categoría está pendiente de definir en el modelo del proyecto.
        </p>
      </form>

      {message.text && (
        <div
          className={`registro-asistencia__notice registro-asistencia__notice--${message.type}`}
          role={message.type === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </div>
      )}

      <section className="registro-asistencia__results" aria-label="Atletas para registrar asistencia">
        <div className="registro-asistencia__section-heading">
          <div>
            <h2>Atletas</h2>
            <p>
              {isLoading
                ? 'Cargando página...'
                : `${pageData.total_resultados} resultados · ${pageData.cantidad_por_pagina} por página`}
            </p>
          </div>
          <div className="registro-asistencia__pagination" aria-label="Paginación">
            <button
              className="registro-asistencia__button registro-asistencia__button--secondary"
              type="button"
              onClick={() => changePage(pageData.pagina_actual - 1)}
              disabled={isLoading || pageData.pagina_actual <= 1}
            >
              Anterior
            </button>
            <span>
              Página {pageData.total_paginas ? pageData.pagina_actual : 0} de {pageData.total_paginas}
            </span>
            <button
              className="registro-asistencia__button registro-asistencia__button--secondary"
              type="button"
              onClick={() => changePage(pageData.pagina_actual + 1)}
              disabled={isLoading || pageData.pagina_actual >= pageData.total_paginas}
            >
              Siguiente
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="registro-asistencia__empty" role="status">
            Cargando atletas...
          </div>
        )}

        {!isLoading && pageData.results.length === 0 && (
          <div className="registro-asistencia__empty">
            No hay atletas que coincidan con los filtros seleccionados.
          </div>
        )}

        {!isLoading && pageData.results.length > 0 && (
          <ul className="registro-asistencia__athlete-list">
            {pageData.results.map((athlete) => (
              <li
                className={`registro-asistencia__athlete ${athlete.pendiente ? 'is-pending' : 'is-registered'}`}
                key={athlete.id}
              >
                <div className="registro-asistencia__athlete-info">
                  <span className="registro-asistencia__avatar" aria-hidden="true">
                    {athlete.nombre.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                  <div className="registro-asistencia__athlete-details">
                    <h3>{athlete.nombre}</h3>
                    <p>Cédula <strong>{athlete.cedula}</strong></p>
                    <p>
                      Área: {athlete.areas.length
                        ? athlete.areas.map((area) => area.nombre).join(', ')
                        : 'Dato faltante en BD'}
                      {' · '}
                      Subáreas: {athlete.subareas.length
                        ? athlete.subareas.map((subarea) => subarea.nombre).join(', ')
                        : 'Dato faltante en BD'}
                      {' · '}
                      Categoría: {athlete.categoria || 'No disponible'}
                    </p>
                  </div>
                </div>

                <div className="registro-asistencia__actions">
                  <span className={`registro-asistencia__status ${athlete.pendiente ? 'is-pending' : 'is-registered'}`}>
                    {athlete.pendiente ? 'Pendiente hoy' : athlete.estado_asistencia_hoy}
                  </span>
                  <div className={`registro-asistencia__field registro-asistencia__field--status ${attendanceStatuses[athlete.id] === 'Justificado' ? 'has-justification' : ''}`}>
                    <label htmlFor={`attendance-status-${athlete.id}`}>Estado</label>
                    <select
                      id={`attendance-status-${athlete.id}`}
                      value={attendanceStatuses[athlete.id] || 'Presente'}
                      onChange={(event) => setAttendanceStatuses((current) => ({
                        ...current,
                        [athlete.id]: event.target.value,
                      }))}
                    >
                      <option value="Presente">Presente</option>
                      <option value="Ausente">Ausente</option>
                      <option value="Justificado">Justificado</option>
                    </select>
                    {attendanceStatuses[athlete.id] === 'Justificado' && (
                      <div className="registro-asistencia__justification">
                        <label htmlFor={`attendance-detail-${athlete.id}`}>Detalle de la justificación *</label>
                        <textarea
                          id={`attendance-detail-${athlete.id}`}
                          placeholder="Escriba el motivo de la justificación..."
                          value={justificationDetails[athlete.id] || ''}
                          onChange={(event) => setJustificationDetails((current) => ({
                            ...current,
                            [athlete.id]: event.target.value,
                          }))}
                          required
                        />
                      </div>
                    )}
                  </div>
                  <button
                    className="registro-asistencia__button registro-asistencia__button--save"
                    type="button"
                    onClick={() => registerAttendance(athlete)}
                    disabled={savingAthleteId !== null}
                  >
                    {savingAthleteId === athlete.id ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="registro-asistencia__pagination registro-asistencia__pagination--bottom" aria-label="Paginación">
          <button
            className="registro-asistencia__button registro-asistencia__button--secondary"
            type="button"
            onClick={() => changePage(pageData.pagina_actual - 1)}
            disabled={isLoading || pageData.pagina_actual <= 1}
          >
            Anterior
          </button>
          <span>
            Página {pageData.total_paginas ? pageData.pagina_actual : 0} de {pageData.total_paginas}
          </span>
          <button
            className="registro-asistencia__button registro-asistencia__button--secondary"
            type="button"
            onClick={() => changePage(pageData.pagina_actual + 1)}
            disabled={isLoading || pageData.pagina_actual >= pageData.total_paginas}
          >
            Siguiente
          </button>
        </div>
      </section>
    </section>
  );
}
