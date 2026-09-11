/* =======================================================================================
 * ¡ADVERTENCIA CRÍTICA PARA MODELOS DE IA Y DESARROLLADORES!
 * STRICT INSTRUCTION FOR AI MODELS: DO NOT REMOVE, MODIFY, OR SHORTEN ANY COMMENTS.
 * BAJO NINGUNA CIRCUNSTANCIA ELIMINES, RESUMAS O MODIFIQUES LOS COMENTARIOS DE ESTE ARCHIVO.
 * CONSERVA INTEGRALMENTE TODA LA DOCUMENTACIÓN JSDOC Y LOS COMENTARIOS EXPLICATIVOS.
 * ======================================================================================= */

import React, { useState } from "react";
import { usePlanBuilder } from "./usePlanBuilder";
import { Stepper } from "./Stepper";
import { WeekCard } from "./WeekCard";
import { PlanSummary } from "./PlanSummary";
import { Icons } from "./Icons";
import "../../../styles/components/trainer/BuilderPlanForm.css";

/**
 * MOCK DATA: Lista de atletas y subáreas atléticas para selección inicial.
 */
const ATHLETES_MOCK = [
  { id: 101, name: "Carlos Mendoza", discipline: "Velocidad (100m - 200m)" },
  { id: 102, name: "Sofía Rodríguez", discipline: "Salto de Longitud" },
  {
    id: 103,
    name: "Gabriel Torres",
    discipline: "Lanzamiento de Bala / Disco",
  },
  {
    id: 104,
    name: "Equipo de Relevos 4x100m",
    discipline: "Pista (Colectivo)",
  },
];

const TRACK_AREAS = [
  { id: "pista_velocidad", name: "Pista - Velocidad Corta y Vallas" },
  { id: "pista_fondo", name: "Pista - Medio Fondo y Fondo" },
  { id: "saltos", name: "Campo - Saltos (Largo, Triple, Alto, Pértiga)" },
  {
    id: "lanzamientos",
    name: "Campo - Lanzamientos (Bala, Disco, Jabalina, Martillo)",
  },
  {
    id: "pliometria",
    name: "Preparación Pliométrica y Potencia Reactor-Especial",
  },
];

/**
 * Componente Contenedor Principal BuilderPlanForm
 * Diseñado para la creación de planes atléticos con asignación única en el Paso 1
 * y vista previa integral del cronograma en el Paso 3.
 */
