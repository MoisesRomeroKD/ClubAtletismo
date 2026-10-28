import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import podApi from '../../api/podApi';
import UserService from '../../api/services/Userservice';
import '../../styles/components/admin/Preregistro.css';
import '../../styles/components/admin/PrerregistrosPendientes.css';

const PrerregistrosPendientes = () => {
  const [pendientes, setPendientes] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [paginacion, setPaginacion] = useState({
    page: 1,
    total_pages: 1,
    count: 0,
    has_previous: false,
    has_next: false,
  });
  const [busqueda, setBusqueda] = useState('');
  const [busquedaDebounced, setBusquedaDebounced] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [filtros, setFiltros] = useState({ rol: '', area: '', subarea: '', desde: '', hasta: '' });
  const [catalogo, setCatalogo] = useState({ areas: [], subareas: [] });
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  // Áreas y subáreas para los filtros.
  useEffect(() => {
    let activo = true;
    Promise.all([UserService.getAreas(), UserService.getSubareas()])
      .then(([areas, subareas]) => {
        if (activo) setCatalogo({ areas: Array.isArray(areas) ? areas : [], subareas: Array.isArray(subareas) ? subareas : [] });
      })
      .catch(() => { if (activo) setCatalogo({ areas: [], subareas: [] }); });
    return () => { activo = false; };
  }, []);

  const cambiarFiltro = (campo, valor) => {
    setFiltros((actual) => ({ ...actual, [campo]: valor, ...(campo === 'area' ? { subarea: '' } : {}) }));
    setPagina(1);
  };

  const areaDeSubarea = (subarea) => String(subarea.area?.id ?? subarea.area_id ?? '');
  const subareasDelArea = filtros.area
    ? catalogo.subareas.filter((subarea) => areaDeSubarea(subarea) === filtros.area)
    : catalogo.subareas;

  useEffect(() => {
    const search = busqueda.trim();
    if (!search) {
      setBusquedaDebounced('');
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setBusquedaDebounced(search);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [busqueda]);

  useEffect(() => {
    let active = true;
    const cargarPendientes = async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');
        const response = await podApi.get('/v1/users/preregistro/pendientes/', {
          params: {
            page: pagina,
            ...(busquedaDebounced && { search: busquedaDebounced }),
            ...Object.fromEntries(Object.entries(filtros).filter(([, valor]) => valor)),
          },
        });
        if (!Array.isArray(response.data?.results)) {
          throw new Error('Respuesta inesperada al consultar prerregistros pendientes.');
        }
        if (active) {
          setPendientes(response.data.results);
          setPaginacion({
            page: response.data.page,
            total_pages: response.data.total_pages,
            count: response.data.count ?? 0,
            has_previous: response.data.has_previous,
            has_next: response.data.has_next,
          });
        }
      } catch (error) {
        console.error('Error al cargar prerregistros pendientes:', error);
        if (active) {
          setErrorMessage(
            error.response?.data?.message ||
            'No se pudieron cargar los prerregistros pendientes.'
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    cargarPendientes();
    return () => {
      active = false;
    };
  }, [pagina, busquedaDebounced, filtros]);

  // Filtros: se pintan en la barra (monitores) y en el panel "Filtros" (celular).
  const controlesFiltro = (
    <>
      <select value={filtros.rol} onChange={(event) => cambiarFiltro('rol', event.target.value)} aria-label="Filtrar por rol">
        <option value="">Todos los roles</option>
        <option value="Atleta">Atleta</option>
        <option value="Entrenador">Entrenador</option>
        <option value="Administrador">Administrador</option>
      </select>
      <select value={filtros.area} onChange={(event) => cambiarFiltro('area', event.target.value)} aria-label="Filtrar por área">
        <option value="">Todas las áreas</option>
        {catalogo.areas.map((area) => <option key={area.id} value={String(area.id)}>{area.nombre}</option>)}
      </select>
      <select value={filtros.subarea} onChange={(event) => cambiarFiltro('subarea', event.target.value)} aria-label="Filtrar por subárea">
        <option value="">Todas las subáreas</option>
        {subareasDelArea.map((subarea) => <option key={subarea.id} value={String(subarea.id)}>{subarea.nombre}</option>)}
      </select>
      <label className="prerregistros-pendientes__fecha">
        <span>Desde</span>
        <input type="date" value={filtros.desde} max={filtros.hasta || undefined} onChange={(event) => cambiarFiltro('desde', event.target.value)} />
      </label>
      <label className="prerregistros-pendientes__fecha">
        <span>Hasta</span>
        <input type="date" value={filtros.hasta} min={filtros.desde || undefined} onChange={(event) => cambiarFiltro('hasta', event.target.value)} />
      </label>
    </>
  );

  const subareasTexto = (atleta) => (
    atleta.subareas?.length
      ? atleta.subareas.map((ficha) => ficha.subarea).join(', ')
      : '—'
  );

  // Paginación siempre visible: 15 por página.
  const renderPaginationControls = (abajo = false) => (
    <div className={`prerregistros-pendientes__pagination${abajo ? ' prerregistros-pendientes__pagination--abajo' : ''}`}>
      <span className="prerregistros-pendientes__total">
        {paginacion.count} pendiente{paginacion.count === 1 ? '' : 's'} · 15 por página
      </span>
      <div className="prerregistros-pendientes__pagination-botones">
        <button
          type="button"
          className="prerregistros-pendientes__page-button"
          disabled={!paginacion.has_previous || isLoading}
          onClick={() => setPagina((current) => Math.max(1, current - 1))}
        >
          <ChevronLeft size={16} aria-hidden="true" />
          Anterior
        </button>
        <span className="prerregistros-pendientes__page-status">
          Página {paginacion.page} de {Math.max(paginacion.total_pages, 1)}
        </span>
        <button
          type="button"
          className="prerregistros-pendientes__page-button"
          disabled={!paginacion.has_next || isLoading}
          onClick={() => setPagina((current) => current + 1)}
        >
          Siguiente
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  const nombreDe = (usuario) => `${usuario.nombres} ${usuario.apellidos}`.trim() || '—';
  const fechaDe = (usuario) => (usuario.fecha ? new Date(usuario.fecha).toLocaleDateString() : '—');
  const mensajeVacio = isLoading
    ? 'Cargando prerregistros pendientes...'
    : errorMessage || 'No hay prerregistros pendientes.';

  return (
    <section className="preregistro-card">

      <div className="prerregistros-pendientes__cabecera">
        <h2>Prerregistros Pendientes</h2>
        <div className="prerregistros-pendientes__search">
          <Search className="prerregistros-pendientes__search-icon" size={20} aria-hidden="true" />
          <input
            type="search"
            className="prerregistros-pendientes__search-input"
            value={busqueda}
            onChange={(event) => {
              setBusqueda(event.target.value);
              setPagina(1);
            }}
            placeholder="Buscar por cédula o nombre y apellido..."
            aria-label="Buscar prerregistros por cédula o nombre y apellido"
          />
        </div>
      </div>

      <div className="prerregistros-pendientes__filtros">
        <button type="button" className="filtros-fab" onClick={() => setFiltrosAbiertos(true)}>
          <SlidersHorizontal size={18} aria-hidden="true" />Filtros
        </button>
        {filtrosAbiertos && createPortal(
          <div className="filtros-sheet" role="dialog" aria-modal="true" aria-label="Filtros">
            <header className="filtros-sheet__header">
              <h2>Filtros</h2>
              <button type="button" className="filtros-sheet__cerrar" onClick={() => setFiltrosAbiertos(false)} aria-label="Cerrar filtros">
                <X size={18} />
              </button>
            </header>
            <div className="filtros-sheet__body">
              {controlesFiltro}
            </div>
            <footer className="filtros-sheet__footer">
              <button type="button" className="filtros-sheet__btn" onClick={() => setFiltrosAbiertos(false)}>Cerrar</button>
              <button type="button" className="filtros-sheet__btn filtros-sheet__btn--primario" onClick={() => setFiltrosAbiertos(false)}>Aplicar filtros</button>
            </footer>
          </div>,
          document.body,
        )}
        <div className="filtros-escritorio">{controlesFiltro}</div>
      </div>

      {renderPaginationControls()}

      {isLoading || errorMessage || pendientes.length === 0 ? (
        <p className="prerregistros-pendientes__vacio" role={errorMessage ? 'alert' : 'status'}>{mensajeVacio}</p>
      ) : (
        /* Tabla en pantallas anchas y tarjetas en celular: patrón global .responsive-list (App.css) */
        <div className="responsive-list">
          <div className="responsive-list__table">
            <table className="preregistro-table">
              <thead>
                <tr>
                  <th>Ref.</th>
                  <th>Cédula</th>
                  <th>Nombre completo</th>
                  <th>Rol asignado</th>
                  <th>Subárea</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.map((usuario) => (
                  <tr key={usuario.id}>
                    <td className="ref-usuario">{usuario.id}</td>
                    <td>{usuario.cedula}</td>
                    <td className="preregistro-name">{nombreDe(usuario)}</td>
                    <td><span className="preregistro-role">{usuario.rol || '—'}</span></td>
                    <td>{subareasTexto(usuario)}</td>
                    <td className="preregistro-date">{fechaDe(usuario)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="responsive-list__cards prerregistros-pendientes__cards">
            {pendientes.map((usuario) => (
              <li key={usuario.id} className="prerregistros-pendientes__card">
                <div className="prerregistros-pendientes__card-cabecera">
                  <strong>{nombreDe(usuario)}</strong>
                  <span className="preregistro-role">{usuario.rol || '—'}</span>
                </div>
                <span>Cédula {usuario.cedula} · <span className="ref-usuario">Ref. {usuario.id}</span></span>
                <span>Subárea: {subareasTexto(usuario)}</span>
                <span>Prerregistro: {fechaDe(usuario)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pendientes.length > 0 && renderPaginationControls(true)}
    </section>
  );
};

export default PrerregistrosPendientes;