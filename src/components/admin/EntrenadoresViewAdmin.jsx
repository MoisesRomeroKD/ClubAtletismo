import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, SlidersHorizontal, X } from 'lucide-react';
import UserService from '../../api/services/Userservice';
import { useApplicationPermissions } from '../../context/ApplicationPermissionsContext';
import '../../styles/components/admin/EntrenadoresViewAdmin.css';

const PAGE_SIZE = 15;

// Reglas de formato al editar (las mismas que valida el backend).
const SOLO_LETRAS = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]/g;
const NOMBRE_COMPLETO = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{2,60}$/;
const CEDULA_COMPLETA = /^\d{7,8}$/;
const TELEFONO_COMPLETO = /^0\d{10}$/;
const GMAIL = /^[a-z0-9](?:\.?[a-z0-9])*@gmail\.com$/;

const nombreDe = (entrenador) => entrenador.nombre_completo || `${entrenador.name} ${entrenador.lastname}`.trim();

function DatoFijo({ etiqueta, valor }) {
  return (
    <div className="entrenadores-drawer-dato">
      <span>{etiqueta}</span>
      <strong>{valor || '—'}</strong>
    </div>
  );
}

/* ---------- Formulario de edición (dentro del drawer) ---------- */
function EditarEntrenadorForm({ entrenador, onCancel, onGuardado }) {
  const [form, setForm] = useState({
    nombres: entrenador.name || '',
    apellidos: entrenador.lastname || '',
    cedula: entrenador.cedula || '',
    correo: entrenador.email || '',
    telefono: entrenador.tlf || '',
    is_active: entrenador.is_active !== false,
  });
  const [rechazos, setRechazos] = useState({});
  const [erroresServidor, setErroresServidor] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [saving, setSaving] = useState(false);

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
    } else if (campo === 'telefono') {
      limpio = valor.replace(/\D/g, '').slice(0, 11);
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

  const errorFormato = {
    nombres: NOMBRE_COMPLETO.test(form.nombres.trim()) ? '' : 'Escribe al menos 2 letras.',
    apellidos: NOMBRE_COMPLETO.test(form.apellidos.trim()) ? '' : 'Escribe al menos 2 letras.',
    // Si no se cambió, no se revisa: así se pueden guardar otros datos aunque la cédula guardada tenga otro formato.
    cedula: form.cedula === (entrenador.cedula || '') || CEDULA_COMPLETA.test(form.cedula)
      ? '' : 'La cédula debe tener 7 u 8 números (ej. 12345678).',
    correo: form.correo === (entrenador.email || '').toLowerCase() || GMAIL.test(form.correo)
      ? '' : 'Solo se aceptan correos de Gmail (ej. nombre@gmail.com).',
    telefono: TELEFONO_COMPLETO.test(form.telefono) ? '' : 'El teléfono debe tener 11 números y empezar por 0 (ej. 04141234567).',
  };
  const aviso = (campo) => rechazos[campo] || erroresServidor[campo] || errorFormato[campo] || '';
  const hayErrores = Object.values(errorFormato).some(Boolean);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (hayErrores) return;
    setSaving(true);
    setMensaje('');
    try {
      const data = await UserService.updateTrainer(entrenador.user_id, {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        cedula: form.cedula,
        correo: form.correo,
        telefono: form.telefono,
        is_active: form.is_active,
      });
      onGuardado(data);
    } catch (err) {
      setErroresServidor(err?.response?.data?.errores || {});
      setMensaje(err?.response?.data?.detail || 'No se pudieron guardar los cambios.');
      setSaving(false);
    }
  };

  const campo = (nombre, etiqueta, props = {}) => {
    const texto = aviso(nombre);
    return (
      <div className="entrenadores-drawer-campo">
        <label htmlFor={`entrenador-${nombre}`}>{etiqueta}</label>
        <input
          id={`entrenador-${nombre}`}
          value={form[nombre]}
          onChange={(event) => cambiar(nombre, event.target.value)}
          className={texto ? 'entrenadores-input--error' : undefined}
          aria-invalid={texto ? true : undefined}
          aria-describedby={texto ? `aviso-entrenador-${nombre}` : undefined}
          {...props}
        />
        {texto && <small id={`aviso-entrenador-${nombre}`} className="entrenadores-aviso" role="alert">{texto}</small>}
      </div>
    );
  };

  return (
    <form className="entrenadores-drawer-form" onSubmit={handleSubmit} noValidate>
      <div className="entrenadores-drawer-cuerpo">
        {campo('nombres', 'Nombres', { type: 'text', maxLength: 60 })}
        {campo('apellidos', 'Apellidos', { type: 'text', maxLength: 60 })}
        {campo('cedula', 'Cédula', { type: 'text', inputMode: 'numeric', placeholder: 'Ej. 12345678' })}
        {campo('correo', 'Correo electrónico', { type: 'email', placeholder: 'nombre@gmail.com' })}
        {campo('telefono', 'Teléfono', { type: 'tel', inputMode: 'numeric', maxLength: 11, placeholder: 'Ej. 04141234567' })}
        <label className="entrenadores-drawer-estado" htmlFor="entrenador-is_active">
          <input
            id="entrenador-is_active"
            type="checkbox"
            checked={form.is_active}
            onChange={(event) => { setMensaje(''); setForm((previo) => ({ ...previo, is_active: event.target.checked })); }}
          />
          <span>
            <strong>Cuenta activa</strong>
            <small>Si se desactiva, el entrenador no podrá iniciar sesión.</small>
          </span>
        </label>
        {erroresServidor.is_active && <small className="entrenadores-aviso" role="alert">{erroresServidor.is_active}</small>}
      </div>

      <footer className="entrenadores-drawer-pie">
        {mensaje && <p role="alert" className="entrenadores-aviso">{mensaje}</p>}
        <div className="entrenadores-drawer-botones">
          <button type="button" className="entrenadores-drawer-secundario" onClick={onCancel} disabled={saving}>Cancelar</button>
          <button type="submit" className="entrenadores-drawer-primario" disabled={saving || hayErrores}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </footer>
    </form>
  );
}

