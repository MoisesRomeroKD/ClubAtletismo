import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CineantropometriaService from '../../../api/services/Cineantropometriaservice';
import { useApplicationPermissions } from '../../../context/ApplicationPermissionsContext';
import '../../../styles/components/admin/dashboard/AntropometriaResumen.css';

const formatFecha = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

export default function AntropometriaResumen() {
  const { hasPermission } = useApplicationPermissions();
  const puedeVer = hasPermission('ver_evaluaciones');
  const navigate = useNavigate();
  const [estado, setEstado] = useState({ data: null, error: '' });

  useEffect(() => {
    if (!puedeVer) return undefined;
    let activo = true;
    CineantropometriaService.getResumen()
      .then((data) => { if (activo) setEstado({ data, error: '' }); })
      .catch(() => { if (activo) setEstado({ data: null, error: 'No se pudo cargar el resumen de antropometría.' }); });
    return () => { activo = false; };
  }, [puedeVer]);

  if (!puedeVer) return null;

  const { data, error } = estado;

  return (
    <section className="antro-resumen">
      <header className="antro-resumen-header">
        <div>
          <h2>Antropometría</h2>
          <p>Desarrollo físico del plantel según la última medición de cada atleta.</p>
        </div>
        <div className="antro-resumen-links">
          <button type="button" onClick={() => navigate('/admin/antropometria/programar')}>Programar medición</button>
          <button type="button" onClick={() => navigate('/admin/antropometria/datos')}>Ver datos</button>
        </div>
      </header>

      {error && <p className="antro-resumen-error" role="alert">{error}</p>}
      {!data && !error && <p className="antro-resumen-vacio">Cargando resumen...</p>}

      {data && (
        <>
          <div className="antro-resumen-metricas">
            <article>
              <span>Evaluaciones registradas</span>
              <strong>{data.evaluaciones_total}</strong>
            </article>
            <article>
              <span>Atletas evaluados</span>
              <strong>{data.atletas_evaluados}<small> / {data.atletas_activos} activos</small></strong>
            </article>
            <article>
              <span>Activos sin evaluación</span>
              <strong className={data.atletas_sin_evaluacion ? 'antro-resumen-alerta' : ''}>{data.atletas_sin_evaluacion}</strong>
            </article>
            <article>
              <span>Última evaluación</span>
              <strong>{formatFecha(data.ultima_evaluacion)}</strong>
            </article>
          </div>

          <div className="antro-resumen-grid">
            <div className="antro-resumen-panel">
              <h3>Promedio por eje (0–100)</h3>
              {data.promedio_por_eje.map((eje) => (
                <div className="antro-resumen-eje" key={eje.eje}>
                  <span>{eje.label}</span>
                  <div className="antro-resumen-barra"><i style={{ width: `${eje.promedio ?? 0}%` }} /></div>
                  <strong>{eje.promedio ?? '—'}</strong>
                </div>
              ))}
            </div>

            <div className="antro-resumen-panel">
              <h3>Próximas mediciones ({data.mediciones_pendientes} pendientes)</h3>
              {data.proximas.length ? (
                <ul className="antro-resumen-proximas">
                  {data.proximas.map((medicion) => (
                    <li key={medicion.id}>
                      <strong>{formatFecha(medicion.fecha)}</strong>
                      <span>{medicion.area_nombre} · {medicion.subarea_nombre}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="antro-resumen-vacio">No hay mediciones programadas.</p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
