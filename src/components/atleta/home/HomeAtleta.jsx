import { createElement, useEffect, useState } from 'react';
import {
  Activity, Calendar, CalendarCheck, CheckCircle2, ChevronRight, ClipboardList, Clock, Dumbbell, Moon, Ruler, Timer, TrendingUp,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import UserService from '../../../api/services/Userservice';
import '../../../styles/components/atleta/HomeAtleta.css';
import CargaCircular from '../../layout/CargaCircular';

/*
 * Home del atleta con el mismo diseño del Home del entrenador: banner, 4 indicadores y tarjetas
 * (sueño, asistencia, tests y plan del día), con los datos del propio atleta.
 */

const formatFecha = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const fechaCorta = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' });

// Color según la calidad de sueño: verde 7 o más, amarillo 5 y 6, rojo menos de 5.
const colorSueno = (calidad) => {
  if (calidad >= 7) return 'var(--state-success)';
  if (calidad >= 5) return 'var(--state-warning)';
  return 'var(--state-danger)';
};

// La calidad explicada en palabras, para que el atleta sepa qué significa el número.
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
      <span>Calidad: {punto.calidad}/10 · {nivelSueno(punto.calidad)}</span>
    </div>
  );
}

function Indicador({ titulo, valor, detalle, icono, color }) {
  return (
    <article className="home-atl-card home-atl-metrica">
      <div className="home-atl-metrica-cabecera">
        <span className="home-atl-metrica-titulo">{titulo}</span>
        <span className="home-atl-icono">{createElement(icono, { size: 18, 'aria-hidden': true })}</span>
      </div>
      <strong className="home-atl-metrica-valor" style={color ? { color } : undefined}>{valor}</strong>
      {detalle && <span className="home-atl-metrica-detalle">{detalle}</span>}
    </article>
  );
}

