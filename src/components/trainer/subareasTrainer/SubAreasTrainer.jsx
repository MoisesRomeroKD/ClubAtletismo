import React, { useEffect, useState } from 'react';
import { Zap, MoveVertical, Users, ArrowRight } from 'lucide-react';
import '../../../styles/components/trainer/SubAreasTrainer.css';
import UserService from '../../../api/services/Userservice';

const ICON_MAP = {
  sprint: Zap,
  height: MoveVertical,
};

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s\-\.\/_]/g, '');

const getAthleteSubareas = (athlete) => {
  if (!athlete) return [];

  const raw = [];

  if (Array.isArray(athlete.subareas_nombres)) {
    raw.push(...athlete.subareas_nombres);
  }

  if (Array.isArray(athlete.assignments)) {
    athlete.assignments.forEach((a) => {
      if (a?.subarea) raw.push(a.subarea);
      if (a?.area && a?.subarea) raw.push(`${a.area} ${a.subarea}`);
    });
  }

  if (typeof athlete.subareas_lista_texto === 'string') {
    raw.push(
      ...athlete.subareas_lista_texto
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    );
  }

  if (athlete.subarea_nombre_principal) {
    raw.push(athlete.subarea_nombre_principal);
  }

  return raw.filter(Boolean);
};

const SubAreasTrainer = () => {
  const [subareas, setSubareas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

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

        const subareasNormalizadas = subareasData.map((relacion) => {
          const nombreArea = relacion.subarea_detalle?.area?.nombre || '';
          const nombreSubarea = relacion.subarea_detalle?.nombre || 'Subárea sin nombre';
          const esSalto = nombreArea.toLowerCase().includes('salto');

          const target = normalize(nombreSubarea);
          const atletas = athletesData.filter((athlete) => {
            const nombres = getAthleteSubareas(athlete);
            return nombres.some((sub) => normalize(sub) === target);
          }).length;

          return {
            id: relacion.id,
            nombre: nombreSubarea,
            categoria: nombreArea || 'Área sin nombre',
            icono: esSalto ? 'height' : 'sprint',
            color: esSalto ? 'purple' : 'blue',
            atletas,
          };
        });

        if (componenteActivo) {
          setSubareas(subareasNormalizadas);
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

  const handleDetalles = (subarea) => {
    console.log('Ver detalles:', subarea);
  };

  return (
    <main className="mis-subareas">
      <div className="mis-subareas__content">

        <div className="mis-subareas__container">

          <div className="mis-subareas__heading">
            <h2>Mis Subáreas</h2>
          </div>

          <div className="mis-subareas__grid">

            {cargando ? (
              <p>Cargando subáreas...</p>
            ) : error ? (
              <p>{error}</p>
            ) : subareas.length === 0 ? (
              <p>No tienes subáreas habilitadas.</p>
            ) : subareas.map((subarea) => {
              const IconComponent = ICON_MAP[subarea.icono] || Zap;

              return (
                <article
                  key={subarea.id}
                  className="subarea-card"
                  onClick={() => handleDetalles(subarea)}
                >

                  <div className="subarea-card__top">
                    <div className={`subarea-card__icon subarea-card__icon--${subarea.color}`}>
                      <IconComponent size={28} />
                    </div>
                  </div>

                  <div className="subarea-card__body">
                    <span className="subarea-card__category">
                      {subarea.categoria}
                    </span>
                    <h3>{subarea.nombre}</h3>
                  </div>

                  <div className="subarea-card__footer">

                    <div className="subarea-card__athletes">
                      <Users size={18} />
                      <span className="subarea-card__athletes-count">
                        {subarea.atletas}
                      </span>
                      <span className="subarea-card__athletes-label">
                        {subarea.atletas === 1 ? 'atleta' : 'atletas'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="subarea-card__details"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDetalles(subarea);
                      }}
                    >
                      <span>Ver detalles</span>
                      <ArrowRight size={16} />
                    </button>

                  </div>

                </article>
              );
            })}

          </div>

        </div>

      </div>
    </main>
  );
};

export default SubAreasTrainer;