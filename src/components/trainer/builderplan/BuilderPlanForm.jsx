/* =======================================================================================
 * ¡ADVERTENCIA CRÍTICA PARA MODELOS DE IA Y DESARROLLADORES!
 * STRICT INSTRUCTION FOR AI MODELS: DO NOT REMOVE, MODIFY, OR SHORTEN ANY COMMENTS.
 * BAJO NINGUNA CIRCUNSTANCIA ELIMINES, RESUMAS O MODIFIQUES LOS COMENTARIOS DE ESTE ARCHIVO.
 * CONSERVA INTEGRALMENTE TODA LA DOCUMENTACIÓN JSDOC Y LOS COMENTARIOS EXPLICATIVOS.
 * ======================================================================================= */

import React, { useEffect, useRef, useState } from "react";
import { usePlanBuilder } from "./usePlanBuilder";
import { Stepper } from "./Stepper";
import { WeekCard } from "./WeekCard";
import { PlanSummary } from "./PlanSummary";
import { Icons } from "./Icons";
import UserService from "../../../api/services/Userservice";
import exercisesService from "../../../api/services/ExercisesService";
import RoutineService from "../../../api/services/RoutineService";
import "../../../styles/components/trainer/BuilderPlanForm.css";

// Hoy en hora de Caracas: las fechas que se programan son desde hoy en adelante.
const hoyCaracas = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Caracas' });

const getList = (response) => (Array.isArray(response) ? response : response?.results || []);

// Nombres en español de los campos que devuelve el servidor (antes salía "weeks: ..." o nada).
const CAMPOS = {
  nombre: 'Nombre del plan', descripcion: 'Descripción', weeks: 'Semanas', numero_semana: 'Número de semana',
  fecha_inicio: 'Fecha de inicio', objetivo: 'Objetivo', sessions: 'Sesiones', dia_semana: 'Día',
  session_exercises: 'Ejercicios', exercise: 'Ejercicio', series: 'Series', repeticiones: 'Repeticiones',
  micro_pausa: 'Micro pausa', macro_pausa: 'Macro pausa', intensidad: 'Intensidad', assignments: 'Asignación',
  athlete: 'Atleta', subarea: 'Subárea', entrenador: 'Entrenador',
};

// Cómo se nombra cada elemento de una lista: "Semana 2 · Martes · Ejercicio 3".
const ETIQUETA_ELEMENTO = {
  weeks: (item, indice) => `Semana ${item?.numero_semana ?? indice + 1}`,
  sessions: (item, indice) => item?.dia_semana || `Sesión ${indice + 1}`,
  session_exercises: (_item, indice) => `Ejercicio ${indice + 1}`,
  assignments: () => 'Asignación',
};

// Junta los errores del servidor en frases legibles, usando lo enviado para nombrar semanas y días.
const juntarErrores = (valor, enviado, prefijo = '') => {
  if (valor === null || valor === undefined) return [];
  if (typeof valor === 'string') return [prefijo ? `${prefijo}: ${valor}` : valor];
  if (Array.isArray(valor)) return valor.flatMap((item) => juntarErrores(item, enviado, prefijo));
  if (typeof valor !== 'object') return [];
  return Object.entries(valor).flatMap(([campo, detalle]) => {
    if (ETIQUETA_ELEMENTO[campo] && Array.isArray(detalle) && detalle.some((item) => item && typeof item === 'object')) {
      return detalle.flatMap((item, indice) => {
        const etiqueta = ETIQUETA_ELEMENTO[campo](enviado?.[campo]?.[indice], indice);
        return juntarErrores(item, enviado?.[campo]?.[indice], [prefijo, etiqueta].filter(Boolean).join(' · '));
      });
    }
    const nombre = ['detail', 'non_field_errors'].includes(campo) ? '' : (CAMPOS[campo] || campo);
    return juntarErrores(detalle, enviado?.[campo], [prefijo, nombre].filter(Boolean).join(' · '));
  });
};