function Enlace({ children, onClick }) {
  return (
    <button type="button" className="home-atl-enlace" onClick={onClick}>
      {children} <ChevronRight size={14} aria-hidden="true" />
    </button>
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

  const { atleta, sueno, asistencia, planes, antropometria } = estado.data;
  const tests = estado.data.tests || { proximos: [], ultimos: [] };
  const proximoTest = tests.proximos[0];
  const masElMismoDia = proximoTest ? tests.proximos.filter((test) => test.fecha === proximoTest.fecha).length - 1 : 0;
  const tendencia = sueno.tendencia.map((punto) => ({ ...punto, etiqueta: fechaCorta(punto.fecha) }));
  const promedioSueno = tendencia.length
    ? Math.round((tendencia.reduce((total, punto) => total + punto.calidad, 0) / tendencia.length) * 10) / 10
    : null;
  const porcentaje = Math.min(Number(asistencia.porcentaje) || 0, 100);

  return (
    <div className="home-atl">
      {/* Banner de bienvenida */}
      <section className="home-atl-card home-atl-banner">
        <div className="home-atl-banner-texto">
          <h1>Hola, {atleta.nombre}</h1>
          <p>{atleta.especialidades.length ? atleta.especialidades.join(' · ') : 'Sin especialidad asignada'}</p>
        </div>
        <div className="home-atl-banner-chips">
          <span className={`home-atl-estado home-atl-estado--${atleta.estado_clave}`}>{atleta.estado}</span>
          <span className="home-atl-fecha">
            <Clock size={16} aria-hidden="true" />
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </section>

      {/* Indicadores */}
      <Indicador
        titulo="Último sueño"
        icono={Moon}
        valor={sueno.ultimo ? `${sueno.ultimo.calidad}/10` : '—'}
        color={sueno.ultimo ? colorSueno(sueno.ultimo.calidad) : undefined}
        detalle={sueno.ultimo ? `${nivelSueno(sueno.ultimo.calidad)} · noche del ${formatFecha(sueno.ultimo.fecha)}` : 'Sin registros todavía'}
      />
      <Indicador
        titulo={`Asistencia (${asistencia.dias} días)`}
        icono={CalendarCheck}
        valor={asistencia.total ? `${asistencia.porcentaje}%` : '—'}
        detalle={asistencia.total ? `${asistencia.presentes} de ${asistencia.total} entrenamientos` : 'Sin registros todavía'}
      />
      <Indicador
        titulo="Próximo test"
        icono={Timer}
        valor={proximoTest ? formatFecha(proximoTest.fecha) : '—'}
        detalle={proximoTest
          ? `${proximoTest.prueba}${masElMismoDia > 0 ? ` y ${masElMismoDia} más` : ''}${proximoTest.recuperacion ? ' (recuperación)' : ''}`
          : 'Sin tests programados'}
      />
      <Indicador
        titulo="Próxima medición"
        icono={Ruler}
        valor={antropometria.proxima_medicion ? formatFecha(antropometria.proxima_medicion) : '—'}
        detalle={antropometria.ultima_evaluacion
          ? `Última: ${formatFecha(antropometria.ultima_evaluacion)}`
          : 'Sin evaluaciones todavía'}
      />

      {/* Calidad de sueño */}
      <article className="home-atl-card home-atl-sueno">
        <h3 className="home-atl-seccion"><TrendingUp size={18} aria-hidden="true" /> ¿Cómo has dormido?</h3>
        {promedioSueno !== null && (
          <p className="home-atl-resumen">
            Tu promedio es <strong style={{ color: colorSueno(promedioSueno) }}>{promedioSueno}/10</strong>: {nivelSueno(promedioSueno).toLowerCase()}.
          </p>
        )}
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
          <p className="home-atl-vacio">Registra tu sueño para ver cómo va tu descanso.</p>
        )}
        <ul className="home-atl-leyenda">
          <li><span style={{ background: 'var(--state-success)' }} />7 a 10: buen descanso</li>
          <li><span style={{ background: 'var(--state-warning)' }} />5 y 6: regular</li>
          <li><span style={{ background: 'var(--state-danger)' }} />1 a 4: mal descanso</li>
        </ul>
        <div className="home-atl-enlaces">
          <Enlace onClick={() => onNavigate('sueno')}>Registrar sueño</Enlace>
          <Enlace onClick={() => onNavigate('sueno_historial')}>Ver mi análisis</Enlace>
        </div>
      </article>

      {/* Asistencia */}
      <article className="home-atl-card home-atl-asistencia">
        <h3 className="home-atl-seccion"><Activity size={18} aria-hidden="true" /> Mi asistencia</h3>
        {asistencia.total ? (
          <>
            <div className="home-atl-asistencia-total">
              <span className="home-atl-asistencia-numero">{asistencia.porcentaje}%</span>
              <span className="home-atl-asistencia-etiqueta">Últimos {asistencia.dias} días</span>
              <div className="home-atl-barra" role="img" aria-label={`Asistencia del ${asistencia.porcentaje}%`}>
                <span style={{ width: `${porcentaje}%` }} />
              </div>
            </div>
            <ul className="home-atl-desglose">
              <li><span>Presente</span><strong className="home-atl-ok">{asistencia.presentes}</strong></li>
              <li><span>Ausente</span><strong className="home-atl-mal">{asistencia.ausentes}</strong></li>
              <li><span>Justificado</span><strong className="home-atl-regular">{asistencia.justificados}</strong></li>
            </ul>
          </>
        ) : (
          <p className="home-atl-vacio">Todavía no tienes asistencias registradas.</p>
        )}
        <div className="home-atl-enlaces">
          <Enlace onClick={() => onNavigate('asistencias')}>Ver mi análisis</Enlace>
        </div>
      </article>

      {/* Tests: próximos y últimos resultados */}
      <article className="home-atl-card home-atl-tests">
        <h3 className="home-atl-seccion"><ClipboardList size={18} aria-hidden="true" /> Mis tests</h3>
        <h4 className="home-atl-subtitulo">Próximos</h4>
        {tests.proximos.length ? (
          <ul className="home-atl-lista">
            {tests.proximos.map((test) => (
              <li key={`${test.fecha}-${test.prueba}-${test.subarea}`}>
                <span className="home-atl-lista-fecha">{formatFecha(test.fecha)}</span>
                <span className="home-atl-lista-texto">
                  {test.prueba}
                  <small>{test.subarea}{test.recuperacion ? ' · Recuperación' : ''}</small>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="home-atl-vacio">No tienes tests programados.</p>
        )}
        <h4 className="home-atl-subtitulo">Últimos resultados</h4>
        {tests.ultimos.length ? (
          <ul className="home-atl-lista">
            {tests.ultimos.map((resultado) => (
              <li key={`${resultado.fecha}-${resultado.prueba}`}>
                <span className="home-atl-lista-fecha">{formatFecha(resultado.fecha)}</span>
                <span className="home-atl-lista-texto">{resultado.prueba}</span>
                <strong className={resultado.ausente ? 'home-atl-mal' : 'home-atl-lista-valor'}>
                  {resultado.ausente ? 'Ausente' : `${resultado.valor} ${resultado.unidad}`}
                </strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="home-atl-vacio">Todavía no tienes resultados.</p>
        )}
        <div className="home-atl-enlaces">
          <Enlace onClick={() => onNavigate('tests')}>Ver mis tests</Enlace>
        </div>
      </article>

      {/* Plan del día */}
      <article className="home-atl-card home-atl-plan">
        <div className="home-atl-plan-cabecera">
          <h3 className="home-atl-seccion"><Calendar size={18} aria-hidden="true" /> Mi entrenamiento de hoy</h3>
          <Enlace onClick={() => onNavigate('rutina')}>
            {planes.total ? `Ver mi plan (${planes.total})` : 'Ver mi plan'}
          </Enlace>
        </div>
        {!planes.hoy.length ? (
          <p className="home-atl-listo">
            <CheckCircle2 size={14} aria-hidden="true" />
            {planes.total ? 'Hoy no tienes sesión en tu plan.' : 'Todavía no tienes un plan asignado.'}
          </p>
        ) : (
          <div className="home-atl-plan-grid">
            {planes.hoy.map((plan) => (
              <div key={`${plan.plan_id}-${plan.semana}`} className="home-atl-plan-caja">
                <div className="home-atl-plan-titulo">
                  <span className="home-atl-semana">Semana {plan.semana}</span>
                  <h4>{plan.plan}</h4>
                </div>
                <div className="home-atl-sesion">
                  {plan.ejercicios.length === 0 ? (
                    <p className="home-atl-vacio">Sesión sin ejercicios cargados.</p>
                  ) : plan.ejercicios.map((ejercicio) => (
                    <div key={ejercicio.id} className="home-atl-ejercicio">
                      <span className="home-atl-series"><Dumbbell size={12} aria-hidden="true" /> {ejercicio.series} x {ejercicio.repeticiones}</span>
                      <span className="home-atl-ejercicio-nombre">{ejercicio.nombre}</span>
                      {ejercicio.intensidad && <span className="home-atl-intensidad">{ejercicio.intensidad}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
