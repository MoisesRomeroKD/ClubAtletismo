import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, SlidersHorizontal, X } from 'lucide-react';
import podApi from '../../api/podApi';
import '../../styles/components/admin/RolesPermisos.css';

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

const PERMISSION_DESCRIPTIONS = {
  ver_atletas: 'Permite consultar la nómina de atletas y los perfiles disponibles.',
  editar_usuarios: 'Permite crear o modificar usuarios y perfiles de atletas.',
  ver_asistencia: 'Permite consultar los registros de asistencia disponibles para este usuario.',
  registrar_asistencia: 'Permite registrar nuevas asistencias.',
  editar_asistencia: 'Permite modificar registros de asistencia existentes.',
  ver_descanso: 'Permite consultar los registros de descanso y sueño disponibles para este usuario.',
  registrar_descanso: 'Permite registrar nuevos registros de descanso y sueño.',
  editar_descanso: 'Permite modificar registros de descanso y sueño existentes.',
  ver_evaluaciones: 'Permite consultar las evaluaciones disponibles para este usuario.',
  registrar_evaluaciones: 'Permite registrar nuevas evaluaciones.',
  editar_evaluaciones: 'Permite modificar evaluaciones existentes.',
  ver_reportes: 'Permite consultar los reportes disponibles para este usuario.',
  gestionar_preregistros: 'Permite crear y consultar prerregistros pendientes.',
  gestionar_permisos: 'Permite otorgar o quitar permisos funcionales a otros usuarios desde la sección Roles y Permisos.',
  ver_categorias_deportivas: 'Permite consultar los rangos de categorías deportivas de atletas.',
  gestionar_categorias_deportivas: 'Permite crear, editar y eliminar categorías deportivas de atletas.',
  vaciar_auditoria: 'Permite exportar toda la auditoría (PDF y Excel) y luego borrar los registros exportados.',
};

// Filtros de rol: texto del botón → nombre del rol en el sistema.
const FILTROS_ROL = [
  ['Todos', ''],
  ['Administrador', 'administrador'],
  ['Entrenador', 'entrenador'],
];

const ETIQUETA_ROL = { administrador: 'Administrador', entrenador: 'Entrenador' };
const etiquetaRol = (rol) => ETIQUETA_ROL[String(rol || '').toLowerCase()] || rol || '—';

const getErrorMessage = (error, fallback) =>
  error.response?.data?.detail || error.response?.data?.message || fallback;

