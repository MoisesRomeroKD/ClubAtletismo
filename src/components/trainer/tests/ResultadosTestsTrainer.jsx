import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import TestService from '../../../api/services/Testservice';
import UserService from '../../../api/services/Userservice';
// Misma presentación que la consulta del administrador (mismas clases admin-evaluaciones-*).
import '../../../styles/components/admin/evaluacion/AdminEvaluacionesView.css';

// Rendimiento en tests: los tests miden el nivel de un atleta en una subárea concreta
// (no es la cineantropometría, que diagnostica en qué subárea puede rendir mejor).
const PAGE_SIZE = 15;

const formatFecha = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

const marca = (fila) => {
  if (fila.ausente) return 'Ausente';
  if (fila.valor === null || fila.valor === undefined) return 'Sin registrar';
  return `${fila.valor} ${fila.unidad}`;
};

// Entrenador: solo los resultados de los tests que creó (el backend lo verifica).
const ResultadosTestsTrainer = () => {
  const [pruebas, setPruebas] = useState([]);
  const [subareas, setSubareas] = useState([]);
  const [inputBuscar, setInputBuscar] = useState('');
  const [filtros, setFiltros] = useState({ buscar: '', prueba: '', subarea: '', desde: '', hasta: '' });
  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState({ clave: '', filas: [], total: 0, error: '' });
  // En celular los filtros van en el panel del botón flotante "Filtros" (mismo diseño que Reportes).
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  useEffect(() => {
    let activo = true;
    Promise.all([TestService.getPruebas(), UserService.getMySubareas()])
      .then(([listaPruebas, misSubareas]) => {
        if (!activo) return;
        setPruebas(Array.isArray(listaPruebas) ? listaPruebas : listaPruebas?.results || []);
        // mis-subareas devuelve las habilitaciones: se toma el detalle de cada subárea.
        setSubareas((Array.isArray(misSubareas) ? misSubareas : []).map((fila) => fila.subarea_detalle).filter(Boolean));
      })
      .catch(() => { if (activo) { setPruebas([]); setSubareas([]); } });
    return () => { activo = false; };
  }, []);

  // El buscador espera a que se deje de escribir antes de pedir la lista.
  useEffect(() => {
    const texto = inputBuscar.trim();
    if (texto === filtros.buscar) return undefined;
    const espera = setTimeout(() => {
      setPage(1);
      setFiltros((actuales) => ({ ...actuales, buscar: texto }));
    }, 400);
    return () => clearTimeout(espera);
  }, [inputBuscar, filtros.buscar]);

  const params = useMemo(() => ({
    page,
    ...Object.fromEntries(Object.entries(filtros).filter(([, valor]) => valor)),
  }), [page, filtros]);
  const clave = JSON.stringify(params);
  const cargando = estado.clave !== clave;

  useEffect(() => {
    let activo = true;
    TestService.getResultados(params)
      .then((data) => {
        if (activo) setEstado({ clave, filas: data?.results ?? [], total: data?.count ?? 0, error: '' });
      })
      .catch((error) => {
        if (activo) setEstado({ clave, filas: [], total: 0, error: error?.response?.data?.detail || 'No se pudieron cargar los resultados.' });
      });
    return () => { activo = false; };
  }, [params, clave]);

  const cambiarFiltro = (campo, valor) => {
    setPage(1);
    setFiltros((actuales) => ({ ...actuales, [campo]: valor }));
  };

  const totalPaginas = Math.ceil(estado.total / PAGE_SIZE) || 1;

  // Filtros: se pintan en la barra (monitores) y en el panel "Filtros" (celular).
  const controlesFiltro = (
    <>
      <input
        type="search"
        className="admin-evaluaciones-buscar"
        placeholder="Buscar atleta por cédula o nombre..."
        aria-label="Buscar atleta por cédula o nombre"
        value={inputBuscar}
        onChange={(event) => setInputBuscar(event.target.value)}
      />
      <select className="admin-evaluaciones-select" aria-label="Filtrar por prueba" value={filtros.prueba} onChange={(event) => cambiarFiltro('prueba', event.target.value)}>
        <option value="">Todas las pruebas</option>
        {pruebas.map((prueba) => <option key={prueba.id} value={String(prueba.id)}>{prueba.nombre}</option>)}
      </select>
      <select className="admin-evaluaciones-select" aria-label="Filtrar por subárea" value={filtros.subarea} onChange={(event) => cambiarFiltro('subarea', event.target.value)}>
        <option value="">Todas mis subáreas</option>
        {subareas.map((subarea) => <option key={subarea.id} value={String(subarea.id)}>{subarea.nombre}</option>)}
      </select>
      <label className="admin-evaluaciones-fecha">
        <span>Desde</span>
        <input type="date" value={filtros.desde} max={filtros.hasta || undefined} onChange={(event) => cambiarFiltro('desde', event.target.value)} />
      </label>
      <label className="admin-evaluaciones-fecha">
        <span>Hasta</span>
        <input type="date" value={filtros.hasta} min={filtros.desde || undefined} onChange={(event) => cambiarFiltro('hasta', event.target.value)} />
      </label>
    </>
  );

  return (
    <div className="admin-evaluaciones">
      <div className="admin-evaluaciones-header">
        <div>
          <h2 className="admin-evaluaciones-titulo">Resultados de tests</h2>
          <p className="admin-evaluaciones-subtitulo">Rendimiento de tus atletas en los tests que programaste.</p>
        </div>
      </div>

      <div className="admin-evaluaciones-filtros">
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
              {controlesFiltro}
            </div>
            <footer className="filtros-sheet__footer">
              <button type="button" className="filtros-sheet__btn" onClick={() => setFiltrosAbiertos(false)}>Cerrar</button>
              <button type="button" className="filtros-sheet__btn filtros-sheet__btn--primario" onClick={() => setFiltrosAbiertos(false)}>Aplicar filtros</button>
            </footer>
          </div>,
          document.body,
        )}
        <div className="filtros-escritorio">{controlesFiltro}</div>
        <span className="admin-evaluaciones-total">{estado.total} {estado.total === 1 ? 'resultado' : 'resultados'}</span>
      </div>

      {estado.error ? (
        <div className="admin-evaluaciones-vacio" role="alert">{estado.error}</div>
      ) : cargando ? (
        <div className="admin-evaluaciones-cargando">Cargando resultados...</div>
      ) : estado.filas.length > 0 ? (
        <div className="responsive-list">
          <div className="responsive-list__table admin-evaluaciones-tabla-wrap">
            <table className="admin-evaluaciones-tabla">
              <thead>
                <tr>
                  <th>Atleta</th>
                  <th>Prueba</th>
                  <th>Resultado</th>
                  <th>Fecha</th>
                  <th>Subárea</th>
                  <th>Entrenador</th>
                </tr>
              </thead>
              <tbody>
                {estado.filas.map((fila) => (
                  <tr key={fila.id}>
                    <td className="admin-evaluaciones-atleta">
                      {fila.nombre} {fila.apellido}
                      <small>C.I. {fila.cedula}</small>
                    </td>
                    <td className="admin-evaluaciones-prueba">
                      {fila.prueba}
                      <small>{fila.criterio}</small>
                    </td>
                    <td className="admin-evaluaciones-resultado">{marca(fila)}</td>
                    <td>{formatFecha(fila.fecha)}</td>
                    <td>{fila.area ? `${fila.area} · ` : ''}{fila.subarea}</td>
                    <td className="admin-evaluaciones-evaluador">{fila.entrenador || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="responsive-list__cards">
            <div className="admin-evaluaciones-cards-wrap">
              {estado.filas.map((fila) => (
                <article className="admin-evaluaciones-card" key={fila.id}>
                  <header className="admin-evaluaciones-card-cabecera">
                    <div className="admin-evaluaciones-atleta">
                      {fila.nombre} {fila.apellido}
                      <small>C.I. {fila.cedula}</small>
                    </div>
                    <span className="admin-evaluaciones-card-resultado">{marca(fila)}</span>
                  </header>
                  <dl className="admin-evaluaciones-card-datos">
                    <div><dt>Prueba</dt><dd>{fila.prueba}<small>{fila.criterio}</small></dd></div>
                    <div><dt>Fecha</dt><dd>{formatFecha(fila.fecha)}</dd></div>
                    <div><dt>Subárea</dt><dd>{fila.area ? `${fila.area} · ` : ''}{fila.subarea}</dd></div>
                    <div><dt>Entrenador</dt><dd>{fila.entrenador || '—'}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="admin-evaluaciones-vacio">
          <h3>No se encontraron resultados</h3>
          <p>No hay resultados de tests con esos filtros.</p>
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="admin-evaluaciones-paginacion">
          <button type="button" onClick={() => setPage(page - 1)} disabled={page <= 1 || cargando}>← Anterior</button>
          <span>Página {page} de {totalPaginas}</span>
          <button type="button" onClick={() => setPage(page + 1)} disabled={page >= totalPaginas || cargando}>Siguiente →</button>
        </div>
      )}
    </div>
  );
};

export default ResultadosTestsTrainer;
