import React, { useEffect, useState } from 'react';
import {
  CartesianGrid, Legend, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import podApi from '../../../api/podApi';
import { CINE_AXES } from '../../reportes/reportUtils';
import '../../../styles/components/atleta/antropometria/AntropometriaAtleta.css';

/*
 * MI ANTROPOMETRÍA (atleta, solo consulta)
 * Sus mediciones de cineantropometría: los 6 ejes (0 a 100, más alto es mejor), cómo cambiaron
 * respecto a la medición anterior, su evolución, altura y peso. Datos: /evaluacion/mis-evaluaciones/.
 */

const formatFecha = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};
const fechaCorta = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: '2-digit' });
const numero = (valor, unidad = '') => (valor === null || valor === undefined ? '—' : `${valor}${unidad}`);

// En palabras, para que el atleta sepa qué significa el puntaje.
const nivel = (puntaje) => {
  if (puntaje === null || puntaje === undefined) return '';
  if (puntaje >= 70) return 'Alto';
  if (puntaje >= 40) return 'Medio';
  return 'Bajo';
};

function Cambio({ actual, anterior }) {
  if (actual === null || actual === undefined || anterior === null || anterior === undefined) return null;
  const diferencia = Math.round((actual - anterior) * 10) / 10;
  if (diferencia === 0) return <span className="antro-atl-cambio">=</span>;
  return (
    <span className={`antro-atl-cambio antro-atl-cambio--${diferencia > 0 ? 'sube' : 'baja'}`}>
      {diferencia > 0 ? '▲' : '▼'} {Math.abs(diferencia)}
    </span>
  );
}

function TooltipEjes({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="antro-atl-tooltip">
      <strong>{label}</strong>
      {payload.map((serie) => (
        <span key={serie.dataKey}>{serie.name}: {numero(serie.value)}</span>
      ))}
    </div>
  );
}