/* ---------- Drawer: permisos del usuario elegido ---------- */
function PermisosDrawer({ usuario, catalogo, onClose }) {
  // El dato guardado lleva el id del usuario: si no coincide, todavía se está cargando.
  const [carga, setCarga] = useState({ id: null, permisos: [], error: '' });
  const [seleccion, setSeleccion] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let active = true;
    podApi.get(`/v1/users/${usuario.id}/permisos/`)
      .then((response) => {
        if (!Array.isArray(response.data?.permissions)) {
          throw new Error('El servidor devolvió una estructura de permisos inesperada.');
        }
        if (active) {
          setCarga({ id: usuario.id, permisos: response.data.permissions, error: '' });
          setSeleccion(response.data.permissions);
        }
      })
      .catch((error) => {
        console.error('Error al consultar permisos del usuario:', error);
        if (active) {
          setCarga({ id: usuario.id, permisos: [], error: getErrorMessage(error, 'No se pudieron consultar los permisos del usuario.') });
        }
      });
    return () => { active = false; };
  }, [usuario.id]);

  // Cerrar con la tecla Escape.
  useEffect(() => {
    const alPresionar = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [onClose]);

  const cargando = carga.id !== usuario.id;
  const sinCambios = !cargando
    && seleccion.length === carga.permisos.length
    && seleccion.every((codename) => carga.permisos.includes(codename));

  const togglePermission = (codename) => {
    setSuccessMessage('');
    setSeleccion((current) => (
      current.includes(codename)
        ? current.filter((permission) => permission !== codename)
        : [...current, codename]
    ));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setErrorMessage('');
      setSuccessMessage('');
      await podApi.put(`/v1/users/${usuario.id}/permisos/`, { permissions: seleccion });
      const confirmation = await podApi.get(`/v1/users/${usuario.id}/permisos/`);
      if (!Array.isArray(confirmation.data?.permissions)) {
        throw new Error('No se pudo confirmar el estado guardado.');
      }
      setCarga({ id: usuario.id, permisos: confirmation.data.permissions, error: '' });
      setSeleccion(confirmation.data.permissions);
      setSuccessMessage('Permisos guardados y verificados correctamente.');
    } catch (error) {
      console.error('Error al guardar permisos:', error);
      setErrorMessage(getErrorMessage(error, 'No se pudieron guardar los permisos.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="roles-drawer-fondo" onClick={onClose} aria-hidden="true" />
      <aside className="roles-drawer" role="dialog" aria-modal="true" aria-labelledby="roles-drawer-titulo">
        <header className="roles-drawer-cabecera">
          <div>
            <h3 id="roles-drawer-titulo">{usuario.nombre || usuario.username}</h3>
            <p>{etiquetaRol(usuario.rol)} · Cédula: {usuario.cedula || '—'}</p>
            {usuario.email && <p>{usuario.email}</p>}
          </div>
          <button type="button" className="roles-drawer-cerrar" onClick={onClose} aria-label="Cerrar detalle">
            <X size={20} />
          </button>
        </header>

        <div className="roles-drawer-cuerpo">
          <h4 className="roles-drawer-subtitulo">
            Permisos asignados
            {!cargando && <span>{seleccion.length} de {catalogo.length}</span>}
          </h4>

          {cargando && !carga.error && <div role="status" className="roles-gestion-muted">Consultando permisos...</div>}
          {carga.error && <div role="alert" className="roles-gestion-error">{carga.error}</div>}

          {!cargando && !carga.error && (
            <div className="roles-drawer-permisos">
              {catalogo.map((permission) => {
                const description = PERMISSION_DESCRIPTIONS[permission.codename];
                const activo = seleccion.includes(permission.codename);
                return (
                  <div key={permission.codename} className={`roles-gestion-permiso${activo ? ' roles-gestion-permiso--activo' : ''}`}>
                    <label htmlFor={`permission-${permission.codename}`}>
                      <input
                        id={`permission-${permission.codename}`}
                        type="checkbox"
                        checked={activo}
                        onChange={() => togglePermission(permission.codename)}
                      />
                      <span>
                        <span className="roles-gestion-permiso-nombre">{permission.name}</span>
                        <code>{permission.codename}</code>
                      </span>
                    </label>
                    {description && (
                      <button
                        type="button"
                        className="roles-permisos__permission-help"
                        title={description}
                        aria-label={`Información sobre ${permission.name}: ${description}`}
                        data-tooltip={description}
                      >
                        ⓘ
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <footer className="roles-drawer-pie">
          {errorMessage && <div role="alert" className="roles-gestion-error">{errorMessage}</div>}
          {successMessage && <div role="status" className="roles-gestion-exito">{successMessage}</div>}
          <div className="roles-drawer-botones">
            <button type="button" className="roles-drawer-secundario" onClick={onClose}>Cerrar</button>
            <button
              type="button"
              disabled={isSaving || cargando || Boolean(carga.error) || sinCambios}
              onClick={handleSave}
              className="roles-gestion-guardar"
            >
              {isSaving ? 'Guardando...' : 'Guardar permisos'}
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
}

const RolesPermisos = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [filtroRol, setFiltroRol] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [usuarioDetalle, setUsuarioDetalle] = useState(null);
  // En celular los filtros van detrás del botón "Filtros" (en monitores siempre se ven).
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  useEffect(() => {
    let active = true;

    const loadInitialData = async () => {
      try {
        const [usersResponse, catalogResponse] = await Promise.all([
          podApi.get('/v1/users/personal-permisos/'),
          podApi.get('/v1/users/permisos/catalogo/'),
        ]);
        const users = usersResponse.data?.usuarios;
        const permissions = catalogResponse.data;
        if (!Array.isArray(users) || !Array.isArray(permissions)) {
          throw new Error('El servidor devolvió una estructura de permisos inesperada.');
        }
        if (active) {
          setUsuarios(users);
          setCatalogo(permissions);
          setErrorMessage('');
        }
      } catch (error) {
        console.error('Error al cargar datos de permisos:', error);
        if (active) {
          setErrorMessage(getErrorMessage(error, 'No se pudo cargar la gestión de permisos.'));
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadInitialData();
    return () => {
      active = false;
    };
  }, []);

  // La lista (solo administradores y entrenadores) se filtra aquí mismo por rol y por cédula o nombre.
  const usuariosVisibles = usuarios.filter((user) => {
    if (filtroRol && String(user.rol || '').toLowerCase() !== filtroRol) return false;
    return coincidePersona(busqueda, user.nombre || user.username, user.cedula);
  });

  const botonDetalle = (user) => (
    <button type="button" className="roles-lista-ver" onClick={() => setUsuarioDetalle(user)}>
      <Eye size={16} aria-hidden="true" />Ver detalle
    </button>
  );

  // Filtros: se pintan en la barra (monitores) y en el panel "Filtros" (celular).
  const controlesFiltro1 = (
    <>
            <div className="roles-gestion-filtros">
              {FILTROS_ROL.map(([etiqueta, valor]) => (
                <button
                  key={etiqueta}
                  type="button"
                  onClick={() => setFiltroRol(valor)}
                  aria-pressed={filtroRol === valor}
                  className={`roles-gestion-filtro ${filtroRol === valor ? 'roles-gestion-filtro--activo' : ''}`}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
            <div className="roles-gestion-buscador">
              <input
                type="search"
                placeholder="Buscar por cédula o nombre y apellido"
                aria-label="Buscar por cédula o nombre y apellido"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
              />
            </div>
    </>
  );

  return (
    <div className="roles-gestion">
      <div className="roles-gestion-header">
        <h2 className="roles-gestion-titulo">
          Roles y Permisos
        </h2>
      </div>

      {isLoading ? (
        <div className="roles-gestion-cargando">
          Cargando usuarios y permisos...
        </div>
      ) : (
        <>
          <div className="roles-gestion-controles">
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
                  {controlesFiltro1}
                </div>
                <footer className="filtros-sheet__footer">
                  <button type="button" className="filtros-sheet__btn" onClick={() => setFiltrosAbiertos(false)}>Cerrar</button>
                  <button type="button" className="filtros-sheet__btn filtros-sheet__btn--primario" onClick={() => setFiltrosAbiertos(false)}>Aplicar filtros</button>
                </footer>
              </div>,
              document.body,
            )}
            <div className="filtros-escritorio">{controlesFiltro1}</div>
          </div>

          {errorMessage && <div role="alert" className="roles-gestion-error">{errorMessage}</div>}

          {!errorMessage && (
            <div className="responsive-list">
              <div className="responsive-list__table">
                <table className="roles-lista-tabla">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Cédula</th>
                      <th>Rol</th>
                      <th>Correo</th>
                      <th><span className="roles-lista-oculto">Detalle</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosVisibles.length ? usuariosVisibles.map((user) => (
                      <tr key={user.id}>
                        <td className="roles-lista-nombre">{user.nombre || user.username}</td>
                        <td>{user.cedula || '—'}</td>
                        <td><span className="roles-lista-rol">{etiquetaRol(user.rol)}</span></td>
                        <td className="roles-lista-correo">{user.email || '—'}</td>
                        <td className="roles-lista-accion">{botonDetalle(user)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="roles-lista-vacia">No hay administradores ni entrenadores que coincidan.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="responsive-list__cards">
                {usuariosVisibles.length ? usuariosVisibles.map((user) => (
                  <article key={user.id} className="roles-lista-card">
                    <div>
                      <strong>{user.nombre || user.username}</strong>
                      <span className="roles-lista-rol">{etiquetaRol(user.rol)}</span>
                    </div>
                    <small>Cédula: {user.cedula || '—'}</small>
                    {user.email && <small className="roles-lista-correo">{user.email}</small>}
                    {botonDetalle(user)}
                  </article>
                )) : (
                  <p className="roles-lista-vacia">No hay administradores ni entrenadores que coincidan.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {usuarioDetalle && (
        <PermisosDrawer
          key={usuarioDetalle.id}
          usuario={usuarioDetalle}
          catalogo={catalogo}
          onClose={() => setUsuarioDetalle(null)}
        />
      )}
    </div>
  );
};

export default RolesPermisos;
