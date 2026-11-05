import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, SlidersHorizontal, X } from 'lucide-react';
import UserService from '../../api/services/Userservice';
import { useApplicationPermissions } from '../../context/ApplicationPermissionsContext';
import '../../styles/components/admin/RepresentantesViewAdmin.css';

// Reglas de formato al editar (las mismas que valida el backend).
const SOLO_LETRAS = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]/g;
const NOMBRE_COMPLETO = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{2,60}$/;
// Cédula: de 1.000.000 a 49.999.999.
const CEDULA_COMPLETA = /^(?:[1-9]\d{6}|[1-4]\d{7})$/;
const TELEFONO_COMPLETO = /^0\d{10}$/;

const nombreDe = (representante) => representante.nombre_completo || `${representante.nombre} ${representante.apellido}`.trim();

function DatoFijo({ etiqueta, valor }) {
  return (
    <div className="representantes-drawer-dato">
      <span>{etiqueta}</span>
      <strong>{valor || '—'}</strong>
    </div>
  );
}

/* ---------- Formulario de edición (dentro del drawer) ---------- */
function EditarRepresentanteForm({ representante, onCancel, onGuardado }) {
  const [form, setForm] = useState({
    nombres: representante.nombre || '',
    apellidos: representante.apellido || '',
    cedula: representante.cedula || '',
    telefono: representante.tlf || '',
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
    } else if (campo === 'cedula' || campo === 'telefono') {
      limpio = valor.replace(/\D/g, '').slice(0, campo === 'cedula' ? 8 : 11);
      if (limpio !== valor) rechazo = 'Aquí solo se escriben números.';
    }
    setRechazos((previos) => ({ ...previos, [campo]: rechazo }));
    setErroresServidor((previos) => ({ ...previos, [campo]: '' }));
    setMensaje('');
    setForm((previo) => ({ ...previo, [campo]: limpio }));
  };

  // Cédula y teléfono: si no se cambiaron, no se revisan (así se pueden guardar otros datos
  // aunque lo guardado tenga un formato viejo).
  const errorFormato = {
    nombres: NOMBRE_COMPLETO.test(form.nombres.trim()) ? '' : 'Escribe al menos 2 letras.',
    apellidos: NOMBRE_COMPLETO.test(form.apellidos.trim()) ? '' : 'Escribe al menos 2 letras.',
    cedula: form.cedula === (representante.cedula || '') || CEDULA_COMPLETA.test(form.cedula)
      ? '' : 'La cédula debe ser un número entre 1.000.000 y 49.999.999 (ej. 12345678).',
    telefono: form.telefono === (representante.tlf || '') || TELEFONO_COMPLETO.test(form.telefono)
      ? '' : 'El teléfono debe tener 11 números y empezar por 0 (ej. 04141234567).',
  };
  const aviso = (campo) => rechazos[campo] || erroresServidor[campo] || errorFormato[campo] || '';
  const hayErrores = Object.values(errorFormato).some(Boolean);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (hayErrores) return;
    setSaving(true);
    setMensaje('');
    try {
      const data = await UserService.updateRepresentative(representante.id, {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        cedula: form.cedula,
        telefono: form.telefono,
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
      <div className="representantes-drawer-campo">
        <label htmlFor={`representante-${nombre}`}>{etiqueta}</label>
        <input
          id={`representante-${nombre}`}
          value={form[nombre]}
          onChange={(event) => cambiar(nombre, event.target.value)}
          className={texto ? 'representantes-input--error' : undefined}
          aria-invalid={texto ? true : undefined}
          aria-describedby={texto ? `aviso-representante-${nombre}` : undefined}
          {...props}
        />
        {texto && <small id={`aviso-representante-${nombre}`} className="representantes-aviso" role="alert">{texto}</small>}
      </div>
    );
  };

  return (
    <form className="representantes-drawer-form" onSubmit={handleSubmit} noValidate>
      <div className="representantes-drawer-cuerpo">
        {campo('nombres', 'Nombres', { type: 'text', maxLength: 60 })}
        {campo('apellidos', 'Apellidos', { type: 'text', maxLength: 60 })}
        {campo('cedula', 'Cédula', { type: 'text', inputMode: 'numeric', placeholder: 'Ej. 12345678' })}
        {campo('telefono', 'Teléfono', { type: 'tel', inputMode: 'numeric', placeholder: 'Ej. 04141234567' })}
        <p className="representantes-drawer-nota">La relación con cada atleta (madre, padre...) se cambia desde el perfil del atleta.</p>
      </div>

      <footer className="representantes-drawer-pie">
        {mensaje && <p role="alert" className="representantes-aviso">{mensaje}</p>}
        <div className="representantes-drawer-botones">
          <button type="button" className="representantes-drawer-secundario" onClick={onCancel} disabled={saving}>Cancelar</button>
          <button type="submit" className="representantes-drawer-primario" disabled={saving || hayErrores}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </footer>
    </form>
  );
}

/* ---------- Drawer: detalle y edición del representante ---------- */
function RepresentanteDrawer({ representante, puedeEditar, onClose, onGuardado }) {
  const [editando, setEditando] = useState(false);
  // Los atletas a cargo se piden al abrir el detalle (la lista no los trae).
  const [carga, setCarga] = useState({ atletas: null, error: '' });

  useEffect(() => {
    let activo = true;
    UserService.getRepresentative(representante.id)
      .then((data) => { if (activo) setCarga({ atletas: Array.isArray(data?.atletas) ? data.atletas : [], error: '' }); })
      .catch(() => { if (activo) setCarga({ atletas: [], error: 'No se pudieron cargar los atletas a cargo.' }); });
    return () => { activo = false; };
  }, [representante.id]);

  // Cerrar con la tecla Escape.
  useEffect(() => {
    const alPresionar = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [onClose]);

  const atletas = carga.atletas || [];

  return (
    <>
      <div className="representantes-drawer-fondo" onClick={onClose} aria-hidden="true" />
      <aside className="representantes-drawer" role="dialog" aria-modal="true" aria-labelledby="representantes-drawer-titulo">
        <header className="representantes-drawer-cabecera">
          <div>
            <span className="representantes-drawer-kicker">{editando ? 'EDITAR REPRESENTANTE' : 'DETALLE DEL REPRESENTANTE'}</span>
            <h3 id="representantes-drawer-titulo">{nombreDe(representante)}</h3>
            <p>Cédula {representante.cedula || '—'}</p>
          </div>
          <button type="button" className="representantes-drawer-cerrar" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        {editando ? (
          <EditarRepresentanteForm
            representante={representante}
            onCancel={() => setEditando(false)}
            onGuardado={(data) => { setEditando(false); onGuardado(data); }}
          />
        ) : (
          <>
            <div className="representantes-drawer-cuerpo">
              <p className="representantes-drawer-seccion">Contacto</p>
              <div className="representantes-drawer-bloque">
                <DatoFijo etiqueta="Teléfono" valor={representante.tlf} />
              </div>

              <p className="representantes-drawer-seccion">Atletas a cargo{carga.atletas ? ` (${atletas.length})` : ''}</p>
              <div className="representantes-drawer-bloque">
                {!carga.atletas ? (
                  <p className="representantes-drawer-vacio">Cargando atletas...</p>
                ) : carga.error ? (
                  <p className="representantes-drawer-vacio" role="alert">{carga.error}</p>
                ) : atletas.length ? (
                  <ul className="representantes-drawer-atletas">
                    {atletas.map((atleta) => (
                      <li key={atleta.id}>
                        <strong>{atleta.nombre}</strong>
                        <small>Cédula {atleta.cedula || '—'}{atleta.relacion ? ` · ${atleta.relacion}` : ''}</small>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="representantes-drawer-vacio">No tiene atletas a cargo.</p>
                )}
              </div>
            </div>

            <footer className="representantes-drawer-pie">
              <div className="representantes-drawer-botones">
                <button type="button" className="representantes-drawer-secundario" onClick={onClose}>Cerrar</button>
                {puedeEditar && (
                  <button type="button" className="representantes-drawer-primario" onClick={() => setEditando(true)}>Editar</button>
                )}
              </div>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}

const totalAtletas = (total) => (total ? `${total} atleta${total === 1 ? '' : 's'}` : '—');

const PAGE_SIZE = 15;

const RepresentantesViewAdmin = () => {
  const [representantes, setRepresentantes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [aviso, setAviso] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [inputBuscar, setInputBuscar] = useState('');
  // Área y subárea: las de los atletas que tiene a cargo.
  const [filtros, setFiltros] = useState({ buscar: '', area: '', subarea: '' });
  const [catalogo, setCatalogo] = useState([]);
  // En celular los filtros van detrás del botón "Filtros" (en monitores siempre se ven).
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const { hasPermission } = useApplicationPermissions();
  const puedeEditar = hasPermission('editar_usuarios');

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

  // El backend devuelve 15 representantes por página, ordenados por número de referencia.
  useEffect(() => {
    let active = true;
    const params = { page, ...Object.fromEntries(Object.entries(filtros).filter(([, valor]) => valor)) };
    UserService.getRepresentatives(params)
      .then((response) => {
        if (!active) return;
        setRepresentantes(Array.isArray(response?.results) ? response.results : []);
        setTotalCount(typeof response?.count === 'number' ? response.count : 0);
        setError(null);
      })
      .catch((err) => {
        console.error('Error al cargar representantes:', err);
        if (active) setError('No se pudo cargar la lista de representantes. Inténtalo de nuevo más tarde.');
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [page, filtros]);

  const cambiarFiltro = (campo, valor) => {
    setIsLoading(true);
    setPage(1);
    setFiltros((actuales) => ({ ...actuales, [campo]: valor, ...(campo === 'area' && { subarea: '' }) }));
  };

  const cambiarPagina = (nueva) => {
    setIsLoading(true);
    setPage(nueva);
  };

  // Áreas y subáreas para los selectores (la subárea se limita al área elegida).
  const areas = [...new Map(catalogo.filter((subarea) => subarea.area).map((subarea) => [subarea.area.id, subarea.area])).values()]
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const subareasVisibles = catalogo.filter((subarea) => !filtros.area || String(subarea.area?.id) === filtros.area);

  // Al guardar, se actualiza el representante en la lista y en el drawer abierto (conserva el total de atletas).
  const alGuardar = (actualizado) => {
    setRepresentantes((lista) => lista.map((item) => (
      item.id === actualizado.id ? { ...item, ...actualizado, atletas: undefined } : item
    )));
    setDetalle((actual) => ({ ...actual, ...actualizado }));
    setAviso(`Se guardaron los cambios de ${nombreDe(actualizado)}.`);
  };

  const botonDetalle = (representante) => (
    <button type="button" className="representantes-admin-ver" onClick={() => { setAviso(''); setDetalle(representante); }}>
      <Eye size={15} aria-hidden="true" />Ver detalle
    </button>
  );

  const hayFiltros = Boolean(filtros.buscar || filtros.area || filtros.subarea);

  // Filtros: se pintan en la barra (monitores) y en el panel "Filtros" (celular).
  const controlesFiltro = (
    <>
      <input
        type="search"
        className="representantes-admin-buscar"
        placeholder="Buscar por nombre o cédula..."
        aria-label="Buscar representante por nombre o cédula"
        value={inputBuscar}
        onChange={(event) => setInputBuscar(event.target.value)}
      />
      <select className="representantes-admin-select" aria-label="Filtrar por área de sus atletas" value={filtros.area} onChange={(event) => cambiarFiltro('area', event.target.value)}>
        <option value="">Todas las áreas</option>
        {areas.map((area) => <option key={area.id} value={String(area.id)}>{area.nombre}</option>)}
      </select>
      <select className="representantes-admin-select" aria-label="Filtrar por subárea de sus atletas" value={filtros.subarea} onChange={(event) => cambiarFiltro('subarea', event.target.value)}>
        <option value="">Todas las subáreas</option>
        {subareasVisibles.map((subarea) => <option key={subarea.id} value={String(subarea.id)}>{subarea.nombre}</option>)}
      </select>
    </>
  );

  const barraFiltros = (
    <div className="representantes-admin-filtros">
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
      <span className="representantes-admin-total">{totalCount} {totalCount === 1 ? 'representante' : 'representantes'}</span>
    </div>
  );

  // Paginación: arriba de la lista (para no bajar hasta el final) y también al final.
  const paginacion = totalPages > 1 && (
    <div className="representantes-admin-paginacion">
      <button type="button" className="representantes-admin-pagina-btn" onClick={() => cambiarPagina(page - 1)} disabled={page <= 1 || isLoading}>
        ← Anterior
      </button>
      <span className="representantes-admin-pagina-info">Página {page} de {totalPages} · {totalCount} representantes</span>
      <button type="button" className="representantes-admin-pagina-btn" onClick={() => cambiarPagina(page + 1)} disabled={page >= totalPages || isLoading}>
        Siguiente →
      </button>
    </div>
  );

  if (isLoading) {
    return <>{barraFiltros}{paginacion}<div className="representantes-admin-estado">Cargando representantes...</div></>;
  }

  if (error) {
    return <>{barraFiltros}<div role="alert" className="representantes-admin-estado representantes-admin-estado--error">{error}</div></>;
  }

  if (representantes.length === 0) {
    return (
      <>
        {barraFiltros}
        <div className="representantes-admin-estado">
          {hayFiltros ? 'No hay representantes con esos filtros.' : 'No hay representantes registrados en el sistema.'}
        </div>
      </>
    );
  }

  return (
    <>
    {barraFiltros}
    {paginacion}
    {aviso && <div role="status" className="representantes-admin-ok">{aviso}</div>}
    <div className="responsive-list">
    <div className="responsive-list__table representantes-admin-wrap">
      <table className="representantes-admin-tabla">
        <thead>
          <tr>
            <th>Ref.</th>
            <th>Cédula</th>
            <th>Nombre del Representante</th>
            <th>Teléfono</th>
            <th>Atleta(s) a cargo</th>
            <th><span className="representantes-admin-oculto">Detalle</span></th>
          </tr>
        </thead>
        <tbody>
          {representantes.map((representante) => (
            <tr key={representante.id}>
              <td className="ref-usuario">{representante.id}</td>
              <td className="representantes-admin-cedula">{representante.cedula || '—'}</td>
              <td className="representantes-admin-nombre">{nombreDe(representante)}</td>
              <td className="representantes-admin-dato">{representante.tlf || '—'}</td>
              <td>{totalAtletas(representante.atletas_total)}</td>
              <td className="representantes-admin-accion">{botonDetalle(representante)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="responsive-list__cards">
      <div className="representantes-admin-cards">
        {representantes.map((representante) => (
          <article className="representantes-admin-card" key={representante.id}>
            <h3 className="representantes-admin-nombre">{nombreDe(representante)}</h3>
            <dl>
              <div><dt>Ref.</dt><dd className="ref-usuario">{representante.id}</dd></div>
              <div><dt>Cédula</dt><dd className="representantes-admin-cedula">{representante.cedula || '—'}</dd></div>
              <div><dt>Teléfono</dt><dd>{representante.tlf || '—'}</dd></div>
              <div>
                <dt>Atleta(s) a cargo</dt>
                <dd>{totalAtletas(representante.atletas_total)}</dd>
              </div>
            </dl>
            {botonDetalle(representante)}
          </article>
        ))}
      </div>
    </div>
    </div>

    {paginacion}

    {detalle && (
      <RepresentanteDrawer
        key={detalle.id}
        representante={detalle}
        puedeEditar={puedeEditar}
        onClose={() => setDetalle(null)}
        onGuardado={alGuardar}
      />
    )}
    </>
  );
};

export default RepresentantesViewAdmin;
