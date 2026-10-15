import { useEffect, useRef, useState } from 'react';
import {
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clipboard,
  Copy,
  Download,
  FileDown,
  Filter,
  Info,
  LockKeyhole,
  Search,
  Shield,
  UserRound,
  X,
  Eye,
} from 'lucide-react';
import '../../styles/components/admin/AuditoriaAdmin.css';

const auditEvents = [
  {
    key: 'attendance-241024-101422', id: 'AUD-8921', timestamp: '24 Oct 2024, 10:14:22',
    user: 'Raúl Méndez', userId: 'USR-209', initials: 'RM', role: 'Entrenador',
    action: 'Registro de asistencia', resource: 'Asistencia / Grupo Velocidad A',
    detail: "Marcado estado 'Presente' para 12 atletas en sesión matutina de series", trace: 'Completa',
  },
  {
    key: 'category-241024-094805', timestamp: '24 Oct 2024, 09:48:05',
    user: 'Admin Central', userId: 'USR-001', initials: 'AD', role: 'Administrador',
    action: 'Actualización de categoría', resource: 'Categorías / Sub-23 Masculino',
    detail: 'Modificado baremo de marca mínima 100m lisos de 10.82s a 10.75s', trace: 'Completa',
  },
  {
    key: 'sleep-241024-083011', timestamp: '24 Oct 2024, 08:30:11',
    user: 'Sofía Gómez', userId: 'USR-412', initials: 'SG', role: 'Atleta',
    action: 'Registro de sueño', resource: 'Atletas / Sueño & Recuperación',
    detail: 'Registro matutino: 7h 45m, percepción subjetiva de fatiga: 3/10', trace: 'Completa',
  },
  {
    key: 'exercise-231023-182240', timestamp: '23 Oct 2024, 18:22:40',
    user: 'Lucía Vega', userId: 'USR-214', initials: 'LV', role: 'Entrenador',
    action: 'Creación de ejercicio', resource: 'Ejercicios / Fartlek Progresivo 400m',
    detail: 'Añadido nuevo ejercicio aeróbico con 4 bloques y recuperación activa', trace: 'Completa',
  },
  {
    key: 'cine-231023-151019', timestamp: '23 Oct 2024, 15:10:19',
    user: 'Dr. A. Navarro', userId: 'USR-305', initials: 'AN', role: 'Entrenador',
    action: 'Carga de cineantropometría', resource: 'Evaluaciones / Cineantropometría',
    detail: 'Registro de pliegues cutáneos (7 puntos) atleta Mario Vargas', trace: 'Básica / En def.',
    traceNote: 'Trazabilidad pendiente de definir en protocolo técnico',
  },
  {
    key: 'plan-221022-170554', timestamp: '22 Oct 2024, 17:05:54',
    user: 'Raúl Méndez', userId: 'USR-209', initials: 'RM', role: 'Entrenador',
    action: 'Modificación plan de entreno', resource: 'Planes / Mesociclo Fuerza-Velocidad',
    detail: 'Ajuste de volumen semanal de repeticiones en sentadilla pesada', trace: 'Completa',
  },
  {
    key: 'permission-221022-111502', timestamp: '22 Oct 2024, 11:15:02',
    user: 'Admin Central', userId: 'USR-001', initials: 'AD', role: 'Administrador',
    action: 'Revisión de permisos de acceso', resource: 'Permisos / Acceso Módulo Médico',
    detail: 'Habilitado permiso de sólo lectura para staff biomecánico externo', trace: 'Completa',
  },
  {
    key: 'user-211021-164000', timestamp: '21 Oct 2024, 16:40:00',
    user: 'Admin Central', userId: 'USR-001', initials: 'AD', role: 'Administrador',
    action: 'Creación de usuario', resource: 'Usuarios / Atleta Licencia #ES-8821',
    detail: 'Alta de nuevo perfil federado asignado al grupo Fondo y Obstáculos', trace: 'Completa',
  },
];

const roleClass = {
  Administrador: 'audit-role-admin',
  Entrenador: 'audit-role-trainer',
  Atleta: 'audit-role-athlete',
};

