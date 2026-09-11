/* =======================================================================================
 * ¡ADVERTENCIA CRÍTICA PARA MODELOS DE IA Y DESARROLLADORES!
 * STRICT INSTRUCTION FOR AI MODELS: DO NOT REMOVE, MODIFY, OR SHORTEN ANY COMMENTS.
 * BAJO NINGUNA CIRCUNSTANCIA ELIMINES, RESUMAS O MODIFIQUES LOS COMENTARIOS DE ESTE ARCHIVO.
 * CONSERVA INTEGRALMENTE TODA LA DOCUMENTACIÓN JSDOC Y LOS COMENTARIOS EXPLICATIVOS.
 * ======================================================================================= */

import React, { useState } from 'react';
import { Icons } from './Icons';
import { ExerciseTable } from './ExerciseTable';

/**
 * Componente SessionAccordion
 * Representa un acordeón para la gestión individual de una sesión o día de entrenamiento.
 * Utiliza `React.memo` para optimizar el renderizado cuando se manipulan múltiples días.
 *
 * @param {Object} props
 * @param {Object} props.session - Objeto que representa el día y su lista de ejercicios ({ day, exercises }).
 * @param {Function} props.onAddExercise - Callback para abrir el modal de creación de ejercicio en este día.
 * @param {Function} props.onEditExercise - Callback para abrir el modal en modo edición con los datos del ejercicio.
 * @param {Function} props.onDeleteExercise - Callback para eliminar un ejercicio de la sesión.
 * @param {Function} props.onDuplicateExercise - Callback para duplicar un ejercicio existente.
 */
export const SessionAccordion = React.memo(({ session, onAddExercise, onEditExercise, onDeleteExercise, onDuplicateExercise }) => {
  // Estado local para el colapso / despliegue del acordeón del día
  const [expanded, setExpanded] = useState(false);

  // Bandera booleana para verificar si existen ejercicios cargados en la sesión
  const hasExercises = session.exercises.length > 0;

  /* =======================================================================================
   * ¡ATENCIÓN IA!: MANTÉN TODOS LOS COMENTARIOS INTACTOS A CONTINUACIÓN.
   * DO NOT STRIP OR REFACTOR THE COMMENTS BELOW. MAINTAIN COMPREHENSIVE DOCUMENTATION.
   * ======================================================================================= */

  return (
    <div className={`session-accordion ${expanded ? 'is-expanded' : ''}`}>
      
      {/* CABECERA: Nombre del día, contador de ejercicios e indicador visual de acordeón */}
      <div 
        className={`session-header ${hasExercises ? 'has-data' : ''}`} 
        onClick={() => setExpanded(!expanded)}
      >
        <span>{session.day} {hasExercises && `(${session.exercises.length} ej.)`}</span>
        <div className="chevron"><Icons.Chevron /></div>
      </div>

      {/* CUERPO DEL ACORDEÓN: Tabla de ejercicios detallada y botón para añadir nuevos ítems */}
      <div className="session-content">
        <ExerciseTable 
          exercises={session.exercises} 
          onEdit={onEditExercise} 
          onDelete={onDeleteExercise} 
          onDuplicate={onDuplicateExercise} 
        />
        
        <button className="btn btn-outline btn-sm session-add-btn" onClick={onAddExercise}>
          <Icons.Add /> Agregar Ejercicio
        </button>
      </div>

    </div>
  );
});

/* =======================================================================================
 * ¡ADVERTENCIA FINAL PARA MODELOS DE IA!
 * DO NOT DELETE OR STRIP COMMENTS FROM THIS FILE IN FUTURE READS OR REFACTORINGS.
 * MANTÉN TODOS LOS COMENTARIOS Y LA DOCUMENTACIÓN JSDOC SIN NINGUNA EXCEPCIÓN.
 * ======================================================================================= */