export default function AntropometriaAtletaView() {
  const [estado, setEstado] = useState({ cargando: true, evaluaciones: [], error: '' });

  useEffect(() => {
    let activo = true;
    podApi.get('/v1/evaluacion/mis-evaluaciones/')
      .then((respuesta) => {
        if (!activo) return;
        const lista = Array.isArray(respuesta.data) ? respuesta.data : [];
        // Más antigua primero (para la evolución); la última es la actual.
        setEstado({ cargando: false, evaluaciones: [...lista].sort((a, b) => a.fecha.localeCompare(b.fecha)), error: '' });
      })
      .catch(() => {
        if (activo) setEstado({ cargando: false, evaluaciones: [], error: 'No se pudieron cargar tus mediciones.' });
      });
    return () => { activo = false; };
  }, []);

  if (estado.cargando) return <p className="antro-atl-vacio">Cargando tus mediciones...</p>;
  if (estado.error) return <p className="antro-atl-vacio antro-atl-error" role="alert">{estado.error}</p>;

  const { evaluaciones } = estado;
  if (!evaluaciones.length) {
    return (
      <div className="antro-atl">
        <h2 className="antro-atl-titulo">Mi antropometría</h2>
        <p className="antro-atl-vacio">
          Todavía no tienes mediciones. Cuando tu entrenador registre una, aquí verás tus 6 ejes y tu evolución.
        </p>
      </div>
    );
  }

  const actual = evaluaciones[evaluaciones.length - 1];
  const anterior = evaluaciones.length > 1 ? evaluaciones[evaluaciones.length - 2] : null;
  const radar = CINE_AXES.map(([eje, etiqueta]) => ({
    eje: etiqueta,
    actual: actual.ejes?.[eje] ?? null,
    anterior: anterior ? anterior.ejes?.[eje] ?? null : null,
  }));
  const evolucion = evaluaciones.map((evaluacion) => ({
    etiqueta: fechaCorta(evaluacion.fecha),
    fecha: evaluacion.fecha,
    promedio: evaluacion.promedio,
  }));
  const ejesOrdenados = CINE_AXES
    .map(([eje, etiqueta]) => ({ eje, etiqueta, puntaje: actual.ejes?.[eje] ?? null }))
    .filter((fila) => fila.puntaje !== null)
    .sort((a, b) => b.puntaje - a.puntaje);
  const fuertes = ejesOrdenados.slice(0, 2).map((fila) => fila.etiqueta);

  return (
    <div className="antro-atl">
      <header className="antro-atl-encabezado">
        <h2 className="antro-atl-titulo">Mi antropometría</h2>
        <p>
          Cada eje va de 0 a 100: mientras más alto, mejor. Sirve para saber en qué subárea puedes rendir más.
        </p>
      </header>

      <div className="antro-atl-kpis">
        <div className="antro-atl-kpi">
          <span>Última medición</span>
          <strong>{formatFecha(actual.fecha)}</strong>
          <small>{actual.subarea}</small>
        </div>
        <div className="antro-atl-kpi">
          <span>Promedio de los 6 ejes</span>
          <strong>{numero(actual.promedio)} <Cambio actual={actual.promedio} anterior={anterior?.promedio} /></strong>
          <small>{nivel(actual.promedio)}{anterior ? ' · respecto a la anterior' : ''}</small>
        </div>
        <div className="antro-atl-kpi">
          <span>Altura</span>
          <strong>{numero(actual.altura_cm, ' cm')} <Cambio actual={actual.altura_cm} anterior={anterior?.altura_cm} /></strong>
        </div>
        <div className="antro-atl-kpi">
          <span>Peso</span>
          <strong>{numero(actual.peso_kg, ' kg')} <Cambio actual={actual.peso_kg} anterior={anterior?.peso_kg} /></strong>
        </div>
      </div>

      {fuertes.length > 0 && (
        <p className="antro-atl-destacado">
          Tus puntos más fuertes hoy: <strong>{fuertes.join(' y ')}</strong>.
        </p>
      )}

      <div className="antro-atl-grid">
        <section className="antro-atl-panel">
          <h3>Tus 6 ejes{anterior ? ': última vs. anterior' : ''}</h3>
          <div className="antro-atl-radar" role="img" aria-label="Puntaje de los 6 ejes">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar} outerRadius="70%">
                <PolarGrid stroke="var(--border-main)" />
                <PolarAngleAxis dataKey="eje" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                {anterior && (
                  <Radar name={`Anterior (${formatFecha(anterior.fecha)})`} dataKey="anterior" stroke="var(--text-muted)" fill="var(--text-muted)" fillOpacity={0.12} strokeWidth={2} strokeDasharray="4 4" />
                )}
                <Radar name={`Última (${formatFecha(actual.fecha)})`} dataKey="actual" stroke="var(--func-primary)" fill="var(--func-primary)" fillOpacity={0.25} strokeWidth={2} />
                <Tooltip content={<TooltipEjes />} />
                {anterior && <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="antro-atl-panel">
          <h3>Puntaje por eje</h3>
          <ul className="antro-atl-ejes">
            {CINE_AXES.map(([eje, etiqueta]) => {
              const puntaje = actual.ejes?.[eje] ?? null;
              return (
                <li key={eje}>
                  <div className="antro-atl-eje-cabecera">
                    <span>{etiqueta}</span>
                    <span>
                      <strong>{numero(puntaje)}</strong> <small>{nivel(puntaje)}</small>{' '}
                      <Cambio actual={puntaje} anterior={anterior?.ejes?.[eje]} />
                    </span>
                  </div>
                  <div className="antro-atl-barra" aria-hidden="true">
                    <span style={{ width: `${Math.max(0, Math.min(100, puntaje || 0))}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {evolucion.length > 1 && (
        <section className="antro-atl-panel">
          <h3>Evolución del promedio</h3>
          <div className="antro-atl-linea" role="img" aria-label="Evolución del promedio de los 6 ejes">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucion} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
                <XAxis dataKey="etiqueta" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipEjes />} />
                <Line type="monotone" dataKey="promedio" name="Promedio" stroke="var(--func-primary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="antro-atl-panel">
        <h3>Historial de mediciones</h3>
        <div className="responsive-list">
          <div className="responsive-list__table antro-atl-tabla-wrap">
            <table className="antro-atl-tabla">
              <thead>
                <tr>
                  <th>Fecha</th><th>Subárea</th><th>Altura</th><th>Peso</th>
                  {CINE_AXES.map(([eje, etiqueta]) => <th key={eje}>{etiqueta}</th>)}
                  <th>Promedio</th>
                </tr>
              </thead>
              <tbody>
                {[...evaluaciones].reverse().map((evaluacion) => (
                  <tr key={evaluacion.id}>
                    <td>{formatFecha(evaluacion.fecha)}</td>
                    <td>{evaluacion.subarea}</td>
                    <td>{numero(evaluacion.altura_cm, ' cm')}</td>
                    <td>{numero(evaluacion.peso_kg, ' kg')}</td>
                    {CINE_AXES.map(([eje]) => <td key={eje}>{numero(evaluacion.ejes?.[eje])}</td>)}
                    <td><strong>{numero(evaluacion.promedio)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="responsive-list__cards antro-atl-filas">
            {[...evaluaciones].reverse().map((evaluacion) => (
              <li key={evaluacion.id}>
                <div>
                  <strong>{formatFecha(evaluacion.fecha)}</strong>
                  <span>{evaluacion.subarea} · {numero(evaluacion.altura_cm, ' cm')} · {numero(evaluacion.peso_kg, ' kg')}</span>
                </div>
                <strong>{numero(evaluacion.promedio)}</strong>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
