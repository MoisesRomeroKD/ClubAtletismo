import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import UserService from '../../../api/services/Userservice';
import '../../../styles/components/trainer/AtletasViewTrainer.css';

const initials = (name = '') => name.split(' ').filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase();

const ESTADO_LABELS = { activo: 'Activo', inactivo: 'Inactivo', justificado: 'Justificado' };

const EstadoBadge = ({ estado }) => (
  <span className={`atletas-estado-badge atletas-estado-${estado}`}>{ESTADO_LABELS[estado] || estado}</span>
);

const DataPoint = ({ label, value }) => (
  <div className="atletas-data-point">
    <span className="atletas-data-point-label">{label}</span>
    <span className="atletas-data-point-value">{value || '—'}</span>
  </div>
);

const useSwipeNavigation = ({ onSwipeLeft, onSwipeRight, threshold = 60 }) => {
  const start = useRef({ x: 0, y: 0 });
  const end = useRef({ x: 0, y: 0 });
  const horizontal = useRef(false);

  const onTouchStart = (e) => {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
    end.current = { x: t.clientX, y: t.clientY };
    horizontal.current = false;
  };

  const onTouchMove = (e) => {
    const t = e.touches[0];
    end.current = { x: t.clientX, y: t.clientY };
    const dx = Math.abs(end.current.x - start.current.x);
    const dy = Math.abs(end.current.y - start.current.y);
    if (dx > dy && dx > 15) horizontal.current = true;
  };

  const onTouchEnd = () => {
    if (!horizontal.current) return;
    const dx = end.current.x - start.current.x;
    if (dx > threshold) onSwipeRight?.();
    else if (dx < -threshold) onSwipeLeft?.();
    horizontal.current = false;
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
};

const ProfileDrawer = ({ athlete, onClose, onPrev, onNext, hasPrev, hasNext, index, total }) => {
  const swipeHandlers = useSwipeNavigation({
    onSwipeLeft: hasNext ? onNext : undefined,
    onSwipeRight: hasPrev ? onPrev : undefined,
  });

  if (!athlete) return null;

  const content = (
    <aside
      className="atletas-perfil-panel open"
      role="dialog"
      aria-label="Perfil de atleta"
      {...swipeHandlers}
    >
      <div className="atletas-perfil-header">
        <div className="atletas-perfil-header-left">
          <span>PERFIL DE ATLETA</span>
          {total > 1 && (
            <span className="atletas-perfil-counter">{index + 1} / {total}</span>
          )}
        </div>
        <button className="atletas-perfil-close-btn" type="button" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
      </div>

      <div className="atletas-perfil-body">
        <div className="atletas-perfil-atleta-header">
          <div className="atletas-perfil-avatar">{initials(`${athlete.nombres} ${athlete.apellidos}`)}</div>
          <div>
            <h2 className="atletas-perfil-name">{`${athlete.nombres} ${athlete.apellidos}`.trim() || 'Atleta'}</h2>
            <p className="atletas-perfil-cedula">Cédula {athlete.cedula || '-'}</p>
          </div>
        </div>

        {athlete.estado !== 'activo' && (
          <div className={`atletas-estado-alert atletas-estado-alert-${athlete.estado}`} role="note">
            <EstadoBadge estado={athlete.estado} />
            {athlete.estado === 'justificado' && <span>{athlete.estadoMotivo || 'Sin motivo registrado'}</span>}
          </div>
        )}

        <h3 className="atletas-perfil-section-title">Información deportiva</h3>
        <div className="atletas-perfil-section-block">
          <div className="atletas-data-point">
            <span className="atletas-data-point-label">Estado</span>
            <span className="atletas-data-point-value"><EstadoBadge estado={athlete.estado} /></span>
          </div>
          <DataPoint label="Categoría" value={athlete.categoria} />
          <DataPoint label="Área" value={athlete.area} />
          <DataPoint label="Subárea" value={athlete.subarea} />
          <DataPoint label="Especialidad" value={athlete.especialidad} />
        </div>

        <h3 className="atletas-perfil-section-title">Datos personales</h3>
        <div className="atletas-perfil-section-block">
          <DataPoint label="Nombres" value={athlete.nombres} />
          <DataPoint label="Apellidos" value={athlete.apellidos} />
          <DataPoint label="Fecha de nacimiento" value={athlete.fechaNacimiento} />
          <DataPoint label="Edad" value={athlete.edad === '-' ? '-' : `${athlete.edad} años`} />
          <DataPoint label="Sexo" value={athlete.sexo === 'M' ? 'Masculino' : athlete.sexo === 'F' ? 'Femenino' : 'No disponible'} />
          <DataPoint label="Correo" value={athlete.email} />
        </div>

        <h3 className="atletas-perfil-section-title">Datos del representante</h3>
        <div className="atletas-perfil-section-block">
          {athlete.representantes.length > 0 ? athlete.representantes.map((representante, i) => (
            <DataPoint
              key={`${representante.nombre}-${representante.apellido}-${i}`}
              label={`${representante.nombre} ${representante.apellido}`}
              value={`${representante.tlf || '—'} · ${representante.tipo_relacion || 'Representante'}`}
            />
          )) : <DataPoint label="Estado" value="Sin representante registrado" />}
        </div>
      </div>

      <div className="atletas-perfil-footer">
        {total > 1 && (
          <button
            className="atletas-perfil-nav-btn"
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            aria-label="Atleta anterior"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <button className="atletas-perfil-btn atletas-perfil-btn-ghost" type="button" onClick={onClose}>
          Cerrar
        </button>
        {total > 1 && (
          <button
            className="atletas-perfil-nav-btn"
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            aria-label="Atleta siguiente"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </aside>
  );

  return createPortal(content, document.body);
};

const normalizeAthlete = (athlete) => {
  const subareas = Array.isArray(athlete.subareas_nombres)
    ? athlete.subareas_nombres
    : (athlete.subareas_lista_texto || '').split(',').map((item) => item.trim()).filter(Boolean);

  return {
    ...athlete,
    id: athlete.user_id,
    nombres: athlete.nombres || athlete.name || '',
    apellidos: athlete.apellidos || '',
    cedula: athlete.cedula || '',
    email: athlete.email || '',
    fechaNacimiento: athlete.fecha_nacimiento || '-',
    edad: athlete.edad ?? '-',
    sexo: athlete.sexo || '',
    categoria: athlete.categoria || '-',
    subarea: athlete.subarea_nombre_principal || subareas.join(', '),
    especialidad: subareas.join(', '),
    representantes: Array.isArray(athlete.representantes) ? athlete.representantes : [],
    estado: athlete.estado || 'activo',
    estadoMotivo: athlete.estado_motivo || '',
  };
};

const PAGE_SIZE = 15;

export default function AtletasViewTrainer() {
  const [athletes, setAthletes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [inputSearch, setInputSearch] = useState('');
  const [buscar, setBuscar] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  // Área, subárea (solo las del entrenador) y turno; se revisan en la misma ficha del atleta.
  const [ubicacion, setUbicacion] = useState({ area: '', subarea: '', turno: '' });
  const [misSubareas, setMisSubareas] = useState([]);
  // En celular los filtros van detrás del botón "Filtros" (en monitores siempre se ven).
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  // Debounce del campo de búsqueda
  useEffect(() => {
    const t = setTimeout(() => {
      setIsLoading(true);
      setBuscar(inputSearch);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [inputSearch]);

  useEffect(() => {
    let active = true;
    const params = { page };
    if (buscar) params.buscar = buscar;
    if (categoryFilter) params.categoria = categoryFilter;
    Object.entries(ubicacion).forEach(([clave, valor]) => { if (valor) params[clave] = valor; });
    UserService.getMyAthletes(params)
      .then((response) => {
        if (!active) return;
        if (response && typeof response.count === 'number') {
          setAthletes((response.results ?? []).map(normalizeAthlete));
          setTotalCount(response.count);
        } else {
          setAthletes(Array.isArray(response) ? response.map(normalizeAthlete) : []);
          setTotalCount(Array.isArray(response) ? response.length : 0);
        }
        setError('');
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.detail || 'No fue posible cargar los atletas asignados.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [page, buscar, categoryFilter, ubicacion]);

  useEffect(() => {
    let active = true;
    UserService.getMySubareas()
      .then((data) => {
        // mis-subareas devuelve las habilitaciones: se toma el detalle de cada subárea.
        if (active) setMisSubareas((Array.isArray(data) ? data : []).map((fila) => fila.subarea_detalle).filter(Boolean));
      })
      .catch(() => { if (active) setMisSubareas([]); });
    return () => { active = false; };
  }, []);

  const areasFiltro = [...new Map(misSubareas.filter((s) => s.area).map((s) => [s.area.id, s.area])).values()]
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const subareasFiltro = misSubareas.filter((s) => !ubicacion.area || String(s.area?.id) === ubicacion.area);
  const cambiarUbicacion = (campo, valor) => {
    setIsLoading(true);
    setPage(1);
    setUbicacion((actual) => ({ ...actual, [campo]: valor, ...(campo === 'area' && { subarea: '' }) }));
  };

  useEffect(() => {
    let active = true;
    UserService.getAthleteCategories()
      .then((response) => {
        if (active && Array.isArray(response)) setCategories(response);
      })
      .catch(() => {
        if (active) setCategories([]);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedAthlete) return undefined;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [selectedAthlete]);

  useEffect(() => {
    if (!selectedAthlete) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setSelectedAthlete(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedAthlete]);

  const drawerOpen = Boolean(selectedAthlete);
  const currentIndex = selectedAthlete
    ? athletes.findIndex((a) => a.id === selectedAthlete.id)
    : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < athletes.length - 1;

  const goPrev = () => { if (hasPrev) setSelectedAthlete(athletes[currentIndex - 1]); };
  const goNext = () => { if (hasNext) setSelectedAthlete(athletes[currentIndex + 1]); };

  // Filtros: se pintan en la barra (monitores) y en el panel "Filtros" (celular).
  const controlesFiltro1 = (
    <>
        <input
          type="search"
          className="atletas-search-input"
          placeholder="Buscar por nombre o cédula..."
          value={inputSearch}
          onChange={(event) => setInputSearch(event.target.value)}
        />
        {categories.length > 0 && (
          <select
            className="atletas-category-select"
            aria-label="Filtrar atletas por categoría"
            value={categoryFilter}
            onChange={(event) => { setIsLoading(true); setCategoryFilter(event.target.value); setPage(1); }}
          >
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name} · {category.min_age}–{category.max_age} años · {category.birth_year_start}–{category.birth_year_end}
              </option>
            ))}
          </select>
        )}
        <select className="atletas-category-select" aria-label="Filtrar atletas por área" value={ubicacion.area} onChange={(event) => cambiarUbicacion('area', event.target.value)}>
          <option value="">Todas las áreas</option>
          {areasFiltro.map((area) => <option key={area.id} value={String(area.id)}>{area.nombre}</option>)}
        </select>
        <select className="atletas-category-select" aria-label="Filtrar atletas por subárea" value={ubicacion.subarea} onChange={(event) => cambiarUbicacion('subarea', event.target.value)}>
          <option value="">Todas mis subáreas</option>
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
    <div className={`atletas-admin-container ${drawerOpen ? 'drawer-open' : ''}`}>
      <div className="atletas-filtros-container">
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
        <span className="atletas-counter">{totalCount} atleta{totalCount !== 1 ? 's' : ''} en total</span>
      </div>

      {isLoading ? (
        <div className="atletas-loading">Cargando lista de atletas...</div>
      ) : error ? (
        <div className="atletas-loading">{error}</div>
      ) : (
        <>
          <div className="responsive-list">
            <div
              className="responsive-list__table"
              style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-main)' }}
            >
              <table className="atletas-tabla">
                <thead>
                  <tr><th>Ref.</th><th>Nombre</th><th>Subárea</th><th>Categoría</th><th>Estado</th><th>Contacto</th><th>Acción</th></tr>
                </thead>
                <tbody>
                  {athletes.map((athlete) => (
                    <tr key={athlete.id}>
                      <td className="ref-usuario">{athlete.id}</td>
                      <td>
                        <div className="atletas-tabla-nombre">{`${athlete.nombres} ${athlete.apellidos}`.trim() || '-'}</div>
                        <div className="atletas-tabla-cedula">Cédula {athlete.cedula || '-'}</div>
                      </td>
                      <td><span className="atletas-tabla-subarea-badge">{athlete.subarea || '—'}</span></td>
                      <td>{athlete.categoria || '—'}</td>
                      <td>
                        <EstadoBadge estado={athlete.estado} />
                        {athlete.estado === 'justificado' && athlete.estadoMotivo && <div className="atletas-estado-motivo">{athlete.estadoMotivo}</div>}
                      </td>
                      <td className="atletas-tabla-contacto">{athlete.email || '—'}</td>
                      <td>
                        <button
                          className="atletas-btn-ver"
                          type="button"
                          onClick={() => setSelectedAthlete(athlete)}
                        >
                          Ver perfil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ⬇️ WRAPPER de visibilidad (App.css) + GRID interno (módulo) */}
            <div className="responsive-list__cards">
              <div className="atletas-cards-grid">
                {athletes.map((athlete) => (
                  <article className="atletas-trainer-card" key={athlete.id}>
                    <div className="atletas-trainer-card-heading">
                      <div className="atletas-perfil-avatar">{initials(`${athlete.nombres} ${athlete.apellidos}`)}</div>
                      <div>
                        <h2>{`${athlete.nombres} ${athlete.apellidos}`.trim() || '-'}</h2>
                        <small>Cédula {athlete.cedula || '-'} · <span className="ref-usuario">Ref. {athlete.id}</span></small>
                      </div>
                    </div>
                    <div className="atletas-trainer-card-grid">
                      <DataPoint label="Subárea" value={athlete.subarea} />
                      <DataPoint label="Categoría" value={athlete.categoria} />
                      <DataPoint label="Correo" value={athlete.email} />
                      <div className="atletas-data-point">
                        <span className="atletas-data-point-label">Estado</span>
                        <span className="atletas-data-point-value"><EstadoBadge estado={athlete.estado} /></span>
                      </div>
                    </div>
                    {athlete.estado === 'justificado' && athlete.estadoMotivo && <p className="atletas-estado-motivo">{athlete.estadoMotivo}</p>}
                    <button
                      className="atletas-btn-ver"
                      type="button"
                      onClick={() => setSelectedAthlete(athlete)}
                    >
                      Ver perfil
                    </button>
                  </article>
                ))}
              </div>
            </div>
          </div>

          {!athletes.length && !isLoading && <div className="atletas-loading">No se encontraron atletas.</div>}

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
              <span className="atletas-paginacion-info">Página {page} de {totalPages}</span>
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

      <ProfileDrawer
        athlete={selectedAthlete}
        onClose={() => setSelectedAthlete(null)}
        onPrev={goPrev}
        onNext={goNext}
        hasPrev={hasPrev}
        hasNext={hasNext}
        index={currentIndex}
        total={athletes.length}
      />
    </div>
  );
}