import React, { useState, useEffect, useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import '../../../styles/components/admin/cineantropometria/CineantropometriaAdmin.css';

/* ============================================================================
   PROTOCOLO POD — 6 EJES CIENTÍFICOS
   ============================================================================
   Convención de normalización:
     min = PEOR valor (0 puntos)
     max = MEJOR valor (100 puntos)
   Esto aplica tanto para dirección "direct" (min < max numérico) como para
   "inverse" (min > max numérico, ej: tiempo 6.5s > 3.6s).
   ============================================================================ */

const initialConfig = [
  {
    id: 'e1',
    name: 'Potencia',
    active: true,
    measurements: [
      { id: 'm1_e1', name: 'Salto Vertical', unit: 'cm' },
    ],
    indicators: [
      {
        id: 'i1_e1',
        name: 'Puntuación Potencia',
        unit: 'pt',
        type: 'direct',
        varA: 'm1_e1',
        min: 15.0,
        max: 85.0,
        direction: 'direct',
      },
    ],
  },
  {
    id: 'e2',
    name: 'Velocidad',
    active: true,
    measurements: [
      { id: 'm1_e2', name: 'Sprint 30 m', unit: 's' },
    ],
    indicators: [
      {
        id: 'i1_e2',
        name: 'Puntuación Velocidad',
        unit: 'pt',
        type: 'direct',
        varA: 'm1_e2',
        min: 6.5,
        max: 3.6,
        direction: 'inverse',
      },
    ],
  },
  {
    id: 'e3',
    name: 'Resistencia',
    active: true,
    measurements: [
      { id: 'm1_e3', name: 'Nivel Navette', unit: 'niveles' },
    ],
    indicators: [
      {
        id: 'i1_e3',
        name: 'Puntuación Resistencia',
        unit: 'pt',
        type: 'direct',
        varA: 'm1_e3',
        min: 2.0,
        max: 18.0,
        direction: 'direct',
      },
    ],
  },
  {
    id: 'e4',
    name: 'Envergadura',
    active: true,
    measurements: [
      { id: 'm1_e4', name: 'Altura', unit: 'cm' },
      { id: 'm2_e4', name: 'Envergadura', unit: 'cm' },
    ],
    indicators: [
      {
        id: 'i1_e4',
        name: 'Índice de Alcance',
        unit: 'cm',
        type: 'difference',
        varA: 'm2_e4',
        varB: 'm1_e4',
        min: -5.0,
        max: 15.0,
        direction: 'direct',
      },
    ],
  },
  {
    id: 'e5',
    name: 'Fuerza',
    active: true,
    measurements: [
      { id: 'm1_e5', name: 'Peso Corporal', unit: 'kg' },
      { id: 'm2_e5', name: 'Carga Sentadilla', unit: 'kg' },
    ],
    indicators: [
      {
        id: 'i1_e5',
        name: 'Ratio Sentadilla / Peso',
        unit: '×',
        type: 'ratio',
        varA: 'm2_e5',
        varB: 'm1_e5',
        min: 0.5,
        max: 2.5,
        direction: 'direct',
      },
    ],
  },
  {
    id: 'e6',
    name: 'Flexibilidad',
    active: true,
    measurements: [
      { id: 'm1_e6', name: 'Test de Wells', unit: 'cm' },
    ],
    indicators: [
      {
        id: 'i1_e6',
        name: 'Puntuación Flexibilidad',
        unit: 'pt',
        type: 'direct',
        varA: 'm1_e6',
        min: -10.0,
        max: 25.0,
        direction: 'direct',
      },
    ],
  },
];

const initialAthletes = [
  { id: 'a1', name: 'Juan Pérez', area: 'Velocidad', subarea: '100 m', cedula: 'V-1555666' },
  { id: 'a2', name: 'María Gómez', area: 'Saltos', subarea: 'Salto Largo', cedula: 'V-3111222' },
  { id: 'a3', name: 'Carlos Ruiz', area: 'Velocidad', subarea: '200 m', cedula: 'V-0222333' },
  { id: 'a4', name: 'Sofía Larga', area: 'Saltos', subarea: 'Triple Salto', cedula: 'V-25444555' },
];

const initialEvaluations = [
  {
    id: 'ev1',
    athleteId: 'a1',
    date: '2026-06-15',
    evaluator: 'Carlos Ruiz',
    data: {
      m1_e1: 60.5,     // Salto vertical
      m1_e2: 4.30,     // Sprint 30m
      m1_e3: 13.2,     // Navette
      m1_e4: 181,      // Altura
      m2_e4: 187,      // Envergadura
      m1_e5: 75,       // Peso
      m2_e5: 140,      // Sentadilla
      m1_e6: 18.35,    // Wells
    },
  },
  {
    id: 'ev2',
    athleteId: 'a1',
    date: '2026-08-11',
    evaluator: 'Carlos Ruiz',
    data: {
      m1_e1: 65.4,
      m1_e2: 4.06,
      m1_e3: 12.8,
      m1_e4: 181,
      m2_e4: 187,
      m1_e5: 75,
      m2_e5: 148.5,
      m1_e6: 20.8,
    },
  },
  {
    id: 'ev3',
    athleteId: 'a2',
    date: '2026-07-20',
    evaluator: 'Carlos Ruiz',
    data: {
      m1_e1: 53.5,
      m1_e2: 4.00,
      m1_e3: 14.8,
      m1_e4: 168,
      m2_e4: 170,
      m1_e5: 58,
      m2_e5: 110,
      m1_e6: 22.5,
    },
  },
];

/* ============================================================================
   UTILS
   ============================================================================ */

const generateId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

/**
 * Calcula el valor CRUDO del indicador según su tipo.
 * - 'direct'     → devuelve varA
 * - 'difference' → varA − varB
 * - 'ratio'      → varA / varB
 * - 'ratio_percent' → (varA / varB) × 100
 */
const calculateIndicatorValue = (indicator, measurementsData) => {
  if (!indicator) return null;
  const valA = parseFloat(measurementsData[indicator.varA]);
  const valB = indicator.varB ? parseFloat(measurementsData[indicator.varB]) : null;
  if (isNaN(valA)) return null;

  switch (indicator.type) {
    case 'difference':
      if (isNaN(valB)) return null;
      return valA - valB;
    case 'ratio':
      if (isNaN(valB) || valB === 0) return null;
      return valA / valB;
    case 'ratio_percent':
      if (isNaN(valB) || valB === 0) return null;
      return (valA / valB) * 100;
    case 'direct':
      return valA;
    default:
      return null;
  }
};

/**
 * Normaliza el valor a 0-100.
 * min = peor valor (0 pt) · max = mejor valor (100 pt)
 * Funciona igual para dirección "direct" (min<max) e "inverse" (min>max).
 */
const normalizeScore = (value, min, max) => {
  if (value === null || isNaN(value)) return 0;
  const p = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, Math.round(p)));
};

