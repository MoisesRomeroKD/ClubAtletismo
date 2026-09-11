import React, { useState, useEffect } from 'react';

const CineantropometriaAdmin = () => {
  const [mediciones, setMediciones] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);

  // Búsqueda y Selección de Atleta
  const [cedulaQuery, setCedulaQuery] = useState('');
  const [atletaSeleccionado, setAtletaSeleccionado] = useState(null);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(null);

  // Datos de Prueba
  const [atletasRegistrados] = useState([
    { id: 101, cedula: 'V-1555666', nombre: 'Juan Veloz', categoria: 'Juvenil' },
    { id: 102, cedula: 'V-3111222', nombre: 'Sofía Larga', categoria: 'Juvenil' },
    { id: 103, cedula: 'V-0222333', nombre: 'Diego Fuerte', categoria: 'Sub-23' },
    { id: 104, cedula: 'V-25444555', nombre: 'Carlos Ramírez', categoria: 'Infantil' },
    { id: 105, cedula: 'V-28999000', nombre: 'María Fernández', categoria: 'Adulto' },
  ]);

  const [nuevoRegistro, setNuevoRegistro] = useState({
    fechaMedicion: new Date().toISOString().split('T')[0],
    peso: '',
    talla: '',
    envergadura: '',
    grasaCorporal: '',
    masaMuscular: ''
  });

  useEffect(() => {
    setMediciones([
      { id: 1, cedula: 'V-1555666', nombre: 'Juan Veloz', categoria: 'Juvenil', fecha: '2026-08-10', peso: '68.5 kg', talla: '175 cm', imc: '22.37', grasa: '11.2%', masaMuscular: '48.5%', evaluador: 'Carlos Mendoza' },
      { id: 2, cedula: 'V-3111222', nombre: 'Sofía Larga', categoria: 'Juvenil', fecha: '2026-08-12', peso: '58.0 kg', talla: '168 cm', imc: '20.55', grasa: '14.8%', masaMuscular: '42.1%', evaluador: 'Carlos Mendoza' },
      { id: 3, cedula: 'V-0222333', nombre: 'Diego Fuerte', categoria: 'Sub-23', fecha: '2026-08-15', peso: '76.2 kg', talla: '181 cm', imc: '23.26', grasa: '9.8%', masaMuscular: '52.4%', evaluador: 'María Rodríguez' },
    ]);
  }, []);

  const handleInputChange = (e) => {
    setNuevoRegistro({ ...nuevoRegistro, [e.target.name]: e.target.value });
  };

  const limpiarTexto = (txt) => (txt || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  const atletasFiltrados = atletasRegistrados.filter(a => {
    const queryLimpia = limpiarTexto(cedulaQuery);
    if (!queryLimpia) return true;
    return (
      limpiarTexto(a.cedula).includes(queryLimpia) ||
      limpiarTexto(a.nombre).includes(queryLimpia)
    );
  });

  const handleSeleccionarAtleta = (atleta) => {
    setAtletaSeleccionado(atleta);
    setCedulaQuery(`${atleta.cedula} — ${atleta.nombre}`);
    setMostrarResultados(false);
  };

  const handleGuardarMedicion = (e) => {
    e.preventDefault();

    if (!atletaSeleccionado) {
      alert("Por favor busque y seleccione un atleta registrado.");
      return;
    }

    const pesoNum = parseFloat(nuevoRegistro.peso) || 70;
    const tallaM = (parseFloat(nuevoRegistro.talla) || 170) / 100;
    const imcCalculado = (pesoNum / (tallaM * tallaM)).toFixed(2);

    const nuevaEvaluacion = {
      id: Date.now(),
      cedula: atletaSeleccionado.cedula,
      nombre: atletaSeleccionado.nombre,
      categoria: atletaSeleccionado.categoria,
      fecha: nuevoRegistro.fechaMedicion,
      peso: `${nuevoRegistro.peso} kg`,
      talla: `${nuevoRegistro.talla} cm`,
      imc: imcCalculado,
      grasa: `${nuevoRegistro.grasaCorporal || '12'}%`,
      masaMuscular: `${nuevoRegistro.masaMuscular || '45'}%`,
      evaluador: 'Administrador'
    };

    setMediciones([nuevaEvaluacion, ...mediciones]);
    setMostrarModal(false);
    setAtletaSeleccionado(null);
    setCedulaQuery('');
    setNuevoRegistro({
      fechaMedicion: new Date().toISOString().split('T')[0],
      peso: '',
      talla: '',
      envergadura: '',
      grasaCorporal: '',
      masaMuscular: ''
    });
  };

  const medicionesFiltradasTabla = mediciones.filter(m =>
    (m.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (m.cedula || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '2px solid #2A6BFF', paddingBottom: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#111827', fontWeight: '800' }}>
            Control Antropométrico y Cineantropometría
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#6B7280', fontSize: '0.9rem' }}>
            Registro de composición corporal, pliegues cutáneos e índices morfofuncionales de los atletas
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input 
            type="text"
            placeholder="Buscar por atleta o cédula..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ padding: '9px 14px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '0.9rem', width: '240px' }}
          />

          <button 
            type="button"
            onClick={() => {
              setMostrarModal(true);
              setCedulaQuery('');
              setAtletaSeleccionado(null);
            }}
            style={{ backgroundColor: '#2A6BFF', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>+</span> Nueva Evaluación
          </button>
        </div>
      </div>

      {/* MÉTRICAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #2A6BFF' }}>
          <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: '600' }}>EVALUACIONES REALIZADAS</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111827' }}>{mediciones.length}</div>
        </div>

        <div style={{ backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: '600' }}>% GRASA PROMEDIO</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10B981' }}>11.9%</div>
        </div>

        <div style={{ backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '0.8rem', color: '#B45309', fontWeight: '600' }}>% MASA MUSCULAR PROMEDIO</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#F59E0B' }}>47.6%</div>
        </div>
      </div>

      {/* TABLA */}
      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#374151' }}>
              <th style={{ padding: '12px 16px' }}>Fecha</th>
              <th style={{ padding: '12px 16px' }}>Atleta</th>
              <th style={{ padding: '12px 16px' }}>Categoría</th>
              <th style={{ padding: '12px 16px' }}>Peso / Talla</th>
              <th style={{ padding: '12px 16px' }}>IMC</th>
              <th style={{ padding: '12px 16px' }}>% Grasa</th>
              <th style={{ padding: '12px 16px' }}>% Muscular</th>
              <th style={{ padding: '12px 16px' }}>Evaluador</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {medicionesFiltradasTabla.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '12px 16px', color: '#4B5563', fontWeight: '600' }}>{item.fecha}</td>
                <td style={{ padding: '12px 16px', fontWeight: '700', color: '#111827' }}>
                  {item.nombre} <br />
                  <span style={{ fontSize: '0.78rem', color: '#6B7280', fontWeight: 'normal' }}>{item.cedula}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ backgroundColor: '#F3F4F6', color: '#374151', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>{item.categoria}</span>
                </td>
                <td style={{ padding: '12px 16px', color: '#374151', fontWeight: '600' }}>{item.peso} / {item.talla}</td>
                <td style={{ padding: '12px 16px', fontWeight: '700', color: '#2A6BFF' }}>{item.imc}</td>
                <td style={{ padding: '12px 16px', color: '#10B981', fontWeight: '700' }}>{item.grasa}</td>
                <td style={{ padding: '12px 16px', color: '#F59E0B', fontWeight: '700' }}>{item.masaMuscular}</td>
                <td style={{ padding: '12px 16px', color: '#6B7280' }}>{item.evaluador}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <button style={{ backgroundColor: '#F3F4F6', border: '1px solid #D1D5DB', color: '#374151', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }} onClick={() => alert(`Ficha de ${item.nombre}`)}>Ver Ficha</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL MODERNIZADO */}
      {mostrarModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17, 24, 39, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '2rem', width: '90%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            {/* ENCABEZADO DEL MODAL */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F3F4F6', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ backgroundColor: '#EFF6FF', color: '#2A6BFF', padding: '8px 12px', borderRadius: '10px', fontSize: '1.2rem' }}>
                  📏
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#111827', fontWeight: '800' }}>
                    Nueva Evaluación Antropométrica
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>
                    Seleccione un atleta y registre sus parámetros físicos
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setMostrarModal(false)} 
                style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#4B5563', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarMedicion} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem' }}>
              
              {/* BUSCADOR AUTOCOMPLETADO MODERNIZADO */}
              <div style={{ gridColumn: '1 / -1', position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '700', color: '#374151' }}>
                  Atleta a Evaluar *
                </label>
                
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '14px', fontSize: '1rem', color: atletaSeleccionado ? '#10B981' : '#9CA3AF' }}>
                    {atletaSeleccionado ? '✓' : '🔍'}
                  </span>

                  <input 
                    type="text" 
                    autoComplete="off"
                    placeholder="Escriba la cédula o el nombre del atleta..." 
                    value={cedulaQuery} 
                    onChange={(e) => {
                      setCedulaQuery(e.target.value);
                      setMostrarResultados(true);
                      if (!e.target.value) setAtletaSeleccionado(null);
                    }} 
                    onFocus={() => setMostrarResultados(true)}
                    style={{ 
                      width: '100%', 
                      padding: '11px 14px 11px 40px', 
                      borderRadius: '10px', 
                      border: atletaSeleccionado ? '2px solid #10B981' : '1.5px solid #E5E7EB',
                      backgroundColor: atletaSeleccionado ? '#F0FDF4' : '#F9FAFB',
                      fontWeight: atletaSeleccionado ? '700' : 'normal',
                      fontSize: '0.92rem',
                      color: atletaSeleccionado ? '#065F46' : '#111827',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }} 
                  />
                </div>

                {/* MENÚ DESPLEGABLE CON DISEÑO ELEGANTE */}
                {mostrarResultados && (
                  <div style={{
                    position: 'absolute',
                    top: '105%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#ffffff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                    zIndex: 9999,
                    maxHeight: '220px',
                    overflowY: 'auto',
                    padding: '6px'
                  }}>
                    {atletasFiltrados.length > 0 ? (
                      atletasFiltrados.map((atleta, index) => (
                        <div 
                          key={atleta.id}
                          onClick={() => handleSeleccionarAtleta(atleta)}
                          onMouseEnter={() => setHoverIndex(index)}
                          onMouseLeave={() => setHoverIndex(null)}
                          style={{
                            padding: '10px 12px',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            fontSize: '0.88rem',
                            display: 'flex',
                            justify: 'space-between',
                            alignItems: 'center',
                            backgroundColor: hoverIndex === index ? '#F3F4F6' : '#ffffff',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E0E7FF', color: '#3730A3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                              {atleta.nombre.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: '#111827' }}>{atleta.nombre}</div>
                              <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>C.I: {atleta.cedula}</div>
                            </div>
                          </div>

                          <span style={{ fontSize: '0.75rem', backgroundColor: '#EFF6FF', color: '#2A6BFF', padding: '4px 10px', borderRadius: '20px', fontWeight: '700' }}>
                            {atleta.categoria}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '14px', fontSize: '0.88rem', color: '#9CA3AF', textAlign: 'center' }}>
                        No se encontraron coincidencias para esa búsqueda.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.82rem', fontWeight: '600', color: '#4B5563' }}>Fecha de Evaluación</label>
                <input type="date" name="fechaMedicion" required value={nuevoRegistro.fechaMedicion} onChange={handleInputChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.82rem', fontWeight: '600', color: '#4B5563' }}>Peso (kg)</label>
                <input type="number" step="0.1" name="peso" required value={nuevoRegistro.peso} onChange={handleInputChange} placeholder="Ej. 68.5" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.82rem', fontWeight: '600', color: '#4B5563' }}>Talla / Estatura (cm)</label>
                <input type="number" step="0.1" name="talla" required value={nuevoRegistro.talla} onChange={handleInputChange} placeholder="Ej. 175" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.82rem', fontWeight: '600', color: '#4B5563' }}>Envergadura (cm)</label>
                <input type="number" step="0.1" name="envergadura" value={nuevoRegistro.envergadura} onChange={handleInputChange} placeholder="Ej. 178" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.82rem', fontWeight: '600', color: '#4B5563' }}>% Grasa Corporal</label>
                <input type="number" step="0.1" name="grasaCorporal" value={nuevoRegistro.grasaCorporal} onChange={handleInputChange} placeholder="Ej. 11.2" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.82rem', fontWeight: '600', color: '#4B5563' }}>% Masa Muscular</label>
                <input type="number" step="0.1" name="masaMuscular" value={nuevoRegistro.masaMuscular} onChange={handleInputChange} placeholder="Ej. 48.5" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB' }} />
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #F3F4F6' }}>
                <button type="button" onClick={() => setMostrarModal(false)} style={{ backgroundColor: '#F3F4F6', color: '#374151', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ backgroundColor: '#2A6BFF', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(42, 107, 255, 0.3)' }}>
                  Guardar Evaluación
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CineantropometriaAdmin;