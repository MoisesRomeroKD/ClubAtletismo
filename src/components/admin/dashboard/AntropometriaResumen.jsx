import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CineantropometriaService from '../../../api/services/Cineantropometriaservice';
import { useApplicationPermissions } from '../../../context/ApplicationPermissionsContext';
import DashboardRadarChart from './charts/DashboardRadarChart.jsx';
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
  // Promedio de cada eje (0 a 100) en el formato del radar; los ejes sin datos no se dibujan.
  const ejesConDatos = (data?.promedio_por_eje ?? [])
    .filter((eje) => eje.promedio !== null && eje.promedio !== undefined)
    .map((eje) => ({ label: eje.label, rawValue: eje.promedio, min: 0, max: 100, isInverted: false, unit: 'pts' }));

  return (
    <section className="antro-resumen">
      <header className="antro-resumen-header">
        <div>
          <h2>Antropometría</h2>
          <p>Conteos del último trimestre{data?.desde ? ` (desde el ${formatFecha(data.desde)})` : ''}: la medición se hace cada 3 meses.</p>
        </div>
        <div className="antro-resumen-links">
          <button type="button" onClick={() => navigate('/admin/antropometria/programar')}>Ver mediciones</button>
          <button type="button" onClick={() => navigate('/admin/antropometria/datos')}>Ver datos</button>
        </div>
      </header>

      {error && <p className="antro-resumen-error" role="alert">{error}</p>}
      {!data && !error && <p className="antro-resumen-vacio">Cargando resumen...</p>}

      {data && (
        <>
          <div className="antro-resumen-metricas">
            <article>
              <span>Evaluaciones del trimestre</span>
              <strong>{data.evaluaciones_trimestre}</strong>
            </article>
            <article>
              <span>Atletas evaluados</span>
              <strong>{data.atletas_evaluados}<small> / {data.atletas_activos} activos</small></strong>
            </article>
            <article>
              <span>Activos sin evaluar en el trimestre</span>
              <strong className={data.atletas_sin_evaluacion ? 'antro-resumen-alerta' : ''}>{data.atletas_sin_evaluacion}</strong>
            </article>
            <article>
              <span>Última evaluación</span>
              <strong>{formatFecha(data.ultima_evaluacion)}</strong>
            </article>
          </div>

          <div className="antro-resumen-grid">
            <div className="antro-resumen-panel">
              <h3>Promedio por eje (0–100), según la última medición de cada atleta</h3>
              {ejesConDatos.length ? (
                <div className="antro-resumen-radar">
                  <DashboardRadarChart metrics={ejesConDatos} />
                </div>
              ) : (
                <p className="antro-resumen-vacio">Todavía no hay evaluaciones con resultados.</p>
              )}
            </div>

          </div>
        </>
      )}
    </section>
  );
}
