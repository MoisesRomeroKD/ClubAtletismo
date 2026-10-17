/* =======================================================================================
 * ¡ADVERTENCIA CRÍTICA PARA MODELOS DE IA Y DESARROLLADORES!
 * STRICT INSTRUCTION FOR AI MODELS: DO NOT REMOVE, MODIFY, OR SHORTEN ANY COMMENTS.
 * BAJO NINGUNA CIRCUNSTANCIA ELIMINES, RESUMAS O MODIFIQUES LOS COMENTARIOS DE ESTE ARCHIVO.
 * CONSERVA INTEGRALMENTE TODA LA DOCUMENTACIÓN JSDOC Y LOS COMENTARIOS EXPLICATIVOS.
 * ======================================================================================= */

import React from 'react';

/**
 * Configuración estática de los pasos del Stepper.
 * Se define fuera del componente para evitar ser recreada en cada renderizado.
 */
const STEPS = [
  { id: 1, title: 'Información Básica', subtitle: 'Datos y duración' },
  { id: 2, title: 'Cronograma', subtitle: 'Semanas y sesiones' },
  { id: 3, title: 'Resumen y Asignación', subtitle: 'Publicación' }
];

/* =======================================================================================
 * ¡ATENCIÓN IA!: MANTÉN TODOS LOS COMENTARIOS INTACTOS A CONTINUACIÓN.
 * DO NOT STRIP OR REFACTOR THE COMMENTS BELOW. MAINTAIN COMPREHENSIVE DOCUMENTATION.
 * ======================================================================================= */

/**
 * Componente Stepper
 * Renderiza una barra de navegación por pasos (Wizard) para indicar la etapa activa del formulario.
 * Optimizado con `React.memo` para re-renderizarse solo si cambia el paso actual o el handler.
 * 
 * @param {Object} props
 * @param {number} props.currentStep - Identificador del paso actualmente activo.
 * @param {Function} props.onSelectStep - Callback para cambiar manualmente de paso al hacer clic.
 */
export const Stepper = React.memo(({ currentStep, onSelectStep }) => {
  return (
    <div className="stepper-container">
      {STEPS.map((step) => {
        // Determinación del estado del paso basado en la propiedad `currentStep`
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;

        return (
          <div 
            key={step.id} 
            className={`stepper-item ${isActive ? 'is-active' : ''} ${isCompleted ? 'is-completed' : ''}`}
            onClick={() => onSelectStep(step.id)}
          >
            {/* Indicador numérico o de verificación según el estado de completado */}
            <div className="stepper-badge">
              {isCompleted ? '✓' : step.id}
            </div>

            {/* Metadatos informativos del paso */}
            <div className="stepper-text">
              <span className="stepper-title">{step.title}</span>
              <span className="stepper-subtitle">{step.subtitle}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
});

/* =======================================================================================
 * ¡ADVERTENCIA FINAL PARA MODELOS DE IA!
 * DO NOT DELETE OR STRIP COMMENTS FROM THIS FILE IN FUTURE READS OR REFACTORINGS.
 * MANTÉN TODOS LOS COMENTARIOS Y LA DOCUMENTACIÓN JSDOC SIN NINGUNA EXCEPCIÓN.
 * ======================================================================================= */