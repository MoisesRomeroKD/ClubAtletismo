import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import UserService from '../../../api/services/Userservice';
import '../../../styles/components/trainer/AtletasViewTrainer.css';

const initials = (name = '') => name.split(' ').filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase();

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
            <p className="atletas-perfil-cedula">C.I. {athlete.cedula || '-'}</p>
          </div>
        </div>

        <h3 className="atletas-perfil-section-title">Información deportiva</h3>
        <div className="atletas-perfil-section-block">
          <DataPoint label="Categoría" value={athlete.categoria} />
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
  };
};

export default function AtletasViewTrainer() {
  const [athletes, setAthletes] = useState([]);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    UserService.getMyAthletes()
      .then((response) => {
        if (!active) return;
        setAthletes(Array.isArray(response) ? response.map(normalizeAthlete) : []);
        setError('');
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.detail || 'No fue posible cargar los atletas asignados.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
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

  const filteredAthletes = athletes.filter((athlete) => {
    const query = search.toLowerCase();
    return [athlete.nombres, athlete.apellidos, athlete.cedula, athlete.subarea, athlete.categoria]
      .some((value) => String(value || '').toLowerCase().includes(query));
  });

  const drawerOpen = Boolean(selectedAthlete);
  const currentIndex = selectedAthlete
    ? filteredAthletes.findIndex((a) => a.id === selectedAthlete.id)
    : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < filteredAthletes.length - 1;

  const goPrev = () => { if (hasPrev) setSelectedAthlete(filteredAthletes[currentIndex - 1]); };
  const goNext = () => { if (hasNext) setSelectedAthlete(filteredAthletes[currentIndex + 1]); };

  return (
    <div className={`atletas-admin-container ${drawerOpen ? 'drawer-open' : ''}`}>
      <div className="atletas-filtros-container">
        <input
          type="search"
          className="atletas-search-input"
          placeholder="Buscar por nombre o cédula..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <span className="atletas-counter">Mostrando {filteredAthletes.length} atletas</span>
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
                  <tr><th>Nombre</th><th>Subárea</th><th>Categoría</th><th>Contacto</th><th>Acción</th></tr>
                </thead>
                <tbody>
                  {filteredAthletes.map((athlete) => (
                    <tr key={athlete.id}>
                      <td>
                        <div className="atletas-tabla-nombre">{`${athlete.nombres} ${athlete.apellidos}`.trim() || '-'}</div>
                        <div className="atletas-tabla-cedula">C.I. {athlete.cedula || '-'}</div>
                      </td>
                      <td><span className="atletas-tabla-subarea-badge">{athlete.subarea || '—'}</span></td>
                      <td>{athlete.categoria || '—'}</td>
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
                {filteredAthletes.map((athlete) => (
                  <article className="atletas-trainer-card" key={athlete.id}>
                    <div className="atletas-trainer-card-heading">
                      <div className="atletas-perfil-avatar">{initials(`${athlete.nombres} ${athlete.apellidos}`)}</div>
                      <div>
                        <h2>{`${athlete.nombres} ${athlete.apellidos}`.trim() || '-'}</h2>
                        <small>C.I. {athlete.cedula || '-'}</small>
                      </div>
                    </div>
                    <div className="atletas-trainer-card-grid">
                      <DataPoint label="Subárea" value={athlete.subarea} />
                      <DataPoint label="Categoría" value={athlete.categoria} />
                      <DataPoint label="Correo" value={athlete.email} />
                    </div>
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

          {!filteredAthletes.length && <div className="atletas-loading">No se encontraron atletas.</div>}
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
        total={filteredAthletes.length}
      />
    </div>
  );
}