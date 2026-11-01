import { useState } from 'react';
import { FileDown, Plus, Search, Trash2, X } from 'lucide-react';
import UserService from '../../api/services/Userservice';
import { generarConstancias } from '../../api/services/constanciaPdf';
import '../../styles/components/admin/GestionConstancias.css';

/*
 * Gestión de Constancias: el administrador busca atletas por cédula, arma una selección y genera
 * todas las constancias de entrenamiento en una sola operación: un PDF con una constancia por página
 * (plantilla del liceo en constanciaPdf.js). Los datos y los permisos los valida el backend.
 */
const CEDULA_COMPLETA = /^(?:[1-9]\d{6}|[1-4]\d{7})$/;
const MAXIMO = 100;

const mensajeError = (error, porDefecto) => error?.response?.data?.detail || porDefecto;

export default function GestionConstancias() {
  const [cedula, setCedula] = useState('');
  const [busqueda, setBusqueda] = useState({ cargando: false, atleta: null, error: '' });
  const [seleccion, setSeleccion] = useState([]);
  const [generando, setGenerando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const yaSeleccionado = (id) => seleccion.some((atleta) => atleta.id === id);

  const buscar = async (event) => {
    event.preventDefault();
    if (!CEDULA_COMPLETA.test(cedula)) {
      setBusqueda({ cargando: false, atleta: null, error: 'La cédula debe ser un número entre 1.000.000 y 49.999.999.' });
      return;
    }
    setBusqueda({ cargando: true, atleta: null, error: '' });
    try {
      const atleta = await UserService.buscarAtletaConstancia(cedula);
      setBusqueda({ cargando: false, atleta, error: '' });
    } catch (error) {
      setBusqueda({ cargando: false, atleta: null, error: mensajeError(error, 'No se pudo buscar la cédula.') });
    }
  };

  const agregar = (atleta) => {
    if (yaSeleccionado(atleta.id) || seleccion.length >= MAXIMO) return;
    setSeleccion((actual) => [...actual, atleta]);
    setMensaje({ tipo: '', texto: '' });
    // Lista para la siguiente búsqueda; la selección se conserva.
    setCedula('');
    setBusqueda({ cargando: false, atleta: null, error: '' });
  };

  const quitar = (id) => setSeleccion((actual) => actual.filter((atleta) => atleta.id !== id));

  const generar = async () => {
    setGenerando(true);
    setMensaje({ tipo: '', texto: '' });
    try {
      const { constancias } = await UserService.generarDatosConstancias(seleccion.map((atleta) => atleta.id));
      await generarConstancias(constancias);
      setMensaje({
        tipo: 'ok',
        texto: constancias.length === 1
          ? 'Se descargó la constancia.'
          : `Se descargó un PDF con ${constancias.length} constancias, una por página.`,
      });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: mensajeError(error, 'No se pudieron generar las constancias.') });
    } finally {
      setGenerando(false);
    }
  };

  const encontrado = busqueda.atleta;

  return (
    <section className="constancias">
      <header className="constancias__header">
        <h2>Gestión de Constancias</h2>
        <p>Busca a los atletas por su cédula, agrégalos a la lista y genera todas sus constancias de una vez.</p>
      </header>

      <form className="constancias__buscar" onSubmit={buscar}>
        <label htmlFor="constancias-cedula">Cédula del atleta</label>
        <div className="constancias__buscar-fila">
          <input
            id="constancias-cedula"
            type="text"
            inputMode="numeric"
            maxLength={8}
            placeholder="Ej. 12345678"
            value={cedula}
            onChange={(event) => setCedula(event.target.value.replace(/\D/g, '').slice(0, 8))}
            autoComplete="off"
          />
          <button type="submit" className="constancias__btn" disabled={busqueda.cargando || !cedula}>
            <Search size={16} aria-hidden="true" />
            {busqueda.cargando ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {busqueda.error && <p className="constancias__error" role="alert">{busqueda.error}</p>}
      </form>

      {encontrado && (
        <article className="constancias__encontrado">
          <div>
            <strong>{encontrado.nombres} {encontrado.apellidos}</strong>
            <span>Cédula {encontrado.cedula}</span>
            <span>Subáreas: {encontrado.subareas.join(', ') || '—'}</span>
            {!encontrado.puede_constancia && <span className="constancias__error">{encontrado.motivo}</span>}
          </div>
          <div className="constancias__acciones">
            <button
              type="button"
              className="constancias__btn"
              onClick={() => agregar(encontrado)}
              disabled={!encontrado.puede_constancia || yaSeleccionado(encontrado.id) || seleccion.length >= MAXIMO}
            >
              <Plus size={16} aria-hidden="true" />
              {yaSeleccionado(encontrado.id) ? 'Ya está en la selección' : 'Agregar a la selección'}
            </button>
            <button
              type="button"
              className="constancias__btn constancias__btn--ghost"
              onClick={() => setBusqueda({ cargando: false, atleta: null, error: '' })}
              aria-label="Descartar resultado"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </article>
      )}

      <div className="constancias__seleccion">
        <div className="constancias__seleccion-head">
          <h3>Atletas seleccionados ({seleccion.length})</h3>
          {seleccion.length > 0 && (
            <button type="button" className="constancias__btn constancias__btn--ghost" onClick={() => setSeleccion([])}>
              Quitar todos
            </button>
          )}
        </div>

        {!seleccion.length ? (
          <p className="constancias__vacio">Todavía no hay atletas seleccionados.</p>
        ) : (
          <div className="responsive-list">
            <div className="responsive-list__table">
              <table className="constancias__tabla">
                <thead>
                  <tr><th>#</th><th>Atleta</th><th>Cédula</th><th>Subáreas</th><th aria-label="Quitar" /></tr>
                </thead>
                <tbody>
                  {seleccion.map((atleta, indice) => (
                    <tr key={atleta.id}>
                      <td>{indice + 1}</td>
                      <td className="constancias__fuerte">{atleta.nombres} {atleta.apellidos}</td>
                      <td>{atleta.cedula}</td>
                      <td>{atleta.subareas.join(', ') || '—'}</td>
                      <td>
                        <button type="button" className="constancias__quitar" onClick={() => quitar(atleta.id)} aria-label={`Quitar a ${atleta.nombres} ${atleta.apellidos}`}>
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="responsive-list__cards">
              <div className="constancias__cards">
                {seleccion.map((atleta) => (
                  <article className="constancias__card" key={atleta.id}>
                    <div>
                      <strong>{atleta.nombres} {atleta.apellidos}</strong>
                      <span>Cédula {atleta.cedula}</span>
                    </div>
                    <button type="button" className="constancias__quitar" onClick={() => quitar(atleta.id)} aria-label={`Quitar a ${atleta.nombres} ${atleta.apellidos}`}>
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {mensaje.texto && (
        <p className={mensaje.tipo === 'ok' ? 'constancias__ok' : 'constancias__error'} role={mensaje.tipo === 'ok' ? 'status' : 'alert'}>
          {mensaje.texto}
        </p>
      )}

      <div className="constancias__generar">
        <button type="button" className="constancias__btn constancias__btn--primario" onClick={generar} disabled={!seleccion.length || generando}>
          <FileDown size={18} aria-hidden="true" />
          {generando ? 'Generando...' : `Generar constancias (${seleccion.length})`}
        </button>
        <small>Se descarga un solo PDF, con una constancia por página, listo para imprimir.</small>
      </div>
    </section>
  );
}
