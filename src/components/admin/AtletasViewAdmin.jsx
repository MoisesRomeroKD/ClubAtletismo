import React, { useState, useEffect } from 'react';
import podApi from '../../api/podApi';

// Paleta equivalente a la usada en el mockup dark, llevada a valores hex
// planos para no depender de un tailwind.config con tokens personalizados.
const COLORS = {
  bg: '#131313',
  onBg: '#e5e2e1',
  panelBg: 'rgba(20,20,20,0.7)',
  panelBorder: '#262626',
  surfaceContainer: '#201f1f',
  surfaceContainerLowest: '#0e0e0e',
  surfaceContainerHigh: '#2a2a2a',
  surfaceContainerHighest: '#353534',
  outline: '#84967e',
  outlineVariant: '#3b4b37',
  onSurfaceVariant: '#b9ccb2',
  primary: '#72ff70',
  surfaceDim: '#131313',
  activoBg: '#0f6e56',
  activoText: '#e1f5ee',
  inhabilitadoBg: '#791f1f',
  inhabilitadoText: '#fcebeb',
};

const iniciales = (nombre = '') =>
  nombre
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const EstadoPill = ({ activo }) => (
  <span
    style={{
      padding: '4px 10px',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      backgroundColor: activo ? COLORS.activoBg : COLORS.inhabilitadoBg,
      color: activo ? COLORS.activoText : COLORS.inhabilitadoText,
      whiteSpace: 'nowrap',
    }}
  >
    {activo ? 'Activo' : 'Inhabilitado'}
  </span>
);

function DataPoint({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.65rem',
          letterSpacing: '0.05em',
          color: COLORS.onSurfaceVariant,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: '0.9rem', color: COLORS.onBg }}>{value || '—'}</span>
    </div>
  );
}

