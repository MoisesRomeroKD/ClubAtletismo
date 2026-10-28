import { useEffect, useState } from 'react';
import TestService from '../../../api/services/Testservice';
import ResumenTestsAtleta from './ResumenTestsAtleta';
import '../../../styles/components/atleta/TestsAtleta.css';

const formatFecha = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

// Resultado del atleta: ausente, la marca con su unidad o pendiente si todavía no lo miden.
const miResultado = (fila) => {
  if (fila.ausente) return 'Ausente';
  if (fila.valor === null || fila.valor === undefined) return 'Pendiente';
  return `${fila.valor} ${fila.unidad}`;
};

const mensajeError = (error, fallback) => {
  const data = error?.response?.data;
  return typeof data?.detail === 'string' ? data.detail : fallback;
};

export default function TestsAtleta() {
  const [estado, setEstado] = useState({ cargando: true, filas: [], error: '' });

  useEffect(() => {
    let activo = true;
    TestService.getMisResultados()
      .then((data) => { if (activo) setEstado({ cargando: false, filas: Array.isArray(data) ? data : [], error: '' }); })
      .catch((error) => { if (activo) setEstado({ cargando: false, filas: [], error: mensajeError(error, 'No se pudieron cargar tus tests.') }); });
    return () => { activo = false; };
  }, []);

  return (
    <div className="tests-atl">
      <header className="tests-atl-header">
        <h2>Mis tests</h2>
        <p>Tu evolución en cada prueba y el historial de tests que te asignó tu entrenador.</p>
      </header>

      {estado.cargando ? (
        <p className="tests-atl-vacio">Cargando tus tests...</p>
      ) : estado.error ? (
        <p className="tests-atl-vacio tests-atl-error" role="alert">{estado.error}</p>
      ) : !estado.filas.length ? (
        <p className="tests-atl-vacio">Todavía no tienes tests asignados.</p>
      ) : (
        <>
        <ResumenTestsAtleta filas={estado.filas} />
        <h3 className="tests-atl-subtitulo">Historial</h3>
        <div className="responsive-list">
          <div className="responsive-list__table tests-atl-tabla-wrap">
            <table className="tests-atl-tabla">
              <thead>
                <tr><th>Fecha</th><th>Prueba</th><th>Subárea</th><th>Estado</th><th>Mi resultado</th><th>Observación</th></tr>
              </thead>
              <tbody>
                {estado.filas.map((fila) => (
                  <tr key={fila.id}>
                    <td>{formatFecha(fila.fecha)}</td>
                    <td className="tests-atl-fuerte">{fila.prueba}</td>
                    <td>{fila.area ? `${fila.area} · ` : ''}{fila.subarea}</td>
                    <td><span className={`tests-atl-estado tests-atl-estado--${fila.estado}`}>{fila.estado_label}</span></td>
                    <td className="tests-atl-fuerte">{miResultado(fila)}</td>
                    <td>{fila.observacion || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="responsive-list__cards">
            <div className="tests-atl-cards">
              {estado.filas.map((fila) => (
                <article className="tests-atl-card" key={fila.id}>
                  <div className="tests-atl-card-head">
                    <h4>{fila.prueba}</h4>
                    <span className={`tests-atl-estado tests-atl-estado--${fila.estado}`}>{fila.estado_label}</span>
                  </div>
                  <dl>
                    <div><dt>Fecha</dt><dd>{formatFecha(fila.fecha)}</dd></div>
                    <div><dt>Subárea</dt><dd>{fila.area ? `${fila.area} · ` : ''}{fila.subarea}</dd></div>
                    <div><dt>Mi resultado</dt><dd className="tests-atl-fuerte">{miResultado(fila)}</dd></div>
                    {fila.observacion && <div><dt>Observación</dt><dd>{fila.observacion}</dd></div>}
                  </dl>
                </article>
              ))}
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
