import React, { useState, useEffect } from 'react';
import podApi from '../../api/podApi';

const RolesPermisos = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [guardandoId, setGuardandoId] = useState(null);

  // Cargar lista de personal (Administradores, Administración, Entrenadores)
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        setIsLoading(true);
        const response = await podApi.get('/v1/users/personal-permisos/');
        if (response.data?.status === 'success') {
          setUsuarios(response.data.usuarios || []);
        } else if (Array.isArray(response.data)) {
          setUsuarios(response.data);
        }
      } catch (error) {
        console.error("Error al cargar personal:", error);
        // Datos de prueba maquetados mientras conectas el endpoint
        setUsuarios([
          { id: 1, cedula: 'V-12345678', nombre: 'Frank Bautista', email: 'admin@clubatletismo.com', grupo: 'Administrador', modulos: ['Control Total', 'Carga Masiva', 'Evaluaciones'] },
          { id: 2, cedula: 'V-18765432', nombre: 'Moisés Romero', email: 'moises.admin@clubatletismo.com', grupo: 'Administración', modulos: ['Gestión Atletas', 'Preregistro', 'Asistencia'] },
          { id: 3, cedula: 'V-14555666', nombre: 'Carlos Mendoza', email: 'carlos.entrenador@clubatletismo.com', grupo: 'Entrenador', modulos: ['Mis Atletas', 'Planes Entrenamiento'] },
          { id: 4, cedula: 'V-20111222', nombre: 'María Rodríguez', email: 'maria.entrenadora@clubatletismo.com', grupo: 'Entrenador', modulos: ['Mis Atletas', 'Asistencia'] },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  // Función para cambiar el Grupo/Permiso con menú desplegable al instante
  const handleCambiarGrupo = async (usuarioId, nuevoGrupo) => {
    setGuardandoId(usuarioId);
    try {
      // Petición al Backend para actualizar el Grupo Django del usuario
      await podApi.post(`/v1/users/${usuarioId}/cambiar-grupo/`, { grupo: nuevoGrupo });
      
      // Actualización local en la interfaz
      setUsuarios(prev => prev.map(u => {
        if (u.id === usuarioId) {
          let nuevosModulos = [];
          if (nuevoGrupo === 'Administrador') nuevosModulos = ['Control Total', 'Carga Masiva', 'Evaluaciones'];
          if (nuevoGrupo === 'Administración') nuevosModulos = ['Gestión Atletas', 'Preregistro', 'Asistencia'];
          if (nuevoGrupo === 'Entrenador') nuevosModulos = ['Mis Atletas', 'Planes Entrenamiento'];
          
          return { ...u, grupo: nuevoGrupo, modulos: nuevosModulos };
        }
        return u;
      }));

    } catch (error) {
      console.error("Error al actualizar grupo de usuario:", error);
      // Actualización visual local de respaldo
      setUsuarios(prev => prev.map(u => u.id === usuarioId ? { ...u, grupo: nuevoGrupo } : u));
    } finally {
      setGuardandoId(null);
    }
  };

  // Filtrado dinámico por búsqueda o rol
  const usuariosFiltrados = usuarios.filter(user => {
    const cumpleFiltro = filtroRol === 'Todos' || user.grupo === filtroRol;
    const cumpleBusqueda = (user.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                           (user.cedula || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                           (user.email || '').toLowerCase().includes(busqueda.toLowerCase());
    return cumpleFiltro && cumpleBusqueda;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
      
      {/* HEADER PRINCIPAL */}
      <div style={{ borderBottom: '2px solid var(--func-primary)', paddingBottom: '0.75rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: '800' }}>
          Gestión de Permisos y Perfiles
        </h2>
        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Asigna y modifica el perfil de acceso (Grupos Django) para el personal administrativo y cuerpo técnico
        </p>
      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Pestañas de Filtro */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['Todos', 'Administrador', 'Administración', 'Entrenador'].map((rol) => (
            <button
              key={rol}
              type="button"
              onClick={() => setFiltroRol(rol)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: filtroRol === rol ? '2px solid var(--func-primary)' : '1px solid var(--border-main)',
                backgroundColor: filtroRol === rol ? 'var(--func-primary-bg-soft)' : 'var(--bg-card)',
                color: filtroRol === rol ? 'var(--func-primary)' : 'var(--text-main)',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              {rol}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <input 
          type="text"
          placeholder="Buscar por nombre, cédula o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            border: '1px solid var(--border-main)',
            fontSize: '0.88rem',
            width: '280px'
          }}
        />
      </div>

      {/* TABLA DE USUARIOS Y PERMISOS */}
      {isLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando permisos de personal...</div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-main)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-main)', color: 'var(--text-main)' }}>
                <th style={{ padding: '12px 16px' }}>Cédula / ID</th>
                <th style={{ padding: '12px 16px' }}>Personal</th>
                <th style={{ padding: '12px 16px' }}>Correo Electrónico</th>
                <th style={{ padding: '12px 16px' }}>Módulos Habilitados (Grupo)</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Asignar Grupo / Permisos</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-main)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-main)' }}>{item.cedula}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--text-main)' }}>{item.nombre}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{item.email}</td>
                  
                  {/* Etiquetas con módulos permitidos */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {(item.modulos || []).map((mod, idx) => (
                        <span key={idx} style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: '600' }}>
                          ✓ {mod}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* MENÚ DESPLEGABLE INTERACTIVO CON OPCIONES DE GRUPO */}
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <select
                      value={item.grupo}
                      disabled={guardandoId === item.id}
                      onChange={(e) => handleCambiarGrupo(item.id, e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '2px solid var(--func-primary)',
                        backgroundColor: item.grupo === 'Administrador' ? 'var(--func-primary-bg-soft)' : item.grupo === 'Administración' ? 'var(--clr-verde-100)' : 'var(--bg-surface)',
                        color: item.grupo === 'Administrador' ? 'var(--func-primary)' : item.grupo === 'Administración' ? 'var(--clr-verde-900)' : 'var(--text-main)',
                        fontWeight: '800',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="Administrador">🔑 Administrador (Acceso Total)</option>
                      <option value="Administración">📋 Administración (Operativo)</option>
                      <option value="Entrenador">🏃‍♂️ Entrenador (Cuerpo Técnico)</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

export default RolesPermisos;