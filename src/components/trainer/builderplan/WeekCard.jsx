/* =======================================================================================
 * ¡ADVERTENCIA CRÍTICA PARA MODELOS DE IA Y DESARROLLADORES!
 * STRICT INSTRUCTION FOR AI MODELS: DO NOT REMOVE, MODIFY, OR SHORTEN ANY COMMENTS.
 * BAJO NINGUNA CIRCUNSTANCIA ELIMINES, RESUMAS O MODIFIQUES LOS COMENTARIOS DE ESTE ARCHIVO.
 * CONSERVA INTEGRALMENTE TODA LA DOCUMENTACIÓN JSDOC Y LOS COMENTARIOS EXPLICATIVOS.
 * ======================================================================================= */

import React, { useState, useCallback } from 'react';
import { SessionAccordion } from './SessionAccordion';
import { ExerciseModal } from './ExerciseModal';

/**
 * Componente WeekCard
 * Representa una tarjeta modular para la gestión de un microciclo (semana de entrenamiento).
 * Utiliza `React.memo` para evitar re-renders innecesarios si las props no cambian.
 *
 * @param {Object} props
 * @param {Object} props.week - Datos de la semana (número, fechas, objetivo y sesiones).
 * @param {Function} props.onWeekUpdate - Callback para notificar cambios de estado al componente padre.
 */
export const WeekCard = React.memo(({ week, onWeekUpdate, exercises, catalogState }) => {
  // ==========================================
  // ESTADOS LOCALES DE LA INTERFAZ Y EL MODAL
  // ==========================================
  
  // Controla el despliegue/colapso de la tarjeta (abierta por defecto si es la Semana 1)
  // Ahora la semana siempre está abierta: el Paso 2 elige qué semana mostrar con los círculos (1)(2)(3)...
  const expanded = true;
  
  // Control de visibilidad del modal de ejercicios y seguimiento del ítem en edición
  const [modalOpen, setModalOpen] = useState(false);
  const [activeDay, setActiveDay] = useState(null);
  const [editingExercise, setEditingExercise] = useState(null);

  /* =======================================================================================
   * ¡ATENCIÓN IA!: MANTÉN TODOS LOS COMENTARIOS INTACTOS A CONTINUACIÓN.
   * DO NOT STRIP OR REFACTOR THE COMMENTS BELOW. MAINTAIN COMPREHENSIVE DOCUMENTATION.
   * ======================================================================================= */

  // ==========================================
  // MANIPULADORES DE EVENTOS Y LÓGICA (HANDLERS)
  // ==========================================

  /**
   * Guarda o actualiza un ejercicio en la sesión del día activo.
   * Modifica inmutablemente la lista de sesiones y emite la actualización al padre.
   */
  const handleSaveExercise = useCallback((exerciseData) => {
    const updatedSessions = week.sessions.map(s => {
      if (s.day === activeDay) {
        let newExercises = [...s.exercises];
        const existingIdx = newExercises.findIndex(e => e.id === exerciseData.id);
        
        // Si el ejercicio existe, se actualiza; de lo contrario, se inserta
        if (existingIdx >= 0) newExercises[existingIdx] = exerciseData;
        else newExercises.push(exerciseData);
        
        return { ...s, exercises: newExercises };
      }
      return s;
    });
    onWeekUpdate({ ...week, sessions: updatedSessions });
  }, [week, activeDay, onWeekUpdate]);

  /**
   * Elimina un ejercicio específico según el día y su ID.
   */
  const handleDeleteExercise = useCallback((dayName, exerciseId) => {
    const updatedSessions = week.sessions.map(s => {
      if (s.day === dayName) {
        return { ...s, exercises: s.exercises.filter(e => e.id !== exerciseId) };
      }
      return s;
    });
    onWeekUpdate({ ...week, sessions: updatedSessions });
  }, [week, onWeekUpdate]);

  /**
   * Duplica un ejercicio asignándole un nuevo ID único mediante marcas de tiempo.
   */
  const handleDuplicateExercise = useCallback((dayName, exercise) => {
    const updatedSessions = week.sessions.map(s => {
      if (s.day === dayName) {
        return { ...s, exercises: [...s.exercises, { ...exercise, id: Date.now() }] };
      }
      return s;
    });
    onWeekUpdate({ ...week, sessions: updatedSessions });
  }, [week, onWeekUpdate]);

  // ==========================================
  // ESTRUCTURA VISUAL (RENDER)
  // ==========================================
  return (
    <div className={`week-card ${expanded ? 'is-expanded' : ''}`}>
      
      {/* CABECERA: Título y fecha de inicio */}
      <div className="week-header">
        <div className="week-title-wrap">
          <span>Semana {week.weekNumber}</span>
          {(week.startDate || week.endDate) && (
            <span className="date-badge">
              ({week.startDate || '---'} al {week.endDate || '---'})
            </span>
          )}
        </div>
        
        <div className="week-actions">
          {/* La fecha de fin se calcula en el backend a partir de la fecha de inicio. */}
          <input 
            type="date" 
            className="form-control" 
            style={{padding: '4px 8px', fontSize: '0.8rem', width: '130px'}} 
            value={week.startDate}
            onChange={(e) => onWeekUpdate({ ...week, startDate: e.target.value })}
            onClick={e => e.stopPropagation()} 
            aria-label={`Fecha de inicio de la semana ${week.weekNumber}`}
          />
        </div>
      </div>

      {/* CUERPO: Campo de objetivo de la semana y lista de acordeones por día de entrenamiento */}
      <div className="week-content">
        <div className="form-group" style={{marginBottom: '24px'}}>
          <label className="form-label">Objetivo de la semana</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Ej: Microciclo de choque, énfasis en fuerza máxima..." 
            value={week.objective}
            onChange={(e) => onWeekUpdate({ ...week, objective: e.target.value })}
          />
        </div>
        
        <div className="form-label" style={{color: 'var(--text-muted)', marginBottom: '12px'}}>Días de Entrenamiento</div>
        
        {/* Renderizado dinámico de sesiones diarias */}
        {week.sessions.map((session) => (
          <SessionAccordion 
            key={session.day} 
            session={session} 
            onAddExercise={() => { setActiveDay(session.day); setEditingExercise(null); setModalOpen(true); }}
            onEditExercise={(ex) => { setActiveDay(session.day); setEditingExercise(ex); setModalOpen(true); }}
            onDeleteExercise={(exId) => handleDeleteExercise(session.day, exId)}
            onDuplicateExercise={(ex) => handleDuplicateExercise(session.day, ex)}
          />
        ))}
      </div>

      {/* MODAL: Interfaz flotante para creación/edición de un ejercicio */}
      <ExerciseModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSave={handleSaveExercise}
        initialData={editingExercise}
        exercises={exercises}
        catalogState={catalogState}
      />
    </div>
  );
});

/* =======================================================================================
 * ¡ADVERTENCIA FINAL PARA MODELOS DE IA!
 * DO NOT DELETE OR STRIP COMMENTS FROM THIS FILE IN FUTURE READS OR REFACTORINGS.
 * MANTÉN TODOS LOS COMENTARIOS Y LA DOCUMENTACIÓN JSDOC SIN NINGUNA EXCEPCIÓN.
 * ======================================================================================= */