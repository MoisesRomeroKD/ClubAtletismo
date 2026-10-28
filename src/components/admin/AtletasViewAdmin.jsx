import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, X } from 'lucide-react';
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

// Reglas de formato al editar (las mismas que valida el backend).
const SOLO_LETRAS = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]/g;
const NOMBRE_COMPLETO = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{2,60}$/;
// Cédula: de 1.000.000 a 49.999.999.
const CEDULA_COMPLETA = /^(?:[1-9]\d{6}|[1-4]\d{7})$/;
const TELEFONO_COMPLETO = /^0\d{10}$/;
const GMAIL = /^[a-z0-9](?:\.?[a-z0-9])*@gmail\.com$/;
const RELACIONES = [
  ['Madre', 'Madre'], ['Padre', 'Padre'], ['Tutor Legal', 'Tutor Legal'],
  ['Abuelo/a', 'Abuelo/a'], ['Hermano/a', 'Hermano/a'], ['Otro', 'Otro / Responsable'],
];
const TIPO_CAMPO = {
  cedula: 'cedula', nombres: 'nombre', apellidos: 'nombre', rep_nombres: 'nombre', rep_apellidos: 'nombre',
  rep_cedula: 'cedula', rep_telefono: 'telefono', correo: 'correo',
};

// Último día permitido como fecha de nacimiento: ayer, en hora local (AAAA-MM-DD).
// Edad mínima del atleta: 9 años. Se acepta hasta el 31/12 de (año actual - 9).
// Ej.: en 2026 se puede elegir 2017 o antes; 2020 no.
const EDAD_MINIMA_ATLETA = 9;
const anioMaximoNacimiento = () => Number(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Caracas' }).slice(0, 4)) - EDAD_MINIMA_ATLETA;
const maxNacimiento = () => `${anioMaximoNacimiento()}-12-31`;

// Mientras se escribe, cada campo descarta lo que no le corresponde y devuelve el aviso.
const limpiarCampo = (campo, valor) => {
  const tipo = TIPO_CAMPO[campo];
  let limpio = valor;
  let rechazo = '';
  if (tipo === 'nombre') {
    limpio = valor.replace(SOLO_LETRAS, '').replace(/ {2,}/g, ' ').slice(0, 60);
    if (limpio !== valor) rechazo = 'Aquí solo se escriben letras y espacios.';
  } else if (tipo === 'cedula' || tipo === 'telefono') {
    limpio = valor.replace(/\D/g, '').slice(0, tipo === 'cedula' ? 8 : 11);
    if (limpio !== valor) rechazo = 'Aquí solo se escriben números.';
  } else if (tipo === 'correo') {
    limpio = valor.replace(/\s/g, '').toLowerCase();
    if (limpio !== valor.toLowerCase()) rechazo = 'Aquí no se escriben espacios.';
  }
  return [limpio, rechazo];
};

function EditarAtletaForm({ atleta, onCancel, onGuardado }) {
  const representante = atleta.representantes?.[0];
  const [form, setForm] = useState({
    nombres: atleta.nombres || '',
    apellidos: atleta.apellidos || '',
    cedula: atleta.cedula || '',
    correo: atleta.email || '',
    fecha_nacimiento: atleta.fecha_nacimiento || '',
    sexo: atleta.sexo || 'M',
    rep_nombres: representante?.nombre || '',
    rep_apellidos: representante?.apellido || '',
    rep_telefono: representante?.tlf || '',
    rep_relacion: representante?.tipo_relacion || 'Madre',
    rep_cedula: '',
  });
  // Sin representante: se puede agregar uno (o dejarlo vacío).
  const [agregarRep, setAgregarRep] = useState(false);
  const conRep = Boolean(representante) || agregarRep;
  const [rechazos, setRechazos] = useState({});
  const [erroresServidor, setErroresServidor] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [saving, setSaving] = useState(false);
  // Subáreas: catálogo con sus entrenadores y lo elegido { idSubarea: { turno, entrenador } }.
  const [catalogo, setCatalogo] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [elegidas, setElegidas] = useState({});
  const [subareasTocadas, setSubareasTocadas] = useState(false);

  useEffect(() => {
    let active = true;
    UserService.getAthleteSubareas(atleta.user_id)
      .then((data) => {
        if (!active) return;
        setCatalogo(Array.isArray(data?.subareas) ? data.subareas : []);
        setElegidas(Object.fromEntries((data?.asignadas || []).map((fila) => [
          fila.id, { turno: fila.turno || 'manana', entrenador: fila.entrenador ? String(fila.entrenador) : '' },
        ])));
      })
      .catch(() => { if (active) setErrorCarga('No se pudieron cargar las subáreas.'); });
    return () => { active = false; };
  }, [atleta.user_id]);

  const subareaPorId = Object.fromEntries((catalogo || []).map((subarea) => [subarea.id, subarea]));
  const grupos = {};
  (catalogo || []).forEach((subarea) => {
    const area = subarea.area?.nombre || 'Sin área';
    (grupos[area] = grupos[area] || []).push(subarea);
  });
  const areas = Object.keys(grupos).sort((a, b) => a.localeCompare(b, 'es'));

  const alternarSubarea = (id) => {
    setMensaje('');
    setSubareasTocadas(true);
    setElegidas((actuales) => {
      const nuevas = { ...actuales };
      if (id in nuevas) {
        delete nuevas[id];
      } else {
        // Si la subárea tiene un solo entrenador queda preseleccionado.
        const entrenadores = subareaPorId[id]?.entrenadores || [];
        nuevas[id] = { turno: 'manana', entrenador: entrenadores.length === 1 ? String(entrenadores[0].id) : '' };
      }
      return nuevas;
    });
  };

  const cambiarSubarea = (id, campo, valor) => {
    setMensaje('');
    setSubareasTocadas(true);
    setElegidas((actuales) => ({ ...actuales, [id]: { ...actuales[id], [campo]: valor } }));
  };

  // Cada subárea necesita su entrenador (sin entrenador asignado el atleta no le aparece a nadie).
  const faltaEntrenador = subareasTocadas && Object.values(elegidas).some((fila) => !fila.entrenador);

  const cambiar = (campo, valor) => {
    const [limpio, rechazo] = limpiarCampo(campo, valor);
    setRechazos((previos) => ({ ...previos, [campo]: rechazo }));
    setErroresServidor((previos) => ({ ...previos, [campo]: '' }));
    setMensaje('');
    setForm((previo) => ({ ...previo, [campo]: limpio }));
  };

  const errorFormato = {
    nombres: NOMBRE_COMPLETO.test(form.nombres.trim()) ? '' : 'Escribe al menos 2 letras.',
    apellidos: NOMBRE_COMPLETO.test(form.apellidos.trim()) ? '' : 'Escribe al menos 2 letras.',
    // Si no se cambió, no se revisa: así se pueden guardar otros datos aunque la cédula guardada tenga otro formato.
    cedula: form.cedula === (atleta.cedula || '') || CEDULA_COMPLETA.test(form.cedula)
      ? '' : 'La cédula debe ser un número entre 1.000.000 y 49.999.999 (ej. 12345678).',
    correo: form.correo === (atleta.email || '').toLowerCase() || GMAIL.test(form.correo)
      ? '' : 'Solo se aceptan correos de Gmail (ej. nombre@gmail.com).',
    fecha_nacimiento: form.fecha_nacimiento && form.fecha_nacimiento <= maxNacimiento()
      ? '' : `El atleta debe tener al menos ${EDAD_MINIMA_ATLETA} años: nacido en ${anioMaximoNacimiento()} o antes.`,
    rep_nombres: !conRep || NOMBRE_COMPLETO.test(form.rep_nombres.trim()) ? '' : 'Escribe al menos 2 letras.',
    rep_apellidos: !conRep || NOMBRE_COMPLETO.test(form.rep_apellidos.trim()) ? '' : 'Escribe al menos 2 letras.',
    rep_telefono: !conRep || TELEFONO_COMPLETO.test(form.rep_telefono)
      ? '' : 'El teléfono debe tener 11 números y empezar por 0 (ej. 04141234567).',
    rep_cedula: !agregarRep || CEDULA_COMPLETA.test(form.rep_cedula) ? '' : 'La cédula debe ser un número entre 1.000.000 y 49.999.999 (ej. 12345678).',
  };
  const aviso = (campo) => rechazos[campo] || erroresServidor[campo] || errorFormato[campo] || '';
  const hayErrores = Object.values(errorFormato).some(Boolean) || faltaEntrenador;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (hayErrores) return;
    setSaving(true);
    setMensaje('');
    try {
      let data = await UserService.updateAthlete(atleta.user_id, {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        cedula: form.cedula,
        correo: form.correo,
        fecha_nacimiento: form.fecha_nacimiento,
        sexo: form.sexo,
        ...(conRep && {
          representante: {
            nombres: form.rep_nombres.trim(),
            apellidos: form.rep_apellidos.trim(),
            telefono: form.rep_telefono,
            relacion: form.rep_relacion,
            ...(agregarRep && { cedula: form.rep_cedula }),
          },
        }),
      });
      if (subareasTocadas) {
        data = await UserService.setAthleteSubareas(
          atleta.user_id,
          Object.entries(elegidas).map(([id, fila]) => ({
            id: Number(id),
            turno: fila.turno,
            ...(fila.entrenador && { entrenador: Number(fila.entrenador) }),
          })),
        );
      }
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
      <div className="atletas-editar-campo">
        <label htmlFor={`atleta-editar-${nombre}`}>{etiqueta}</label>
        <input
          id={`atleta-editar-${nombre}`}
          value={form[nombre]}
          onChange={(event) => cambiar(nombre, event.target.value)}
          className={texto ? 'atletas-editar-input--error' : undefined}
          aria-invalid={texto ? true : undefined}
          aria-describedby={texto ? `aviso-atleta-${nombre}` : undefined}
          {...props}
        />
        {texto && <small id={`aviso-atleta-${nombre}`} className="atletas-editar-aviso" role="alert">{texto}</small>}
      </div>
    );
  };

  return (
    <form className="atletas-editar-form" onSubmit={handleSubmit} noValidate>
      <div className="atletas-adm-drawer-body">
        <p className="atletas-adm-drawer-seccion">Datos del atleta</p>
        <div className="atletas-adm-drawer-bloque atletas-editar-bloque">
          {campo('nombres', 'Nombres', { type: 'text', maxLength: 60 })}
          {campo('apellidos', 'Apellidos', { type: 'text', maxLength: 60 })}
          {campo('cedula', 'Cédula', { type: 'text', inputMode: 'numeric', placeholder: 'Ej. 12345678' })}
          {campo('fecha_nacimiento', 'Fecha de nacimiento', { type: 'date', max: maxNacimiento() })}
          <div className="atletas-editar-campo">
            <label htmlFor="atleta-editar-sexo">Sexo</label>
            <select id="atleta-editar-sexo" value={form.sexo} onChange={(event) => setForm((previo) => ({ ...previo, sexo: event.target.value }))}>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
          {campo('correo', 'Correo electrónico', { type: 'email', placeholder: 'nombre@gmail.com' })}
        </div>

        <p className="atletas-adm-drawer-seccion">Subáreas, turno y entrenador</p>
        <div className="atletas-adm-drawer-bloque atletas-editar-bloque">
          <p className="atletas-editar-nota">
            Marca las subáreas en las que entrena el atleta, su turno y su entrenador. Solo se le puede marcar
            Presente dentro del horario de su turno: mañana 8:00–11:30, tarde 13:00–17:30, noche 18:00–21:00.
          </p>
          {errorCarga && <p role="alert" className="atletas-editar-error">{errorCarga}</p>}
          {!catalogo && !errorCarga && <p className="atletas-editar-nota">Cargando subáreas...</p>}
          {catalogo && !areas.length && <p className="atletas-editar-nota">No hay subáreas creadas. Créalas en Áreas y Subáreas.</p>}
          {areas.map((area) => (
            <fieldset key={area} className="atletas-subareas-grupo">
              <legend>{area}</legend>
              {grupos[area].map((subarea) => {
                const fila = elegidas[subarea.id];
                const entrenadores = subarea.entrenadores || [];
                return (
                  <div key={subarea.id} className="atletas-subareas-fila">
                    <label className="atletas-subareas-opcion">
                      <input type="checkbox" checked={Boolean(fila)} onChange={() => alternarSubarea(subarea.id)} />
                      {subarea.nombre}
                    </label>
                    {fila && (
                      <div className="atletas-subareas-detalle">
                        <select
                          className="atletas-subareas-turno"
                          aria-label={`Turno en ${subarea.nombre}`}
                          value={fila.turno}
                          onChange={(event) => cambiarSubarea(subarea.id, 'turno', event.target.value)}
                        >
                          <option value="manana">Mañana</option>
                          <option value="tarde">Tarde</option>
                          <option value="noche">Noche</option>
                        </select>
                        {entrenadores.length ? (
                          <select
                            className={`atletas-subareas-turno${fila.entrenador ? '' : ' atletas-editar-input--error'}`}
                            aria-label={`Entrenador en ${subarea.nombre}`}
                            value={fila.entrenador}
                            onChange={(event) => cambiarSubarea(subarea.id, 'entrenador', event.target.value)}
                          >
                            <option value="">Elige el entrenador</option>
                            {entrenadores.map((entrenador) => (
                              <option key={entrenador.id} value={String(entrenador.id)}>{entrenador.nombre}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="atletas-subareas-entrenador atletas-editar-aviso">
                            Sin entrenadores habilitados: asígnale uno en Entrenadores.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </fieldset>
          ))}
          {faltaEntrenador && (
            <small className="atletas-editar-aviso" role="alert">Cada subárea marcada necesita su entrenador.</small>
          )}
        </div>

        <p className="atletas-adm-drawer-seccion">Familiar responsable</p>
        <div className="atletas-adm-drawer-bloque atletas-editar-bloque atletas-adm-drawer-bloque--ultimo">
          {!conRep ? (
            <>
              <p className="atletas-editar-nota">Este atleta no tiene representante registrado.</p>
              <button type="button" className="atletas-adm-drawer-btn atletas-adm-drawer-btn--ghost" onClick={() => setAgregarRep(true)}>
                + Agregar representante
              </button>
            </>
          ) : (
            <>
              {agregarRep
                ? campo('rep_cedula', 'Cédula del representante', { type: 'text', inputMode: 'numeric', maxLength: 8, placeholder: 'Ej. 12345678' })
                : null}
              {campo('rep_nombres', 'Nombres del representante', { type: 'text', maxLength: 60 })}
              {campo('rep_apellidos', 'Apellidos del representante', { type: 'text', maxLength: 60 })}
              {campo('rep_telefono', 'Teléfono del representante', { type: 'tel', inputMode: 'numeric', maxLength: 11, placeholder: 'Ej. 04141234567' })}
              <div className="atletas-editar-campo">
                <label htmlFor="atleta-editar-rep_relacion">Relación con el atleta</label>
                <select id="atleta-editar-rep_relacion" value={form.rep_relacion} onChange={(event) => setForm((previo) => ({ ...previo, rep_relacion: event.target.value }))}>
                  {RELACIONES.map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
                </select>
              </div>
              {representante && atleta.representantes.length > 1 && (
                <p className="atletas-editar-nota">Este atleta tiene {atleta.representantes.length} representantes; aquí se edita el primero.</p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="atletas-adm-drawer-footer atletas-editar-pie">
        {mensaje && <p className="atletas-editar-error" role="alert">{mensaje}</p>}
        <div className="atletas-editar-botones">
          <button type="button" className="atletas-adm-drawer-btn atletas-adm-drawer-btn--ghost" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="atletas-adm-drawer-btn atletas-adm-drawer-btn--primario" disabled={saving || hayErrores}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </form>
  );
}

// Drawer lateral de perfil, inspirado en el patrón gu-sidePanel / ProfileModal
function PerfilDrawer({ atleta, onClose, puedeEditar, onGuardado }) {
  const open = Boolean(atleta);
  // Se guarda el id del atleta que se está editando: al abrir otro perfil vuelve a modo lectura.
  const [editandoId, setEditandoId] = useState(null);
  const editando = Boolean(atleta) && editandoId === atleta.user_id;

  // Con el drawer abierto solo se desplaza el drawer: se bloquea el scroll de la página (regla en App.css).
  useEffect(() => {
    if (!open) return undefined;
    document.documentElement.classList.add('scroll-bloqueado');
    return () => document.documentElement.classList.remove('scroll-bloqueado');
  }, [open]);

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
              <span className="atletas-adm-drawer-kicker">
                {editando ? 'EDITAR ATLETA' : 'PERFIL DE ATLETA'}
              </span>
              <button type="button" className="atletas-adm-drawer-cerrar" onClick={onClose} aria-label="Cerrar">
                ✕
              </button>
            </div>

            {editando ? (
              <EditarAtletaForm
                key={atleta.user_id}
                atleta={atleta}
                onCancel={() => setEditandoId(null)}
                onGuardado={(data) => { setEditandoId(null); onGuardado(data); }}
              />
            ) : (
            <>
            <div className="atletas-adm-drawer-body">
              <div className="atletas-adm-drawer-identidad">
                <div className="atletas-adm-drawer-avatar">{iniciales(atleta.name)}</div>
                <div>
                  <h2 className="atletas-adm-drawer-nombre">{atleta.name || '-'}</h2>
                  <p className="atletas-adm-drawer-cedula">Cédula {atleta.cedula || '-'}</p>
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
              {atleta.subareas_asignadas?.length > 0 && (
                <p className="atletas-editar-nota atletas-subareas-lista">
                  {atleta.subareas_asignadas.map((subarea) => `${subarea.area ? `${subarea.area} · ` : ''}${subarea.nombre}`).join(', ')}
                </p>
              )}

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
              {puedeEditar && (
                <button
                  type="button"
                  className="atletas-adm-drawer-btn atletas-adm-drawer-btn--primario"
                  onClick={() => setEditandoId(atleta.user_id)}
                >
                  Editar
                </button>
              )}
            </div>
            </>
            )}
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
  // Área, subárea y turno se revisan en la misma ficha del atleta (ej. 100m en la noche).
  const [ubicacion, setUbicacion] = useState({ area: '', subarea: '', turno: '' });
  const [catalogoSubareas, setCatalogoSubareas] = useState([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [perfilAbierto, setPerfilAbierto] = useState(null);
  // En celular el buscador y la categoría van detrás del botón "Filtros" (en monitores siempre se ven).
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
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
    Object.entries(ubicacion).forEach(([clave, valor]) => { if (valor) params[clave] = valor; });
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
  }, [page, buscar, categoriaFiltro, ubicacion]);

  useEffect(() => {
    let active = true;
    UserService.getSubareas()
      .then((data) => { if (active) setCatalogoSubareas(Array.isArray(data) ? data : data?.results || []); })
      .catch(() => { if (active) setCatalogoSubareas([]); });
    return () => { active = false; };
  }, []);

  // Áreas y subáreas para los selectores (la subárea se limita al área elegida).
  const areasFiltro = [...new Map(catalogoSubareas.filter((s) => s.area).map((s) => [s.area.id, s.area])).values()]
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const subareasFiltro = catalogoSubareas.filter((s) => !ubicacion.area || String(s.area?.id) === ubicacion.area);
  const cambiarUbicacion = (campo, valor) => {
    setIsLoading(true);
    setPage(1);
    setUbicacion((actual) => ({ ...actual, [campo]: valor, ...(campo === 'area' && { subarea: '' }) }));
  };

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

  const handleVerPerfil = (item) => setPerfilAbierto(item);
  const handleCerrarPerfil = () => setPerfilAbierto(null);
  // Al guardar la edición se reemplaza el atleta en la lista y en el perfil abierto.
  const handleAtletaEditado = (actualizado) => {
    setAtletas((prev) => prev.map((item) => (item.user_id === actualizado.user_id ? { ...item, ...actualizado } : item)));
    setPerfilAbierto((actual) => (actual ? { ...actual, ...actualizado } : actual));
  };

  // Filtros: se pintan en la barra (monitores) y en el panel "Filtros" (celular).
  const controlesFiltro1 = (
    <>
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
        <select className="atletas-category-select" aria-label="Filtrar atletas por área" value={ubicacion.area} onChange={(event) => cambiarUbicacion('area', event.target.value)}>
          <option value="">Todas las áreas</option>
          {areasFiltro.map((area) => <option key={area.id} value={String(area.id)}>{area.nombre}</option>)}
        </select>
        <select className="atletas-category-select" aria-label="Filtrar atletas por subárea" value={ubicacion.subarea} onChange={(event) => cambiarUbicacion('subarea', event.target.value)}>
          <option value="">Todas las subáreas</option>
          {subareasFiltro.map((subarea) => <option key={subarea.id} value={String(subarea.id)}>{subarea.nombre}</option>)}
        </select>
        <select className="atletas-category-select" aria-label="Filtrar atletas por turno" value={ubicacion.turno} onChange={(event) => cambiarUbicacion('turno', event.target.value)}>
          <option value="">Todos los turnos</option>
          <option value="manana">Mañana</option>
          <option value="tarde">Tarde</option>
          <option value="noche">Noche</option>
        </select>
    </>
  );

  return (
    <div className="atletas-adm">
      {/* FILTRO + ACCIONES */}
      <div className="atletas-adm-filtros">
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
        <span className="atletas-adm-total">
          {totalCount} atleta{totalCount !== 1 ? 's' : ''} en total
        </span>
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
                  <th>Ref.</th>
                  <th>Nombre</th>
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
                    <td className="ref-usuario">{item.user_id}</td>
                    <td>
                      <div className="atletas-adm-nombre">{item.name || '-'}</div>
                      <div className="atletas-adm-cedula">Cédula {item.cedula || '-'}</div>
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
                      <p className="atletas-adm-card-cedula">Cédula {item.cedula || '-'} · <span className="ref-usuario">Ref. {item.user_id}</span></p>
                    </div>
                  </div>
                </div>

                <div className="atletas-adm-card-grid">
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

      <PerfilDrawer
        atleta={perfilAbierto}
        onClose={handleCerrarPerfil}
        puedeEditar={puedeEditarEstado}
        onGuardado={handleAtletaEditado}
      />
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