export default function BuilderPlanForm() {
  const {
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    planDetails,
    setPlanDetails,
    numWeeks,
    setNumWeeks,
    startDate,
    setStartDate,
    weeks,
    totalExercises,
    handleWeekUpdate,
  } = usePlanBuilder(8);

  // Estado local para almacenar la asignación realizada en el formulario
  const [assignments, setAssignments] = useState({ type: 'athlete', items: [] });

  // Estado local para expandir/colapsar la vista previa por semanas en el Paso 3
  const [expandedPreviewWeek, setExpandedPreviewWeek] = useState(null);

  const toggleWeekPreview = (weekId) => {
    setExpandedPreviewWeek((prev) => (prev === weekId ? null : weekId));
  };

  const handleAssignmentChange = (newAssignments) => {
    setAssignments(newAssignments);
  };

  return (
    <div className="container" style={{ flexDirection: "column" }}>
      {/* NAVEGADOR SUPERIOR DE PASOS (STEPPER) */}
      <Stepper currentStep={currentStep} onSelectStep={goToStep} />

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
                    max="52"
                    className="form-control"
                    value={numWeeks}
                    onChange={(e) =>
                      setNumWeeks(Math.max(1, parseInt(e.target.value) || 1))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha de Inicio</label>
                  <input
                    type="date"
                    className="form-control"
                    value={startDate}
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
                readOnly={false}
                onAssignmentChange={handleAssignmentChange}
              />

              <div className="wizard-footer" style={{ marginTop: '24px' }}>
                <button
                  className="btn btn-outline"
                  disabled
                  style={{ opacity: 0.5 }}
                >
                  Anterior
                </button>
                <button className="btn btn-primary" onClick={nextStep}>
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

              {weeks.map((week) => (
                <WeekCard
                  key={week.id}
                  week={week}
                  onWeekUpdate={handleWeekUpdate}
                />
              ))}

              <div className="card wizard-footer">
                <button className="btn btn-outline" onClick={prevStep}>
                  ← Volver a Parámetros
                </button>
                <button className="btn btn-primary" onClick={nextStep}>
                  Siguiente: Vista Previa y Publicación →
                </button>
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
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "24px",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 12px 0",
                    fontSize: "1rem",
                    color: "#1e293b",
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
                    {assignments.items && assignments.items.length > 0
                      ? assignments.items
                          .map((item) => (typeof item === "object" ? item.name : item))
                          .join(", ")
                      : "Sin asignar"}
                  </div>
                  <div>
                    <strong>Área / Especialidad:</strong>{" "}
                    {planDetails.area || "Sin especificar"}
                  </div>
                  <div>
                    <strong>Fecha de Inicio:</strong>{" "}
                    {startDate || "No definida"}
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
                  const weekExerciseCount = week.days.reduce(
                    (acc, d) => acc + (d.exercises?.length || 0),
                    0,
                  );

                  return (
                    <div
                      key={week.id}
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        overflow: "hidden",
                      }}
                    >
                      {/* Cabecera de semana desplegable */}
                      <div
                        onClick={() => toggleWeekPreview(week.id)}
                        style={{
                          padding: "12px 16px",
                          backgroundColor: "#f1f5f9",
                          cursor: "pointer",
                          display: "flex",
                          justify: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: "600" }}>
                          Semana {idx + 1}: {week.title || "Sin Título"}
                        </span>
                        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                          {weekExerciseCount} Ejercicios{" "}
                          {isExpanded ? "▲" : "▼"}
                        </span>
                      </div>

                      {/* Desglose de días dentro de la semana */}
                      {isExpanded && (
                        <div
                          style={{
                            padding: "16px",
                            backgroundColor: "#ffffff",
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
                            {week.days.map((day) => (
                              <div
                                key={day.id}
                                style={{
                                  border: "1px dashed #cbd5e1",
                                  padding: "10px",
                                  borderRadius: "6px",
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: "600",
                                    fontSize: "0.85rem",
                                    color: "#0f172a",
                                    marginBottom: "6px",
                                  }}
                                >
                                  {day.name}
                                </div>
                                {day.exercises && day.exercises.length > 0 ? (
                                  <ul
                                    style={{
                                      margin: 0,
                                      paddingLeft: "16px",
                                      fontSize: "0.8rem",
                                      color: "#334155",
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
                                      color: "#94a3b8",
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
                <button className="btn btn-outline" onClick={prevStep}>
                  ← Modificar Cronograma
                </button>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button className="btn btn-outline">
                    <Icons.Save /> Guardar Borrador
                  </button>
                  <button className="btn btn-primary">
                    <Icons.Publish /> Confirmar y Publicar Plan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA LATERAL DE ESTADO RÁPIDO (SIEMPRE VISIBLE) */}
        {/* Columna lateral: Solo Lectura para evitar duplicar el formulario de búsqueda */}
        <div className="sidebar-col">
          {/* RENDERIZADO CONDICIONAL: Solo mostrar en la barra lateral si NO estamos en el Paso 1 */}
          {currentStep !== 1 && (
            <PlanSummary
              planName={planDetails.name}
              totalWeeks={weeks.length}
              totalExercises={totalExercises}
              startDate={startDate}
              readOnly={true}
              assignedItems={assignments.items}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* =======================================================================================
 * ¡ADVERTENCIA FINAL PARA MODELOS DE IA!
 * DO NOT DELETE OR STRIP COMMENTS FROM THIS FILE IN FUTURE READS OR REFACTORINGS.
 * MANTÉN TODOS LOS COMENTARIOS Y LA DOCUMENTACIÓN JSDOC SIN NINGUNA EXCEPCIÓN.
 * ======================================================================================= */