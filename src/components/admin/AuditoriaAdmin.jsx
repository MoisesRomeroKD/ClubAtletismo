import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Clipboard, Copy, Download, Filter, SlidersHorizontal, Info, Search, Shield, Trash2, UserRound, X, Eye } from 'lucide-react';
import AuditoriaService from '../../api/services/AuditoriaService';
import { exportToExcel, exportToPdf } from '../../api/services/reportExport';
import '../../styles/components/admin/AuditoriaAdmin.css';

const roleClass = {
  administrador: 'audit-role-admin',
  entrenador: 'audit-role-trainer',
  atleta: 'audit-role-athlete',
};

const ROLES = [
  ['administrador', 'Administrador'],
  ['entrenador', 'Entrenador'],
  ['atleta', 'Atleta'],
];

const SIN_ROL = 'Sin rol en la BD';

const hoyISO = () => {
  const hoy = new Date();
  const local = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const haceDiasISO = (dias) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const FILTROS_INICIALES = () => ({ desde: haceDiasISO(30), hasta: hoyISO(), usuario: '', rol: '', modulo: '', buscar: '' });

const capitalizar = (texto) => (texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : '');

const iniciales = (nombre) => (nombre || '?')
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((parte) => parte[0].toUpperCase())
  .join('');

// Fecha y hora en que se hizo la acción.
const formatFecha = (evento) => {
  return new Date(evento.fecha).toLocaleString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const mensajeError = (error, fallback) => {
  const data = error?.response?.data;
  return typeof data?.detail === 'string' ? data.detail : fallback;
};

function SinDato({ children }) {
  return <small className="audit-sin-dato"><AlertTriangle size={12} aria-hidden="true" />{children}</small>;
}

function FechaEvento({ evento }) {
  return <span>{formatFecha(evento)}</span>;
}

function NombreUsuario({ evento }) {
  return evento.usuario ? <span>{evento.usuario}</span> : <SinDato>Sin usuario en la BD</SinDato>;
}

function RolBadge({ rol }) {
  if (!rol) return <SinDato>{SIN_ROL}</SinDato>;
  return <span className={`audit-role-badge ${roleClass[rol.toLowerCase()] || ''}`}>{capitalizar(rol)}</span>;
}

function Usuario({ evento }) {
  return (
    <div className="audit-user-cell">
      <span className={`audit-avatar ${roleClass[(evento.rol || '').toLowerCase()] || ''}`}>{iniciales(evento.usuario)}</span>
      <NombreUsuario evento={evento} />
    </div>
  );
}

function Cedula({ evento }) {
  return evento.cedula ? <span>{evento.cedula}</span> : <SinDato>Sin cédula en la BD</SinDato>;
}

// En la lista solo va nombre, cédula, rol y módulo; lo demás está en "Ver detalle".
function AuditEventRow({ evento, onView }) {
  return (
    <tr>
      <td className="audit-nowrap"><Usuario evento={evento} /></td>
      <td className="audit-tabular audit-nowrap"><Cedula evento={evento} /></td>
      <td><RolBadge rol={evento.rol} /></td>
      <td>{evento.modulo_label}</td>
      <td className="audit-nowrap audit-action-cell">
        <button className="audit-view-button" type="button" onClick={(clickEvent) => onView(evento, clickEvent.currentTarget)}>
          Ver detalle<Eye size={15} aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
}

function AuditEventCard({ evento, onView }) {
  return (
    <article className="audit-event-card">
      <div className="audit-card-heading audit-card-heading--modulo">
        <Usuario evento={evento} />
        <span className="audit-card-modulo">{evento.modulo_label}</span>
      </div>
      <dl className="audit-card-fields">
        <div><dt>Cédula</dt><dd><Cedula evento={evento} /></dd></div>
        <div><dt>Rol</dt><dd><RolBadge rol={evento.rol} /></dd></div>
      </dl>
      <button className="audit-view-button" type="button" onClick={(clickEvent) => onView(evento, clickEvent.currentTarget)}>
        Ver detalle<Eye size={15} aria-hidden="true" />
      </button>
    </article>
  );
}

function AuditDetailDrawer({ evento, openerRef, onClose }) {
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!evento) return undefined;

    const closeOnEscape = (keyboardEvent) => {
      if (keyboardEvent.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    drawerRef.current?.focus();

    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [evento, onClose]);

  if (!evento) return null;

  const closeAndRestoreFocus = () => {
    onClose();
    requestAnimationFrame(() => openerRef.current?.focus());
  };

  const copyIdentifier = async () => {
    await navigator.clipboard.writeText(`#${evento.id}`);
  };

  const exportarJson = () => {
    const blob = new Blob([JSON.stringify(evento, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `auditoria_${evento.id}.json`;
    enlace.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="audit-drawer-layer">
      <button className="audit-drawer-backdrop" type="button" aria-label="Cerrar detalle de auditoría" onClick={closeAndRestoreFocus} />
      <aside className="audit-drawer" role="dialog" aria-modal="true" aria-labelledby="audit-drawer-title" tabIndex={-1} ref={drawerRef}>
        <header className="audit-drawer-header">
          <div>
            <div className="audit-drawer-badges">
              <span className="audit-event-id">#{evento.id}</span>
            </div>
            <h2 id="audit-drawer-title">Detalle del Evento de Auditoría</h2>
            <p>{evento.modulo_label}</p>
          </div>
          <button className="audit-icon-button" type="button" onClick={closeAndRestoreFocus} aria-label="Cerrar panel"><X size={19} /></button>
        </header>

        <div className="audit-drawer-body">
          <section className="audit-detail-section">
            <h3><Info size={15} />Metadatos del Evento</h3>
            <dl className="audit-metadata-grid">
              <div><dt>Fecha y hora</dt><dd><FechaEvento evento={evento} /></dd></div>
              <div><dt>Módulo Afectado</dt><dd>{evento.modulo_label}</dd></div>
              <div><dt>Usuario Responsable</dt><dd><NombreUsuario evento={evento} /></dd></div>
              <div><dt>Cédula</dt><dd><Cedula evento={evento} /></dd></div>
              <div><dt>Acción Realizada</dt><dd>{evento.accion}</dd></div>
              <div>
                <dt>Rol</dt>
                <dd>
                  <RolBadge rol={evento.rol} />
                </dd>
              </div>
              <div className="audit-metadata-wide"><dt>Recurso Afectado</dt><dd>{evento.recurso}</dd></div>
              <div className="audit-metadata-wide"><dt>Detalle de Operación</dt><dd>{evento.detalle || '—'}</dd></div>
            </dl>
          </section>

          <section className="audit-detail-section">
            <div className="audit-detail-section-heading">
              <h3><Clipboard size={15} />Campos Afectados (Antes / Después)</h3>
              {evento.cambios.length > 0 && <span>{evento.cambios.length} campo(s)</span>}
            </div>
            {evento.cambios.length > 0 ? (
              <div className="audit-diff-list">
                {evento.cambios.map((cambio, indice) => (
                  <article className="audit-diff-item" key={`${cambio.campo}-${indice}`}>
                    <h4>{cambio.campo}</h4>
                    <div className="audit-diff-values">
                      <div><small>ANTES</small><span>{cambio.antes || '—'}</span></div>
                      <div><small>DESPUÉS</small><span>{cambio.despues || '—'}</span></div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <SinDato>Sin cambios de campos registrados.</SinDato>
            )}
          </section>

          <section className="audit-integrity-note">
            <Info size={20} aria-hidden="true" />
            <div>
              <strong>Registrado al momento</strong>
              <p>Se guardó en la tabla de auditoría en el mismo momento de la acción. No se puede editar ni borrar.</p>
            </div>
          </section>
        </div>

        <footer className="audit-drawer-footer">
          <button className="audit-copy-button" type="button" onClick={copyIdentifier} title="Copiar identificador">
            <Copy size={15} />Copiar Identificador
          </button>
          <button className="audit-export-button" type="button" onClick={exportarJson}>
            <Download size={15} />Exportar Registro (.JSON)
          </button>
        </footer>
      </aside>
    </div>
  );
}

function paginasVisibles(actual, total) {
  const paginas = new Set([1, total, actual - 1, actual, actual + 1].filter((n) => n >= 1 && n <= total));
  return [...paginas].sort((a, b) => a - b);
}

export default function AuditoriaAdmin() {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [texto, setTexto] = useState('');
  // En celular los filtros van detrás del botón "Filtros" (en monitores siempre se ven).
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [pagina, setPagina] = useState({ page: 1, pageSize: 25 });
  const [resultado, setResultado] = useState({ clave: '', data: null, error: '' });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const openerRef = useRef(null);
  // Exportar y vaciar: el borrado solo se habilita después de exportar en esta misma pantalla.
  const [exportacion, setExportacion] = useState(null);
  const [exportando, setExportando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [palabra, setPalabra] = useState('');
  const [vaciando, setVaciando] = useState(false);
  const [aviso, setAviso] = useState({ tipo: '', texto: '' });
  const [version, setVersion] = useState(0);

  const params = useMemo(() => ({
    ...Object.fromEntries(Object.entries(filtros).filter(([, valor]) => valor)),
    page: pagina.page,
    page_size: pagina.pageSize,
  }), [filtros, pagina]);
  const clave = JSON.stringify(params);

  useEffect(() => {
    let activo = true;
    AuditoriaService.getEventos(params)
      .then((data) => { if (activo) setResultado({ clave, data, error: '' }); })
      .catch((error) => { if (activo) setResultado({ clave, data: null, error: mensajeError(error, 'No se pudo cargar la auditoría.') }); });
    return () => { activo = false; };
  }, [params, clave, version]);

  const exportarTodo = async () => {
    setExportando(true);
    setAviso({ tipo: '', texto: '' });
    try {
      const datos = await AuditoriaService.exportarTodo();
      const fechaArchivo = datos.fecha.slice(0, 10);
      const registros = {
        title: 'Registros',
        columns: [
          { key: 'fecha', label: 'Fecha y hora', exportValue: (fila) => formatFecha(fila) },
          { key: 'usuario', label: 'Usuario', exportValue: (fila) => fila.usuario || 'Sin usuario en la BD' },
          { key: 'cedula', label: 'Cédula' },
          { key: 'rol', label: 'Rol' },
          { key: 'modulo_label', label: 'Módulo' },
          { key: 'accion', label: 'Acción' },
          { key: 'recurso', label: 'Recurso' },
          { key: 'detalle', label: 'Detalle' },
        ],
        rows: datos.results,
      };
      const cambios = {
        title: 'Cambios',
        columns: [
          { key: 'registro', label: 'Registro' },
          { key: 'fecha', label: 'Fecha y hora' },
          { key: 'modulo', label: 'Módulo' },
          { key: 'recurso', label: 'Recurso' },
          { key: 'campo', label: 'Campo' },
          { key: 'antes', label: 'Antes' },
          { key: 'despues', label: 'Después' },
        ],
        rows: datos.results.flatMap((fila) => fila.cambios.map((cambio) => ({
          registro: `#${fila.id}`,
          fecha: formatFecha(fila),
          modulo: fila.modulo_label,
          recurso: fila.recurso,
          ...cambio,
        }))),
      };
      exportToExcel(`auditoria_${fechaArchivo}`, [registros, cambios]);
      exportToPdf(`auditoria_${fechaArchivo}`, `Auditoría completa (${datos.total} registros)`, [registros]);
      setExportacion({ id: datos.exportacion_id, total: datos.total });
      setAviso({
        tipo: 'ok',
        texto: 'Se descargaron 2 archivos. Revisa que se abran bien y tengan todos los registros antes de borrar la auditoría.',
      });
    } catch (error) {
      setAviso({ tipo: 'error', texto: mensajeError(error, 'No se pudo exportar la auditoría.') });
    } finally {
      setExportando(false);
    }
  };

  const vaciar = async () => {
    setVaciando(true);
    try {
      const respuesta = await AuditoriaService.vaciar(exportacion.id, palabra);
      setAviso({ tipo: 'ok', texto: respuesta.detail });
      setExportacion(null);
      setConfirmando(false);
      setPalabra('');
      setVersion((n) => n + 1);
    } catch (error) {
      setAviso({ tipo: 'error', texto: mensajeError(error, 'No se pudo vaciar la auditoría.') });
    } finally {
      setVaciando(false);
    }
  };

  const cargando = resultado.clave !== clave;
  const data = resultado.data;
  // El backend decide: superusuario o administrador con el permiso vaciar_auditoria.
  const puedeVaciar = Boolean(data?.puede_vaciar);
  const eventos = data?.results ?? [];
  const cambiarFiltro = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setPagina((prev) => ({ ...prev, page: 1 }));
  };
  const restablecer = () => {
    setFiltros(FILTROS_INICIALES());
    setTexto('');
    setPagina((prev) => ({ ...prev, page: 1 }));
  };
  const irA = (page) => setPagina((prev) => ({ ...prev, page }));

  const handleViewDetail = (evento, button) => {
    openerRef.current = button;
    setSelectedEvent(evento);
  };

  const closeDrawer = () => setSelectedEvent(null);
  const totalPaginas = data?.paginas ?? 1;
  const paginaActual = data?.page ?? pagina.page;
  const primero = data?.count ? (paginaActual - 1) * data.page_size + 1 : 0;
  const ultimo = data ? Math.min(paginaActual * data.page_size, data.count) : 0;

  // Filtros: se pintan en la barra (monitores) y en el panel "Filtros" (celular).
  const controlesFiltro1 = (
    <>
        <div className="audit-filter-grid">
          <label>
            <span>Intervalo de Fechas</span>
            <div className="audit-date-range">
              <div className="audit-input-with-icon"><CalendarDays size={15} /><input type="date" value={filtros.desde} max={filtros.hasta} onChange={(event) => cambiarFiltro('desde', event.target.value)} aria-label="Desde" /></div>
              <div className="audit-input-with-icon"><CalendarDays size={15} /><input type="date" value={filtros.hasta} min={filtros.desde} onChange={(event) => cambiarFiltro('hasta', event.target.value)} aria-label="Hasta" /></div>
            </div>
          </label>
          <label>
            <span>Usuario Responsable</span>
            <div className="audit-input-with-icon"><UserRound size={15} />
              <select value={filtros.usuario} onChange={(event) => cambiarFiltro('usuario', event.target.value)}>
                <option value="">Todos los usuarios</option>
                {(data?.usuarios ?? []).map((usuario) => <option key={usuario.id} value={String(usuario.id)}>{usuario.nombre}</option>)}
              </select>
            </div>
          </label>
          <label>
            <span>Rol de Usuario</span>
            <div className="audit-input-with-icon"><Shield size={15} />
              <select value={filtros.rol} onChange={(event) => cambiarFiltro('rol', event.target.value)}>
                <option value="">Todos los roles</option>
                {ROLES.map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}
              </select>
            </div>
          </label>
          <label>
            <span>Familia de Eventos / Módulo</span>
            <div className="audit-input-with-icon"><Clipboard size={15} />
              <select value={filtros.modulo} onChange={(event) => cambiarFiltro('modulo', event.target.value)}>
                <option value="">Todos los módulos</option>
                {(data?.modulos ?? []).map((modulo) => <option key={modulo.id} value={modulo.id}>{modulo.nombre}</option>)}
              </select>
            </div>
          </label>
          <label>
            <span>Buscar por cédula o nombre</span>
            <div className="audit-input-with-icon"><Search size={15} />
              <input
                type="search"
                placeholder="Cédula o nombre y Enter"
                value={texto}
                onChange={(event) => {
                  setTexto(event.target.value);
                  if (!event.target.value) cambiarFiltro('buscar', '');
                }}
                onKeyDown={(event) => { if (event.key === 'Enter') cambiarFiltro('buscar', texto.trim()); }}
              />
            </div>
          </label>
        </div>
    </>
  );

  return (
    <div className="audit-admin">
      <section className="audit-heading">
        <div>
          <div className="audit-eyebrow"><span />Consola de Control Normativo <b>Administrador (Consulta de Auditoría)</b></div>
          <h1>Registro General de Auditoría Administrativa</h1>
        </div>
        {puedeVaciar && (
          <div className="audit-vaciado-acciones">
            <button type="button" className="audit-export-button" onClick={exportarTodo} disabled={exportando || vaciando}>
              <Download size={15} />{exportando ? 'Exportando...' : 'Exportar auditoría completa'}
            </button>
            <button
              type="button"
              className="audit-export-button audit-vaciar-button"
              onClick={() => setConfirmando(true)}
              disabled={!exportacion || vaciando}
              title={exportacion ? undefined : 'Primero exporta la auditoría completa'}
            >
              <Trash2 size={15} />Borrar auditoría
            </button>
          </div>
        )}
      </section>

      {aviso.texto && (
        <div className={`audit-vaciado-aviso audit-vaciado-aviso--${aviso.tipo}`} role={aviso.tipo === 'error' ? 'alert' : 'status'}>
          <span>{aviso.texto}</span>
          <button type="button" onClick={() => setAviso({ tipo: '', texto: '' })} aria-label="Cerrar aviso"><X size={16} /></button>
        </div>
      )}

      {confirmando && exportacion && (
        <form
          className="audit-vaciado-confirmar"
          onSubmit={(event) => { event.preventDefault(); vaciar(); }}
        >
          <p>
            Se borrarán los <strong>{exportacion.total}</strong> registros que se exportaron. Los cambios hechos después de exportar
            se conservan, y el vaciado queda registrado. Escribe <strong>BORRAR</strong> para confirmar.
          </p>
          <div className="audit-vaciado-confirmar__fila">
            <input
              type="text"
              value={palabra}
              onChange={(event) => setPalabra(event.target.value)}
              placeholder="BORRAR"
              aria-label="Escribe BORRAR para confirmar"
              autoComplete="off"
            />
            <button type="button" className="audit-export-button" onClick={() => { setConfirmando(false); setPalabra(''); }}>
              Cancelar
            </button>
            <button type="submit" className="audit-export-button audit-vaciar-button" disabled={palabra.trim().toUpperCase() !== 'BORRAR' || vaciando}>
              <Trash2 size={15} />{vaciando ? 'Borrando...' : 'Borrar definitivamente'}
            </button>
          </div>
        </form>
      )}

      <section className="audit-filter-panel">
        <div className="audit-filter-heading">
          <div><Filter size={18} /><strong>Filtros de Auditoría Avanzada</strong></div>
          <div className="audit-filter-summary">
            <span>{data ? `${data.count.toLocaleString('es-VE')} eventos encontrados` : '—'}</span>
            <button type="button" onClick={restablecer}><Clipboard size={14} />Restablecer</button>
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
          </div>
        </div>
        <div className="filtros-escritorio">{controlesFiltro1}</div>
      </section>

      <section className="audit-table-section" aria-label="Eventos de auditoría">
        {resultado.error && !cargando ? (
          <p className="audit-estado audit-estado--error" role="alert">{resultado.error}</p>
        ) : cargando && !data ? (
          <p className="audit-estado">Cargando auditoría...</p>
        ) : !eventos.length ? (
          <p className="audit-estado">No hay eventos con esos filtros.</p>
        ) : (
          <div className={`responsive-list audit-responsive-list${cargando ? ' audit-cargando' : ''}`}>
            <div className="responsive-list__table">
              <div className="audit-table-wrap">
                <table className="audit-table">
                  <thead><tr><th>Nombre</th><th>Cédula</th><th>Rol</th><th>Módulo</th><th>Acción</th></tr></thead>
                  <tbody>{eventos.map((evento) => <AuditEventRow evento={evento} key={evento.id} onView={handleViewDetail} />)}</tbody>
                </table>
              </div>
            </div>
            <div className="responsive-list__cards">
              <div className="audit-cards-list">{eventos.map((evento) => <AuditEventCard evento={evento} key={evento.id} onView={handleViewDetail} />)}</div>
            </div>
          </div>
        )}
        {data?.count > 0 && (
          <footer className="audit-pagination">
            <div>
              <label htmlFor="audit-page-size">Mostrar filas:</label>
              <select id="audit-page-size" value={pagina.pageSize} onChange={(event) => setPagina({ page: 1, pageSize: Number(event.target.value) })}>
                <option value={15}>15</option><option value={25}>25</option><option value={50}>50</option>
              </select>
              <span>Mostrando registros {primero} - {ultimo} de {data.count.toLocaleString('es-VE')}</span>
            </div>
            <nav aria-label="Paginación de auditoría">
              <button type="button" aria-label="Primera página" disabled={paginaActual <= 1} onClick={() => irA(1)}><ChevronsLeft size={16} /></button>
              <button type="button" aria-label="Página anterior" disabled={paginaActual <= 1} onClick={() => irA(paginaActual - 1)}><ChevronLeft size={16} /></button>
              {paginasVisibles(paginaActual, totalPaginas).map((numero, indice, lista) => (
                <span key={numero} className="audit-page-group">
                  {indice > 0 && numero - lista[indice - 1] > 1 && <span>…</span>}
                  {numero === paginaActual
                    ? <span className="audit-current-page">{numero}</span>
                    : <button type="button" onClick={() => irA(numero)}>{numero}</button>}
                </span>
              ))}
              <button type="button" aria-label="Página siguiente" disabled={paginaActual >= totalPaginas} onClick={() => irA(paginaActual + 1)}><ChevronRight size={16} /></button>
              <button type="button" aria-label="Última página" disabled={paginaActual >= totalPaginas} onClick={() => irA(totalPaginas)}><ChevronsRight size={16} /></button>
            </nav>
          </footer>
        )}
      </section>

      <AuditDetailDrawer evento={selectedEvent} openerRef={openerRef} onClose={closeDrawer} />
    </div>
  );
}
