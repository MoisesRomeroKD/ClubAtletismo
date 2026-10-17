import React, { useState, useEffect } from 'react';
import { Pencil, X } from 'lucide-react';
import podApi from '../../api/podApi';
import '../../styles/components/admin/AdministradoresView.css';

// Reglas de formato (las mismas que valida el backend).
const SOLO_LETRAS = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]/g;
const NOMBRE_COMPLETO = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{2,60}$/;
const CEDULA_COMPLETA = /^\d{7,8}$/;
const GMAIL = /^[a-z0-9](?:\.?[a-z0-9])*@gmail\.com$/;

const etiquetaRol = (rol) => (String(rol || '').toLowerCase() === 'administrador' ? 'Administrador' : rol || 'Administrador');

/* ---------- Drawer: editar administrador ---------- */
function EditarAdministradorDrawer({ admin, onClose, onGuardado }) {
  // Un administrador sin perfil (sin cédula) se completa aquí: se crea con la cédula que se escriba.
  const sinPerfil = !admin.cedula;
  const cedulaActual = admin.cedula || '';
  const [form, setForm] = useState({
    nombres: admin.cedula ? admin.name || '' : '',
    apellidos: admin.lastname || '',
    cedula: cedulaActual,
    correo: admin.email || '',
    is_active: Boolean(admin.is_active),
  });
  const [rechazos, setRechazos] = useState({});
  const [erroresServidor, setErroresServidor] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Cerrar con la tecla Escape.
  useEffect(() => {
    const alPresionar = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [onClose]);

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
      ? '' : 'La cédula debe tener 7 u 8 números (ej. 12345678).',
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
    <>
      <div className="admins-drawer-fondo" onClick={onClose} aria-hidden="true" />
      <aside className="admins-drawer" role="dialog" aria-modal="true" aria-labelledby="admins-drawer-titulo">
        <header className="admins-drawer-cabecera">
          <div>
            <h3 id="admins-drawer-titulo">Editar administrador</h3>
            <p>{admin.nombre_completo} · Usuario: {admin.username}</p>
          </div>
          <button type="button" className="admins-drawer-cerrar" onClick={onClose} aria-label="Cerrar edición">
            <X size={20} />
          </button>
        </header>

        <form className="admins-drawer-form" onSubmit={handleSubmit} noValidate>
          <div className="admins-drawer-cuerpo">
            {campo('nombres', 'Nombres', { type: 'text', maxLength: 60, required: true })}
            {campo('apellidos', 'Apellidos', { type: 'text', maxLength: 60, required: true })}
            {campo('cedula', 'Cédula', { type: 'text', inputMode: 'numeric', required: true, placeholder: 'Ej. 12345678' })}
            {sinPerfil && (
              <p className="admins-drawer-nota">Este administrador no tiene perfil: se crea con esta cédula.</p>
            )}
            {campo('correo', 'Correo electrónico', { type: 'email', required: true, placeholder: 'nombre@gmail.com' })}

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
              <button type="button" className="admins-drawer-secundario" onClick={onClose}>Cancelar</button>
              <button type="submit" className="admins-drawer-guardar" disabled={isSaving || hayErrores}>
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </footer>
        </form>
      </aside>
    </>
  );
}

const AdministradoresView = () => {
  const [administradores, setAdministradores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editando, setEditando] = useState(null);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    const fetchAdministradores = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await podApi.get('/v1/users/administradores/');
        setAdministradores(response.data);
      } catch (err) {
        console.error('Error al cargar administradores:', err);
        setError(err?.response?.status === 403
          ? 'No tienes permiso para ver la lista de administradores. Pide el permiso "Puede crear o modificar usuarios y atletas" en Roles y Permisos.'
          : 'No se pudo cargar la lista de administradores.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdministradores();
  }, []);

  // Al guardar, se reemplaza la fila con lo que devolvió el backend.
  const alGuardar = (actualizado) => {
    setAdministradores((lista) => lista.map((admin) => (admin.id === actualizado.id ? actualizado : admin)));
    setEditando(null);
    setAviso(`Se guardaron los cambios de ${actualizado.nombre_completo}.`);
  };

  const botonEditar = (admin) => (
    <button type="button" className="administradores-editar" onClick={() => { setAviso(''); setEditando(admin); }}>
      <Pencil size={15} aria-hidden="true" />Editar
    </button>
  );

  if (isLoading) {
    return <div className="administradores-estado">Cargando administradores...</div>;
  }

  if (error) {
    return <div className="administradores-estado administradores-estado--error">{error}</div>;
  }

  if (administradores.length === 0) {
    return <div className="administradores-estado">No hay administradores registrados en el sistema.</div>;
  }

  return (
    <>
    {aviso && <div role="status" className="administradores-aviso-ok">{aviso}</div>}
    <div className="responsive-list">
    <div className="responsive-list__table administradores-wrap">
      <table className="administradores-tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo Electrónico</th>
            <th>Rol</th>
            <th>Estado</th>
            <th><span className="administradores-oculto">Editar</span></th>
          </tr>
        </thead>
        <tbody>
          {administradores.map((admin) => (
            <tr key={admin.id}>
              <td className="administradores-nombre">{admin.nombre_completo}</td>
              <td className="administradores-email">{admin.email}</td>
              <td>
                <span className="administradores-rol">{admin.rol || 'Administrador'}</span>
              </td>
              <td>
                <span className={`administradores-activo ${admin.is_active ? '' : 'administradores-activo--no'}`}>
                  {admin.is_active ? '● Activo' : '● Inactivo'}
                </span>
              </td>
              <td className="administradores-accion">{botonEditar(admin)}</td>
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
              <span className={`administradores-activo ${admin.is_active ? '' : 'administradores-activo--no'}`}>
                {admin.is_active ? '● Activo' : '● Inactivo'}
              </span>
            </div>
            <dl>
              <div><dt>Correo</dt><dd>{admin.email}</dd></div>
              <div><dt>Rol</dt><dd><span className="administradores-rol">{admin.rol || 'Administrador'}</span></dd></div>
            </dl>
            {botonEditar(admin)}
          </article>
        ))}
      </div>
    </div>
    </div>

    {editando && (
      <EditarAdministradorDrawer
        key={editando.id}
        admin={editando}
        onClose={() => setEditando(null)}
        onGuardado={alGuardar}
      />
    )}
    </>
  );
};

export default AdministradoresView;
