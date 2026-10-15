import React, { useState, useEffect } from 'react';
import UserService from '../../api/services/Userservice';
import { useApplicationPermissions } from '../../context/ApplicationPermissionsContext';
import '../../styles/components/admin/AtletasViewAdmin.css';

const ESTADOS = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'justificado', label: 'Justificado' },
];

const estadoLabel = (value) => ESTADOS.find((estado) => estado.value === value)?.label || 'Activo';

function EstadoBadge({ estado }) {
  const value = estado || 'activo';
  return <span className={`atletas-estado-badge atletas-estado-${value}`}>{estadoLabel(value)}</span>;
}

function EstadoModal({ atleta, onClose, onSaved }) {
  const [estado, setEstado] = useState(atleta.estado || 'activo');
  const [motivo, setMotivo] = useState(atleta.estado === 'justificado' ? atleta.estado_motivo || '' : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const requiereMotivo = estado === 'justificado';

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (requiereMotivo && !motivo.trim()) {
      setError('Indique el motivo de la justificación.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = await UserService.updateAthleteStatus(atleta.user_id, {
        estado,
        estado_motivo: requiereMotivo ? motivo.trim() : '',
      });
      onSaved(data);
    } catch (err) {
      setError(err?.response?.data?.detail || 'No se pudo actualizar el estado.');
      setSaving(false);
    }
  };

  return (
    <div className="atletas-estado-overlay" onClick={onClose}>
      <form
        className="atletas-estado-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="atletas-estado-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h3 id="atletas-estado-title">Estado del atleta</h3>
        <p className="atletas-estado-name">{atleta.name}</p>

        <fieldset className="atletas-estado-options">
          <legend>Seleccione el estado</legend>
          {ESTADOS.map((option) => (
            <label key={option.value} className={estado === option.value ? 'is-selected' : ''}>
              <input
                type="radio"
                name="estado"
                value={option.value}
                checked={estado === option.value}
                onChange={() => setEstado(option.value)}
              />
              {option.label}
            </label>
          ))}
        </fieldset>

        {estado === 'justificado' && (
          <p className="atletas-estado-hint">Un atleta justificado no aparece en el registro de asistencia diaria.</p>
        )}

        {requiereMotivo && (
          <label className="atletas-estado-field">
            <span>Motivo</span>
            <textarea
              rows={3}
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              placeholder="Ej. Lesión, reposo médico, viaje..."
            />
          </label>
        )}

        {error && <p className="atletas-estado-error" role="alert">{error}</p>}

        <div className="atletas-estado-actions">
          <button type="button" className="atletas-estado-cancel" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="atletas-estado-save" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}

const iniciales = (nombre = '') =>
  nombre
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const nombreRepresentantes = (representantes = []) =>
  representantes
    .map(({ nombre, apellido }) => `${nombre} ${apellido}`.trim())
    .filter(Boolean)
    .join(', ');

const telefonoRepresentante = (representantes = []) =>
  representantes.map(({ tlf }) => tlf).filter(Boolean).join(', ');

const nombreEntrenadores = (entrenadores = []) =>
  entrenadores.map(({ nombre }) => nombre).filter(Boolean).join(', ');

function DataPoint({ label, value }) {
  return (
    <div className="atletas-data-point">
      <span className="atletas-data-point-label">
        {label}
      </span>
      <span className="atletas-data-point-value">{value || '—'}</span>
    </div>
  );
}

