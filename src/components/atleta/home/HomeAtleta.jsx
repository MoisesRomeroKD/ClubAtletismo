import { useEffect, useState } from 'react';
import {
  Activity, CalendarCheck, ChevronRight, Dumbbell, Moon, Ruler, TrendingUp,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import UserService from '../../../api/services/Userservice';
import '../../../styles/components/atleta/HomeAtleta.css';
import CargaCircular from '../../layout/CargaCircular';

const formatFecha = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const fechaCorta = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' });

// Color según la nota de sueño: verde 7 o más, amarillo 5 y 6, rojo menos de 5.
const colorSueno = (calidad) => {
  if (calidad >= 7) return 'var(--state-success)';
  if (calidad >= 5) return 'var(--state-warning)';
  return 'var(--state-danger)';
};

// La nota explicada en palabras, para que el atleta sepa qué significa el número.
const nivelSueno = (calidad) => {
  if (calidad >= 7) return 'Buen descanso';
  if (calidad >= 5) return 'Descanso regular';
  return 'Mal descanso';
};

function TooltipSueno({ active, payload }) {
  if (!active || !payload?.length) return null;
  const punto = payload[0].payload;
  return (
    <div className="home-atl-tooltip">
      <strong>{formatFecha(punto.fecha)}</strong>
      <span>Nota: {punto.calidad}/10 · {nivelSueno(punto.calidad)}</span>
    </div>
  );
}

export default function HomeAtleta({ onNavigate }) {
  const [estado, setEstado] = useState({ data: null, error: '' });

  useEffect(() => {
    let activo = true;
    UserService.getHomeAtleta()
      .then((data) => { if (activo) setEstado({ data, error: '' }); })
      .catch((error) => {
        if (activo) setEstado({ data: null, error: error.response?.data?.detail || 'No se pudo cargar tu Home.' });
      });
    return () => { activo = false; };
  }, []);

  if (estado.error) return <p className="home-atl-vacio home-atl-error" role="alert">{estado.error}</p>;
  if (!estado.data) return <CargaCircular texto="Cargando Home" />;

  const { atleta, sueno, asistencia, planes, antropometria, fecha } = estado.data;
  const ejerciciosHoy = planes.hoy.reduce((total, plan) => total + plan.ejercicios.length, 0);
  const tendencia = sueno.tendencia.map((punto) => ({ ...punto, etiqueta: fechaCorta(punto.fecha) }));
  const promedioSueno = tendencia.length
    ? Math.round((tendencia.reduce((total, punto) => total + punto.calidad, 0) / tendencia.length) * 10) / 10
    : null;

  return (
    <div className="home-atl">
      <section className="home-atl-banner">
        <div>
          <h1>Bienvenido, {atleta.nombre}</h1>
          <p>{atleta.especialidades.length ? atleta.especialidades.join(' · ') : 'Sin especialidad asignada'}</p>
        </div>
        <span className="home-atl-badge">Temporada {fecha.slice(0, 4)}</span>
      </section>

      <section className="home-atl-kpis">
        <article className="home-atl-kpi">
          <span className="home-atl-kpi-titulo"><Moon size={16} aria-hidden="true" /> Último sueño</span>
          {sueno.ultimo ? (
            <>
              <strong className="home-atl-kpi-valor" style={{ color: colorSueno(sueno.ultimo.calidad) }}>
                {sueno.ultimo.calidad} / 10
              </strong>
              <span className="home-atl-kpi-significado" style={{ color: colorSueno(sueno.ultimo.calidad) }}>
                {nivelSueno(sueno.ultimo.calidad)}
              </span>
              <small>Noche del {formatFecha(sueno.ultimo.fecha)}</small>
            </>
          ) : (
            <>
              <strong className="home-atl-kpi-valor">Sin registros</strong>
              <small>Registra cómo dormiste para ver tu descanso.</small>
            </>
          )}
          <div className="home-atl-links">
            <button type="button" className="home-atl-link" onClick={() => onNavigate('sueno')}>
              Registrar sueño <ChevronRight size={14} aria-hidden="true" />
            </button>
            <button type="button" className="home-atl-link" onClick={() => onNavigate('sueno_historial')}>
              Ver historial <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
        </article>

        <article className="home-atl-kpi">
          <span className="home-atl-kpi-titulo"><Dumbbell size={16} aria-hidden="true" /> Plan de entrenamiento</span>
          <strong className="home-atl-kpi-valor">
            {planes.total ? `${planes.total} plan${planes.total === 1 ? '' : 'es'} asignado${planes.total === 1 ? '' : 's'}` : 'Sin plan activo'}
          </strong>
          <small>{ejerciciosHoy ? `${ejerciciosHoy} ejercicio(s) para hoy` : 'Sin ejercicios para hoy'}</small>
          <button type="button" className="home-atl-link" onClick={() => onNavigate('rutina')}>
            Ver mi plan <ChevronRight size={14} aria-hidden="true" />
          </button>
        </article>

        <article className="home-atl-kpi">
          <span className="home-atl-kpi-titulo"><CalendarCheck size={16} aria-hidden="true" /> Asistencia ({asistencia.dias} días)</span>
          <strong className="home-atl-kpi-valor">{asistencia.total ? `${asistencia.porcentaje}%` : 'Sin registros'}</strong>
          {asistencia.total > 0 && (
            <>
              <div className="home-atl-barra" role="img" aria-label={`Asistencia del ${asistencia.porcentaje}%`}>
                <span style={{ width: `${Math.min(Number(asistencia.porcentaje) || 0, 100)}%` }} />
              </div>
              <span className="home-atl-kpi-significado">
                Fuiste a {asistencia.presentes} de {asistencia.total} entrenamientos
              </span>
              <small>{asistencia.ausentes} falta(s) · {asistencia.justificados} justificada(s)</small>
            </>
          )}
          <button type="button" className="home-atl-link" onClick={() => onNavigate('asistencias')}>
            Consultar registro <ChevronRight size={14} aria-hidden="true" />
          </button>
        </article>
      </section>

      <section className="home-atl-grid">
        <article className="home-atl-card">
          <h3><TrendingUp size={18} aria-hidden="true" /> ¿Cómo has dormido?</h3>
          {promedioSueno !== null && (
            <p className="home-atl-resumen">
              Tu nota promedio es <strong style={{ color: colorSueno(promedioSueno) }}>{promedioSueno}/10</strong>: {nivelSueno(promedioSueno).toLowerCase()}.
            </p>
          )}
          <small className="home-atl-nota">Cada barra es una noche. Mientras más alta, mejor dormiste. La línea marca la meta (7).</small>
          {tendencia.length ? (
            <div className="home-atl-grafico">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tendencia} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
                  <XAxis dataKey="etiqueta" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 10]} ticks={[0, 5, 10]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<TooltipSueno />} cursor={{ fill: 'var(--bg-surface)' }} />
                  <ReferenceLine y={7} stroke="var(--text-muted)" strokeDasharray="4 4" />
                  <Bar dataKey="calidad" radius={[4, 4, 0, 0]}>
                    {tendencia.map((punto) => <Cell key={punto.fecha} fill={colorSueno(punto.calidad)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="home-atl-vacio">Registra tu sueño para ver la tendencia.</p>
          )}
          <ul className="home-atl-leyenda">
            <li><span style={{ background: 'var(--state-success)' }} />7 a 10: buen descanso</li>
            <li><span style={{ background: 'var(--state-warning)' }} />5 y 6: regular</li>
            <li><span style={{ background: 'var(--state-danger)' }} />1 a 4: mal descanso</li>
          </ul>
        </article>

        <article className="home-atl-card">
          <h3><Activity size={18} aria-hidden="true" /> Mis datos</h3>
          <dl className="home-atl-datos">
            <div><dt>Estado</dt><dd>{atleta.estado}</dd></div>
            <div>
              <dt><Ruler size={14} aria-hidden="true" /> Última evaluación antropométrica</dt>
              <dd>{antropometria.ultima_evaluacion ? formatFecha(antropometria.ultima_evaluacion) : 'Sin evaluaciones'}</dd>
            </div>
            <div>
              <dt>Próxima medición</dt>
              <dd>{antropometria.proxima_medicion ? formatFecha(antropometria.proxima_medicion) : 'Sin medición programada'}</dd>
            </div>
            <div>
              <dt>Especialidad</dt>
              <dd>{atleta.especialidades.length ? atleta.especialidades.join(', ') : 'Sin especialidad asignada'}</dd>
            </div>
          </dl>
        </article>
      </section>
    </div>
  );
}