const formatValue = (val) => {
  if (val === null || isNaN(val)) return '—';
  const n = parseFloat(val);
  if (Math.abs(n) < 10) return n.toFixed(2);
  return n.toFixed(1);
};

const getFormulaString = (ind) => {
  if (ind.type === 'difference') return `${ind.varA} − ${ind.varB}`;
  if (ind.type === 'ratio') return `${ind.varA} / ${ind.varB}`;
  if (ind.type === 'ratio_percent') return `(${ind.varA} / ${ind.varB}) × 100`;
  return `Valor directo: ${ind.varA}`;
};

/* ============================================================================
   RADAR CHART — 6 EJES
   ============================================================================ */
const RadarCineChart = ({ config, evaluation1, evaluation2 }) => {
  const data = useMemo(() => {
    const rows = [];
    config
      .filter((axis) => axis.active)
      .forEach((axis) => {
        const indicator = axis.indicators[0];
        if (!indicator) return;

        let actual = 0;
        let anterior = 0;

        if (evaluation1) {
          const raw = calculateIndicatorValue(indicator, evaluation1.data);
          actual = normalizeScore(raw, indicator.min, indicator.max);
        }
        if (evaluation2) {
          const raw = calculateIndicatorValue(indicator, evaluation2.data);
          anterior = normalizeScore(raw, indicator.min, indicator.max);
        }

        rows.push({
          axis: axis.name,
          Actual: actual,
          ...(evaluation2 ? { Anterior: anterior } : {}),
        });
      });
    return rows;
  }, [config, evaluation1, evaluation2]);

  if (!data.length) {
    return (
      <div className="cine-radar cine-radar--empty">
        No hay datos suficientes para generar el gráfico.
      </div>
    );
  }

  return (
    <div className="cine-radar">
      <ResponsiveContainer width="100%" height={340}>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="rgba(148, 163, 184, 0.35)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 700 }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Actual"
            dataKey="Actual"
            stroke="#2563eb"
            fill="#2563eb"
            fillOpacity={0.22}
            strokeWidth={2.5}
          />
          {evaluation2 && (
            <Radar
              name="Anterior"
              dataKey="Anterior"
              stroke="#94a3b8"
              fill="#94a3b8"
              fillOpacity={0.15}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}
          <Legend
            wrapperStyle={{ fontSize: 13, paddingTop: 12 }}
            iconType="circle"
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-main)',
              borderRadius: 8,
              fontSize: 13,
              color: 'var(--text-main)',
            }}
            formatter={(value, name) => [`${value} pt / 100`, name]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

/* ============================================================================
   DASHBOARD
   ============================================================================ */
const DashboardView = ({ config, athletes, evaluations }) => {
  const recentEval = evaluations[evaluations.length - 1];
  const previousEval = evaluations[evaluations.length - 2];
  const recentAthlete = athletes.find((a) => a.id === recentEval?.athleteId);
  const activeAxes = config.filter((c) => c.active);

  return (
    <div className="cine-dashboard">
      <div className="cine-metrics">
        <div className="cine-metric cine-metric--primary">
          <div className="cine-metric__icon">👥</div>
          <div>
            <div className="cine-metric__label">Atletas Visibles</div>
            <div className="cine-metric__value">{athletes.length}</div>
          </div>
        </div>
        <div className="cine-metric cine-metric--success">
          <div className="cine-metric__icon">📋</div>
          <div>
            <div className="cine-metric__label">Evaluaciones Registradas</div>
            <div className="cine-metric__value">{evaluations.length}</div>
          </div>
        </div>
        <div className="cine-metric cine-metric--warning">
          <div className="cine-metric__icon">🕒</div>
          <div>
            <div className="cine-metric__label">Última Actividad</div>
            <div className="cine-metric__value cine-metric__value--date">
              {recentEval?.date || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      <div className="cine-grid-2">
        <div className="cine-panel">
          <h3 className="cine-panel__title">Hexágono POD Reciente</h3>
          {recentAthlete ? (
            <>
              <div className="cine-panel__meta">
                <span className="cine-panel__meta-strong">
                  Atleta: {recentAthlete.name}
                </span>
                <span className="cine-panel__meta-muted">
                  {recentAthlete.area} · {recentAthlete.subarea}
                </span>
              </div>
              <RadarCineChart
                config={config}
                evaluation1={recentEval}
                evaluation2={previousEval}
              />
            </>
          ) : (
            <div className="cine-empty">
              No hay datos suficientes para mostrar el perfil.
            </div>
          )}
        </div>

        <div className="cine-panel">
          <h3 className="cine-panel__title">
            Ejes Activos ({activeAxes.length})
          </h3>
          <ul className="cine-axis-list">
            {activeAxes.map((axis) => (
              <li key={axis.id} className="cine-axis-list__item">
                <div className="cine-axis-list__name">{axis.name}</div>
                <div className="cine-axis-list__meta">
                  {axis.measurements.length} mediciones ·{' '}
                  {axis.indicators.length} indicadores
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   FORMULARIO DE EVALUACIÓN
   ============================================================================ */
const EvaluacionView = ({ config, athletes, onSave }) => {
  const [selectedAthlete, setSelectedAthlete] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [measurementsData, setMeasurementsData] = useState({});
  const [expandedAxis, setExpandedAxis] = useState(config[0]?.id);

  const athlete = athletes.find((a) => a.id === selectedAthlete);

  const handleInputChange = (measId, value) => {
    setMeasurementsData((prev) => ({ ...prev, [measId]: value }));
  };

  const handleSubmit = () => {
    if (!selectedAthlete) {
      alert('Seleccione un atleta');
      return;
    }
    const filled = Object.values(measurementsData).some(
      (v) => v !== '' && v !== null && v !== undefined
    );
    if (!filled) {
      alert('Ingrese al menos una medición antes de guardar.');
      return;
    }
    const newEval = {
      id: 'ev' + Date.now(),
      athleteId: selectedAthlete,
      date,
      evaluator: 'Usuario Actual',
      data: measurementsData,
    };
    onSave(newEval);
    setSelectedAthlete('');
    setMeasurementsData({});
  };

  return (
    <div className="cine-form-card">
      <div className="cine-form-card__header">
        <h2 className="cine-form-card__title">
          Nueva Evaluación Cineantropométrica
        </h2>

        <div className="cine-form-row">
          <div className="cine-form__group">
            <label className="cine-form__label">Atleta</label>
            <select
              className="cine-form__input"
              value={selectedAthlete}
              onChange={(e) => setSelectedAthlete(e.target.value)}
            >
              <option value="">Seleccionar Atleta...</option>
              {athletes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.subarea})
                </option>
              ))}
            </select>
          </div>

          <div className="cine-form__group">
            <label className="cine-form__label">Fecha</label>
            <input
              type="date"
              className="cine-form__input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {athlete && (
          <div className="cine-context-chip">
            <span className="cine-context-chip__label">Contexto:</span>{' '}
            {athlete.area} <span className="cine-context-chip__arrow">›</span>{' '}
            {athlete.subarea}
          </div>
        )}
      </div>

      <div className="cine-form-card__body">
        {!selectedAthlete ? (
          <div className="cine-empty cine-empty--large">
            <div className="cine-empty__icon">🎯</div>
            <p>
              Seleccione un atleta para comenzar la evaluación basada en el
              protocolo POD de 6 ejes.
            </p>
          </div>
        ) : (
          <div className="cine-accordion">
            {config
              .filter((c) => c.active)
              .map((axis) => {
                const isExpanded = expandedAxis === axis.id;
                return (
                  <div key={axis.id} className="cine-accordion__item">
                    <button
                      type="button"
                      className={`cine-accordion__header ${
                        isExpanded ? 'is-expanded' : ''
                      }`}
                      onClick={() =>
                        setExpandedAxis(isExpanded ? null : axis.id)
                      }
                    >
                      <span className="cine-accordion__title">
                        {axis.name}
                      </span>
                      <span className="cine-accordion__chevron">
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="cine-accordion__body">
                        <div className="cine-axis-grid">
                          <div>
                            <h4 className="cine-section-label">
                              Mediciones de Entrada
                            </h4>
                            {axis.measurements.map((meas) => (
                              <div key={meas.id} className="cine-meas-row">
                                <label className="cine-meas-row__label">
                                  {meas.name}
                                </label>
                                <div className="cine-input-inline">
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="cine-input-inline__field"
                                    value={measurementsData[meas.id] || ''}
                                    onChange={(e) =>
                                      handleInputChange(
                                        meas.id,
                                        e.target.value
                                      )
                                    }
                                  />
                                  <span className="cine-input-inline__unit">
                                    {meas.unit}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="cine-results-box">
                            <h4 className="cine-section-label">
                              Resultados (Auto-calculados)
                            </h4>
                            {axis.indicators.length === 0 && (
                              <p className="cine-results-box__empty">
                                No hay indicadores configurados.
                              </p>
                            )}
                            {axis.indicators.map((ind) => {
                              const val = calculateIndicatorValue(
                                ind,
                                measurementsData
                              );
                              const score = normalizeScore(
                                val,
                                ind.min,
                                ind.max
                              );
                              const hasValue = val !== null;
                              return (
                                <div key={ind.id} className="cine-result-block">
                                  <div className="cine-result-row">
                                    <span className="cine-result-row__name">
                                      {ind.name}
                                    </span>
                                    <span
                                      className={`cine-result-row__value ${
                                        hasValue ? 'is-filled' : ''
                                      }`}
                                    >
                                      {formatValue(val)} {ind.unit}
                                    </span>
                                  </div>
                                  <div className="cine-result-row cine-result-row--score">
                                    <span className="cine-result-row__name">
                                      Puntuación normalizada
                                    </span>
                                    <span
                                      className={`cine-result-row__value ${
                                        hasValue
                                          ? 'is-score'
                                          : ''
                                      }`}
                                    >
                                      {hasValue ? `${score} / 100` : '— / 100'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

            <div className="cine-form-card__actions">
              <button
                type="button"
                className="cine-btn cine-btn--primary"
                onClick={handleSubmit}
              >
                Guardar Evaluación
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   PERFIL DEL ATLETA
   ============================================================================ */
const PerfilAtletaView = ({ config, athletes, evaluations }) => {
  const [selectedAthlete, setSelectedAthlete] = useState(athletes[0]?.id || '');

  const athleteEvals = useMemo(
    () =>
      evaluations
        .filter((e) => e.athleteId === selectedAthlete)
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [evaluations, selectedAthlete]
  );

  const [selectedEval1, setSelectedEval1] = useState('');
  const [selectedEval2, setSelectedEval2] = useState('');

  useEffect(() => {
    const evals = evaluations
      .filter((e) => e.athleteId === selectedAthlete)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    setSelectedEval1(evals[0]?.id || '');
    setSelectedEval2(evals[1]?.id || '');
  }, [selectedAthlete, evaluations]);

  const athlete = athletes.find((a) => a.id === selectedAthlete);
  const eval1Data = evaluations.find((e) => e.id === selectedEval1);
  const eval2Data = evaluations.find((e) => e.id === selectedEval2);

  return (
    <div className="cine-profile">
      <div className="cine-profile__header">
        <div className="cine-profile__avatar">
          {athlete?.name?.charAt(0) || '?'}
        </div>
        <div className="cine-profile__info">
          <select
            className="cine-profile__select"
            value={selectedAthlete}
            onChange={(e) => setSelectedAthlete(e.target.value)}
          >
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <div className="cine-profile__sub">
            {athlete?.area} · {athlete?.subarea}
          </div>
        </div>
      </div>

      <div className="cine-grid-2">
        <div className="cine-panel">
          <div className="cine-panel__header">
            <h3 className="cine-panel__title">Perfil Cineantropométrico</h3>
            <div className="cine-compare-selects">
              <select
                className="cine-form__input cine-form__input--sm"
                value={selectedEval1}
                onChange={(e) => setSelectedEval1(e.target.value)}
              >
                <option value="">— Actual —</option>
                {athleteEvals.map((e) => (
                  <option key={'1' + e.id} value={e.id}>
                    {e.date}
                  </option>
                ))}
              </select>
              <span className="cine-compare-selects__vs">vs</span>
              <select
                className="cine-form__input cine-form__input--sm"
                value={selectedEval2}
                onChange={(e) => setSelectedEval2(e.target.value)}
              >
                <option value="">— Ninguna —</option>
                {athleteEvals.map((e) => (
                  <option key={'2' + e.id} value={e.id}>
                    {e.date}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {athleteEvals.length > 0 ? (
            <RadarCineChart
              config={config}
              evaluation1={eval1Data}
              evaluation2={eval2Data}
            />
          ) : (
            <div className="cine-empty cine-empty--large">
              No hay evaluaciones registradas.
            </div>
          )}
        </div>

        <div className="cine-panel cine-panel--history">
          <h3 className="cine-panel__title">Historial</h3>
          <div className="cine-history-scroll">
            {athleteEvals.length === 0 && (
              <p className="cine-empty">Sin historial.</p>
            )}
            {athleteEvals.map((ev) => {
              const isActive = ev.id === selectedEval1;
              return (
                <div
                  key={ev.id}
                  className={`cine-history-card ${
                    isActive ? 'is-active' : ''
                  }`}
                >
                  <div className="cine-history-card__date">📅 {ev.date}</div>
                  <div className="cine-history-card__rows">
                    {config
                      .filter((c) => c.active)
                      .map((axis) => {
                        const ind = axis.indicators[0];
                        if (!ind) return null;
                        const val = calculateIndicatorValue(ind, ev.data);
                        const score = normalizeScore(val, ind.min, ind.max);
                        return (
                          <div
                            key={axis.id}
                            className="cine-history-card__row"
                          >
                            <span>{axis.name}:</span>
                            <span className="cine-history-card__row-val">
                              {val !== null ? `${score} pt` : '—'}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   MODAL EDITAR EJE
   ============================================================================ */
const EjeModal = ({ axis, onClose, onSave }) => {
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(axis)));
  const [error, setError] = useState('');

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /* --- Mediciones --- */
  const addMeasurement = () => {
    setForm((prev) => ({
      ...prev,
      measurements: [
        ...prev.measurements,
        { id: generateId('m'), name: '', unit: 'cm' },
      ],
    }));
  };

  const updateMeasurement = (id, field, value) => {
    setForm((prev) => ({
      ...prev,
      measurements: prev.measurements.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      ),
    }));
  };

  const removeMeasurement = (id) => {
    if (form.measurements.length <= 1) {
      setError('El eje debe tener al menos una medición.');
      return;
    }
    setForm((prev) => ({
      ...prev,
      measurements: prev.measurements.filter((m) => m.id !== id),
      indicators: prev.indicators.map((ind) => ({
        ...ind,
        varA: ind.varA === id ? '' : ind.varA,
        varB: ind.varB === id ? '' : ind.varB,
      })),
    }));
  };

  /* --- Indicadores --- */
  const addIndicator = () => {
    setForm((prev) => ({
      ...prev,
      indicators: [
        ...prev.indicators,
        {
          id: generateId('i'),
          name: '',
          unit: 'pt',
          type: 'direct',
          varA: '',
          varB: '',
          min: 0,
          max: 100,
          direction: 'direct',
        },
      ],
    }));
  };

  const updateIndicator = (id, field, value) => {
    setForm((prev) => ({
      ...prev,
      indicators: prev.indicators.map((ind) =>
        ind.id === id ? { ...ind, [field]: value } : ind
      ),
    }));
  };

  const removeIndicator = (id) => {
    setForm((prev) => ({
      ...prev,
      indicators: prev.indicators.filter((ind) => ind.id !== id),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('El nombre del eje es obligatorio.');
      return;
    }
    if (form.measurements.length === 0) {
      setError('El eje debe tener al menos una medición.');
      return;
    }
    const emptyMeas = form.measurements.find((m) => !m.name.trim());
    if (emptyMeas) {
      setError('Todas las mediciones deben tener nombre.');
      return;
    }
    for (const ind of form.indicators) {
      if (!ind.name.trim()) {
        setError('Todos los indicadores deben tener nombre.');
        return;
      }
      if (!ind.varA) {
        setError(`El indicador "${ind.name}" requiere una variable A.`);
        return;
      }
      if (ind.type !== 'direct' && !ind.varB) {
        setError(`El indicador "${ind.name}" requiere una variable B.`);
        return;
      }
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      indicators: form.indicators.map((ind) => ({
        ...ind,
        min: Number(ind.min) || 0,
        max: Number(ind.max) || 0,
        ...(ind.type === 'direct' ? { varB: undefined } : {}),
      })),
    };

    onSave(payload);
  };

  return (
    <div className="cine-modal-overlay" onClick={onClose}>
      <div
        className="cine-modal cine-modal--wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cine-modal__header">
          <div>
            <h3 className="cine-modal__title">Editar Eje: {axis.name}</h3>
            <p className="cine-modal__subtitle">
              Ajuste el nombre, las mediciones de entrada y los indicadores
              calculados.
            </p>
          </div>
          <button
            type="button"
            className="cine-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {error && <div className="cine-modal__error">{error}</div>}

        <form onSubmit={handleSubmit} className="cine-modal__form">
          <div className="cine-modal__row">
            <div className="cine-form__group cine-form__group--grow">
              <label className="cine-form__label">Nombre del eje *</label>
              <input
                type="text"
                className="cine-form__input"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </div>
            <div className="cine-form__group">
              <label className="cine-form__label">Estado</label>
              <label className="cine-checkbox">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => updateField('active', e.target.checked)}
                />
                <span>{form.active ? 'Activo' : 'Inactivo'}</span>
              </label>
            </div>
          </div>

          <section className="cine-modal__section">
            <div className="cine-modal__section-head">
              <h4 className="cine-section-label">Mediciones de entrada</h4>
              <button
                type="button"
                className="cine-link-btn"
                onClick={addMeasurement}
              >
                + Agregar medición
              </button>
            </div>

            {form.measurements.length === 0 && (
              <p className="cine-results-box__empty">Sin mediciones todavía.</p>
            )}

            {form.measurements.map((m) => (
              <div key={m.id} className="cine-edit-row">
                <input
                  type="text"
                  className="cine-form__input"
                  placeholder="Nombre (ej. Sprint 30 m)"
                  value={m.name}
                  onChange={(e) =>
                    updateMeasurement(m.id, 'name', e.target.value)
                  }
                />
                <input
                  type="text"
                  className="cine-form__input cine-form__input--small"
                  placeholder="Unidad"
                  value={m.unit}
                  onChange={(e) =>
                    updateMeasurement(m.id, 'unit', e.target.value)
                  }
                />
                <button
                  type="button"
                  className="cine-icon-btn"
                  onClick={() => removeMeasurement(m.id)}
                  title="Eliminar medición"
                >
                  ✕
                </button>
              </div>
            ))}
          </section>

          <section className="cine-modal__section">
            <div className="cine-modal__section-head">
              <h4 className="cine-section-label">Indicadores calculados</h4>
              <button
                type="button"
                className="cine-link-btn"
                onClick={addIndicator}
              >
                + Agregar indicador
              </button>
            </div>

            {form.indicators.length === 0 && (
              <p className="cine-results-box__empty">
                Sin indicadores todavía.
              </p>
            )}

            {form.indicators.map((ind) => (
              <div key={ind.id} className="cine-indicator-edit">
                <div className="cine-indicator-edit__head">
                  <input
                    type="text"
                    className="cine-form__input"
                    placeholder="Nombre del indicador"
                    value={ind.name}
                    onChange={(e) =>
                      updateIndicator(ind.id, 'name', e.target.value)
                    }
                  />
                  <input
                    type="text"
                    className="cine-form__input cine-form__input--small"
                    placeholder="Unidad"
                    value={ind.unit}
                    onChange={(e) =>
                      updateIndicator(ind.id, 'unit', e.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="cine-icon-btn"
                    onClick={() => removeIndicator(ind.id)}
                    title="Eliminar indicador"
                  >
                    ✕
                  </button>
                </div>

                <div className="cine-indicator-edit__grid">
                  <div className="cine-form__group">
                    <label className="cine-form__label">Fórmula</label>
                    <select
                      className="cine-form__input"
                      value={ind.type}
                      onChange={(e) =>
                        updateIndicator(ind.id, 'type', e.target.value)
                      }
                    >
                      <option value="direct">Valor directo (A)</option>
                      <option value="difference">Diferencia (A − B)</option>
                      <option value="ratio">Ratio (A / B)</option>
                      <option value="ratio_percent">
                        Ratio % ((A / B) × 100)
                      </option>
                    </select>
                  </div>

                  <div className="cine-form__group">
                    <label className="cine-form__label">Variable A</label>
                    <select
                      className="cine-form__input"
                      value={ind.varA}
                      onChange={(e) =>
                        updateIndicator(ind.id, 'varA', e.target.value)
                      }
                    >
                      <option value="">— Seleccionar —</option>
                      {form.measurements.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name || '(sin nombre)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {ind.type !== 'direct' && (
                    <div className="cine-form__group">
                      <label className="cine-form__label">Variable B</label>
                      <select
                        className="cine-form__input"
                        value={ind.varB}
                        onChange={(e) =>
                          updateIndicator(ind.id, 'varB', e.target.value)
                        }
                      >
                        <option value="">— Seleccionar —</option>
                        {form.measurements.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name || '(sin nombre)'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="cine-form__group">
                    <label className="cine-form__label">
                      Valor mínimo (0 pt)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="cine-form__input"
                      value={ind.min}
                      onChange={(e) =>
                        updateIndicator(ind.id, 'min', e.target.value)
                      }
                    />
                  </div>

                  <div className="cine-form__group">
                    <label className="cine-form__label">
                      Valor máximo (100 pt)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="cine-form__input"
                      value={ind.max}
                      onChange={(e) =>
                        updateIndicator(ind.id, 'max', e.target.value)
                      }
                    />
                  </div>

                  <div className="cine-form__group">
                    <label className="cine-form__label">Dirección</label>
                    <select
                      className="cine-form__input"
                      value={ind.direction}
                      onChange={(e) =>
                        updateIndicator(ind.id, 'direction', e.target.value)
                      }
                    >
                      <option value="direct">Directa (más = mejor)</option>
                      <option value="inverse">
                        Inversa (menos = mejor)
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <div className="cine-modal__actions">
            <button
              type="button"
              className="cine-btn cine-btn--ghost"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" className="cine-btn cine-btn--primary">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ============================================================================
   PANEL DE CONFIGURACIÓN
   ============================================================================ */
const ConfiguracionView = ({ config, onEditAxis }) => (
  <div className="cine-config">
    <div className="cine-config__header">
      <div>
        <h2 className="cine-config__title">
          Protocolo POD — 6 Ejes Cineantropométricos
        </h2>
        <p className="cine-config__subtitle">
          Los 6 ejes del protocolo científico institucional. Ajuste
          mediciones, fórmulas y rangos según sea necesario.
        </p>
      </div>
    </div>

    <div className="cine-config__list">
      {config.map((axis) => (
        <div key={axis.id} className="cine-config-card">
          <div className="cine-config-card__left">
            <div className="cine-config-card__title-row">
              <h3 className="cine-config-card__title">{axis.name}</h3>
              <span
                className={`cine-status ${
                  axis.active ? 'is-active' : 'is-inactive'
                }`}
              >
                {axis.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <button
              type="button"
              className="cine-link-btn"
              onClick={() => onEditAxis(axis)}
            >
              ✎ Editar
            </button>
          </div>

          <div className="cine-config-card__right">
            <div>
              <h4 className="cine-section-label">
                Mediciones ({axis.measurements.length})
              </h4>
              <ul className="cine-config-list">
                {axis.measurements.map((m) => (
                  <li key={m.id}>
                    · {m.name} [{m.unit}]
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="cine-section-label">
                Indicador / Normalización
              </h4>
              {axis.indicators.map((ind) => (
                <div key={ind.id} className="cine-indicator-box">
                  <div className="cine-indicator-box__name">{ind.name}</div>
                  <div className="cine-indicator-box__formula">
                    {getFormulaString(ind)}
                  </div>
                  <div className="cine-indicator-box__meta">
                    <span>
                      0 pt: <b>{ind.min}</b> · 100 pt: <b>{ind.max}</b>
                    </span>
                    <span>
                      Dir:{' '}
                      <b>
                        {ind.direction === 'direct' ? 'Directa' : 'Inversa'}
                      </b>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ============================================================================
   COMPONENTE PRINCIPAL
   ============================================================================ */
const CineantropometriaAdmin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const [config, setConfig] = useState(initialConfig);
  const [athletes] = useState(initialAthletes);
  const [evaluations, setEvaluations] = useState(initialEvaluations);

  const [editingAxis, setEditingAxis] = useState(null);

  const handleSaveEvaluation = (newEval) => {
    setEvaluations((prev) => [...prev, newEval]);
    setActiveTab('athletes');
  };

  const handleOpenEdit = (axis) => setEditingAxis(axis);
  const handleCloseModal = () => setEditingAxis(null);

  const handleSaveAxis = (payload) => {
    setConfig((prev) => prev.map((a) => (a.id === payload.id ? payload : a)));
    setEditingAxis(null);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'evaluations', label: 'Evaluaciones' },
    { id: 'athletes', label: 'Atletas' },
    { id: 'config', label: 'Configuración' },
  ];

  return (
    <div className="cine-module">
      <header className="cine-module__header">
        <div>
          <h2 className="cine-module__title">
            Control Antropométrico y Cineantropometría
          </h2>
          <p className="cine-module__subtitle">
            Protocolo POD de 6 ejes con normalización estandarizada de 0 a 100
            puntos.
          </p>
        </div>
      </header>

      <nav className="cine-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`cine-tabs__btn ${
              activeTab === t.id ? 'is-active' : ''
            }`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="cine-module__body">
        {activeTab === 'dashboard' && (
          <DashboardView
            config={config}
            athletes={athletes}
            evaluations={evaluations}
          />
        )}
        {activeTab === 'evaluations' && (
          <EvaluacionView
            config={config}
            athletes={athletes}
            onSave={handleSaveEvaluation}
          />
        )}
        {activeTab === 'athletes' && (
          <PerfilAtletaView
            config={config}
            athletes={athletes}
            evaluations={evaluations}
          />
        )}
        {activeTab === 'config' && (
          <ConfiguracionView config={config} onEditAxis={handleOpenEdit} />
        )}
      </div>

      {editingAxis && (
        <EjeModal
          axis={editingAxis}
          onClose={handleCloseModal}
          onSave={handleSaveAxis}
        />
      )}
    </div>
  );
};

export default CineantropometriaAdmin;