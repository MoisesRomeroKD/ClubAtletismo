import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Zap, MoveVertical, Users, ArrowRight, X } from 'lucide-react';
import '../../../styles/components/trainer/SubAreasTrainer.css';
import UserService from '../../../api/services/Userservice';

const ICON_MAP = {
  sprint: Zap,
  height: MoveVertical,
};

const normalize = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[\s\-\.\/_]/g, '');

const getAthleteSubareas = (athlete) => {
  if (Array.isArray(athlete.subareas_nombres)) {
    return [...new Set(athlete.subareas_nombres.map(normalize).filter(Boolean))];
  }

  if (typeof athlete.subareas_lista_texto === 'string') {
    return [...new Set(
      athlete.subareas_lista_texto.split(',').map(normalize).filter(Boolean)
    )];
  }

  if (athlete.subarea_nombre_principal) {
    return [normalize(athlete.subarea_nombre_principal)];
  }

  return [];
};

function SubareaDetailsPanel({ subarea, athletes, closeButtonRef, onClose, isMobile }) {
  const sortedAthletes = [...athletes].sort((first, second) => (
    `${first.nombres || first.name || ''} ${first.apellidos || ''}`
      .trim()
      .localeCompare(
        `${second.nombres || second.name || ''} ${second.apellidos || ''}`.trim(),
        'es',
      )
  ));

  return (
    <aside
      className={`subarea-detail-panel ${isMobile ? 'subarea-detail-panel--sheet' : 'subarea-detail-panel--desktop'}`}
      role="dialog"
      aria-modal={isMobile}
      aria-label={`Atletas de ${subarea.nombre}`}
      tabIndex={-1}
    >
      <header className="subarea-detail-panel__header">
        <div>
          <span className="subarea-detail-panel__eyebrow">Subárea</span>
          <h2>{subarea.nombre}</h2>
        </div>
        <button
          className="subarea-detail-panel__close"
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalles de subárea"
          ref={closeButtonRef}
        >
          <X size={19} />
        </button>
      </header>

      <div className="subarea-detail-panel__body">
        {sortedAthletes.length === 0 ? (
          <p className="subarea-detail-panel__empty">No hay atletas asignados a esta subárea.</p>
        ) : (
          <ul className="subarea-athlete-list">
            {sortedAthletes.map((athlete) => (
              <li className="subarea-athlete-list__item" key={athlete.user_id}>
                <span className="subarea-athlete-list__name">
                  {`${athlete.nombres || athlete.name || ''} ${athlete.apellidos || ''}`.trim()}
                </span>
                <span className="subarea-athlete-list__category">{athlete.categoria || 'Sin categoría'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

const SubAreasTrainer = () => {
  const [subareas, setSubareas] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [selectedSubarea, setSelectedSubarea] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const openerRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    let componenteActivo = true;

    const cargarDatos = async () => {
      try {
        const [subareasResponse, athletesResponse] = await Promise.all([
          UserService.getMySubareas(),
          UserService.getMyAthletes(),
        ]);

        const subareasData = Array.isArray(subareasResponse) ? subareasResponse : [];
        const athletesData = Array.isArray(athletesResponse) ? athletesResponse : [];
        const seenSubareaIds = new Set();
        const subareasNormalizadas = subareasData.reduce((result, relacion) => {
          const subareaDetalle = relacion.subarea_detalle;
          const subareaId = subareaDetalle?.id ?? relacion.subarea;
          if (subareaId == null || seenSubareaIds.has(subareaId)) return result;
          seenSubareaIds.add(subareaId);

          const nombreArea = subareaDetalle?.area?.nombre || '';
          const nombreSubarea = subareaDetalle?.nombre || 'Subárea sin nombre';
          const esSalto = nombreArea.toLowerCase().includes('salto');
          const target = normalize(nombreSubarea);
          const subareaAthletes = athletesData.filter((athlete) => (
            getAthleteSubareas(athlete).includes(target)
          ));

          result.push({
            id: subareaId,
            nombre: nombreSubarea,
            areaId: subareaDetalle?.area?.id ?? null,
            areaNombre: nombreArea || 'Área sin nombre',
            icono: esSalto ? 'height' : 'sprint',
            color: esSalto ? 'purple' : 'blue',
            atletas: subareaAthletes.length,
            atletasDetalle: subareaAthletes,
          });
          return result;
        }, []);

        if (componenteActivo) {
          setSubareas(subareasNormalizadas);
          setAthletes(athletesData);
          setError('');
        }
      } catch (requestError) {
        if (componenteActivo) {
          setError(requestError.response?.data?.detail || 'No fue posible cargar tus subáreas.');
        }
      } finally {
        if (componenteActivo) setCargando(false);
      }
    };

    cargarDatos();

    return () => {
      componenteActivo = false;
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const updateViewportMode = (event) => setIsMobile(event.matches);
    mediaQuery.addEventListener('change', updateViewportMode);
    return () => mediaQuery.removeEventListener('change', updateViewportMode);
  }, []);

  useEffect(() => {
    if (!selectedSubarea) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') closeDetails();
    };
    document.addEventListener('keydown', closeOnEscape);
    closeButtonRef.current?.focus();

    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [selectedSubarea]);

  useEffect(() => {
    if (!selectedSubarea || !isMobile) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [selectedSubarea, isMobile]);

  const groupedSubareas = useMemo(() => {
    const groups = new Map();
    subareas.forEach((subarea) => {
      const groupKey = subarea.areaId ?? subarea.areaNombre;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, { id: groupKey, nombre: subarea.areaNombre, subareas: [] });
      }
      groups.get(groupKey).subareas.push(subarea);
    });
    return [...groups.values()];
  }, [subareas]);

  const selectedAthletes = useMemo(() => {
    if (!selectedSubarea) return [];
    const target = normalize(selectedSubarea.nombre);
    return athletes.filter((athlete) => getAthleteSubareas(athlete).includes(target));
  }, [athletes, selectedSubarea]);

  const handleDetalles = (subarea, event) => {
    openerRef.current = event.currentTarget;
    setSelectedSubarea(subarea);
  };

  const closeDetails = () => {
    setSelectedSubarea(null);
    requestAnimationFrame(() => openerRef.current?.focus());
  };

  return (
    <main className="mis-subareas">
      <div className={`mis-subareas__workspace ${selectedSubarea && !isMobile ? 'mis-subareas__workspace--details-open' : ''}`}>
        <div className="mis-subareas__content">
          <div className="mis-subareas__container">
            <div className="mis-subareas__heading">
              <h2>Mis Subáreas</h2>
            </div>

            {cargando ? (
              <p>Cargando subáreas...</p>
            ) : error ? (
              <p role="alert">{error}</p>
            ) : subareas.length === 0 ? (
              <p>No tienes subáreas habilitadas.</p>
            ) : (
              <div className="mis-subareas__groups">
                {groupedSubareas.map((group) => (
                  <section className="mis-subareas__area-group" key={group.id}>
                    <h3 className="mis-subareas__area-title">{group.nombre}</h3>
                    <div className="mis-subareas__grid">
                      {group.subareas.map((subarea) => {
                        const IconComponent = ICON_MAP[subarea.icono] || Zap;

                        return (
                          <article className="subarea-card" key={subarea.id}>
                            <div className="subarea-card__top">
                              <div className={`subarea-card__icon subarea-card__icon--${subarea.color}`}>
                                <IconComponent size={28} />
                              </div>
                            </div>
                            <div className="subarea-card__body">
                              <h3>{subarea.nombre}</h3>
                            </div>
                            <div className="subarea-card__footer">
                              <div className="subarea-card__athletes">
                                <Users size={18} />
                                <span className="subarea-card__athletes-count">{subarea.atletas}</span>
                                <span className="subarea-card__athletes-label">
                                  {subarea.atletas === 1 ? 'atleta' : 'atletas'}
                                </span>
                              </div>
                              <button
                                type="button"
                                className="subarea-card__details"
                                onClick={(event) => handleDetalles(subarea, event)}
                                aria-label={`Ver detalles de ${subarea.nombre}`}
                              >
                                <span>Ver detalles</span>
                                <ArrowRight size={16} />
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedSubarea && !isMobile && (
          <SubareaDetailsPanel
            subarea={selectedSubarea}
            athletes={selectedAthletes}
            closeButtonRef={closeButtonRef}
            onClose={closeDetails}
            isMobile={false}
          />
        )}
      </div>

      {selectedSubarea && isMobile && createPortal(
        <div className="subarea-sheet-layer">
          <button
            className="subarea-sheet-backdrop"
            type="button"
            aria-label="Cerrar detalles de subárea"
            onClick={closeDetails}
          />
          <SubareaDetailsPanel
            subarea={selectedSubarea}
            athletes={selectedAthletes}
            closeButtonRef={closeButtonRef}
            onClose={closeDetails}
            isMobile
          />
        </div>,
        document.body,
      )}
    </main>
  );
};

export default SubAreasTrainer;