/* ---------- Asignar subáreas (dentro del drawer) ---------- */
function AsignarSubareasEntrenador({ entrenador, onCancel, onGuardado }) {
  const [catalogo, setCatalogo] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [elegidas, setElegidas] = useState(() => (entrenador.subareas || []).map((subarea) => subarea.id));
  const [mensaje, setMensaje] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    UserService.getSubareas()
      .then((data) => { if (active) setCatalogo(Array.isArray(data) ? data : data?.results || []); })
      .catch(() => { if (active) setErrorCarga('No se pudieron cargar las subáreas.'); });
    return () => { active = false; };
  }, []);

  // Subáreas agrupadas por área, en orden alfabético.
  const grupos = {};
  (catalogo || []).forEach((subarea) => {
    const area = subarea.area?.nombre || 'Sin área';
    (grupos[area] = grupos[area] || []).push(subarea);
  });
  const areas = Object.keys(grupos).sort((a, b) => a.localeCompare(b, 'es'));

  const alternar = (id) => {
    setMensaje('');
    setElegidas((actuales) => (actuales.includes(id) ? actuales.filter((valor) => valor !== id) : [...actuales, id]));
  };

  const guardar = async () => {
    setSaving(true);
    setMensaje('');
    try {
      const data = await UserService.setTrainerSubareas(entrenador.user_id, elegidas);
      onGuardado(data);
    } catch (err) {
      setMensaje(err?.response?.data?.detail || 'No se pudieron guardar las subáreas.');
      setSaving(false);
    }
  };

  return (
    <div className="entrenadores-drawer-form">
      <div className="entrenadores-drawer-cuerpo">
        <p className="entrenadores-drawer-nota">
          Marca las subáreas en las que está habilitado el entrenador. Verá a los atletas de esas subáreas.
        </p>
        {errorCarga && <p role="alert" className="entrenadores-aviso">{errorCarga}</p>}
        {!catalogo && !errorCarga && <p className="entrenadores-drawer-vacio">Cargando subáreas...</p>}
        {catalogo && !areas.length && <p className="entrenadores-drawer-vacio">No hay subáreas creadas. Créalas en Áreas y Subáreas.</p>}
        {areas.map((area) => (
          <fieldset key={area} className="entrenadores-subareas-grupo">
            <legend>{area}</legend>
            {grupos[area].map((subarea) => (
              <label key={subarea.id} className="entrenadores-subareas-opcion">
                <input type="checkbox" checked={elegidas.includes(subarea.id)} onChange={() => alternar(subarea.id)} />
                {subarea.nombre}
              </label>
            ))}
          </fieldset>
        ))}
      </div>

      <footer className="entrenadores-drawer-pie">
        {mensaje && <p role="alert" className="entrenadores-aviso">{mensaje}</p>}
        <div className="entrenadores-drawer-botones">
          <button type="button" className="entrenadores-drawer-secundario" onClick={onCancel} disabled={saving}>Cancelar</button>
          <button type="button" className="entrenadores-drawer-primario" onClick={guardar} disabled={saving || !catalogo}>
            {saving ? 'Guardando...' : `Guardar (${elegidas.length})`}
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Drawer: detalle y edición del entrenador ---------- */
function EntrenadorDrawer({ entrenador, puedeEditar, onClose, onGuardado }) {
  // Modo del panel: '' = detalle, 'editar' = datos personales, 'subareas' = asignar subáreas.
  const [modo, setModo] = useState('');
  const editando = modo === 'editar';

  // Cerrar con la tecla Escape.
  useEffect(() => {
    const alPresionar = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [onClose]);

  const subareas = entrenador.subareas || [];

  return (
    <>
      <div className="entrenadores-drawer-fondo" onClick={onClose} aria-hidden="true" />
      <aside className="entrenadores-drawer" role="dialog" aria-modal="true" aria-labelledby="entrenadores-drawer-titulo">
        <header className="entrenadores-drawer-cabecera">
          <div>
            <span className="entrenadores-drawer-kicker">
              {editando ? 'EDITAR ENTRENADOR' : modo === 'subareas' ? 'ASIGNAR SUBÁREAS' : 'DETALLE DEL ENTRENADOR'}
            </span>
            <h3 id="entrenadores-drawer-titulo">{nombreDe(entrenador)}</h3>
            <p>C.I. {entrenador.cedula || '—'}</p>
          </div>
          <button type="button" className="entrenadores-drawer-cerrar" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        {editando && (
          <EditarEntrenadorForm
            entrenador={entrenador}
            onCancel={() => setModo('')}
            onGuardado={(data) => { setModo(''); onGuardado(data); }}
          />
        )}
        {modo === 'subareas' && (
          <AsignarSubareasEntrenador
            entrenador={entrenador}
            onCancel={() => setModo('')}
            onGuardado={(data) => { setModo(''); onGuardado(data); }}
          />
        )}
        {!modo && (
          <>
            <div className="entrenadores-drawer-cuerpo">
              <p className="entrenadores-drawer-seccion">Contacto</p>
              <div className="entrenadores-drawer-bloque">
                <DatoFijo etiqueta="Correo" valor={entrenador.email} />
                <DatoFijo etiqueta="Teléfono" valor={entrenador.tlf} />
                <DatoFijo etiqueta="Estado" valor={entrenador.is_active === false ? 'Inactivo' : 'Activo'} />
              </div>

              <p className="entrenadores-drawer-seccion">Subáreas habilitadas ({subareas.length})</p>
              <div className="entrenadores-drawer-bloque">
                {subareas.length ? (
                  <ul className="entrenadores-drawer-subareas">
                    {subareas.map((subarea) => (
                      <li key={subarea.id}>{subarea.area ? `${subarea.area} · ` : ''}{subarea.nombre}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="entrenadores-drawer-vacio">No tiene subáreas habilitadas.</p>
                )}
                {puedeEditar && (
                  <button type="button" className="entrenadores-admin-ver" onClick={() => setModo('subareas')}>
                    Asignar subáreas
                  </button>
                )}
              </div>
            </div>

            <footer className="entrenadores-drawer-pie">
              <div className="entrenadores-drawer-botones">
                <button type="button" className="entrenadores-drawer-secundario" onClick={onClose}>Cerrar</button>
                {puedeEditar && (
                  <button type="button" className="entrenadores-drawer-primario" onClick={() => setModo('editar')}>Editar</button>
                )}
              </div>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}

const EntrenadoresViewAdmin = () => {
  const [entrenadores, setEntrenadores] = useState([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [aviso, setAviso] = useState('');
  const { hasPermission } = useApplicationPermissions();
  const puedeEditar = hasPermission('editar_usuarios');

  // Filtros: nombre o cédula, área y subárea (el backend los aplica).
  const [inputBuscar, setInputBuscar] = useState('');
  const [filtros, setFiltros] = useState({ buscar: '', area: '', subarea: '' });
  const [catalogo, setCatalogo] = useState([]);
  // En celular los filtros van detrás del botón "Filtros" (en monitores siempre se ven).
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  useEffect(() => {
    let active = true;
    UserService.getSubareas()
      .then((data) => { if (active) setCatalogo(Array.isArray(data) ? data : data?.results || []); })
      .catch(() => { if (active) setCatalogo([]); });
    return () => { active = false; };
  }, []);

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

  const cambiarFiltro = (campo, valor) => {
    setIsLoading(true);
    setPage(1);
    setFiltros((actuales) => ({ ...actuales, [campo]: valor, ...(campo === 'area' && { subarea: '' }) }));
  };

  // Áreas y subáreas para los selectores (la subárea se limita al área elegida).
  const areas = [...new Map(catalogo.filter((subarea) => subarea.area).map((subarea) => [subarea.area.id, subarea.area])).values()]
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const subareasVisibles = catalogo.filter((subarea) => !filtros.area || String(subarea.area?.id) === filtros.area);

  // El backend devuelve 15 entrenadores por página.
  useEffect(() => {
    let active = true;
    const params = { page, ...Object.fromEntries(Object.entries(filtros).filter(([, valor]) => valor)) };
    UserService.getTrainers(params)
      .then((response) => {
        if (!active) return;
        setEntrenadores(Array.isArray(response?.results) ? response.results : []);
        setTotalCount(typeof response?.count === 'number' ? response.count : 0);
        setError(null);
      })
      .catch((err) => {
        console.error('Error al cargar entrenadores:', err);
        if (active) setError('No se pudo cargar la lista de entrenadores. Inténtalo de nuevo más tarde.');
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [page, filtros]);

  const cambiarPagina = (nueva) => {
    setIsLoading(true);
    setPage(nueva);
  };

  // Al guardar, se reemplaza el entrenador en la lista y en el drawer abierto.
  const alGuardar = (actualizado) => {
    setEntrenadores((lista) => lista.map((item) => (item.user_id === actualizado.user_id ? actualizado : item)));
    setDetalle(actualizado);
    setAviso(`Se guardaron los cambios de ${nombreDe(actualizado)}.`);
  };

  const botonDetalle = (entrenador) => (
    <button type="button" className="entrenadores-admin-ver" onClick={() => { setAviso(''); setDetalle(entrenador); }}>
      <Eye size={15} aria-hidden="true" />Ver detalle
    </button>
  );

  const hayFiltros = Boolean(filtros.buscar || filtros.area || filtros.subarea);

  // Filtros: se pintan en la barra (monitores) y en el panel "Filtros" (celular).
  const controlesFiltro = (
    <>
        <input
          type="search"
          className="entrenadores-admin-buscar"
          placeholder="Buscar por nombre o cédula..."
          aria-label="Buscar entrenador por nombre o cédula"
          value={inputBuscar}
          onChange={(event) => setInputBuscar(event.target.value)}
        />
        <select className="entrenadores-admin-select" aria-label="Filtrar por área" value={filtros.area} onChange={(event) => cambiarFiltro('area', event.target.value)}>
          <option value="">Todas las áreas</option>
          {areas.map((area) => <option key={area.id} value={String(area.id)}>{area.nombre}</option>)}
        </select>
        <select className="entrenadores-admin-select" aria-label="Filtrar por subárea" value={filtros.subarea} onChange={(event) => cambiarFiltro('subarea', event.target.value)}>
          <option value="">Todas las subáreas</option>
          {subareasVisibles.map((subarea) => <option key={subarea.id} value={String(subarea.id)}>{subarea.nombre}</option>)}
        </select>
    </>
  );

  const barraFiltros = (
    <div className="entrenadores-admin-filtros">
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
      <span className="entrenadores-admin-total">{totalCount} {totalCount === 1 ? 'entrenador' : 'entrenadores'}</span>
    </div>
  );

  if (isLoading) {
    return <>{barraFiltros}<div className="entrenadores-admin-estado">Cargando entrenadores...</div></>;
  }

  if (error) {
    return <>{barraFiltros}<div role="alert" className="entrenadores-admin-estado entrenadores-admin-estado--error">{error}</div></>;
  }

  if (entrenadores.length === 0) {
    return (
      <>
        {barraFiltros}
        <div className="entrenadores-admin-estado">
          {hayFiltros ? 'No hay entrenadores con esos filtros.' : 'No hay entrenadores registrados en el sistema.'}
        </div>
      </>
    );
  }

  return (
    <>
    {barraFiltros}
    {aviso && <div role="status" className="entrenadores-admin-ok">{aviso}</div>}
    <div className="responsive-list">
    <div className="responsive-list__table entrenadores-admin-wrap">
      <table className="entrenadores-admin-tabla">
        <thead>
          <tr>
            <th>Cédula</th>
            <th>Nombre Completo</th>
            <th>Correo Electrónico</th>
            <th>Teléfono</th>
            <th><span className="entrenadores-admin-oculto">Detalle</span></th>
          </tr>
        </thead>
        <tbody>
          {entrenadores.map((entrenador) => (
            <tr key={entrenador.user_id}>
              <td className="entrenadores-admin-cedula">{entrenador.cedula || '—'}</td>
              <td className="entrenadores-admin-nombre">{nombreDe(entrenador)}</td>
              <td className="entrenadores-admin-dato">{entrenador.email || '—'}</td>
              <td className="entrenadores-admin-dato">{entrenador.tlf || '—'}</td>
              <td className="entrenadores-admin-accion">{botonDetalle(entrenador)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="responsive-list__cards">
      <div className="entrenadores-admin-cards">
        {entrenadores.map((entrenador) => (
          <article className="entrenadores-admin-card" key={entrenador.user_id}>
            <h3 className="entrenadores-admin-nombre">{nombreDe(entrenador)}</h3>
            <dl>
              <div><dt>Cédula</dt><dd className="entrenadores-admin-cedula">{entrenador.cedula || '—'}</dd></div>
              <div><dt>Correo</dt><dd>{entrenador.email || '—'}</dd></div>
              <div><dt>Teléfono</dt><dd>{entrenador.tlf || '—'}</dd></div>
            </dl>
            {botonDetalle(entrenador)}
          </article>
        ))}
      </div>
    </div>
    </div>

    {totalPages > 1 && (
      <div className="entrenadores-admin-paginacion">
        <button type="button" className="entrenadores-admin-pagina-btn" onClick={() => cambiarPagina(page - 1)} disabled={page <= 1}>
          ← Anterior
        </button>
        <span className="entrenadores-admin-pagina-info">Página {page} de {totalPages} · {totalCount} entrenadores</span>
        <button type="button" className="entrenadores-admin-pagina-btn" onClick={() => cambiarPagina(page + 1)} disabled={page >= totalPages}>
          Siguiente →
        </button>
      </div>
    )}

    {detalle && (
      <EntrenadorDrawer
        key={detalle.user_id}
        entrenador={detalle}
        puedeEditar={puedeEditar}
        onClose={() => setDetalle(null)}
        onGuardado={alGuardar}
      />
    )}
    </>
  );
};

export default EntrenadoresViewAdmin;
