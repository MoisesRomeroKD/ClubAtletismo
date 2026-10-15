import React, { useEffect, useState } from 'react';
import podApi from '../../api/podApi';
import '../../styles/components/admin/RolesPermisos.css';

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
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.detail || error.response?.data?.message || fallback;

const RolesPermisos = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosManuales, setUsuariosManuales] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let active = true;

    const loadInitialData = async () => {
      try {
        setIsLoading(true);
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
          setUsuariosManuales(users.filter((user) => (
            ['administrador', 'entrenador'].includes(
              String(user.rol || '').toLowerCase()
            )
          )));
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

  useEffect(() => {
    const search = busqueda.trim();
    if (search.length < 5) {
      setUsuarios([]);
      setIsSearching(false);
      return undefined;
    }

    let active = true;
    setUsuarios([]);
    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await podApi.get('/v1/users/personal-permisos/', {
          params: {
            search,
            ...(filtroRol !== 'Todos' && {
              role: filtroRol.toLowerCase(),
            }),
          },
        });
        const users = response.data?.usuarios;
        if (!Array.isArray(users)) {
          throw new Error('El servidor devolvió una estructura de usuarios inesperada.');
        }
        if (active) {
          setUsuarios(users);
          setErrorMessage('');
        }
      } catch (error) {
        console.error('Error al buscar usuarios administrables:', error);
        if (active) {
          setUsuarios([]);
          setErrorMessage(getErrorMessage(error, 'No se pudieron buscar usuarios.'));
        }
      } finally {
        if (active) setIsSearching(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [busqueda, filtroRol]);

  useEffect(() => {
    if (!selectedUserId) {
      setSelectedPermissions([]);
      setIsLoadingPermissions(false);
      return undefined;
    }

    let active = true;
    const loadUserPermissions = async () => {
      try {
        setIsLoadingPermissions(true);
        setSuccessMessage('');
        const response = await podApi.get(`/v1/users/${selectedUserId}/permisos/`);
        if (!Array.isArray(response.data?.permissions)) {
          throw new Error('El servidor devolvió una estructura de permisos inesperada.');
        }
        if (active) {
          setSelectedPermissions(response.data.permissions);
          setErrorMessage('');
        }
      } catch (error) {
        console.error('Error al consultar permisos del usuario:', error);
        if (active) {
          setSelectedPermissions([]);
          setErrorMessage(getErrorMessage(error, 'No se pudieron consultar los permisos del usuario.'));
        }
      } finally {
        if (active) setIsLoadingPermissions(false);
      }
    };

    loadUserPermissions();
    return () => {
      active = false;
    };
  }, [selectedUserId]);

  const togglePermission = (codename) => {
    setSelectedPermissions((current) => (
      current.includes(codename)
        ? current.filter((permission) => permission !== codename)
        : [...current, codename]
    ));
  };

  const handleSave = async () => {
    if (!selectedUserId) return;

    try {
      setIsSaving(true);
      setErrorMessage('');
      setSuccessMessage('');
      await podApi.put(`/v1/users/${selectedUserId}/permisos/`, {
        permissions: selectedPermissions,
      });
      const confirmation = await podApi.get(`/v1/users/${selectedUserId}/permisos/`);
      if (!Array.isArray(confirmation.data?.permissions)) {
        throw new Error('No se pudo confirmar el estado guardado.');
      }
      setSelectedPermissions(confirmation.data.permissions);
      setSuccessMessage('Permisos guardados y verificados correctamente.');
    } catch (error) {
      console.error('Error al guardar permisos:', error);
      setErrorMessage(getErrorMessage(error, 'No se pudieron guardar los permisos.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="roles-gestion">
      <div className="roles-gestion-header">
        <h2 className="roles-gestion-titulo">
          Roles y Permisos
        </h2>
        <p className="roles-gestion-subtitulo">
          Administra permisos individuales. El rol y los datos de identidad no se modifican aquí.
        </p>
      </div>

      {isLoading ? (
        <div className="roles-gestion-cargando">
          Cargando usuarios y permisos...
        </div>
      ) : (
        <>
          <div className="roles-gestion-controles">
            <div className="roles-gestion-filtros">
              {['Todos', 'administrador', 'Entrenador'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setFiltroRol(role)}
                  className={`roles-gestion-filtro ${filtroRol === role ? 'roles-gestion-filtro--activo' : ''}`}
                >
                  {role === 'Todos' ? role : role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
            <div className="roles-gestion-buscador">
              <input
                type="search"
                placeholder="Buscar por cédula o nombre y apellido (mín. 5 caracteres)"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
              />
              {busqueda.trim().length >= 5 && (
                <div
                  role="listbox"
                  aria-label="Resultados de búsqueda"
                  className="roles-gestion-resultados"
                >
                  {isSearching ? (
                    <div className="roles-gestion-resultados-msg">
                      Buscando...
                    </div>
                  ) : usuarios.length ? (
                    usuarios.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        role="option"
                        aria-selected={false}
                        onClick={() => {
                          setSelectedUser(user);
                          setSelectedUserId(String(user.id));
                          setBusqueda('');
                          setUsuarios([]);
                          setErrorMessage('');
                        }}
                        className="roles-gestion-resultado"
                      >
                        <strong>{user.nombre}</strong>
                        <span>
                          {user.rol} · Cédula: {user.cedula}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="roles-gestion-resultados-msg">
                      No se encontraron usuarios.
                    </div>
                  )}
                </div>
              )}
            </div>
            <select
              aria-label="Seleccionar usuario manualmente"
              value={selectedUserId}
              onChange={(event) => {
                const user = usuariosManuales.find(
                  (item) => String(item.id) === event.target.value
                );
                setSelectedUser(user || null);
                setSelectedUserId(event.target.value);
                setBusqueda('');
                setUsuarios([]);
                setErrorMessage('');
              }}
              className="roles-gestion-select"
            >
              <option value="">Seleccionar usuario manualmente</option>
              {usuariosManuales.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nombre} — {user.rol}
                </option>
              ))}
            </select>
          </div>

          {errorMessage && <div role="alert" className="roles-gestion-error">{errorMessage}</div>}
          {successMessage && <div role="status" className="roles-gestion-exito">{successMessage}</div>}

          {selectedUser && (
            <section className="roles-gestion-usuario">
              <div>
                <strong>{selectedUser.nombre}</strong>
                <span className="roles-gestion-usuario-rol">
                  Rol: {selectedUser.rol}
                </span>
              </div>

              {isLoadingPermissions ? (
                <div role="status" className="roles-gestion-muted">Consultando permisos...</div>
              ) : (
                <div className="roles-gestion-permisos">
                  {catalogo.map((permission) => {
                    const description = PERMISSION_DESCRIPTIONS[permission.codename];
                    return (
                      <div
                        key={permission.codename}
                        className="roles-gestion-permiso"
                      >
                        <label
                          htmlFor={`permission-${permission.codename}`}
                        >
                          <input
                            id={`permission-${permission.codename}`}
                            type="checkbox"
                            checked={selectedPermissions.includes(permission.codename)}
                            onChange={() => togglePermission(permission.codename)}
                          />
                          <span>
                            <span className="roles-gestion-permiso-nombre">{permission.name}</span>
                            <code>{permission.codename}</code>
                          </span>
                        </label>
                        <button
                          type="button"
                          className="roles-permisos__permission-help"
                          title={description}
                          aria-label={`Información sobre ${permission.name}: ${description}`}
                          data-tooltip={description}
                        >
                          ⓘ
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="roles-gestion-acciones">
                <button
                  type="button"
                  disabled={isSaving || isLoadingPermissions}
                  onClick={handleSave}
                  className="roles-gestion-guardar"
                >
                  {isSaving ? 'Guardando...' : 'Guardar permisos'}
                </button>
              </div>
            </section>
          )}

        </>
      )}
    </div>
  );
};

export default RolesPermisos;
