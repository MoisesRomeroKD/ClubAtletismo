import React, { useEffect, useState } from 'react';
import '../../../styles/components/trainer/SubAreasTrainer.css';
import UserService from '../../../api/services/Userservice';

const SubAreasTrainer = () => {
  const [subareas, setSubareas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let componenteActivo = true;

    const cargarSubareas = async () => {
      try {
        const respuesta = await UserService.getMySubareas();
        const datos = Array.isArray(respuesta) ? respuesta : [];
        const subareasNormalizadas = datos.map((relacion) => {
          const nombreArea = relacion.subarea_detalle?.area?.nombre || '';
          const esSalto = nombreArea.toLowerCase().includes('salto');

          return {
            id: relacion.id,
            nombre: relacion.subarea_detalle?.nombre || 'Subárea sin nombre',
            categoria: nombreArea || 'Área sin nombre',
            icono: esSalto ? 'height' : 'sprint',
            color: esSalto ? 'purple' : 'blue',
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

    cargarSubareas();

    return () => {
      componenteActivo = false;
    };
  }, []);

  const handleDetalles = (subarea) => {
    console.log('Ver detalles:', subarea);
  };

  const handleMenu = (subarea) => {
    console.log('Menú:', subarea);
  };

  return (
    <main className="mis-subareas">
        <div className="mis-subareas__content">

          <div className="mis-subareas__container">

            {/* Encabezado */}
            <div className="mis-subareas__heading">

              <div className="mis-subareas__heading-text">

                <h2>Mis Subáreas</h2>

                <p>
                  Gestiona y visualiza el progreso de tus grupos deportivos.
                </p>

              </div>

            </div>

            {/* Grid */}
            <div className="mis-subareas__grid">

              {cargando ? (
                <p>Cargando subáreas...</p>
              ) : error ? (
                <p>{error}</p>
              ) : subareas.length === 0 ? (
                <p>No tienes subáreas habilitadas.</p>
              ) : subareas.map((subarea) => (
                <article
                  key={subarea.id}
                  className="subarea-card"
                  onClick={() => handleDetalles(subarea)}
                >

                  {/* Parte superior */}
                  <div className="subarea-card__top">

                    <div
                      className={`subarea-card__icon subarea-card__icon--${subarea.color}`}
                    >
                      <span className="material-symbols-outlined">
                        {subarea.icono}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="subarea-card__menu"
                      aria-label={`Opciones de ${subarea.nombre}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleMenu(subarea);
                      }}
                    >
                      <span className="material-symbols-outlined">
                        more_vert
                      </span>
                    </button>

                  </div>

                  {/* Información */}
                  <div className="subarea-card__body">

                    <span className="subarea-card__category">
                      {subarea.categoria}
                    </span>

                    <h3>
                      {subarea.nombre}
                    </h3>

                  </div>

                  {/* Footer */}
                  <div className="subarea-card__footer">

                    <div className="subarea-card__athletes">
                      <span className="material-symbols-outlined">
                        group
                      </span>

                      <span>
                        Atletas asignados
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

                      <span className="material-symbols-outlined">
                        arrow_forward
                      </span>
                    </button>

                  </div>

                </article>
              ))}

            </div>

          </div>

        </div>
    </main>
  );
};

export default SubAreasTrainer;
