import React, { useEffect, useState } from 'react';
import '../../../styles/components/trainer/AtletasTrainer.css';
import UserService from '../../../api/services/Userservice';

const AtletasTrainer = () => {
  const [atletas, setAtletas] = useState([]);
  const [atletaSeleccionado, setAtletaSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let componenteActivo = true;

    const cargarAtletas = async () => {
      try {
        const respuesta = await UserService.getMyAthletes();
        const atletasApi = Array.isArray(respuesta) ? respuesta : [];
        const atletasNormalizados = atletasApi.map((atleta) => {
          const subareas = Array.isArray(atleta.subareas_nombres)
            ? atleta.subareas_nombres
            : (atleta.subareas_lista_texto || '').split(',').map((item) => item.trim()).filter(Boolean);

          return {
            ...atleta,
            id: atleta.user_id,
            nombres: atleta.nombres || atleta.name || '',
            apellidos: atleta.apellidos || '',
            email: atleta.email || '',
            fechaNacimiento: atleta.fecha_nacimiento || '-',
            edad: atleta.edad ?? '-',
            sexo: atleta.sexo || '',
            categoria: atleta.categoria || '-',
            subarea: atleta.subarea_nombre_principal || subareas.join(', '),
            especialidad: subareas.join(', '),
            representantes: Array.isArray(atleta.representantes)
              ? atleta.representantes
              : [],
          };
        });

        if (componenteActivo) {
          setAtletas(atletasNormalizados);
          setError('');
        }
      } catch (requestError) {
        if (componenteActivo) {
          setError(requestError.response?.data?.detail || 'No fue posible cargar los atletas asignados.');
        }
      } finally {
        if (componenteActivo) setCargando(false);
      }
    };

    cargarAtletas();

    return () => {
      componenteActivo = false;
    };
  }, []);

  const atletasFiltrados = atletas.filter((atleta) => {
    const texto = busqueda.toLowerCase();

    return (
      atleta.nombres.toLowerCase().includes(texto) ||
      atleta.apellidos.toLowerCase().includes(texto) ||
      atleta.cedula.includes(texto) ||
      atleta.subarea.toLowerCase().includes(texto) ||
      atleta.categoria.toLowerCase().includes(texto)
    );
  });

  const seleccionarAtleta = (atleta) => {
    setAtletaSeleccionado(atleta);
  };

  return (
    <div className="mis-atletas-container">
      <div className="coach-content-inner">

            {/* Header */}
            <div className="athletes-header">

              <div>
                <h3>Mis Atletas</h3>

                <p>
                  Gestiona y revisa el perfil de tus atletas asignados.
                </p>
              </div>

              <div className="mis-atletas-search">
                <span className="material-symbols-outlined">search</span>
                <input
                  type="text"
                  placeholder="Buscar atleta..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>

            </div>

            {/* =========================================
                TABLA: visible SOLO en pc/laptop (>=870px)
            ========================================= */}
            <div className="athletes-table-wrap">
              <div className="athletes-table-card">

                <div className="athletes-table-wrapper">

                  <table className="athletes-table">

                    <thead>
                      <tr>
                        <th>Cédula</th>
                        <th>Nombres</th>
                        <th>Apellidos</th>
                        <th>Categoría</th>
                        <th>Subárea</th>
                        <th className="table-action-header">
                          Acción
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {cargando ? (
                        <tr>
                          <td colSpan="6" className="empty-athletes">
                            <p>Cargando atletas...</p>
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan="6" className="empty-athletes">
                            <p>{error}</p>
                          </td>
                        </tr>
                      ) : atletasFiltrados.length > 0 ? (
                        atletasFiltrados.map((atleta) => (
                          <tr
                            key={atleta.id}
                            className={
                              atletaSeleccionado?.id === atleta.id
                                ? 'athlete-row athlete-row-selected'
                                : 'athlete-row'
                            }
                          >

                            <td>{atleta.cedula}</td>

                            <td className="athlete-name">
                              {atleta.nombres}
                            </td>

                            <td>{atleta.apellidos}</td>

                            <td>{atleta.categoria}</td>

                            <td>
                              <span
                                className={`subarea-badge ${
                                  atleta.subarea.toLowerCase().includes('salto')
                                    ? 'subarea-jump'
                                    : 'subarea-speed'
                                }`}
                              >
                                {atleta.subarea}
                              </span>
                            </td>

                            <td className="table-action">

                              <button
                                type="button"
                                className="view-athlete-button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  seleccionarAtleta(atleta);
                                }}
                              >
                                Ver
                              </button>

                            </td>

                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className="empty-athletes"
                          >
                            <span className="material-symbols-outlined">
                              search_off
                            </span>

                            <p>
                              No se encontraron atletas.
                            </p>
                          </td>
                        </tr>
                      )}

                    </tbody>

                  </table>

                </div>

                {/* Pagination */}
                <div className="athletes-pagination">

                  <span>
                    Mostrando {atletasFiltrados.length ? 1 : 0} a {atletasFiltrados.length} de {atletas.length} atletas
                  </span>

                  <div className="pagination-buttons">

                    <button
                      type="button"
                      disabled
                      aria-label="Página anterior"
                    >
                      <span className="material-symbols-outlined">
                        chevron_left
                      </span>
                    </button>

                    <button
                      type="button"
                      aria-label="Página siguiente"
                    >
                      <span className="material-symbols-outlined">
                        chevron_right
                      </span>
                    </button>

                  </div>

                </div>

              </div>
            </div>

            {/* =========================================
                CARDS: visibles SOLO en móvil (<870px)
            ========================================= */}
            <div className="athletes-cards-wrap">

              {cargando ? (
                <div className="empty-athletes">
                  <p>Cargando atletas...</p>
                </div>
              ) : error ? (
                <div className="empty-athletes">
                  <p>{error}</p>
                </div>
              ) : atletasFiltrados.length > 0 ? (
                atletasFiltrados.map((atleta) => (
                  <div
                    key={atleta.id}
                    className={
                      atletaSeleccionado?.id === atleta.id
                        ? 'athlete-card athlete-card-selected'
                        : 'athlete-card'
                    }
                  >
                    <div className="athlete-card-header">
                      <div>
                        <p className="athlete-card-name">
                          {atleta.nombres} {atleta.apellidos}
                        </p>
                        <p className="athlete-card-id">
                          C.I. {atleta.cedula}
                        </p>
                      </div>

                    </div>

                    <div className="athlete-card-body">
                      <div>
                        <span className="athlete-card-label">Categoría</span>
                        <strong>{atleta.categoria}</strong>
                      </div>
                    </div>

                    <div className="athlete-card-footer">
                      <span
                        className={`subarea-badge ${
                          atleta.subarea.toLowerCase().includes('salto')
                            ? 'subarea-jump'
                            : 'subarea-speed'
                        }`}
                      >
                        {atleta.subarea}
                      </span>

                      <button
                        type="button"
                        className="view-athlete-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          seleccionarAtleta(atleta);
                        }}
                      >
                        Ver
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-athletes">
                  <span className="material-symbols-outlined">search_off</span>
                  <p>No se encontraron atletas.</p>
                </div>
              )}

              {/* Pagination (misma info que en la tabla) */}
              {!cargando && !error && atletasFiltrados.length > 0 && (
                <div className="athletes-pagination athletes-pagination-mobile">
                  <span>
                    Mostrando {atletasFiltrados.length ? 1 : 0} a {atletasFiltrados.length} de {atletas.length} atletas
                  </span>

                  <div className="pagination-buttons">
                    <button type="button" disabled aria-label="Página anterior">
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>

                    <button type="button" aria-label="Página siguiente">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>

        {/* =========================================
            PANEL DETALLE
        ========================================= */}
        {atletaSeleccionado && (
          <aside className="athlete-drawer">

            {/* Drawer Header */}
            <div className="drawer-header">

              <button
                type="button"
                className="drawer-close"
                onClick={() => setAtletaSeleccionado(null)}
                aria-label="Cerrar detalle"
              >
                <span className="material-symbols-outlined">
                  close
                </span>
              </button>

              <div className="athlete-profile">

                <div className="athlete-photo-wrapper">
                  <div
                    className="athlete-photo"
                    aria-label={`Sin foto de ${atletaSeleccionado.nombres} ${atletaSeleccionado.apellidos}`}
                  >
                    <span className="material-symbols-outlined">person</span>
                  </div>

                </div>

                <h3>
                  {atletaSeleccionado.nombres}{' '}
                  {atletaSeleccionado.apellidos}
                </h3>

                <p>
                  {atletaSeleccionado.cedula}
                </p>

              </div>

            </div>

            {/* Drawer Body */}
            <div className="drawer-body">

              {/* Datos deportivos */}
              <section className="drawer-section">

                <h4>
                  Datos Deportivos
                </h4>

                <div className="sports-data-grid">

                  <div>
                    <span>Categoría</span>
                    <strong>
                      {atletaSeleccionado.categoria}
                    </strong>
                  </div>

                  <div>
                    <span>Subárea</span>

                    <span className="drawer-subarea">
                      {atletaSeleccionado.subarea}
                    </span>
                  </div>

                  <div>
                    <span>Especialidad</span>
                    <strong>
                      {atletaSeleccionado.especialidad}
                    </strong>
                  </div>

                </div>

              </section>

              {/* Datos personales */}
              <section className="drawer-section">

                <h4>
                  Datos Personales
                </h4>

                <div className="personal-data">

                  <div>
                    <span>Nombres</span>
                    <strong>{atletaSeleccionado.nombres}</strong>
                  </div>

                  <div>
                    <span>Apellidos</span>
                    <strong>{atletaSeleccionado.apellidos}</strong>
                  </div>

                  <div>
                    <span>Cédula</span>
                    <strong>{atletaSeleccionado.cedula}</strong>
                  </div>

                  <div>
                    <span>Fecha de nacimiento</span>
                    <strong>{atletaSeleccionado.fechaNacimiento}</strong>
                  </div>

                  <div>
                    <span>Edad</span>
                    <strong>{atletaSeleccionado.edad} años</strong>
                  </div>

                  <div>
                    <span>Sexo</span>
                    <strong>
                      {atletaSeleccionado.sexo === 'M'
                        ? 'Masculino'
                        : atletaSeleccionado.sexo === 'F'
                          ? 'Femenino'
                          : 'No disponible'}
                    </strong>
                  </div>

                  <div>
                    <span>Categoría</span>
                    <strong>{atletaSeleccionado.categoria}</strong>
                  </div>

                  <div>
                    <span>Subáreas</span>
                    <strong>{atletaSeleccionado.especialidad || 'No disponibles'}</strong>
                  </div>

                  <div>
                    <span>Correo Electrónico</span>
                    <strong>
                      {atletaSeleccionado.email || 'No disponible'}
                    </strong>
                  </div>

                </div>

              </section>

              <section className="drawer-section">

                <h4>
                  Datos del representante
                </h4>

                <div className="personal-data">
                  {atletaSeleccionado.representantes.length > 0 ? (
                    atletaSeleccionado.representantes.map((representante, index) => (
                      <div key={`${representante.nombre}-${representante.apellido}-${index}`}>
                        <span>
                          {representante.nombre} {representante.apellido}
                        </span>
                        <strong>
                          {representante.tlf} · {representante.tipo_relacion}
                        </strong>
                      </div>
                    ))
                  ) : (
                    <div>
                      <span>Estado</span>
                      <strong>Sin representante registrado</strong>
                    </div>
                  )}
                </div>

              </section>

            </div>

          </aside>
        )}
    </div>
  );
};

export default AtletasTrainer;