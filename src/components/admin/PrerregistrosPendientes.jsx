import { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import podApi from '../../api/podApi';
import '../../styles/components/admin/Preregistro.css';
import '../../styles/components/admin/PrerregistrosPendientes.css';

const PrerregistrosPendientes = () => {
  const [pendientes, setPendientes] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [paginacion, setPaginacion] = useState({
    page: 1,
    total_pages: 1,
    has_previous: false,
    has_next: false,
  });
  const [busqueda, setBusqueda] = useState('');
  const [busquedaDebounced, setBusquedaDebounced] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

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
  }, [pagina, busquedaDebounced]);

  const renderPaginationControls = () => (
    paginacion.total_pages > 1 && (
      <div className="prerregistros-pendientes__pagination">
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
          Página {paginacion.page} de {paginacion.total_pages}
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
    )
  );

  const renderPendingRows = () => {
    if (isLoading || errorMessage || pendientes.length === 0) {
      const message = isLoading
        ? 'Cargando prerregistros pendientes...'
        : errorMessage || 'No hay prerregistros pendientes.';

      return (
        <tr>
          <td colSpan="5" className="preregistro-empty">
            {message}
          </td>
        </tr>
      );
    }

    return pendientes.map((atleta) => (
      <tr key={atleta.id}>
        <td data-label="Identificación">{atleta.cedula}</td>
        <td className="preregistro-name" data-label="Nombre Completo">
          {`${atleta.nombres} ${atleta.apellidos}`.trim()}
        </td>
        <td data-label="Rol Solicitado"><span className="preregistro-role">Atleta</span></td>
        <td className="preregistro-date" data-label="Fecha">
          {atleta.fecha ? new Date(atleta.fecha).toLocaleDateString() : '—'}
        </td>
        <td className="preregistro-action" data-label="Acción">—</td>
      </tr>
    ));
  };

  return (
    <section className="preregistro-card">

      <div className="preregistro-card-header">
        <h2>Prerregistros Pendientes</h2>

        <p>
          Usuarios registrados pendientes de revisión.
        </p>
      </div>

      <div className="preregistro-table-wrapper">
        <div className="prerregistros-pendientes__search">
          <Search
            className="prerregistros-pendientes__search-icon"
            size={20}
            aria-hidden="true"
          />
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
        {renderPaginationControls()}

        <table className="preregistro-table">

          <thead>
            <tr>
              <th>Identificación</th>
              <th>Nombre Completo</th>
              <th>Rol Solicitado</th>
              <th>Fecha</th>
              <th>Acción</th>
            </tr>
          </thead>

          <tbody>{renderPendingRows()}</tbody>
        </table>
        {renderPaginationControls()}
        <div className="preregistro-cards-wrap">
          <table className="preregistro-table">
            <thead>
              <tr>
                <th>Identificación</th>
                <th>Nombre Completo</th>
                <th>Rol Solicitado</th>
                <th>Fecha</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>{renderPendingRows()}</tbody>
          </table>
        </div>

      </div>

    </section>
  );
};

export default PrerregistrosPendientes;