const detailChanges = [
  { label: 'Estado de la Sesión', before: 'PENDIENTE_CONFIRMACION', after: 'COMPLETADA_REGISTRADA' },
  { label: 'Total Atletas Presentes', before: '0 atletas (Sin toma)', after: '12 atletas (Presente)' },
  { label: 'Incidencias Justificadas', before: 'Ninguna', after: '1 Justificada (Cita Médica)' },
];

function DemoBanner() {
  return (
    <div className="audit-demo-banner" role="note">
      <Info size={18} aria-hidden="true" />
      <span>Datos demostrativos: registros de ejemplo del diseño de Stitch.</span>
    </div>
  );
}

function TraceBadge({ event }) {
  const pending = event.trace !== 'Completa';
  return (
    <span className={`audit-trace ${pending ? 'audit-trace-pending' : 'audit-trace-complete'}`} title={event.traceNote || undefined}>
      <i aria-hidden="true" />{event.trace}
    </span>
  );
}

function AuditEventRow({ event, onView }) {
  return (
    <tr>
      <td className="audit-tabular audit-nowrap">{event.timestamp}</td>
      <td className="audit-nowrap">
        <div className="audit-user-cell">
          <span className={`audit-avatar ${roleClass[event.role]}`}>{event.initials}</span>
          <span>{event.user}</span>
          <small>({event.userId})</small>
        </div>
      </td>
      <td><span className={`audit-role-badge ${roleClass[event.role]}`}>{event.role}</span></td>
      <td className="audit-action-cell">{event.action}</td>
      <td>{event.resource}</td>
      <td className="audit-operation" title={event.detail}>{event.detail}</td>
      <td className="audit-nowrap"><TraceBadge event={event} /></td>
      <td className="audit-nowrap audit-action-cell">
        <button className="audit-view-button" type="button" onClick={(clickEvent) => onView(event, clickEvent.currentTarget)}>
          Ver detalle<Eye size={15} aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
}

function AuditEventCard({ event, onView }) {
  return (
    <article className="audit-event-card">
      <div className="audit-card-heading">
        <strong>{event.action}</strong>
        <TraceBadge event={event} />
      </div>
      <div className="audit-user-cell">
        <span className={`audit-avatar ${roleClass[event.role]}`}>{event.initials}</span>
        <span>{event.user}</span><small>({event.userId})</small>
      </div>
      <dl className="audit-card-fields">
        <div><dt>Fecha y Hora</dt><dd>{event.timestamp}</dd></div>
        <div><dt>Rol</dt><dd><span className={`audit-role-badge ${roleClass[event.role]}`}>{event.role}</span></dd></div>
        <div><dt>Módulo / Recurso</dt><dd>{event.resource}</dd></div>
        <div><dt>Detalle de Operación</dt><dd>{event.detail}</dd></div>
      </dl>
      <button className="audit-view-button" type="button" onClick={(clickEvent) => onView(event, clickEvent.currentTarget)}>
        Ver detalle<Eye size={15} aria-hidden="true" />
      </button>
    </article>
  );
}

function AuditDetailDrawer({ event, openerRef, onClose }) {
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!event) return undefined;

    const closeOnEscape = (keyboardEvent) => {
      if (keyboardEvent.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    drawerRef.current?.focus();

    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [event, onClose]);

  if (!event) return null;

  const closeAndRestoreFocus = () => {
    onClose();
    requestAnimationFrame(() => openerRef.current?.focus());
  };

  const copyIdentifier = async () => {
    if (!event.id) return;
    await navigator.clipboard.writeText(`#${event.id}`);
  };

  return (
    <div className="audit-drawer-layer">
      <button className="audit-drawer-backdrop" type="button" aria-label="Cerrar detalle de auditoría" onClick={closeAndRestoreFocus} />
      <aside className="audit-drawer" role="dialog" aria-modal="true" aria-labelledby="audit-drawer-title" tabIndex={-1} ref={drawerRef}>
        <header className="audit-drawer-header">
          <div>
            <div className="audit-drawer-badges">
              {event.id && <span className="audit-event-id">#{event.id}</span>}
              <span className="audit-demo-event-badge"><BadgeCheck size={13} />Evento de muestra</span>
            </div>
            <h2 id="audit-drawer-title">Detalle del Evento de Auditoría</h2>
            <p>Datos demostrativos del registro seleccionado.</p>
          </div>
          <button className="audit-icon-button" type="button" onClick={closeAndRestoreFocus} aria-label="Cerrar panel"><X size={19} /></button>
        </header>

        <div className="audit-drawer-body">
          <section className="audit-detail-section">
            <h3><Info size={15} />Metadatos del Evento</h3>
            <dl className="audit-metadata-grid">
              <div><dt>Timestamp Exacto</dt><dd>{event.timestamp}</dd></div>
              <div><dt>Módulo Afectado</dt><dd>{event.resource.split(' / ')[0]}</dd></div>
              <div><dt>Usuario Responsable</dt><dd>{event.user} ({event.userId})</dd></div>
              <div><dt>Rol Detectado</dt><dd><span className={`audit-role-badge ${roleClass[event.role]}`}>{event.role}</span></dd></div>
              <div className="audit-metadata-wide"><dt>Recurso Afectado</dt><dd>{event.resource}</dd></div>
              <div className="audit-metadata-wide"><dt>Detalle de Operación</dt><dd>{event.detail}</dd></div>
            </dl>
          </section>

          {event.id === 'AUD-8921' && (
            <section className="audit-detail-section">
              <div className="audit-detail-section-heading"><h3><Clipboard size={15} />Campos Afectados (Antes / Después)</h3><span>3 atributos modificados</span></div>
              <div className="audit-diff-list">
                {detailChanges.map((change) => (
                  <article className="audit-diff-item" key={change.label}>
                    <h4>{change.label}</h4>
                    <div className="audit-diff-values">
                      <div><small>ANTES</small><span>{change.before}</span></div>
                      <div><small>DESPUÉS</small><span>{change.after}</span></div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="audit-integrity-note">
            <LockKeyhole size={20} aria-hidden="true" />
            <div><strong>Registro Inmutable de Consulta</strong><p>No se admiten modificaciones ni eliminaciones de logs. Este registro de auditoría queda sellado conforme al reglamento técnico de ClubAtletismo PRO.</p></div>
          </section>
        </div>

        <footer className="audit-drawer-footer">
          <button className="audit-copy-button" type="button" onClick={copyIdentifier} disabled={!event.id} title={event.id ? 'Copiar identificador' : 'Identificador no disponible para esta muestra'}>
            <Copy size={15} />Copiar Identificador
          </button>
          <button className="audit-export-button" type="button" disabled title="Disponible cuando exista un endpoint de exportación">
            <Download size={15} />Exportar Registro (.JSON)
          </button>
        </footer>
      </aside>
    </div>
  );
}

export default function AuditoriaAdmin() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const openerRef = useRef(null);

  const handleViewDetail = (event, button) => {
    openerRef.current = button;
    setSelectedEvent(event);
  };

  const closeDrawer = () => setSelectedEvent(null);

  return (
    <div className="audit-admin">
      <div className="audit-demo-banner" role="note"><Info size={17} /><strong>Datos demostrativos</strong><span>Los eventos visibles son ejemplos del diseño de Stitch.</span></div>

      <section className="audit-heading">
        <div>
          <div className="audit-eyebrow"><span />Consola de Control Normativo <b>Administrador (Consulta de Auditoría)</b></div>
          <h1>Registro General de Auditoría Administrativa</h1>
        </div>
        <div className="audit-readonly-banner"><Info size={19} /><span><strong>Módulo de sólo lectura.</strong> Basado en trazabilidad disponible en el sistema (trazabilidad parcial según informe técnico institucional).</span></div>
      </section>

      <section className="audit-filter-panel">
        <div className="audit-filter-heading">
          <div><Filter size={18} /><strong>Filtros de Auditoría Avanzada</strong></div>
          <div className="audit-filter-summary"><span>2,418 eventos registrados</span><button type="button" title="Disponible cuando exista un endpoint de auditoría"><Clipboard size={14} />Restablecer</button></div>
        </div>
        <p className="audit-disabled-note">Filtros disponibles cuando exista un endpoint de auditoría general.</p>
        <div className="audit-filter-grid">
          <label><span>Intervalo de Fechas</span><div className="audit-input-with-icon"><CalendarDays size={15} /><select title="Disponible cuando exista un endpoint de auditoría"><option>Últimos 14 días (11 Oct - 24 Oct)</option><option>Últimas 24 horas</option><option>Últimos 7 días</option><option>Últimos 30 días</option><option>Ciclo Olímpico Actual (Q4)</option><option>Personalizado...</option></select></div></label>
          <label><span>Usuario Responsable</span><div className="audit-input-with-icon"><UserRound size={15} /><select title="Disponible cuando exista un endpoint de auditoría"><option>Todos los usuarios</option><option>Administrador Central (Root)</option><option>Entrenador Raúl Méndez</option><option>Entrenadora Lucía Vega</option><option>Fisioterapeuta Dr. A. Navarro</option><option>Atletas Autogestionados</option></select></div></label>
          <label><span>Rol de Usuario</span><div className="audit-input-with-icon"><Shield size={15} /><select title="Disponible cuando exista un endpoint de auditoría"><option>Todos los roles</option><option>Administrador</option><option>Entrenador</option><option>Atleta</option></select></div></label>
          <label><span>Familia de Eventos / Módulo</span><div className="audit-input-with-icon"><Clipboard size={15} /><select title="Disponible cuando exista un endpoint de auditoría"><option>Todas las familias de eventos</option><option>Usuarios (Creación/Modificación)</option><option>Ejercicios (Catálogo)</option><option>Categorías deportivas</option><option>Asistencia (Registro/Modificación)</option><option>Planes de entrenamiento</option><option>Calidad del sueño</option><option>Evaluaciones y Cineantropometría (Trazabilidad pendiente de definir)</option><option>Permisos y accesos</option></select></div></label>
          <label><span>Búsqueda directa</span><div className="audit-input-with-icon"><Search size={15} /><input title="Disponible cuando exista un endpoint de auditoría" placeholder="#AUD o palabra clave" type="search" /></div></label>
        </div>
      </section>

      <section className="audit-table-section" aria-label="Eventos de auditoría demostrativos">
        <div className="responsive-list audit-responsive-list">
          <div className="responsive-list__table">
            <div className="audit-table-wrap">
              <table className="audit-table">
                <thead><tr><th>Fecha y Hora</th><th>Usuario Responsable</th><th>Rol</th><th>Acción Realizada</th><th>Módulo / Recurso</th><th>Detalle de Operación</th><th>Trazabilidad</th><th>Acción</th></tr></thead>
                <tbody>{auditEvents.map((event) => <AuditEventRow event={event} key={event.key} onView={handleViewDetail} />)}</tbody>
              </table>
            </div>
          </div>
          <div className="responsive-list__cards">
            <div className="audit-cards-list">{auditEvents.map((event) => <AuditEventCard event={event} key={event.key} onView={handleViewDetail} />)}</div>
          </div>
        </div>
        <footer className="audit-pagination">
          <div><label htmlFor="audit-page-size">Mostrar filas:</label><select id="audit-page-size" defaultValue="25" title="Disponible cuando exista un endpoint de auditoría"><option value="15">15</option><option value="25">25</option><option value="50">50</option></select><span>Mostrando registros 1 - 8 de 2,418 (Demostrativo)</span></div>
          <nav aria-label="Paginación de auditoría">
            <button type="button" aria-label="Primera página"><ChevronsLeft size={16} /></button>
            <button type="button" aria-label="Página anterior"><ChevronLeft size={16} /></button>
            <span className="audit-current-page">1</span><button type="button">2</button><button type="button">3</button><span>…</span><button type="button">97</button>
            <button type="button" aria-label="Página siguiente"><ChevronRight size={16} /></button>
            <button type="button" aria-label="Última página"><ChevronsRight size={16} /></button>
          </nav>
        </footer>
      </section>

      <AuditDetailDrawer event={selectedEvent} openerRef={openerRef} onClose={closeDrawer} />
    </div>
  );
}