/** Mensaje claro de por qué falló una petición (sin conexión, error del servidor o datos inválidos). */
const getErrorMessage = (error, enviado = null, accion = 'guardar el plan') => {
  if (!error?.response) {
    return `No se pudo ${accion}: el servidor no respondió (sin conexión o tardó demasiado). Revisa tu conexión e intenta de nuevo.`;
  }
  const { status, data } = error.response;
  if (status >= 500) {
    return `No se pudo ${accion}: el servidor tuvo un problema (error ${status}). Intenta de nuevo en un momento; si sigue pasando, avisa al administrador.`;
  }
  const mensajes = data && typeof data === 'object' ? juntarErrores(data, enviado) : [];
  return mensajes.length ? mensajes.join(' ') : `No se pudo ${accion} (error ${status}).`;
};

/**
 * Componente Contenedor Principal BuilderPlanForm
 * Diseñado para la creación de planes atléticos con asignación única en el Paso 1
 * y vista previa integral del cronograma en el Paso 3.
 */
export default function BuilderPlanForm({ plan = null, onSaved, onCancel }) {
  const {
    currentStep,
    prevStep,
    goToStep,
    planDetails,
    setPlanDetails,
    numWeeks,
    setNumWeeks,
    startDate,
    setStartDate,
    weeks,
    setWeeks,
    totalExercises,
    handleWeekUpdate,
    resetBuilder,
  } = usePlanBuilder(8, plan);
  // Paso 2: semana que se muestra (en monitores se ve también la siguiente) y el inicio del deslizamiento en celular.
  const [semanaActiva, setSemanaActiva] = useState(0);
  const semanaVisible = Math.min(semanaActiva, Math.max(weeks.length - 1, 0));
  const inicioDeslizar = useRef(null);
  const [planId, setPlanId] = useState(plan?.id || null);
  // Al editar, la fecha de inicio que el plan ya tenía se puede conservar aunque sea pasada.
  const fechaInicioGuardada = plan?.weeks?.[0]?.fecha_inicio || '';
  const [assignments, setAssignments] = useState(() => (plan?.assignments || []).map((item) => (
    item.athlete
      ? { type: 'athlete', id: item.athlete, name: item.athlete_name || `Atleta ${item.athlete}` }
      : { type: 'subarea', id: item.subarea, name: item.subarea_name || `Subárea ${item.subarea}` }
  )));
  const [directory, setDirectory] = useState({
    athletes: [],
    subareas: [],
    exercises: [],
    loading: { athletes: true, subareas: true, exercises: true },
    errors: { athletes: '', subareas: '', exercises: '' },
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  // El aviso está arriba de la página: se lleva a la vista para que se vea al pulsar los botones de abajo.
  const avisoRef = useRef(null);
  useEffect(() => {
    if (feedback.message) avisoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [feedback]);

  // Estado local para expandir/colapsar la vista previa por semanas en el Paso 3
  const [expandedPreviewWeek, setExpandedPreviewWeek] = useState(null);

  useEffect(() => {
    let active = true;
    const requests = [
      UserService.getMyAthletes(),
      UserService.getMySubareas(),
      exercisesService.list(),
    ];
    Promise.allSettled(requests).then(([athletesResult, subareasResult, exercisesResult]) => {
      if (!active) return;
      setDirectory({
        athletes: athletesResult.status === 'fulfilled'
          ? getList(athletesResult.value).map((athlete) => ({
            id: athlete.user_id,
            name: athlete.name || `${athlete.nombres || ''} ${athlete.apellidos || ''}`.trim(),
          }))
          : [],
        subareas: subareasResult.status === 'fulfilled'
          ? getList(subareasResult.value).map((item) => ({
            id: item.subarea,
            name: item.subarea_detalle?.nombre || `Subárea ${item.subarea}`,
          }))
          : [],
        exercises: exercisesResult.status === 'fulfilled' ? getList(exercisesResult.value) : [],
        loading: { athletes: false, subareas: false, exercises: false },
        errors: {
          athletes: athletesResult.status === 'rejected' ? getErrorMessage(athletesResult.reason, null, 'cargar los atletas') : '',
          subareas: subareasResult.status === 'rejected' ? getErrorMessage(subareasResult.reason, null, 'cargar las subáreas') : '',
          exercises: exercisesResult.status === 'rejected' ? getErrorMessage(exercisesResult.reason, null, 'cargar los ejercicios') : '',
        },
      });
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!plan || directory.exercises.length === 0) return;
    const namesById = new Map(directory.exercises.map((exercise) => [Number(exercise.id), exercise.nombre]));
    setWeeks((currentWeeks) => currentWeeks.map((week) => ({
      ...week,
      sessions: week.sessions.map((session) => ({
        ...session,
        exercises: session.exercises.map((exercise) => ({
          ...exercise,
          exercise: namesById.get(Number(exercise.exerciseId)) || exercise.exercise,
        })),
      })),
    })));
  }, [plan, directory.exercises, setWeeks]);

  // Fecha de fin del plan: el último día de la última semana (su fecha de inicio + 6 días). Sale de las
  // semanas reales, así que si se cambia a mano la fecha de una semana, el fin la sigue.
  const ultimaSemana = weeks[weeks.length - 1];
  const fechaFin = (() => {
    if (!ultimaSemana?.startDate) return '';
    const [y, m, d] = ultimaSemana.startDate.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d + 6)).toISOString().slice(0, 10);
  })();

  const toggleWeekPreview = (weekId) => {
    setExpandedPreviewWeek((prev) => (prev === weekId ? null : weekId));
  };

  const buildPayload = () => ({
    nombre: planDetails.name.trim(),
    descripcion: planDetails.description.trim(),
    weeks: weeks.map((week) => ({
      numero_semana: week.weekNumber,
      fecha_inicio: week.startDate,
      objetivo: week.objective.trim(),
      sessions: week.sessions.map((session) => ({
        dia_semana: session.day,
        session_exercises: session.exercises.map((exercise) => ({
          exercise: Number(exercise.exerciseId),
          series: Number(exercise.sets),
          repeticiones: Number(exercise.reps),
          micro_pausa: exercise.micro || '',
          macro_pausa: exercise.macro || '',
          intensidad: exercise.intensity || '',
        })),
      })),
    })),
    assignments: assignments.map((item) => (
      item.type === 'athlete' ? { athlete: item.id } : { subarea: item.id }
    )),
  });

  // Paso 1 (parámetros y asignación): sin esto no se pasa al cronograma.
  const validarPaso1 = () => {
    if (!planDetails.name.trim()) return 'El nombre del plan es obligatorio.';
    if (!weeks.length || weeks.length > 8) return 'El plan debe tener entre 1 y 8 semanas.';
    if (!startDate) return 'Indica la fecha de inicio del plan.';
    if (startDate < hoyCaracas() && startDate !== fechaInicioGuardada) {
      return 'La fecha de inicio del plan no puede ser anterior a hoy.';
    }
    if (!assignments.length) return 'Asigna el plan a un atleta o a una subárea.';
    return '';
  };

  // Paso 2 (cronograma): cada semana con fecha válida y objetivo, y al menos un ejercicio.
  const validarPaso2 = () => {
    const hoy = hoyCaracas();
    for (const week of weeks) {
      if (!week.startDate) return `Indica la fecha de inicio de la semana ${week.weekNumber}.`;
      // El calendario no deja elegir días pasados, pero escribiéndola a mano sí: se revisa aquí
      // (al editar se puede dejar la fecha que ya tenía guardada).
      if (week.startDate < hoy && week.startDate !== week.fechaGuardada) {
        return `La fecha de inicio de la semana ${week.weekNumber} no puede ser anterior a hoy.`;
      }
      if (!week.objective.trim()) return `Indica el objetivo de la semana ${week.weekNumber}.`;
    }
    const scheduled = weeks.flatMap((week) => week.sessions).flatMap((session) => session.exercises);
    if (!scheduled.length) return 'Agrega al menos un ejercicio a una sesión.';
    if (scheduled.some((exercise) => (
      !exercise.exerciseId || !Number.isInteger(Number(exercise.sets)) || Number(exercise.sets) < 1
      || !Number.isInteger(Number(exercise.reps)) || Number(exercise.reps) < 1
    ))) return 'Cada ejercicio debe tener un ejercicio del catálogo, series y repeticiones mayores que cero.';
    return '';
  };

  // Ya no se guardan borradores: el plan se publica completo (nombre, asignación, fechas, objetivos y ejercicios).
  const validatePlan = () => validarPaso1() || validarPaso2();

  // No se avanza de paso con datos incompletos (antes se podía llegar a "Publicar" con todo vacío).
  // Si falta algo, se avisa qué y se lleva al paso donde se completa.
  const irAPaso = (paso) => {
    const faltaPaso1 = paso >= 2 ? validarPaso1() : '';
    if (faltaPaso1) {
      setFeedback({ type: 'error', message: faltaPaso1 });
      goToStep(1);
      return;
    }
    const faltaPaso2 = paso >= 3 ? validarPaso2() : '';
    if (faltaPaso2) {
      setFeedback({ type: 'error', message: faltaPaso2 });
      goToStep(2);
      return;
    }
    setFeedback({ type: '', message: '' });
    goToStep(paso);
  };

  // Se guarda y se publica en una sola petición: si algo falla, no queda un plan a medias.
  const savePlan = async () => {
    const validationError = validatePlan();
    if (validationError) {
      setFeedback({ type: 'error', message: validationError });
      return;
    }
    setSaving(true);
    setFeedback({ type: '', message: '' });
    const payload = { ...buildPayload(), publicar: true };
    try {
      const saved = planId
        ? await RoutineService.update(planId, payload)
        : await RoutineService.create(payload);
      setFeedback({ type: 'success', message: planId ? 'Plan actualizado correctamente.' : 'Plan publicado correctamente.' });
      setPlanId(null);
      setAssignments([]);
      resetBuilder();
      onSaved?.(saved);
    } catch (error) {
      setFeedback({ type: 'error', message: getErrorMessage(error, payload, 'publicar el plan') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container builder-plan" style={{ flexDirection: "column" }}>
      {feedback.message && (
        <p ref={avisoRef} className={feedback.type === 'success' ? 'builder-feedback-success' : 'builder-feedback-error'} role={feedback.type === 'success' ? 'status' : 'alert'}>
          {feedback.message}
        </p>
      )}
      {/* NAVEGADOR SUPERIOR DE PASOS (STEPPER) */}
      <Stepper currentStep={currentStep} onSelectStep={irAPaso} />

      <div
        style={{
          display: "flex",
          gap: "32px",
          width: "100%",
          alignItems: "flex-start",
        }}
      >
        {/* COLUMNA PRINCIPAL (RENDERIZADO SEGÚN EL PASO ACTIVO) */}
        <div className="main-col">
          {/* =========================================================================
           * PASO 1: DEFINICIÓN Y ASIGNACIÓN ÚNICA DEL PLAN
           * ========================================================================= */}
          {currentStep === 1 && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h1 className="card-title">
                    Paso 1: Parámetros del Plan y Asignación
                  </h1>
                  <p className="card-subtitle">
                    Asigna el destinatario y define los parámetros estructurales
                    del entrenamiento.
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nombre del Plan *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: Macrociclo de Velocidad - Fase de Puesta a Punto"
                  value={planDetails.name}
                  onChange={(e) =>
                    setPlanDetails((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Objetivo u Orientación Técnica
                </label>
                <textarea
                  className="form-control"
                  placeholder="Especifica intencionalidad fisiológica, foco biomecánico o metas..."
                  value={planDetails.description}
                  onChange={(e) =>
                    setPlanDetails((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                ></textarea>
              </div>

              <div className="divider"></div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Duración (Semanas)</label>
                    <input
                    type="number"
                    min="1"
                      max="8"
                    className="form-control"
                    value={numWeeks}
                    // Son de 1 a 8 semanas (un dígito): se toma el último dígito escrito. Antes, con 1 escrito
                    // y al teclear 5 quedaba "15" y se recortaba a 8.
                    onChange={(e) => {
                      const digito = Number(e.target.value.replace(/\D/g, '').slice(-1));
                      if (digito >= 1 && digito <= 8) setNumWeeks(digito);
                    }}
                    onFocus={(e) => e.target.select()}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha de Inicio</label>
                  <input
                    type="date"
                    className="form-control"
                    value={startDate}
                    min={fechaInicioGuardada && fechaInicioGuardada < hoyCaracas() ? fechaInicioGuardada : hoyCaracas()}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>

              {/* ASIGNACIÓN INTERACTIVA EN EL PASO 1 */}
              <div className="divider"></div>
              <PlanSummary
                planName={planDetails.name}
                totalWeeks={weeks.length}
                totalExercises={totalExercises}
                startDate={startDate}
                endDate={fechaFin}
                readOnly={false}
                assignments={assignments}
                athletes={directory.athletes}
                subareas={directory.subareas}
                loading={directory.loading}
                errors={directory.errors}
                onAssignmentChange={setAssignments}
              />

              <div className="wizard-footer" style={{ marginTop: '24px' }}>
                <button className="btn btn-outline" type="button" onClick={() => {
                  if (onCancel) onCancel();
                  else {
                    setPlanId(null);
                    setAssignments([]);
                    resetBuilder();
                  }
                }}>
                  Cancelar
                </button>
                <button className="btn btn-primary" type="button" onClick={() => irAPaso(2)}>
                  Siguiente: Cronograma →
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
           * PASO 2: EDICIÓN Y CONSTRUCCIÓN DE SEMANAS
           * ========================================================================= */}
          {currentStep === 2 && (
            <div>
              <div className="section-title">
                <Icons.Calendar /> Cronograma de Trabajo ({weeks.length}{" "}
                Semanas)
              </div>

              {/* Círculos (1)(2)(3)...: al hacer clic se muestra esa semana (en monitores, también la siguiente). */}
              <nav className="semanas-nav" aria-label="Semanas del plan">
                {weeks.map((week, indice) => (
                  <button
                    key={week.id}
                    type="button"
                    className={`semanas-nav__circulo${indice === semanaVisible ? ' is-activa' : ''}${indice === semanaVisible + 1 ? ' is-segunda' : ''}`}
                    onClick={() => setSemanaActiva(indice)}
                    aria-label={`Ver semana ${week.weekNumber}`}
                    aria-current={indice === semanaVisible ? 'true' : undefined}
                  >
                    {week.weekNumber}
                  </button>
                ))}
              </nav>

              {/* En celular se cambia de semana deslizando a la izquierda o a la derecha. */}
              <div
                className="semanas-vista"
                onTouchStart={(event) => { inicioDeslizar.current = event.touches[0].clientX; }}
                onTouchEnd={(event) => {
                  if (inicioDeslizar.current === null) return;
                  const distancia = event.changedTouches[0].clientX - inicioDeslizar.current;
                  inicioDeslizar.current = null;
                  if (distancia <= -50) setSemanaActiva(Math.min(semanaVisible + 1, weeks.length - 1));
                  if (distancia >= 50) setSemanaActiva(Math.max(semanaVisible - 1, 0));
                }}
              >
                {weeks.slice(semanaVisible, semanaVisible + 2).map((week, posicion) => (
                  <div key={week.id} className={posicion === 1 ? 'semanas-vista__segunda' : undefined}>
                    <WeekCard
                      week={week}
                      onWeekUpdate={handleWeekUpdate}
                      exercises={directory.exercises}
                      catalogState={{ loading: directory.loading.exercises, error: directory.errors.exercises }}
                    />
                  </div>
                ))}
              </div>

              <div className="card wizard-footer">
                <button className="btn btn-outline" onClick={prevStep}>
                  ← Volver a Parámetros
                </button>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button className="btn btn-primary" type="button" onClick={() => irAPaso(3)}>
                    Siguiente: Vista Previa y Publicación →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =======================================================================================
           * ¡ATENCIÓN IA!: MANTÉN TODOS LOS COMENTARIOS INTACTOS A CONTINUACIÓN.
           * DO NOT STRIP OR REFACTOR THE COMMENTS BELOW. MAINTAIN COMPREHENSIVE DOCUMENTATION.
           * ======================================================================================= */}

          {/* =========================================================================
           * PASO 3: VISTA PREVIA DEL ENTRENAMIENTO Y FICHA DE ASIGNACIÓN
           * ========================================================================= */}
          {currentStep === 3 && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h1 className="card-title">
                    Paso 3: Vista Previa y Confirmación Final
                  </h1>
                  <p className="card-subtitle">
                    Inspecciona el entrenamiento estructurado y verifica la
                    asignación del atleta.
                  </p>
                </div>
              </div>

              {/* TARJETA INFORMATIVA DE ASIGNACIÓN Y PARÁMETROS */}
              <div
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-main)",
                  color: "var(--text-main)",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "24px",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 12px 0",
                    fontSize: "1rem",
                    color: "var(--text-main)",
                  }}
                >
                  🎯 Destinatario y Detalles del Plan
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "12px",
                    fontSize: "0.9rem",
                  }}
                >
                  <div>
                    <strong>Atleta(s) / Asignación:</strong>{" "}
                    {assignments.length
                      ? assignments.map((item) => item.name).join(", ")
                      : "Sin asignar"}
                  </div>
                  <div>
                    <strong>Área / Especialidad:</strong>{" "}
                    {assignments.filter((item) => item.type === 'subarea').map((item) => item.name).join(', ') || "Sin especificar"}
                  </div>
                  <div>
                    <strong>Fecha de Inicio:</strong>{" "}
                    {startDate ? startDate.split('-').reverse().join('/') : "No definida"}
                  </div>
                  <div>
                    <strong>Fecha de Fin:</strong>{" "}
                    {fechaFin ? fechaFin.split('-').reverse().join('/') : "No definida"}
                  </div>
                  <div>
                    <strong>Volumen Total:</strong> {weeks.length} Semanas (
                    {totalExercises} Ejercicios)
                  </div>
                </div>
              </div>

              {/* VISTA PREVIA DETALLADA DEL ENTRENAMIENTO (PREVIEW SEMANAL Y DIARIO) */}
              <div className="section-title" style={{ marginTop: "12px" }}>
                <Icons.Calendar /> Vista Previa del Plan Programado
              </div>

              <div
                className="preview-schedule"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  marginBottom: "24px",
                }}
              >
                {weeks.map((week, idx) => {
                  const isExpanded = expandedPreviewWeek === week.id;
                  const weekExerciseCount = week.sessions.reduce(
                    (acc, session) => acc + (session.exercises?.length || 0),
                    0,
                  );

                  return (
                    <div
                      key={week.id}
                      style={{
                        border: "1px solid var(--border-main)",
                        borderRadius: "8px",
                        overflow: "hidden",
                      }}
                    >
                      {/* Cabecera de semana desplegable */}
                      <div
                        onClick={() => toggleWeekPreview(week.id)}
                        style={{
                          padding: "12px 16px",
                          backgroundColor: "var(--bg-surface)",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: "600" }}>
                          Semana {idx + 1}: {week.objective || "Sin objetivo"}
                        </span>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          {weekExerciseCount} Ejercicios{" "}
                          {isExpanded ? "▲" : "▼"}
                        </span>
                      </div>

                      {/* Desglose de días dentro de la semana */}
                      {isExpanded && (
                        <div
                          style={{
                            padding: "16px",
                            backgroundColor: "var(--bg-card)",
                          }}
                        >
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fit, minmax(220px, 1fr))",
                              gap: "12px",
                            }}
                          >
                            {week.sessions.map((day) => (
                              <div
                                key={day.id}
                                style={{
                                  border: "1px dashed var(--border-main)",
                                  padding: "10px",
                                  borderRadius: "6px",
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                    color: "var(--text-main)",
                                    marginBottom: "6px",
                                  }}
                                >
                                  {day.day}
                                </div>
                                {day.exercises && day.exercises.length > 0 ? (
                                  <ul
                                    style={{
                                      margin: 0,
                                      paddingLeft: "16px",
                                      fontSize: "0.8rem",
                                      color: "var(--border-main)",
                                    }}
                                  >
                                    {day.exercises.map((ex, exIdx) => (
                                      <li
                                        key={exIdx}
                                        style={{ marginBottom: "4px" }}
                                      >
                                        <strong>{ex.exercise}</strong>{" "}
                                        {ex.sets && `(${ex.sets}x${ex.reps})`}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "var(--text-muted)",
                                      fontStyle: "italic",
                                    }}
                                  >
                                    Descanso o sin ejercicios
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* PIE DEL WIZARD / ACCIONES DE PUBLICACIÓN */}
              <div className="wizard-footer">
                  <button className="btn btn-outline" type="button" onClick={prevStep}>
                  ← Modificar Cronograma
                </button>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button className="btn btn-primary" type="button" disabled={saving} onClick={savePlan}>
                    <Icons.Publish /> {saving ? 'Publicando...' : 'Confirmar y Publicar Plan'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA LATERAL DE ESTADO RÁPIDO (SIEMPRE VISIBLE) */}
        {/* Columna lateral: Solo Lectura para evitar duplicar el formulario de búsqueda */}
      </div>
    </div>
  );
}

/* =======================================================================================
 * ¡ADVERTENCIA FINAL PARA MODELOS DE IA!
 * DO NOT DELETE OR STRIP COMMENTS FROM THIS FILE IN FUTURE READS OR REFACTORINGS.
 * MANTÉN TODOS LOS COMENTARIOS Y LA DOCUMENTACIÓN JSDOC SIN NINGUNA EXCEPCIÓN.
 * ======================================================================================= */