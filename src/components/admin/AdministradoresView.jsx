import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, SlidersHorizontal, X } from 'lucide-react';
import podApi from '../../api/podApi';
import { useApplicationPermissions } from '../../context/ApplicationPermissionsContext';
import '../../styles/components/admin/AdministradoresView.css';

const PAGE_SIZE = 15;

// Reglas de formato (las mismas que valida el backend).
const SOLO_LETRAS = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]/g;
const NOMBRE_COMPLETO = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{2,60}$/;
// Cédula: de 1.000.000 a 49.999.999.
const CEDULA_COMPLETA = /^(?:[1-9]\d{6}|[1-4]\d{7})$/;
const GMAIL = /^[a-z0-9](?:\.?[a-z0-9])*@gmail\.com$/;

const etiquetaRol = (rol) => (String(rol || '').toLowerCase() === 'administrador' ? 'Administrador' : rol || 'Administrador');

// Inactivo = cuenta desactivada; Pendiente = prerregistrado que no ha creado su contraseña;
// Activo = está en el plantel y puede entrar.
const estadoDe = (admin) => {
  if (!admin.is_active) return <span className="administradores-activo administradores-activo--no">● Inactivo</span>;
  if (admin.registro_pendiente) return <span className="administradores-activo administradores-activo--pendiente">● Pendiente</span>;
  return <span className="administradores-activo">● Activo</span>;
};

const fechaHora = (valor) => (valor ? new Date(valor).toLocaleString('es-VE', { dateStyle: 'medium', timeStyle: 'short' }) : 'Nunca');

function DatoFijo({ etiqueta, children }) {
  return (
    <div className="admins-drawer-dato">
      <span>{etiqueta}</span>
      <strong>{children || '—'}</strong>
    </div>
  );
}

