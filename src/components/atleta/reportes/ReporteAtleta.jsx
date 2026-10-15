import { useEffect, useState } from 'react';
import { ClipboardCheck, Clock3, LockKeyhole, Moon, Ruler } from 'lucide-react';
import UserService from '../../../api/services/Userservice';
import '../../../styles/components/admin/ReporteAdmin.css';
import '../../../styles/components/atleta/ReporteAtleta.css';

const CINE_EJES = [
  ['potencia', 'Potencia'],
  ['velocidad', 'Velocidad'],
  ['resistencia', 'Resistencia'],
  ['envergadura', 'Envergadura'],
  ['fuerza', 'Fuerza'],
  ['flexibilidad', 'Flexibilidad'],
];

const athleteSleepSamples = [
  { score: '4.0', height: '80%', date: '08/10', tone: 'success' },
  { score: '4.5', height: '90%', date: '09/10', tone: 'success' },
  { score: '2.0', height: '40%', date: '10/10', tone: 'danger' },
  { score: '3.5', height: '70%', date: '11/10', tone: 'warning' },
  { score: '5.0', height: '100%', date: '12/10', tone: 'success' },
  { score: '4.0', height: '80%', date: '13/10', tone: 'success' },
  { score: '-', height: '4%', date: '14/10', tone: 'empty' },
];

