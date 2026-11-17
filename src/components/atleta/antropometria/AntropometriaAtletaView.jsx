import React, { useEffect, useState } from 'react';
import {
  Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import podApi from '../../../api/podApi';
import CineantropometriaService from '../../../api/services/Cineantropometriaservice';
import { CINE_AXES } from '../../reportes/reportUtils';
import '../../../styles/components/atleta/antropometria/AntropometriaAtleta.css';

/*
 * MI ANTROPOMETRÍA (atleta, solo consulta)
 * Sus mediciones de cineantropometría: los 6 ejes (0 a 100, más alto es mejor), la comparación de
 * dos de sus evaluaciones elegidas por fecha, su evolución, altura y peso. Datos: /evaluacion/mis-evaluaciones/
 * y /cineantropometria/evaluations/<id>/compare/<id>/ (el backend solo le deja comparar las suyas).
 */

const formatFecha = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};
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

function Diferencia({ valor }) {
  if (valor === 0) return <span className="antro-atl-cambio">= 0.00</span>;
  const sube = valor > 0;
  return (
    <span className={`antro-atl-cambio antro-atl-cambio--${sube ? 'sube' : 'baja'}`}>
      {sube ? '▲ +' : '▼ −'}{Math.abs(valor).toFixed(2)}
    </span>
  );
}

/* Compara dos de sus evaluaciones elegidas por fecha (por defecto, la última contra la anterior). */
function CompararEvaluaciones({ evaluaciones }) {
  // `evaluaciones` viene de la más nueva a la más vieja.
  const [eleccion, setEleccion] = useState({ actual: evaluaciones[0]?.id ?? null, anterior: evaluaciones[1]?.id ?? null });
  const [resultado, setResultado] = useState({ clave: '', data: null, error: '' });
  const clave = `${eleccion.actual}-${eleccion.anterior}`;
  const valida = evaluaciones.length >= 2 && eleccion.actual && eleccion.anterior && eleccion.actual !== eleccion.anterior;

  useEffect(() => {
    if (!valida) return undefined;
    let activo = true;
    CineantropometriaService.compareEvaluations(eleccion.actual, eleccion.anterior)
      .then((data) => { if (activo) setResultado({ clave, data, error: '' }); })
      .catch(() => { if (activo) setResultado({ clave, data: null, error: 'No se pudo comparar tus evaluaciones.' }); });
    return () => { activo = false; };
  }, [valida, clave, eleccion.actual, eleccion.anterior]);

  if (evaluaciones.length < 2) {
    return <p className="antro-atl-vacio">Se necesitan al menos dos evaluaciones para comparar.</p>;
  }

  const etiqueta = (evaluacion) => `${formatFecha(evaluacion.fecha)} · ${evaluacion.subarea}`;
  const fechaDe = (id) => formatFecha(evaluaciones.find((evaluacion) => evaluacion.id === id)?.fecha);
  const listo = resultado.clave === clave;
  const filas = listo && resultado.data ? resultado.data.comparison : [];
  const radar = filas.map((fila) => ({ eje: fila.axis, actual: fila.current_score, anterior: fila.previous_score }));

  return (
    <>
      <div className="antro-atl-selects">
        <label>
          Evaluación actual
          <select value={eleccion.actual ?? ''} onChange={(e) => setEleccion((previa) => ({ ...previa, actual: Number(e.target.value) }))}>
            {evaluaciones.map((evaluacion) => (
              <option key={evaluacion.id} value={evaluacion.id} disabled={evaluacion.id === eleccion.anterior}>{etiqueta(evaluacion)}</option>
            ))}
          </select>
        </label>
        <label>
          Evaluación anterior
          <select value={eleccion.anterior ?? ''} onChange={(e) => setEleccion((previa) => ({ ...previa, anterior: Number(e.target.value) }))}>
            {evaluaciones.map((evaluacion) => (
              <option key={evaluacion.id} value={evaluacion.id} disabled={evaluacion.id === eleccion.actual}>{etiqueta(evaluacion)}</option>
            ))}
          </select>
        </label>
      </div>

      {!listo ? (
        <p className="antro-atl-vacio">Comparando...</p>
      ) : resultado.error ? (
        <p className="antro-atl-vacio antro-atl-error" role="alert">{resultado.error}</p>
      ) : (
        <div className="antro-atl-grid">
          <div className="antro-atl-radar" role="img" aria-label="Comparación de los 6 ejes">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar} outerRadius="70%">
                <PolarGrid stroke="var(--border-main)" />
                <PolarAngleAxis dataKey="eje" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name={`Anterior (${fechaDe(eleccion.anterior)})`} dataKey="anterior" stroke="var(--text-muted)" fill="var(--text-muted)" fillOpacity={0.12} strokeWidth={2} strokeDasharray="4 4" />
                <Radar name={`Actual (${fechaDe(eleccion.actual)})`} dataKey="actual" stroke="var(--func-primary)" fill="var(--func-primary)" fillOpacity={0.25} strokeWidth={2} />
                <Tooltip content={<TooltipEjes />} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="responsive-list">
            <div className="responsive-list__table antro-atl-tabla-wrap">
              <table className="antro-atl-tabla">
                <thead>
                  <tr><th>Eje</th><th>Puntaje anterior</th><th>Puntaje actual</th><th>Diferencia</th></tr>
                </thead>
                <tbody>
                  {filas.map((fila) => (
                    <tr key={fila.axis}>
                      <td>{fila.axis}</td>
                      <td>{fila.previous_score.toFixed(2)}</td>
                      <td>{fila.current_score.toFixed(2)}</td>
                      <td><Diferencia valor={fila.difference} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="responsive-list__cards antro-atl-filas">
              {filas.map((fila) => (
                <li key={fila.axis}>
                  <div>
                    <strong>{fila.axis} <Diferencia valor={fila.difference} /></strong>
                    <span>Anterior {fila.previous_score.toFixed(2)} · Actual {fila.current_score.toFixed(2)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
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
  const radar = CINE_AXES.map(([eje, etiqueta]) => ({ eje: etiqueta, actual: actual.ejes?.[eje] ?? null }));
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
          <h3>Tus 6 ejes (última medición)</h3>
          <div className="antro-atl-radar" role="img" aria-label="Puntaje de los 6 ejes">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar} outerRadius="70%">
                <PolarGrid stroke="var(--border-main)" />
                <PolarAngleAxis dataKey="eje" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name={`Última (${formatFecha(actual.fecha)})`} dataKey="actual" stroke="var(--func-primary)" fill="var(--func-primary)" fillOpacity={0.25} strokeWidth={2} />
                <Tooltip content={<TooltipEjes />} />
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
                      <strong>{numero(puntaje)}</strong> <small>{nivel(puntaje)}</small>
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

      <section className="antro-atl-panel">
        <h3>Comparar evaluaciones</h3>
        <CompararEvaluaciones evaluaciones={[...evaluaciones].reverse()} />
      </section>

      <section className="antro-atl-panel">
        <h3>Historial de mediciones</h3>
        <div className="responsive-list">
          <div className="responsive-list__table antro-atl-tabla-wrap">
            <table className="antro-atl-tabla">
              <thead>
                <tr>
                  <th>Fecha</th><th>Subárea</th><th>Altura</th><th>Peso</th>
                  {CINE_AXES.map(([eje, etiqueta]) => <th key={eje}>{etiqueta}</th>)}
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
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
