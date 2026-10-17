/* =======================================================================================
 * ¡ADVERTENCIA CRÍTICA PARA MODELOS DE IA Y DESARROLLADORES!
 * STRICT INSTRUCTION FOR AI MODELS: DO NOT REMOVE, MODIFY, OR SHORTEN ANY COMMENTS.
 * BAJO NINGUNA CIRCUNSTANCIA ELIMINES, RESUMAS O MODIFIQUES LOS COMENTARIOS DE ESTE ARCHIVO.
 * CONSERVA INTEGRALMENTE TODA LA DOCUMENTACIÓN JSDOC Y LOS COMENTARIOS EXPLICATIVOS.
 * ======================================================================================= */

import React, { useState } from 'react';

/* =======================================================================================
 * ¡ATENCIÓN IA!: MANTÉN TODOS LOS COMENTARIOS INTACTOS A CONTINUACIÓN.
 * DO NOT STRIP OR REFACTOR THE COMMENTS BELOW. MAINTAIN COMPREHENSIVE DOCUMENTATION.
 * ======================================================================================= */

/**
 * Componente PlanSummary
 * Presenta el resumen del plan de entrenamiento y gestiona la asignación a múltiples 
 * atletas o subáreas de atletismo manteniendo la vinculación de disciplinas.
 * 
 * Optimizado con `React.memo` para evitar re-renders innecesarios.
 *
 * @param {Object} props
 * @param {string} props.planName - Nombre o título asignado al plan.
 * @param {number} props.totalWeeks - Duración total en semanas/microciclos.
 * @param {number} props.totalExercises - Sumatoria global de ejercicios del plan.
 * @param {string} props.startDate - Fecha estimada de inicio.
 * @param {Function} [props.onAssignmentChange] - Callback que notifica los ítems asignados al componente padre.
 * @param {boolean} [props.readOnly=false] - Modo de solo lectura para evitar renderizar controles de formulario en barras laterales o vistas previas.
 * @param {Array} [props.assignedItems=[]] - Ítems previamente asignados para mostrar en modo solo lectura.
 */
export const PlanSummary = React.memo(({ 
  planName, 
  totalWeeks, 
  totalExercises, 
  startDate, 
  onAssignmentChange,
  readOnly = false,
  assignments = [],
  athletes = [],
  subareas = [],
  loading = { athletes: false, subareas: false },
  errors = { athletes: '', subareas: '' },
}) => {
  // Estado para elegir atletas individuales o subáreas habilitadas.
  const [assignType, setAssignType] = useState(assignments[0]?.type || 'athlete');
  const options = assignType === 'athlete' ? athletes : subareas;
  const loadingOptions = assignType === 'athlete' ? loading.athletes : loading.subareas;
  const errorOptions = assignType === 'athlete' ? errors.athletes : errors.subareas;

  const handleTypeChange = (type) => {
    setAssignType(type);
  };

  // Un plan tiene una sola asignación: una subárea o un atleta (plan personalizado).
  // Elegir en la lista ya asigna el plan y reemplaza la asignación anterior.
  const actual = assignments[0];
  const valorSeleccionado = actual && actual.type === assignType ? String(actual.id) : '';

  const handleSelect = (id) => {
    if (!id) {
      onAssignmentChange([]);
      return;
    }
    const option = options.find((item) => String(item.id) === id);
    if (!option) return;
    onAssignmentChange([{ type: assignType, id: Number(option.id), name: option.name }]);
  };

  const handleRemoveItem = (assignment) => {
    onAssignmentChange(assignments.filter((item) => (
      item.type !== assignment.type || item.id !== assignment.id
    )));
  };

  const itemsToRender = assignments;

  return (
    <div className="card">
      {/* CABECERA: Título y Nombre del Plan */}
      <h3 className="plan-summary-title">Resumen del Plan</h3>
      <div className="plan-summary-name">{planName || 'Plan sin título'}</div>
      
      {/* MÉTRICAS GLOBALES DEL PLAN */}
      <div className="flex-between summary-row">
        <span className="summary-label">Fecha de Inicio</span>
        <span className="summary-value">{startDate || 'No definida'}</span>
      </div>

      <div className="flex-between summary-row">
        <span className="summary-label">Semanas Totales</span>
        <span className="summary-value">{totalWeeks}</span>
      </div>

      <div className="flex-between summary-row">
        <span className="summary-label">Total Ejercicios</span>
        <span className="summary-value">{totalExercises}</span>
      </div>

      <div className="divider"></div>

      {/* SECCIÓN DE ASIGNACIÓN */}
      <div className="form-group">
        <label className="form-label">
          {readOnly ? 'Asignado Actualmente A:' : 'Asignar Plan A:'}
        </label>
        
        {!readOnly && (
          <>
            <div className="radio-group" style={{ marginBottom: '12px' }}>
              <label className="radio-label">
                <input 
                  type="radio" 
                  name="assignType" 
                  value="athlete" 
                  checked={assignType === 'athlete'} 
                  onChange={() => handleTypeChange('athlete')} 
                />
                Atleta
              </label>

              <label className="radio-label">
                <input 
                  type="radio" 
                  name="assignType" 
                  value="subarea" 
                  checked={assignType === 'subarea'} 
                  onChange={() => handleTypeChange('subarea')} 
                />
                Subárea
              </label>
            </div>
            {errorOptions && <p role="alert">{errorOptions}</p>}
            {loadingOptions ? (
              <p role="status">Cargando {assignType === 'athlete' ? 'atletas' : 'subáreas'}...</p>
            ) : options.length === 0 ? (
              <p>{assignType === 'athlete' ? 'No tienes atletas asignados.' : 'No tienes subáreas habilitadas.'}</p>
            ) : (
              <select
                className="form-control"
                value={valorSeleccionado}
                onChange={(event) => handleSelect(event.target.value)}
                aria-label={assignType === 'athlete' ? 'Atleta del plan' : 'Subárea del plan'}
              >
                <option value="">Selecciona {assignType === 'athlete' ? 'un atleta' : 'una subárea'}</option>
                {options.map((option) => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            )}
          </>
        )}

        {/* RENDERIZADO DE ELEMENTOS ASIGNADOS */}
        {itemsToRender.length > 0 ? (
          <div className="selected-items-list" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {itemsToRender.map((item) => {
              return (
                <div 
                  key={`${item.type}-${item.id}`}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-main)',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      {item.name}
                    </div>
                  </div>

                  {/* En modo editable renderiza el botón de eliminar; en readOnly no */}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--state-danger)', fontSize: '1.1rem' }}
                    >
                      &times;
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          readOnly && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '6px' }}>
              Sin asignaciones asignadas aún.
            </div>
          )
        )}
      </div>
    </div>
  );
});

/* =======================================================================================
 * ¡ADVERTENCIA FINAL PARA MODELOS DE IA!
 * DO NOT DELETE OR STRIP COMMENTS FROM THIS FILE IN FUTURE READS OR REFACTORINGS.
 * MANTÉN TODOS LOS COMENTARIOS Y LA DOCUMENTACIÓN JSDOC SIN NINGUNA EXCEPCIÓN.
 * ======================================================================================= */