// Drawer lateral de perfil, inspirado en el patrón gu-sidePanel / ProfileModal
function PerfilDrawer({ atleta, onClose }) {
  const open = Boolean(atleta);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
          zIndex: 40,
        }}
      />

      {/* Panel */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100%',
          width: 'min(400px, 100%)',
          backgroundColor: '#191919',
          borderLeft: `1px solid ${COLORS.outlineVariant}`,
          boxShadow: '-8px 0 24px rgba(0,0,0,0.4)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          color: COLORS.onBg,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {atleta && (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem 1.5rem',
                borderBottom: `1px solid ${COLORS.outlineVariant}`,
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  color: COLORS.primary,
                }}
              >
                PERFIL DE ATLETA
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                style={{
                  background: 'none',
                  border: 'none',
                  color: COLORS.onSurfaceVariant,
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  lineHeight: 1,
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {/* Encabezado del atleta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    backgroundColor: COLORS.surfaceContainerHighest,
                    border: `1px solid ${COLORS.outlineVariant}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    flexShrink: 0,
                  }}
                >
                  {iniciales(atleta.nombre || atleta.nombres)}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                    {atleta.nombre || atleta.nombres || '-'}
                  </h2>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: COLORS.onSurfaceVariant }}>
                    C.I. {atleta.cedula || '-'}
                  </p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <EstadoPill activo={atleta.activo} />
                </div>
              </div>

              {/* Bloque: Deportivo */}
              <p
                style={{
                  margin: '0 0 0.75rem 0',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.7rem',
                  letterSpacing: '0.1em',
                  color: COLORS.onSurfaceVariant,
                  textTransform: 'uppercase',
                }}
              >
                Información deportiva
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  backgroundColor: COLORS.panelBg,
                  border: `1px solid ${COLORS.panelBorder}`,
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                <DataPoint label="Categoría" value={atleta.categoria} />
                <DataPoint label="Subárea" value={atleta.subarea} />
                <DataPoint label="Entrenador" value={atleta.entrenador} />
                <DataPoint
                  label="Sleep Quality"
                  value={atleta.sleep != null ? `${atleta.sleep}/10` : '—'}
                />
                <DataPoint label="Subáreas asignadas" value={atleta.subareas ?? 1} />
                <DataPoint label="Entrenadores asignados" value={atleta.entrenadores ?? 0} />
              </div>

              {/* Bloque: Contacto del atleta */}
              <p
                style={{
                  margin: '0 0 0.75rem 0',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.7rem',
                  letterSpacing: '0.1em',
                  color: COLORS.onSurfaceVariant,
                  textTransform: 'uppercase',
                }}
              >
                Contacto del atleta
              </p>
              <div
                style={{
                  backgroundColor: COLORS.panelBg,
                  border: `1px solid ${COLORS.panelBorder}`,
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                <DataPoint label="Correo" value={atleta.email} />
              </div>

              {/* Bloque: Familiar responsable */}
              <p
                style={{
                  margin: '0 0 0.75rem 0',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.7rem',
                  letterSpacing: '0.1em',
                  color: COLORS.onSurfaceVariant,
                  textTransform: 'uppercase',
                }}
              >
                Familiar responsable
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  backgroundColor: COLORS.panelBg,
                  border: `1px solid ${COLORS.panelBorder}`,
                  borderRadius: '10px',
                  padding: '1rem',
                }}
              >
                <DataPoint label="Nombre" value={atleta.familiar} />
                <DataPoint label="Teléfono" value={atleta.telefonoFamiliar} />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                padding: '1.25rem 1.5rem',
                borderTop: `1px solid ${COLORS.outlineVariant}`,
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: `1px solid ${COLORS.outlineVariant}`,
                  color: COLORS.onBg,
                  padding: '10px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => alert(`Editar detalle de: ${atleta.nombre || atleta.nombres}`)}
                style={{
                  flex: 1,
                  backgroundColor: COLORS.primary,
                  border: 'none',
                  color: COLORS.surfaceDim,
                  padding: '10px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Editar
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

const AtletasViewAdmin = () => {
  const [atletas, setAtletas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [perfilAbierto, setPerfilAbierto] = useState(null);

  useEffect(() => {
    const fetchAtletas = async () => {
      try {
        setIsLoading(true);
        const response = await podApi.get('/v1/usuarios/atletas/listar/');
        if (response.data && response.data.status === 'success') {
          setAtletas(response.data.atletas || response.data.data || []);
        } else if (Array.isArray(response.data)) {
          setAtletas(response.data);
        }
      } catch (error) {
        console.error('Error al obtener la lista de atletas:', error);
        // Datos mock de respaldo si falla la API temporalmente
        setAtletas([
          {
            id: 1,
            cedula: '1555666',
            nombre: 'Juan Veloz',
            email: 'juan@club.com',
            categoria: 'Juvenil',
            subarea: 'Velocidad',
            entrenador: 'Luis Pérez',
            familiar: 'María Veloz',
            telefonoFamiliar: '0414-1234567',
            subareas: 1,
            entrenadores: 1,
            activo: true,
            sleep: 8,
          },
          {
            id: 2,
            cedula: '2444555',
            nombre: 'Pedro Saltarín',
            email: 'pedro@club.com',
            categoria: 'Infantil',
            subarea: 'Salto Largo',
            entrenador: 'Carmen Rosa',
            familiar: 'José Saltarín',
            telefonoFamiliar: '0424-2345678',
            subareas: 1,
            entrenadores: 0,
            activo: false,
            sleep: 5,
          },
          {
            id: 3,
            cedula: '3111222',
            nombre: 'Sofía Larga',
            email: 'sofia@club.com',
            categoria: 'Juvenil',
            subarea: 'Salto Alto',
            entrenador: 'Luis Pérez',
            familiar: 'Ana Larga',
            telefonoFamiliar: '0412-3456789',
            subareas: 1,
            entrenadores: 0,
            activo: true,
            sleep: 9,
          },
          {
            id: 4,
            cedula: '0222333',
            nombre: 'Diego Fuerte',
            email: 'diego@club.com',
            categoria: 'Mayor / Sub-23',
            subarea: 'Halterofilia',
            entrenador: 'Jorge Díaz',
            familiar: 'Marta Fuerte',
            telefonoFamiliar: '0416-4567890',
            subareas: 1,
            entrenadores: 1,
            activo: true,
            sleep: 7,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAtletas();
  }, []);

  const atletasFiltrados = atletas.filter(
    (item) =>
      (item.nombre || item.nombres || '').toLowerCase().includes(filtro.toLowerCase()) ||
      (item.cedula || '').toLowerCase().includes(filtro.toLowerCase())
  );

  const handleNuevo = () => alert('Formulario para agregar atleta');
  const handleVerPerfil = (item) => setPerfilAbierto(item);
  const handleCerrarPerfil = () => setPerfilAbierto(null);

  return (
    <div
      style={{
        backgroundColor: COLORS.bg,
        color: COLORS.onBg,
        padding: '1.5rem',
        borderRadius: '12px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Toggle responsive: cards desde 320px hasta 869px, tabla desde 870px en adelante */}
      <style>{`
        .atletas-tabla-wrap { display: none; }
        .atletas-cards-wrap { display: grid; grid-template-columns: 1fr; gap: 1.25rem; }
        @media (min-width: 870px) {
          .atletas-tabla-wrap { display: block; }
          .atletas-cards-wrap { display: none; }
        }
        .atletas-btn-ver:hover { background-color: ${COLORS.primary}; color: ${COLORS.surfaceDim}; }
        .atletas-search:focus { outline: none; border-color: ${COLORS.primary}; box-shadow: 0 0 0 1px ${COLORS.primary}; }
      `}</style>

      {/* FILTRO + ACCIONES */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '1rem',
          backgroundColor: COLORS.panelBg,
          border: `1px solid ${COLORS.panelBorder}`,
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <input
          className="atletas-search"
          type="text"
          placeholder="Buscar por nombre o cédula..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={{
            backgroundColor: COLORS.surfaceContainerLowest,
            border: `1px solid ${COLORS.outlineVariant}`,
            borderRadius: '8px',
            padding: '9px 14px',
            color: COLORS.onBg,
            fontSize: '0.9rem',
            width: '260px',
            maxWidth: '100%',
          }}
        />
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.75rem',
            color: COLORS.onSurfaceVariant,
          }}
        >
          Mostrando {atletasFiltrados.length} atletas
        </span>
        <button
          type="button"
          onClick={handleNuevo}
          style={{
            marginLeft: 'auto',
            backgroundColor: COLORS.primary,
            color: COLORS.surfaceDim,
            border: 'none',
            padding: '9px 20px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          + Nuevo Atleta
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: COLORS.onSurfaceVariant }}>
          Cargando lista de atletas...
        </div>
      ) : (
        <>
          {/* TABLA: visible SOLO en pc/laptop (>=870px). Solo info relevante + Ver perfil */}
          <div
            className="atletas-tabla-wrap"
            style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${COLORS.outlineVariant}` }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: COLORS.surfaceContainer,
                    borderBottom: `1px solid ${COLORS.outlineVariant}`,
                    color: COLORS.onSurfaceVariant,
                  }}
                >
                  <th style={{ padding: '12px 16px' }}>Nombre</th>
                  <th style={{ padding: '12px 16px' }}>Subárea</th>
                  <th style={{ padding: '12px 16px' }}>Entrenador</th>
                  <th style={{ padding: '12px 16px' }}>Familiar / Contacto</th>
                  <th style={{ padding: '12px 16px' }}>Estado</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {atletasFiltrados.map((item, idx) => (
                  <tr key={item.id ?? idx} style={{ borderBottom: `1px solid ${COLORS.outlineVariant}55` }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700 }}>{item.nombre || item.nombres || '-'}</div>
                      <div style={{ fontSize: '0.75rem', color: COLORS.onSurfaceVariant, fontFamily: "'JetBrains Mono', monospace" }}>
                        C.I. {item.cedula || '-'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          backgroundColor: COLORS.surfaceContainer,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        {item.subarea || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{item.entrenador || '—'}</td>
                    <td style={{ padding: '12px 16px', color: COLORS.onSurfaceVariant }}>
                      <div>{item.familiar || '—'}</div>
                      <div style={{ fontSize: '0.75rem' }}>{item.telefonoFamiliar || ''}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <EstadoPill activo={item.activo} />
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        type="button"
                        className="atletas-btn-ver"
                        onClick={() => handleVerPerfil(item)}
                        style={{
                          backgroundColor: COLORS.surfaceContainer,
                          border: `1px solid ${COLORS.outlineVariant}`,
                          color: COLORS.onBg,
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        Ver perfil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CARDS: visibles SOLO en móvil (<870px). Solo info relevante + Ver perfil */}
          <div className="atletas-cards-wrap">
            {atletasFiltrados.map((item, idx) => (
              <div
                key={item.id ?? idx}
                style={{
                  backgroundColor: COLORS.panelBg,
                  border: `1px solid ${COLORS.panelBorder}`,
                  borderRadius: '12px',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        backgroundColor: COLORS.surfaceContainerHighest,
                        border: `1px solid ${COLORS.outlineVariant}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '1rem',
                        flexShrink: 0,
                      }}
                    >
                      {iniciales(item.nombre || item.nombres)}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                        {item.nombre || item.nombres || '-'}
                      </h3>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.7rem',
                          color: COLORS.onSurfaceVariant,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        C.I. {item.cedula || '-'}
                      </p>
                    </div>
                  </div>
                  <EstadoPill activo={item.activo} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.65rem', color: COLORS.onSurfaceVariant, fontFamily: "'JetBrains Mono', monospace" }}>
                      SUBÁREA
                    </p>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>{item.subarea || '—'}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.65rem', color: COLORS.onSurfaceVariant, fontFamily: "'JetBrains Mono', monospace" }}>
                      ENTRENADOR
                    </p>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>{item.entrenador || '—'}</p>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: `1px solid ${COLORS.outlineVariant}`,
                    paddingTop: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: '0.65rem', color: COLORS.onSurfaceVariant, fontFamily: "'JetBrains Mono', monospace" }}>
                      FAMILIAR / CONTACTO
                    </p>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>{item.familiar || '—'}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: COLORS.onSurfaceVariant }}>
                      {item.telefonoFamiliar || ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="atletas-btn-ver"
                    onClick={() => handleVerPerfil(item)}
                    style={{
                      backgroundColor: COLORS.surfaceContainer,
                      border: `1px solid ${COLORS.outline}`,
                      color: COLORS.onBg,
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Ver perfil
                  </button>
                </div>
              </div>
            ))}

            {atletasFiltrados.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: COLORS.onSurfaceVariant }}>
                No se encontraron atletas con ese criterio.
              </div>
            )}
          </div>
        </>
      )}

      <PerfilDrawer atleta={perfilAbierto} onClose={handleCerrarPerfil} />
    </div>
  );
};

export default AtletasViewAdmin;