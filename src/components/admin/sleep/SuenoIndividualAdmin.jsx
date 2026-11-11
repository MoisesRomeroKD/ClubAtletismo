import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import UserService from '../../../api/services/Userservice';
import '../../../styles/components/admin/sleep/SuenoIndividualAdmin.css';

/*
 * Detalle Individual del sueño (administrador). El backend pagina de 15 en 15 y filtra por cédula o
 * nombre, área, subárea y categoría; trae el promedio y los registros de cada atleta en el período.
 * El historial de un atleta se pide solo al abrir su detalle (antes se descargaban los de todos).
 */
const PERIODOS = [
  ['day', 'Día'],
  ['week', 'Semana'],
  ['month', 'Mes'],
  ['quarter', 'Trimestre'],
  ['semester', 'Semestral'],
  ['year', 'Anual'],
];

const FILTROS_VACIOS = { area: '', subarea: '', categoria: '' };

const mensajeError = (error, porDefecto) => error?.response?.data?.detail || porDefecto;

export default function SuenoIndividualAdmin({
  timeRange,
  setTimeRange,
  recarga,
  qualityColor,
  puedeRegistrar,
  onVerDetalle,
  onRegistrar,
}) {
  const [texto, setTexto] = useState('');
  const [buscar, setBuscar] = useState('');
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [pagina, setPagina] = useState(1);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [catalogos, setCatalogos] = useState({ areas: [], subareas: [], categorias: [] });
  const [lista, setLista] = useState({ clave: '', data: null, error: '' });

  // Catálogos de los filtros (lo que no se pueda cargar queda vacío).
  useEffect(() => {
    let activo = true;
    Promise.allSettled([UserService.getAreas(), UserService.getSubareas(), UserService.getAthleteCategories()])
      .then(([areas, subareas, categorias]) => {
        if (!activo) return;
        const lista = (resultado) => (resultado.status === 'fulfilled' && Array.isArray(resultado.value) ? resultado.value : []);
        setCatalogos({ areas: lista(areas), subareas: lista(subareas), categorias: lista(categorias) });
      });
    return () => { activo = false; };
  }, []);

  // La búsqueda espera a que se deje de escribir.
  useEffect(() => {
    const espera = setTimeout(() => { setBuscar(texto.trim()); setPagina(1); }, 350);
    return () => clearTimeout(espera);
  }, [texto]);

  const params = useMemo(() => ({
    periodo: timeRange,
    page: pagina,
    ...(buscar && { buscar }),
    ...(filtros.area && { area: filtros.area }),
    ...(filtros.subarea && { subarea: filtros.subarea }),
    ...(filtros.categoria && { categoria: filtros.categoria }),
  }), [timeRange, pagina, buscar, filtros]);
  const clave = `${JSON.stringify(params)}-${recarga}`;

  useEffect(() => {
    let activo = true;
    UserService.getSuenoAdminAtletas(params)
      .then((data) => { if (activo) setLista({ clave, data, error: '' }); })
      .catch((error) => { if (activo) setLista({ clave, data: null, error: mensajeError(error, 'No se pudo cargar la lista de atletas.') }); });
    return () => { activo = false; };
  }, [params, clave]);

  const cargando = lista.clave !== clave;
  const data = lista.data;
  const subareasDelArea = catalogos.subareas.filter((subarea) => !filtros.area || String(subarea.area?.id) === filtros.area);

  const cambiarFiltro = (campo, valor) => {
    setPagina(1);
    setFiltros((actual) => ({ ...actual, [campo]: valor, ...(campo === 'area' && { subarea: '' }) }));
  };

  const controles = (
    <>
      <select value={filtros.area} onChange={(event) => cambiarFiltro('area', event.target.value)} aria-label="Filtrar por área">
        <option value="">Todas las áreas</option>
        {catalogos.areas.map((area) => <option key={area.id} value={String(area.id)}>{area.nombre}</option>)}
      </select>
      <select value={filtros.subarea} onChange={(event) => cambiarFiltro('subarea', event.target.value)} aria-label="Filtrar por subárea">
        <option value="">Todas las subáreas</option>
        {subareasDelArea.map((subarea) => <option key={subarea.id} value={String(subarea.id)}>{subarea.nombre}</option>)}
      </select>
      <select value={filtros.categoria} onChange={(event) => cambiarFiltro('categoria', event.target.value)} aria-label="Filtrar por categoría">
        <option value="">Todas las categorías</option>
        {catalogos.categorias.map((categoria) => <option key={categoria.id} value={categoria.name}>{categoria.name}</option>)}
      </select>
    </>
  );

  const periodos = (
    <div className="sueno-ind__periodos" role="group" aria-label="Período">
      {PERIODOS.map(([clavePeriodo, etiqueta]) => (
        <button
          key={clavePeriodo}
          type="button"
          className={`sueno-ind__periodo${timeRange === clavePeriodo ? ' sueno-ind__periodo--activo' : ''}`}
          onClick={() => { setTimeRange(clavePeriodo); setPagina(1); }}
          aria-pressed={timeRange === clavePeriodo}
        >
          {etiqueta}
        </button>
      ))}
    </div>
  );

  const hoy = (atleta) => (
    <span className={`sueno-ind__hoy${atleta.registrado_hoy ? ' sueno-ind__hoy--ok' : ''}`}>
      {atleta.registrado_hoy ? 'Registrado' : 'Pendiente'}
    </span>
  );
  const promedio = (atleta) => (
    atleta.promedio === null
      ? <span className="sueno-ind__muted">Sin registros</span>
      : <strong style={{ color: qualityColor(atleta.promedio) }}>{atleta.promedio}/10</strong>
  );
  const acciones = (atleta) => (
    <div className="sueno-ind__acciones">
      <button type="button" className="sueno-ind__btn" onClick={() => onVerDetalle(atleta)}>Ver detalle</button>
      {puedeRegistrar && !atleta.registrado_hoy && (
        <button type="button" className="sueno-ind__btn sueno-ind__btn--ghost" onClick={() => onRegistrar(atleta)}>Registrar hoy</button>
      )}
    </div>
  );
  // Paginación arriba de la lista (para no bajar hasta el final) y también al final.
  const paginacion = data?.count > 0 && (
    <div className="sueno-ind__paginacion">
      <span>{data.count} atleta{data.count === 1 ? '' : 's'} · {data.por_pagina} por página</span>
      <div>
        <button type="button" onClick={() => setPagina(data.page - 1)} disabled={data.page <= 1 || cargando}>← Anterior</button>
        <span>Página {data.page} de {data.num_pages}</span>
        <button type="button" onClick={() => setPagina(data.page + 1)} disabled={data.page >= data.num_pages || cargando}>Siguiente →</button>
      </div>
    </div>
  );
  const subareasTexto = (atleta) => atleta.subareas.map((fila) => fila.subarea).join(', ') || '—';

  return (
    <section className="sueno-ind">
      {/* Período: visible en monitores; en celular va dentro del botón "Filtros" */}
      <div className="filtros-escritorio">{periodos}</div>

      <div className="sueno-ind__barra">
        <label className="sueno-ind__buscar">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            placeholder="Buscar por cédula o nombre"
            aria-label="Buscar atleta por cédula o nombre"
          />
        </label>
        <div className="filtros-escritorio">{controles}</div>
        <button type="button" className="filtros-fab" onClick={() => setFiltrosAbiertos(true)}>
          <SlidersHorizontal size={18} aria-hidden="true" />Filtros
        </button>
      </div>
      {filtrosAbiertos && createPortal(
        <div className="filtros-sheet" role="dialog" aria-modal="true" aria-label="Filtros">
          <header className="filtros-sheet__header">
            <h2>Filtros</h2>
            <button type="button" className="filtros-sheet__cerrar" onClick={() => setFiltrosAbiertos(false)} aria-label="Cerrar filtros">
              <X size={18} />
            </button>
          </header>
          <div className="filtros-sheet__body">{periodos}{controles}</div>
          <footer className="filtros-sheet__footer">
            <button type="button" className="filtros-sheet__btn" onClick={() => { setFiltros(FILTROS_VACIOS); setPagina(1); }}>Limpiar</button>
            <button type="button" className="filtros-sheet__btn filtros-sheet__btn--primario" onClick={() => setFiltrosAbiertos(false)}>Aplicar filtros</button>
          </footer>
        </div>,
        document.body,
      )}

      {!lista.error && paginacion}
      {lista.error ? (
        <p className="sueno-ind__error" role="alert">{lista.error}</p>
      ) : cargando && !data ? (
        <p className="sueno-ind__muted">Cargando atletas...</p>
      ) : !data?.results.length ? (
        <p className="sueno-ind__muted">No hay atletas con esos filtros.</p>
      ) : (
        <div className={`responsive-list${cargando ? ' sueno-ind--cargando' : ''}`}>
          <div className="responsive-list__table">
            <table className="sueno-ind__tabla">
              <thead>
                <tr><th>Ref.</th><th>Atleta</th><th>Subáreas</th><th>Categoría</th><th>Promedio</th><th>Registros</th><th>Hoy</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {data.results.map((atleta) => (
                  <tr key={atleta.id}>
                    <td className="ref-usuario">{atleta.id}</td>
                    <td>
                      <div className="sueno-ind__nombre">{atleta.name}</div>
                      <small className="sueno-ind__muted">Cédula {atleta.cedula}</small>
                    </td>
                    <td>{subareasTexto(atleta)}</td>
                    <td>{atleta.categoria || '—'}</td>
                    <td>{promedio(atleta)}</td>
                    <td>{atleta.registros}</td>
                    <td>{hoy(atleta)}</td>
                    <td>{acciones(atleta)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="responsive-list__cards">
            <div className="sueno-ind__cards">
              {data.results.map((atleta) => (
                <article className="sueno-ind__card" key={atleta.id}>
                  <div className="sueno-ind__card-head">
                    <div>
                      <div className="sueno-ind__nombre">{atleta.name}</div>
                      <small className="sueno-ind__muted">Ref. {atleta.id} · Cédula {atleta.cedula}</small>
                    </div>
                    {hoy(atleta)}
                  </div>
                  <dl>
                    <div><dt>Subáreas</dt><dd>{subareasTexto(atleta)}</dd></div>
                    <div><dt>Categoría</dt><dd>{atleta.categoria || '—'}</dd></div>
                    <div><dt>Promedio</dt><dd>{promedio(atleta)}</dd></div>
                    <div><dt>Registros</dt><dd>{atleta.registros}</dd></div>
                  </dl>
                  {acciones(atleta)}
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {!lista.error && paginacion}
    </section>
  );
}