function formatFecha(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function formatNum(val, decimals = 2) {
  if (val === null || val === undefined || val === '') return '—';
  return Number(val).toFixed(decimals);
}

export default function ReporteAtleta() {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loadingCine, setLoadingCine] = useState(true);
  const [errorCine, setErrorCine] = useState('');

  useEffect(() => {
    let active = true;
    UserService.getMyEvaluaciones()
      .then((data) => {
        if (active) setEvaluaciones(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setErrorCine('No se pudieron cargar las evaluaciones.');
      })
      .finally(() => { if (active) setLoadingCine(false); });
    return () => { active = false; };
  }, []);

  const ultima = evaluaciones[0] ?? null;

  return (
    <div className="report-admin">
    <section className="report-role-panel" aria-label="Reportes del atleta">

      {/* Sueño (demo) */}
      <div className="report-panel report-athlete-notice">
        <div>
          <div className="report-athlete-heading"><Moon size={18} /><h2>Calidad del Sueño registrada por el atleta</h2></div>
          <p>Espacio de auto-registro exclusivo para reporte matutino de descanso. Consulta tu evolución y bitácora de sueño.</p>
        </div>
        <span><LockKeyhole size={15} />Acceso Restringido: Vista Personal del Atleta</span>
      </div>
      <div className="report-athlete-grid">
        <section className="report-panel report-sleep-form">
          <div className="report-section-heading report-section-heading-compact"><h2>Registro Diario de Sueño</h2><span>Escala 1 al 5</span></div>
          <label className="report-input-label" htmlFor="report-sleep-date">Seleccionar Fecha:</label>
          <input id="report-sleep-date" type="date" value="2024-10-15" readOnly />
          <fieldset className="report-score-field" disabled>
            <legend>Puntuación de Calidad:</legend>
            <div className="report-score-options">
              {[['1', 'Pésimo'], ['2', 'Malo'], ['3', 'Regular'], ['4', 'Bueno'], ['5', 'Excelente']].map(([score, label]) => (
                <button className={score === '4' ? 'is-selected' : ''} key={score} type="button" disabled aria-pressed={score === '4'}>
                  <strong>{score}</strong><span>{label}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <label className="report-input-label" htmlFor="report-sleep-notes">Notas de Descanso / Sensaciones:</label>
          <textarea id="report-sleep-notes" placeholder="Ej. Dormí 8 horas completas sin interrupciones. Musculatura ligera tras descarga." rows="3" readOnly />
          <button className="report-save-button" type="button" disabled title="Disponible cuando exista una conexión de guardado"><ClipboardCheck size={16} />Guardar Calidad del Sueño</button>
        </section>
        <div className="report-athlete-history">
          <section className="report-panel report-sleep-evolution">
            <div className="report-section-heading"><div><h2>Evolución Temporal del Sueño</h2><p>Tendencia últimos 7 días con notas asociadas</p></div><div className="report-period-switch"><button type="button" className="is-selected">Semanal</button><button type="button">Mensual</button></div></div>
            <div className="report-sleep-chart" aria-label="Evolución demostrativa de calidad del sueño">
              {athleteSleepSamples.map((item) => (
                <div className="report-sleep-chart-day" key={item.date}>
                  <span>{item.score}</span>
                  <i className={`report-chart-bar report-tone-${item.tone}`} style={{ height: item.height }} />
                  <small>{item.date}</small>
                </div>
              ))}
            </div>
          </section>
          <section className="report-panel report-empty-day">
            <div className="report-empty-icon"><Clock3 size={23} /></div>
            <h3>Sin registro para esta fecha</h3>
            <p>No se detectaron reportes de calidad del sueño para la fecha seleccionada (14 de Octubre). Completa el registro matutino para que el cuerpo técnico pueda optimizar tu carga diaria.</p>
            <button className="report-button report-button-muted" type="button" disabled title="Disponible cuando exista una conexión de registro">Reportar descanso de este día</button>
          </section>
        </div>
      </div>

      {/* Cineantropometría personal */}
      <section className="report-panel reporte-atleta-cine">
        <div className="reporte-atleta-cine-header">
          <div className="reporte-atleta-cine-title">
            <Ruler size={20} />
            <div>
              <h2>Evaluaciones Cineantropométricas</h2>
              <p>Historial de mediciones personales. Este reporte puede compartirse con un profesional de salud.</p>
            </div>
          </div>
        </div>

        {loadingCine && <p className="reporte-atleta-cine-msg">Cargando evaluaciones...</p>}
        {errorCine && <p className="reporte-atleta-cine-msg reporte-atleta-cine-error">{errorCine}</p>}

        {!loadingCine && !errorCine && evaluaciones.length === 0 && (
          <p className="reporte-atleta-cine-msg">Aún no tienes evaluaciones registradas.</p>
        )}

        {!loadingCine && evaluaciones.length > 0 && (
          <>
            {/* Resumen de última evaluación */}
            <div className="reporte-atleta-cine-resumen">
              <div className="reporte-atleta-cine-card">
                <span className="reporte-atleta-cine-card-label">Fecha</span>
                <span className="reporte-atleta-cine-card-value">{formatFecha(ultima.fecha)}</span>
              </div>
              <div className="reporte-atleta-cine-card">
                <span className="reporte-atleta-cine-card-label">Altura</span>
                <span className="reporte-atleta-cine-card-value">{formatNum(ultima.altura_cm, 1)} cm</span>
              </div>
              <div className="reporte-atleta-cine-card">
                <span className="reporte-atleta-cine-card-label">Peso</span>
                <span className="reporte-atleta-cine-card-value">{formatNum(ultima.peso_kg, 1)} kg</span>
              </div>
              <div className="reporte-atleta-cine-card">
                <span className="reporte-atleta-cine-card-label">Promedio ejes</span>
                <span className="reporte-atleta-cine-card-value">{formatNum(ultima.promedio, 1)}</span>
              </div>
              <div className="reporte-atleta-cine-card reporte-atleta-cine-card-wide">
                <span className="reporte-atleta-cine-card-label">Área · Subárea</span>
                <span className="reporte-atleta-cine-card-value">{ultima.area} · {ultima.subarea}</span>
              </div>
            </div>

            {/* Puntuación por eje (0-100) de la última evaluación */}
            <div className="reporte-atleta-cine-ejes">
              {CINE_EJES.map(([eje, label]) => (
                <div className="reporte-atleta-cine-eje" key={eje}>
                  <span>{label}</span>
                  <div className="reporte-atleta-cine-eje-track">
                    <i style={{ width: `${ultima.ejes?.[eje] ?? 0}%` }} />
                  </div>
                  <strong>{formatNum(ultima.ejes?.[eje], 1)}</strong>
                </div>
              ))}
            </div>

            {/* Historial completo */}
            {evaluaciones.length > 1 && (
              <div className="reporte-atleta-cine-tabla-wrap">
                <table className="reporte-atleta-cine-tabla">
                  <thead>
                    <tr>
                      <th scope="col">Fecha</th>
                      <th scope="col">Subárea</th>
                      <th scope="col">Altura (cm)</th>
                      <th scope="col">Peso (kg)</th>
                      <th scope="col">Promedio ejes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluaciones.map((ev) => (
                      <tr key={ev.id}>
                        <td data-label="Fecha">{formatFecha(ev.fecha)}</td>
                        <td data-label="Subárea">{ev.subarea}</td>
                        <td data-label="Altura (cm)">{formatNum(ev.altura_cm, 1)}</td>
                        <td data-label="Peso (kg)">{formatNum(ev.peso_kg, 1)}</td>
                        <td data-label="Promedio ejes">{formatNum(ev.promedio, 1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

    </section>
    </div>
  );
}