// Drawer lateral de perfil, inspirado en el patrón gu-sidePanel / ProfileModal
function PerfilDrawer({ atleta, onClose }) {
  const open = Boolean(atleta);

  return (
    <>
      <div
        onClick={onClose}
        className={`atletas-adm-drawer-overlay ${open ? 'atletas-adm-drawer-overlay--abierto' : ''}`}
      />

      <aside className={`atletas-adm-drawer ${open ? 'atletas-adm-drawer--abierto' : ''}`}>
        {atleta && (
          <>
            <div className="atletas-adm-drawer-header">
              <span className="atletas-adm-drawer-kicker">PERFIL DE ATLETA</span>
              <button type="button" className="atletas-adm-drawer-cerrar" onClick={onClose} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <div className="atletas-adm-drawer-body">
              <div className="atletas-adm-drawer-identidad">
                <div className="atletas-adm-drawer-avatar">{iniciales(atleta.name)}</div>
                <div>
                  <h2 className="atletas-adm-drawer-nombre">{atleta.name || '-'}</h2>
                  <p className="atletas-adm-drawer-cedula">C.I. {atleta.cedula || '-'}</p>
                </div>
              </div>

              <p className="atletas-adm-drawer-seccion">Información deportiva</p>
              <div className="atletas-adm-drawer-bloque atletas-adm-drawer-bloque--grid">
                <DataPoint label="Categoría" value={atleta.categoria} />
                <DataPoint label="Área" value={atleta.area} />
                <DataPoint label="Subárea" value={atleta.subarea_nombre_principal} />
                <DataPoint label="Entrenador" value={nombreEntrenadores(atleta.entrenadores) || '—'} />
                <DataPoint label="Subáreas asignadas" value={atleta.subareas_nombres?.length} />
                <DataPoint label="Entrenadores asignados" value={atleta.entrenadores?.length || 0} />
              </div>

              <p className="atletas-adm-drawer-seccion">Contacto del atleta</p>
              <div className="atletas-adm-drawer-bloque">
                <DataPoint label="Correo" value={atleta.email} />
              </div>

              <p className="atletas-adm-drawer-seccion">Familiar responsable</p>
              <div className="atletas-adm-drawer-bloque atletas-adm-drawer-bloque--grid atletas-adm-drawer-bloque--ultimo">
                <DataPoint label="Nombre" value={nombreRepresentantes(atleta.representantes)} />
                <DataPoint label="Teléfono" value={telefonoRepresentante(atleta.representantes)} />
              </div>
            </div>

            <div className="atletas-adm-drawer-footer">
              <button type="button" className="atletas-adm-drawer-btn atletas-adm-drawer-btn--ghost" onClick={onClose}>
                Cerrar
              </button>
              <button
                type="button"
                className="atletas-adm-drawer-btn atletas-adm-drawer-btn--primario"
                onClick={() => alert(`Editar detalle de: ${atleta.name}`)}
              >
                Editar
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

const PAGE_SIZE = 15;

const AtletasViewAdmin = () => {
  const [atletas, setAtletas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputFiltro, setInputFiltro] = useState('');
  const [buscar, setBuscar] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [perfilAbierto, setPerfilAbierto] = useState(null);
  const [estadoAtleta, setEstadoAtleta] = useState(null);
  const { hasPermission } = useApplicationPermissions();
  const puedeEditarEstado = hasPermission('editar_usuarios');

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  const handleEstadoGuardado = ({ user_id, estado, estado_motivo }) => {
    setAtletas((prev) => prev.map((item) => (
      item.user_id === user_id ? { ...item, estado, estado_motivo } : item
    )));
    setEstadoAtleta(null);
  };

  const renderEstadoControl = (item) => (
    <div className="atletas-estado-cell">
      <EstadoBadge estado={item.estado} />
      {puedeEditarEstado && item.user_id && (
        <button type="button" className="atletas-estado-btn" onClick={() => setEstadoAtleta(item)}>
          Cambiar
        </button>
      )}
    </div>
  );

  // Debounce del campo de búsqueda
  useEffect(() => {
    const t = setTimeout(() => {
      setIsLoading(true);
      setBuscar(inputFiltro);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [inputFiltro]);

  useEffect(() => {
    let active = true;
    const params = { page };
    if (buscar) params.buscar = buscar;
    if (categoriaFiltro) params.categoria = categoriaFiltro;
    UserService.getAllAthletes(params)
      .then((resp) => {
        if (!active) return;
        if (resp && typeof resp.count === 'number') {
          setAtletas(resp.results ?? []);
          setTotalCount(resp.count);
        } else {
          setAtletas(Array.isArray(resp) ? resp : []);
          setTotalCount(Array.isArray(resp) ? resp.length : 0);
        }
      })
      .catch(() => {
        if (active) { setAtletas([]); setTotalCount(0); }
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [page, buscar, categoriaFiltro]);

  useEffect(() => {
    let active = true;
    UserService.getAthleteCategories()
      .then((response) => {
        if (active && Array.isArray(response)) setCategorias(response);
      })
      .catch(() => {
        if (active) setCategorias([]);
      });

    return () => { active = false; };
  }, []);

  const handleNuevo = () => alert('Formulario para agregar atleta');
  const handleVerPerfil = (item) => setPerfilAbierto(item);
  const handleCerrarPerfil = () => setPerfilAbierto(null);

  return (
    <div className="atletas-adm">
      {/* FILTRO + ACCIONES */}
      <div className="atletas-adm-filtros">
        <input
          className="atletas-adm-buscar"
          type="search"
          placeholder="Buscar por nombre o cédula..."
          value={inputFiltro}
          onChange={(e) => setInputFiltro(e.target.value)}
        />
        {categorias.length > 0 && (
          <select
            className="atletas-category-select"
            aria-label="Filtrar atletas por categoría"
            value={categoriaFiltro}
            onChange={(event) => { setIsLoading(true); setCategoriaFiltro(event.target.value); setPage(1); }}
          >
            <option value="">Todas las categorías</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.name}>{categoria.name}</option>
            ))}
          </select>
        )}
        <span className="atletas-adm-total">
          {totalCount} atleta{totalCount !== 1 ? 's' : ''} en total
        </span>
        <button type="button" className="atletas-adm-nuevo" onClick={handleNuevo}>
          + Nuevo Atleta
        </button>
      </div>

      {isLoading ? (
        <div className="atletas-adm-estado-lista">Cargando lista de atletas...</div>
      ) : (
        <>
          {/* Tabla en pantallas anchas y tarjetas en angostas (responsive-list de App.css) */}
          <div className="responsive-list">
          <div className="responsive-list__table atletas-adm-tabla-wrap">
            <table className="atletas-adm-tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Área</th>
                  <th>Subárea</th>
                  <th>Entrenador</th>
                  <th>Familiar / Contacto</th>
                  <th>Estado</th>
                  <th className="atletas-adm-centro">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {atletas.map((item, idx) => (
                  <tr key={item.user_id ?? idx}>
                    <td>
                      <div className="atletas-adm-nombre">{item.name || '-'}</div>
                      <div className="atletas-adm-cedula">C.I. {item.cedula || '-'}</div>
                    </td>
                    <td>
                      <span className="atletas-adm-badge">{item.area || '—'}</span>
                    </td>
                    <td>
                      <span className="atletas-adm-badge">{item.subarea_nombre_principal || '—'}</span>
                    </td>
                    <td>{nombreEntrenadores(item.entrenadores) || '—'}</td>
                    <td className="atletas-adm-familiar">
                      <div>{nombreRepresentantes(item.representantes) || '—'}</div>
                      <div className="atletas-adm-texto-chico">{telefonoRepresentante(item.representantes)}</div>
                    </td>
                    <td>{renderEstadoControl(item)}</td>
                    <td className="atletas-adm-centro">
                      <button type="button" className="atletas-adm-ver" onClick={() => handleVerPerfil(item)}>
                        Ver perfil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="responsive-list__cards">
          <div className="atletas-adm-cards">
            {atletas.map((item, idx) => (
              <div key={item.user_id ?? idx} className="atletas-adm-card">
                <div className="atletas-adm-card-head">
                  <div className="atletas-adm-card-identidad">
                    <div className="atletas-adm-avatar">{iniciales(item.name)}</div>
                    <div>
                      <h3 className="atletas-adm-card-nombre">{item.name || '-'}</h3>
                      <p className="atletas-adm-card-cedula">C.I. {item.cedula || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="atletas-adm-card-grid">
                  <div>
                    <p className="atletas-adm-card-label">ÁREA</p>
                    <p className="atletas-adm-card-valor">{item.area || '—'}</p>
                  </div>
                  <div>
                    <p className="atletas-adm-card-label">SUBÁREA</p>
                    <p className="atletas-adm-card-valor">{item.subarea_nombre_principal || '—'}</p>
                  </div>
                  <div>
                    <p className="atletas-adm-card-label">ENTRENADOR</p>
                    <p className="atletas-adm-card-valor">{nombreEntrenadores(item.entrenadores) || '—'}</p>
                  </div>
                  <div>
                    <p className="atletas-adm-card-label atletas-adm-card-label--espaciado">ESTADO</p>
                    {renderEstadoControl(item)}
                  </div>
                </div>

                <div className="atletas-adm-card-footer">
                  <div>
                    <p className="atletas-adm-card-label">FAMILIAR / CONTACTO</p>
                    <p className="atletas-adm-card-familiar">{nombreRepresentantes(item.representantes) || '—'}</p>
                    <p className="atletas-adm-card-telefono">{telefonoRepresentante(item.representantes)}</p>
                  </div>
                  <button type="button" className="atletas-adm-ver atletas-adm-ver--card" onClick={() => handleVerPerfil(item)}>
                    Ver perfil
                  </button>
                </div>
              </div>
            ))}
          </div>
          </div>
          </div>

          {atletas.length === 0 && (
            <div className="atletas-adm-estado-lista">No se encontraron atletas con ese criterio.</div>
          )}

          {/* PAGINACIÓN */}
          {totalPages > 1 && (
            <div className="atletas-paginacion">
              <button
                type="button"
                className="atletas-paginacion-btn"
                onClick={() => { setIsLoading(true); setPage((p) => Math.max(1, p - 1)); }}
                disabled={page <= 1}
              >
                ← Anterior
              </button>
              <span className="atletas-paginacion-info">
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                className="atletas-paginacion-btn"
                onClick={() => { setIsLoading(true); setPage((p) => Math.min(totalPages, p + 1)); }}
                disabled={page >= totalPages}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      <PerfilDrawer atleta={perfilAbierto} onClose={handleCerrarPerfil} />
      {estadoAtleta && (
        <EstadoModal
          atleta={estadoAtleta}
          onClose={() => setEstadoAtleta(null)}
          onSaved={handleEstadoGuardado}
        />
      )}
    </div>
  );
};

export default AtletasViewAdmin;
