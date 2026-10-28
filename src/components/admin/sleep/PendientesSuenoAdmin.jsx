import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import UserService from '../../../api/services/Userservice';
import { useApplicationPermissions } from '../../../context/ApplicationPermissionsContext';
import SleepRegistrationView from '../../trainer/sleeptracker/SleepRegistrationView';
import '../../../styles/components/admin/sleep/PendientesSuenoAdmin.css';
import CargaCircular from '../../layout/CargaCircular';

const PAGE_SIZE = 15;
const ESPERA_BUSQUEDA_MS = 350;

function mensajeError(error) {
  return error.response?.data?.detail
    || error.response?.data?.message
    || error.message
    || 'No se pudieron cargar los pendientes de sueño.';
}

const iniciales = (nombre) => nombre.split(/\s+/).filter(Boolean).map((parte) => parte[0]).join('').slice(0, 2).toUpperCase();

// Pendientes de sueño de hoy del administrador: el backend manda 15 por página y filtra.
// Al registrar, el atleta sale de la página sin recargar; si la página queda vacía se piden los 15 siguientes.
export default function PendientesSuenoAdmin() {
  const { hasPermission } = useApplicationPermissions();
  const puedeRegistrar = hasPermission('registrar_descanso');

  const [texto, setTexto] = useState('');
  const [filtros, setFiltros] = useState({ buscar: '', area: '', subarea: '' });
  const [cursor, setCursor] = useState(null);
  const [numeroPagina, setNumeroPagina] = useState(1);
  const [resultado, setResultado] = useState({ clave: '', data: null, error: '' });
  const [atletaARegistrar, setAtletaARegistrar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState('');
  // En celular el buscador y los filtros van detrás del botón "Filtros" (en monitores siempre se ven).
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  // Con el drawer de registro abierto: solo se desplaza el drawer y Escape lo cierra.
  const drawerAbierto = Boolean(atletaARegistrar);
  useEffect(() => {
    if (!drawerAbierto) return undefined;
    document.documentElement.classList.add('scroll-bloqueado');
    const alPresionar = (evento) => { if (evento.key === 'Escape' && !guardando) setAtletaARegistrar(null); };
    window.addEventListener('keydown', alPresionar);
    return () => {
      document.documentElement.classList.remove('scroll-bloqueado');
      window.removeEventListener('keydown', alPresionar);
    };
  }, [drawerAbierto, guardando]);

  const cambiarFiltro = (cambios) => {
    setFiltros((prev) => ({ ...prev, ...cambios }));
    setCursor(null);
    setNumeroPagina(1);
  };

  // La búsqueda (cédula o nombre) se manda al backend un momento después de dejar de escribir.
  useEffect(() => {
    const espera = setTimeout(() => {
      const buscar = texto.trim();
      setFiltros((prev) => (prev.buscar === buscar ? prev : { ...prev, buscar }));
      setCursor(null);
      setNumeroPagina(1);
    }, ESPERA_BUSQUEDA_MS);
    return () => clearTimeout(espera);
  }, [texto]);

  // "Buscar" aplica la búsqueda de inmediato, sin esperar a que se deje de escribir.
  const buscarAhora = (event) => {
    event.preventDefault();
    cambiarFiltro({ buscar: texto.trim() });
  };

  const params = useMemo(() => {
    const p = {};
    if (filtros.buscar) p.buscar = filtros.buscar;
    if (filtros.area) p.area = filtros.area;
    if (filtros.subarea) p.subarea = filtros.subarea;
    if (cursor?.despues) p.despues_de = cursor.despues;
    if (cursor?.antes) p.antes_de = cursor.antes;
    return p;
  }, [filtros, cursor]);
  const clave = JSON.stringify(params);

  useEffect(() => {
    let activo = true;
    UserService.getPendientesSuenoHoy(params)
      .then((data) => {
        if (!activo) return;
        // Si después de ese atleta ya no queda nadie pero sí hay pendientes, se vuelve al inicio.
        if (cursor && !data.results.length && data.total) {
          setCursor(null);
          setNumeroPagina(1);
          return;
        }
        setResultado({ clave, data, error: '' });
      })
      .catch((error) => { if (activo) setResultado({ clave, data: null, error: mensajeError(error) }); });
    return () => { activo = false; };
  }, [params, clave, cursor]);

  const data = resultado.data;
  const cargando = resultado.clave !== clave;
  const atletas = data?.results ?? [];
  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const subareas = data?.opciones.find((opcion) => opcion.area === filtros.area)?.subareas ?? [];

  const irA = (direccion) => {
    if (!atletas.length) return;
    if (direccion === 'siguiente') {
      setCursor({ despues: atletas[atletas.length - 1].id });
      setNumeroPagina((n) => n + 1);
    } else {
      setCursor({ antes: atletas[0].id });
      setNumeroPagina((n) => Math.max(n - 1, 1));
    }
  };

  const guardarSueno = async (athleteId, quality) => {
    setGuardando(true);
    try {
      const response = await UserService.registerSleep(athleteId, quality);
      if (response.status !== 'success') {
        throw new Error(response.message || 'No se pudo registrar el sueño.');
      }
      const quedan = atletas.filter((atleta) => atleta.id !== athleteId);
      setAviso(`Registro de sueño guardado para ${atletaARegistrar?.name || 'el atleta'}.`);
      setAtletaARegistrar(null);
      // Solo sale de la página en pantalla: no se recarga ni entra otro en su lugar.
      setResultado((prev) => ({
        ...prev,
        data: prev.data && {
          ...prev.data,
          results: prev.data.results.filter((atleta) => atleta.id !== athleteId),
          total: Math.max(prev.data.total - 1, 0),
          total_pendientes: Math.max(prev.data.total_pendientes - 1, 0),
        },
      }));
      if (!quedan.length && data.total > 1) setCursor({ despues: athleteId });
      return response;
    } finally {
      setGuardando(false);
    }
  };

  // "Registrar" abre el formulario en un drawer encima de la lista (la lista no se borra).
  // Se le pasan el área y las subáreas reales del atleta (vienen en sus asignaciones).
  const atletaDelDrawer = atletaARegistrar && {
    ...atletaARegistrar,
    area: [...new Set((atletaARegistrar.asignaciones || []).map((asignacion) => asignacion.area).filter(Boolean))].join(', ') || 'Sin área asignada',
    subarea: (atletaARegistrar.asignaciones || []).map((asignacion) => asignacion.subarea).filter(Boolean).join(', ') || 'Sin subárea asignada',
  };
  const cerrarDrawer = () => { if (!guardando) setAtletaARegistrar(null); };

  const drawerRegistro = atletaDelDrawer && createPortal(
    <>
      <div className="pend-sueno-drawer__fondo" onClick={cerrarDrawer} aria-hidden="true" />
      <aside className="pend-sueno-drawer" role="dialog" aria-modal="true" aria-label={`Registrar sueño de ${atletaDelDrawer.name}`}>
        <SleepRegistrationView
          athlete={atletaDelDrawer}
          onSave={guardarSueno}
          onCancel={cerrarDrawer}
          isSaving={guardando}
          systemDate={data?.fecha}
        />
      </aside>
    </>,
    document.body,
  );

  const paginacion = (abajo) => (
    <div className={`pend-sueno__pagination${abajo ? ' pend-sueno__pagination--bottom' : ''}`} aria-label="Paginación">
      <button
        className="pend-sueno__button pend-sueno__button--secondary"
        type="button"
        onClick={() => irA('anterior')}
        disabled={cargando || !data?.hay_anterior}
      >
        Anterior
      </button>
      <span>Página {data?.total ? Math.min(numeroPagina, totalPaginas) : 0} de {data?.total ? totalPaginas : 0}</span>
      <button
        className="pend-sueno__button pend-sueno__button--secondary"
        type="button"
        onClick={() => irA('siguiente')}
        disabled={cargando || !data?.hay_siguiente}
      >
        Siguiente
      </button>
    </div>
  );

  // Filtros: se pintan en la barra (monitores) y en el panel "Filtros" (celular).
  const controlesFiltro1A = (
    <>
          <form className="pend-sueno__busqueda" onSubmit={buscarAhora}>
            <label htmlFor="pend-sueno-cedula">Buscar atleta por cédula o nombre</label>
            <div className="pend-sueno__search-control">
              <div className="pend-sueno__input-wrap">
                <Search size={17} aria-hidden="true" />
                <input
                  id="pend-sueno-cedula"
                  type="text"
                  placeholder="Cédula o nombre del atleta..."
                  value={texto}
                  onChange={(event) => setTexto(event.target.value)}
                  autoComplete="off"
                />
                {texto && (
                  <button type="button" className="pend-sueno__limpiar" onClick={() => setTexto('')} aria-label="Borrar texto de búsqueda">
                    <X size={16} />
                  </button>
                )}
              </div>
              <button type="submit" className="pend-sueno__button pend-sueno__button--primary">Buscar</button>
            </div>
          </form>
    </>
  );

  // Filtros: se pintan en la barra (monitores) y en el panel "Filtros" (celular).
  const controlesFiltro1B = (
    <>
        <div className="pend-sueno__filters">
          <div className="pend-sueno__field">
            <label htmlFor="pend-sueno-area">Área</label>
            <select
              id="pend-sueno-area"
              value={filtros.area}
              onChange={(event) => cambiarFiltro({ area: event.target.value, subarea: '' })}
            >
              <option value="">Todas las áreas</option>
              {(data?.opciones ?? []).map(({ area }) => <option key={area} value={area}>{area}</option>)}
            </select>
          </div>
          <div className="pend-sueno__field">
            <label htmlFor="pend-sueno-subarea">Subárea</label>
            <select
              id="pend-sueno-subarea"
              value={filtros.subarea}
              onChange={(event) => cambiarFiltro({ subarea: event.target.value })}
              disabled={!filtros.area}
            >
              <option value="">{filtros.area ? 'Todas las subáreas' : 'Elige un área primero'}</option>
              {subareas.map((subarea) => <option key={subarea} value={subarea}>{subarea}</option>)}
            </select>
          </div>
        </div>
    </>
  );

  return (
    <section className="pend-sueno">
      <header className="pend-sueno__header">
        <h1>Sueño y Descanso</h1>
        <div className="pend-sueno__header-derecha">
          <span className="pend-sueno__contador">Pendientes ({data ? data.total_pendientes : '…'})</span>
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
                {controlesFiltro1A}
                {controlesFiltro1B}
              </div>
              <footer className="filtros-sheet__footer">
                <button type="button" className="filtros-sheet__btn" onClick={() => setFiltrosAbiertos(false)}>Cerrar</button>
                <button type="button" className="filtros-sheet__btn filtros-sheet__btn--primario" onClick={() => setFiltrosAbiertos(false)}>Aplicar filtros</button>
              </footer>
            </div>,
            document.body,
          )}
          <div className="filtros-escritorio">{controlesFiltro1A}</div>
        </div>
      </header>

      {aviso && (
        <div className="pend-sueno__notice pend-sueno__notice--success" role="status">
          <span>{aviso}</span>
          <button type="button" onClick={() => setAviso('')} aria-label="Cerrar aviso"><X size={16} /></button>
        </div>
      )}

      {data?.registrados_coinciden.length > 0 && (
        <div className="pend-sueno__notice pend-sueno__notice--info">
          <span>
            Ya registraron su sueño hoy:{' '}
            {data.registrados_coinciden.map((atleta) => `${atleta.name} (Cédula ${atleta.cedula})`).join(', ')}
            {data.total_registrados_coinciden > data.registrados_coinciden.length
              ? ` y ${data.total_registrados_coinciden - data.registrados_coinciden.length} más`
              : ''}
          </span>
        </div>
      )}

      {resultado.error && !cargando && (
        <div className="pend-sueno__notice pend-sueno__notice--error" role="alert">{resultado.error}</div>
      )}

      <section className="pend-sueno__results" aria-label="Atletas pendientes de registrar su sueño">
        <div className="pend-sueno__section-heading">
          <div>
            <h2>Atletas</h2>
            <p>{data ? `${data.total} resultados · ${PAGE_SIZE} por página` : 'Cargando página...'}</p>
          </div>
          {paginacion(false)}
        </div>

        <div className="filtros-escritorio">{controlesFiltro1B}</div>

        {!data ? (
          <CargaCircular texto="Cargando atletas" enLinea />
        ) : atletas.length === 0 ? (
          <div className="pend-sueno__empty">
            {filtros.buscar || filtros.area
              ? 'Ningún atleta pendiente coincide con la búsqueda o los filtros.'
              : 'No hay atletas pendientes de registrar su sueño hoy.'}
          </div>
        ) : (
          <ul className={`pend-sueno__athlete-list${cargando ? ' is-loading' : ''}`}>
            {atletas.map((atleta) => (
              <li className="pend-sueno__athlete" key={atleta.id}>
                <div className="pend-sueno__athlete-info">
                  <span className="pend-sueno__avatar" aria-hidden="true">{iniciales(atleta.name)}</span>
                  <div className="pend-sueno__athlete-details">
                    <h3>{atleta.name}</h3>
                    <p>Cédula <strong>{atleta.cedula}</strong> · <span className="ref-usuario">Ref. {atleta.id}</span></p>
                    <p>
                      Subáreas: {atleta.asignaciones.length
                        ? atleta.asignaciones.map((asignacion) => asignacion.subarea).join(', ')
                        : 'Sin subárea asignada'}
                      {' · '}
                      Categoría: {atleta.category || 'No disponible'}
                    </p>
                  </div>
                </div>
                <div className="pend-sueno__actions">
                  <span className="pend-sueno__status">Pendiente hoy</span>
                  {puedeRegistrar && (
                    <button
                      type="button"
                      className="pend-sueno__button pend-sueno__button--primary"
                      onClick={() => { setAviso(''); setAtletaARegistrar(atleta); }}
                    >
                      Registrar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {data?.total > PAGE_SIZE && paginacion(true)}
      </section>
      {drawerRegistro}
    </section>
  );
}