/* ---------- Formulario de edición (dentro del drawer) ---------- */
function EditarAdministradorForm({ admin, onCancel, onGuardado }) {
  // Un administrador sin perfil (sin cédula) se completa aquí: se crea con la cédula que se escriba.
  const sinPerfil = !admin.cedula;
  const cedulaActual = admin.cedula || '';
  const [form, setForm] = useState({
    nombres: admin.cedula ? admin.name || '' : '',
    apellidos: admin.lastname || '',
    cedula: cedulaActual,
    correo: admin.email || '',
    cargo: admin.cargo || '',
    is_active: Boolean(admin.is_active),
  });
  const [rechazos, setRechazos] = useState({});
  const [erroresServidor, setErroresServidor] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Cada campo descarta lo que no le corresponde mientras se escribe.
  const cambiar = (campo, valor) => {
    let limpio = valor;
    let rechazo = '';
    if (campo === 'nombres' || campo === 'apellidos') {
      limpio = valor.replace(SOLO_LETRAS, '').replace(/ {2,}/g, ' ').slice(0, 60);
      if (limpio !== valor) rechazo = 'Aquí solo se escriben letras y espacios.';
    } else if (campo === 'cedula') {
      limpio = valor.replace(/\D/g, '').slice(0, 8);
      if (limpio !== valor) rechazo = 'Aquí solo se escriben números.';
    } else if (campo === 'correo') {
      limpio = valor.replace(/\s/g, '').toLowerCase();
      if (limpio !== valor.toLowerCase()) rechazo = 'Aquí no se escriben espacios.';
    } else if (campo === 'cargo') {
      // Texto libre (ej. Secretaria, Asistente administrativo): hasta 60 caracteres.
      limpio = valor.replace(/ {2,}/g, ' ').slice(0, 60);
    }
    setRechazos((previos) => ({ ...previos, [campo]: rechazo }));
    setErroresServidor((previos) => ({ ...previos, [campo]: '' }));
    setMensaje('');
    setForm((previo) => ({ ...previo, [campo]: limpio }));
  };

  // Aviso de formato de cada campo ('' si está bien).
  const errorFormato = {
    nombres: NOMBRE_COMPLETO.test(form.nombres.trim()) ? '' : 'Escribe al menos 2 letras.',
    apellidos: NOMBRE_COMPLETO.test(form.apellidos.trim()) ? '' : 'Escribe al menos 2 letras.',
    // Si no se cambió, no se revisa: así se pueden guardar otros datos aunque la cédula guardada tenga otro formato.
    cedula: (!sinPerfil && form.cedula === cedulaActual) || CEDULA_COMPLETA.test(form.cedula)
      ? '' : 'La cédula debe ser un número entre 1.000.000 y 49.999.999 (ej. 12345678).',
    correo: form.correo === (admin.email || '').toLowerCase() || GMAIL.test(form.correo)
      ? '' : 'Solo se aceptan correos de Gmail (ej. nombre@gmail.com).',
  };
  const aviso = (campo) => rechazos[campo] || erroresServidor[campo] || errorFormato[campo] || '';
  const hayErrores = ['nombres', 'apellidos', 'cedula', 'correo'].some((campo) => errorFormato[campo]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (hayErrores) return;
    try {
      setIsSaving(true);
      setMensaje('');
      const response = await podApi.patch(`/v1/users/administradores/${admin.id}/`, {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        correo: form.correo,
        cargo: form.cargo.trim(),
        is_active: form.is_active,
        cedula: form.cedula,
      });
      onGuardado(response.data);
    } catch (error) {
      console.error('Error al editar administrador:', error);
      setErroresServidor(error.response?.data?.errores || {});
      setMensaje(error.response?.data?.detail || 'No se pudieron guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  const campo = (nombre, etiqueta, props = {}) => {
    const texto = aviso(nombre);
    return (
      <div className="admins-drawer-campo">
        <label htmlFor={`admin-${nombre}`}>{etiqueta}</label>
        <input
          id={`admin-${nombre}`}
          value={form[nombre]}
          onChange={(event) => cambiar(nombre, event.target.value)}
          className={texto ? 'admins-input--error' : undefined}
          aria-invalid={texto ? true : undefined}
          aria-describedby={texto ? `aviso-admin-${nombre}` : undefined}
          {...props}
        />
        {texto && <small id={`aviso-admin-${nombre}`} className="admins-aviso" role="alert">{texto}</small>}
      </div>
    );
  };

  return (
    <form className="admins-drawer-form" onSubmit={handleSubmit} noValidate>
      <div className="admins-drawer-cuerpo">
        {campo('nombres', 'Nombres', { type: 'text', maxLength: 60, required: true })}
        {campo('apellidos', 'Apellidos', { type: 'text', maxLength: 60, required: true })}
        {campo('cedula', 'Cédula', { type: 'text', inputMode: 'numeric', required: true, placeholder: 'Ej. 12345678' })}
        {sinPerfil && (
          <p className="admins-drawer-nota">Este administrador no tiene perfil: se crea con esta cédula.</p>
        )}
        {campo('correo', 'Correo electrónico', { type: 'email', required: true, placeholder: 'nombre@gmail.com' })}
        {campo('cargo', 'Cargo', { type: 'text', maxLength: 60, placeholder: 'Ej. Secretaria, Asistente administrativo' })}

        <div className="admins-drawer-campo">
          <span className="admins-drawer-etiqueta">Rol</span>
          <p className="admins-drawer-fijo">{etiquetaRol(admin.rol)} <small>(no se puede cambiar)</small></p>
        </div>

        <label className="admins-drawer-estado" htmlFor="admin-is_active">
          <input
            id="admin-is_active"
            type="checkbox"
            checked={form.is_active}
            onChange={(event) => { setMensaje(''); setForm((previo) => ({ ...previo, is_active: event.target.checked })); }}
          />
          <span>
            <strong>Cuenta activa</strong>
            <small>Si se desactiva, el administrador no podrá iniciar sesión.</small>
          </span>
        </label>
        {erroresServidor.is_active && <small className="admins-aviso" role="alert">{erroresServidor.is_active}</small>}
      </div>

      <footer className="admins-drawer-pie">
        {mensaje && <div role="alert" className="admins-drawer-error">{mensaje}</div>}
        <div className="admins-drawer-botones">
          <button type="button" className="admins-drawer-secundario" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="admins-drawer-guardar" disabled={isSaving || hayErrores}>
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </footer>
    </form>
  );
}

/* ---------- Drawer: detalle del administrador (y su edición) ---------- */
function AdministradorDrawer({ admin, puedeEditar, onClose, onGuardado }) {
  const [editando, setEditando] = useState(false);

  // Cerrar con la tecla Escape.
  useEffect(() => {
    const alPresionar = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [onClose]);

  return (
    <>
      <div className="admins-drawer-fondo" onClick={onClose} aria-hidden="true" />
      <aside className="admins-drawer" role="dialog" aria-modal="true" aria-labelledby="admins-drawer-titulo">
        <header className="admins-drawer-cabecera">
          <div>
            <h3 id="admins-drawer-titulo">{editando ? 'Editar administrador' : 'Detalle del administrador'}</h3>
            <p>{admin.nombre_completo}</p>
          </div>
          <button type="button" className="admins-drawer-cerrar" onClick={onClose} aria-label="Cerrar detalle">
            <X size={20} />
          </button>
        </header>

        {editando ? (
          <EditarAdministradorForm
            admin={admin}
            onCancel={() => setEditando(false)}
            onGuardado={(data) => { setEditando(false); onGuardado(data); }}
          />
        ) : (
          <div className="admins-drawer-form">
            <div className="admins-drawer-cuerpo">
              <DatoFijo etiqueta="Ref.">{String(admin.id)}</DatoFijo>
              <DatoFijo etiqueta="Nombres">{admin.cedula ? admin.name : ''}</DatoFijo>
              <DatoFijo etiqueta="Apellidos">{admin.lastname}</DatoFijo>
              <DatoFijo etiqueta="Cédula">{admin.cedula}</DatoFijo>
              <DatoFijo etiqueta="Correo electrónico">{admin.email}</DatoFijo>
              <DatoFijo etiqueta="Cargo">{admin.cargo || 'Sin cargo indicado'}</DatoFijo>
              <DatoFijo etiqueta="Rol">{etiquetaRol(admin.rol)}</DatoFijo>
              <DatoFijo etiqueta="Estado">{estadoDe(admin)}</DatoFijo>
              <DatoFijo etiqueta="Último acceso">{fechaHora(admin.last_login)}</DatoFijo>
            </div>
            <footer className="admins-drawer-pie">
              <div className="admins-drawer-botones">
                <button type="button" className="admins-drawer-secundario" onClick={onClose}>Cerrar</button>
                {puedeEditar && (
                  <button type="button" className="admins-drawer-guardar" onClick={() => setEditando(true)}>Editar</button>
                )}
              </div>
            </footer>
          </div>
        )}
      </aside>
    </>
  );
}

const AdministradoresView = () => {
  const [administradores, setAdministradores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [aviso, setAviso] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [inputBuscar, setInputBuscar] = useState('');
  const [filtros, setFiltros] = useState({ buscar: '', estado: '' });
  // En celular los filtros van detrás del botón "Filtros" (en monitores siempre se ven).
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const { hasPermission } = useApplicationPermissions();
  const puedeEditar = hasPermission('editar_usuarios');

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  // El buscador espera a que se deje de escribir antes de pedir la lista.
  useEffect(() => {
    const texto = inputBuscar.trim();
    if (texto === filtros.buscar) return undefined;
    const espera = setTimeout(() => {
      setIsLoading(true);
      setPage(1);
      setFiltros((actuales) => ({ ...actuales, buscar: texto }));
    }, 400);
    return () => clearTimeout(espera);
  }, [inputBuscar, filtros.buscar]);

  // El backend devuelve 15 administradores por página.
  useEffect(() => {
    let active = true;
    const params = { page, ...Object.fromEntries(Object.entries(filtros).filter(([, valor]) => valor)) };
    podApi.get('/v1/users/administradores/', { params })
      .then((response) => {
        if (!active) return;
        setAdministradores(Array.isArray(response.data?.results) ? response.data.results : []);
        setTotalCount(typeof response.data?.count === 'number' ? response.data.count : 0);
        setError(null);
      })
      .catch((err) => {
        console.error('Error al cargar administradores:', err);
        if (active) {
          setError(err?.response?.status === 403
            ? 'No tienes permiso para ver la lista de administradores.'
            : 'No se pudo cargar la lista de administradores.');
        }
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [page, filtros]);

  const cambiarFiltro = (campo, valor) => {
    setIsLoading(true);
    setPage(1);
    setFiltros((actuales) => ({ ...actuales, [campo]: valor }));
  };

  const cambiarPagina = (nueva) => {
    setIsLoading(true);
    setPage(nueva);
  };

  // Al guardar, se reemplaza la fila y el detalle abierto con lo que devolvió el backend.
  const alGuardar = (actualizado) => {
    setAdministradores((lista) => lista.map((admin) => (admin.id === actualizado.id ? actualizado : admin)));
    setDetalle(actualizado);
    setAviso(`Se guardaron los cambios de ${actualizado.nombre_completo}.`);
  };

  const botonDetalle = (admin) => (
    <button type="button" className="administradores-editar" onClick={() => { setAviso(''); setDetalle(admin); }}>
      <Eye size={15} aria-hidden="true" />Ver detalle
    </button>
  );

  const hayFiltros = Boolean(filtros.buscar || filtros.estado);

  // Filtros: se pintan en la barra (monitores) y en el panel "Filtros" (celular).
  const controlesFiltro = (
    <>
      <input
        type="search"
        className="administradores-buscar"
        placeholder="Buscar por nombre, cédula o correo..."
        aria-label="Buscar administrador por nombre, cédula o correo"
        value={inputBuscar}
        onChange={(event) => setInputBuscar(event.target.value)}
      />
      <select className="administradores-select" aria-label="Filtrar por estado" value={filtros.estado} onChange={(event) => cambiarFiltro('estado', event.target.value)}>
        <option value="">Todos los estados</option>
        <option value="activo">Activo</option>
        <option value="pendiente">Pendiente</option>
        <option value="inactivo">Inactivo</option>
      </select>
    </>
  );

  const barraFiltros = (
    <div className="administradores-filtros">
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
          <div className="filtros-sheet__body">{controlesFiltro}</div>
          <footer className="filtros-sheet__footer">
            <button type="button" className="filtros-sheet__btn" onClick={() => setFiltrosAbiertos(false)}>Cerrar</button>
            <button type="button" className="filtros-sheet__btn filtros-sheet__btn--primario" onClick={() => setFiltrosAbiertos(false)}>Aplicar filtros</button>
          </footer>
        </div>,
        document.body,
      )}
      <div className="filtros-escritorio">{controlesFiltro}</div>
    </div>
  );

  // Paginación: arriba de la lista (para no bajar hasta el final) y también al final.
  const paginacion = totalPages > 1 && (
    <div className="administradores-paginacion">
      <button type="button" className="administradores-pagina-btn" onClick={() => cambiarPagina(page - 1)} disabled={page <= 1 || isLoading}>
        ← Anterior
      </button>
      <span className="administradores-pagina-info">Página {page} de {totalPages} · {totalCount} administradores</span>
      <button type="button" className="administradores-pagina-btn" onClick={() => cambiarPagina(page + 1)} disabled={page >= totalPages || isLoading}>
        Siguiente →
      </button>
    </div>
  );

  if (isLoading) {
    return <>{barraFiltros}{paginacion}<div className="administradores-estado">Cargando administradores...</div></>;
  }

  if (error) {
    return <>{barraFiltros}<div role="alert" className="administradores-estado administradores-estado--error">{error}</div></>;
  }

  if (administradores.length === 0) {
    return (
      <>
        {barraFiltros}
        <div className="administradores-estado">
          {hayFiltros ? 'No hay administradores con esos filtros.' : 'No hay administradores registrados en el sistema.'}
        </div>
      </>
    );
  }

  return (
    <>
    {barraFiltros}
    {paginacion}
    {aviso && <div role="status" className="administradores-aviso-ok">{aviso}</div>}
    <div className="responsive-list">
    <div className="responsive-list__table administradores-wrap">
      <table className="administradores-tabla">
        <thead>
          <tr>
            <th>Ref.</th>
            <th>Nombre</th>
            <th>Cargo</th>
            <th>Correo Electrónico</th>
            <th>Estado</th>
            <th><span className="administradores-oculto">Detalle</span></th>
          </tr>
        </thead>
        <tbody>
          {administradores.map((admin) => (
            <tr key={admin.id}>
              <td className="ref-usuario">{admin.id}</td>
              <td className="administradores-nombre">{admin.nombre_completo}</td>
              <td>{admin.cargo || '—'}</td>
              <td className="administradores-email">{admin.email}</td>
              <td>{estadoDe(admin)}</td>
              <td className="administradores-accion">{botonDetalle(admin)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="responsive-list__cards">
      <div className="administradores-cards">
        {administradores.map((admin) => (
          <article className="administradores-card" key={admin.id}>
            <div className="administradores-card-head">
              <h3 className="administradores-nombre">{admin.nombre_completo}</h3>
              {estadoDe(admin)}
            </div>
            <dl>
              <div><dt>Ref.</dt><dd className="ref-usuario">{admin.id}</dd></div>
              <div><dt>Cargo</dt><dd>{admin.cargo || '—'}</dd></div>
              <div><dt>Correo</dt><dd>{admin.email}</dd></div>
            </dl>
            {botonDetalle(admin)}
          </article>
        ))}
      </div>
    </div>
    </div>

    {paginacion}

    {detalle && (
      <AdministradorDrawer
        key={detalle.id}
        admin={detalle}
        puedeEditar={puedeEditar}
        onClose={() => setDetalle(null)}
        onGuardado={alGuardar}
      />
    )}
    </>
  );
};

export default AdministradoresView;
