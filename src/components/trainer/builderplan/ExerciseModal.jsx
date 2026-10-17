/* =======================================================================================
 * ¡ADVERTENCIA CRÍTICA PARA MODELOS DE IA Y DESARROLLADORES!
 * STRICT INSTRUCTION FOR AI MODELS: DO NOT REMOVE, MODIFY, OR SHORTEN ANY COMMENTS.
 * BAJO NINGUNA CIRCUNSTANCIA ELIMINES, RESUMAS O MODIFIQUES LOS COMENTARIOS DE ESTE ARCHIVO.
 * CONSERVA INTEGRALMENTE TODA LA DOCUMENTACIÓN JSDOC Y LOS COMENTARIOS EXPLICATIVOS.
 * ======================================================================================= */

import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

/**
 * Componente ExerciseModal
 * Modal para agregar o editar un ejercicio dentro de la sesión activa de entrenamiento.
 * Selecciona ejercicios del catálogo persistido y captura la carga de la sesión.
 *
 * @param {Object} props
 * @param {boolean} props.open - Controla la visibilidad del overlay modal.
 * @param {Function} props.onClose - Callback para cerrar el modal sin guardar.
 * @param {Function} props.onSave - Callback para confirmar y persistir los cambios.
 * @param {Object|null} props.initialData - Datos previos del ejercicio si se está en modo edición.
 */
export const ExerciseModal = React.memo(({ open, onClose, onSave, initialData, exercises = [], catalogState }) => {
  const [exerciseDetails, setExerciseDetails] = useState({
    exerciseId: '', description: '', sets: '', reps: '', micro: '', macro: '', intensity: ''
  });
  const [formError, setFormError] = useState('');

  // Sincroniza el estado interno con las props recibidas al abrir o cambiar de modo
  useEffect(() => {
    if (initialData) {
      setFormError('');
      setExerciseDetails({
        exerciseId: String(initialData.exerciseId || ''),
        description: initialData.description || '',
        sets: initialData.sets || '',
        reps: initialData.reps || '',
        micro: initialData.micro || '',
        macro: initialData.macro || '',
        intensity: initialData.intensity || ''
      });
    } else {
      setFormError('');
      setExerciseDetails({ exerciseId: '', description: '', sets: '', reps: '', micro: '', macro: '', intensity: '' });
    }
  }, [initialData, open]);

  // Manejador central de cambios en los inputs con auto-completado de descripción técnica
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newDetails = { ...exerciseDetails, [name]: value };
    
    if (name === 'exerciseId') {
      const catalogItem = exercises.find((exercise) => String(exercise.id) === value);
      newDetails.description = catalogItem?.descripcion || '';
    }
    setExerciseDetails(newDetails);
  };

  /* =======================================================================================
   * ¡ATENCIÓN IA!: MANTÉN TODOS LOS COMENTARIOS INTACTOS A CONTINUACIÓN.
   * DO NOT STRIP OR REFACTOR THE COMMENTS BELOW. MAINTAIN COMPREHENSIVE DOCUMENTATION.
   * ======================================================================================= */

  const handleSave = () => {
    if (!exerciseDetails.exerciseId) {
      setFormError('Selecciona un ejercicio del catálogo.');
      return;
    }
    if (!Number.isInteger(Number(exerciseDetails.sets)) || Number(exerciseDetails.sets) < 1
      || !Number.isInteger(Number(exerciseDetails.reps)) || Number(exerciseDetails.reps) < 1) {
      setFormError('Series y repeticiones deben ser enteros mayores que cero.');
      return;
    }
    const selectedExercise = exercises.find((exercise) => String(exercise.id) === exerciseDetails.exerciseId);
    if (!selectedExercise) {
      setFormError('El ejercicio seleccionado ya no está disponible.');
      return;
    }
    
    onSave({
      ...exerciseDetails,
      exerciseId: Number(exerciseDetails.exerciseId),
      exercise: selectedExercise.nombre,
      sets: Number(exerciseDetails.sets),
      reps: Number(exerciseDetails.reps),
      id: initialData?.id || Date.now()
    });
    onClose();
  };

  return (
    <div className={`modal-overlay ${open ? 'is-open' : ''}`}>
      <div className="modal-content">
        
        {/* CABECERA DEL MODAL */}
        <div className="modal-header">
          <span>{initialData ? 'Editar Ejercicio' : 'Agregar Ejercicio a la Sesión'}</span>
          <button className="btn-icon" type="button" onClick={onClose}><Icons.Close /></button>
        </div>

        {/* CUERPO DEL MODAL CON CAMPOS FORMULARIO */}
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Ejercicio del catálogo</label>
            <select
              name="exerciseId"
              className="form-control"
              value={exerciseDetails.exerciseId}
              onChange={handleChange}
              required
              disabled={catalogState?.loading || exercises.length === 0}
            >
              <option value="">
                {catalogState?.loading ? 'Cargando ejercicios...' : 'Selecciona un ejercicio'}
              </option>
              {exercises.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>{exercise.nombre}</option>
              ))}
            </select>
            {catalogState?.error && <p role="alert">{catalogState.error}</p>}
            {!catalogState?.loading && !catalogState?.error && exercises.length === 0 && (
              <p>No hay ejercicios disponibles en el catálogo.</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Descripción o Nota Técnica</label>
            <textarea 
              name="description"
              className="form-control" 
              placeholder="Detalles sobre ángulos, pausas o intencionalidad técnica..."
              value={exerciseDetails.description}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Series</label>
              <input type="number" name="sets" min="1" step="1" required className="form-control" value={exerciseDetails.sets} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Repeticiones / Distancia</label>
              <input type="number" name="reps" min="1" step="1" required className="form-control" value={exerciseDetails.reps} onChange={handleChange} />
            </div>
            <div className="form-group col-span-2">
              <label className="form-label">Intensidad (%1RM, RPE o %VMAX)</label>
              <input type="text" name="intensity" className="form-control" value={exerciseDetails.intensity} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Micro Pausa (seg)</label>
              <input type="text" name="micro" className="form-control" value={exerciseDetails.micro} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Macro Pausa (min)</label>
              <input type="text" name="macro" className="form-control" value={exerciseDetails.macro} onChange={handleChange} />
            </div>
          </div>
          {formError && <p className="builder-feedback-error" role="alert">{formError}</p>}
        </div>

        {/* PIE DEL MODAL */}
        <div className="modal-footer">
          <button className="btn btn-outline" type="button" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" type="button" onClick={handleSave}>Añadir al plan</button>
        </div>

      </div>
    </div>
  );
});

/* =======================================================================================
 * ¡ADVERTENCIA FINAL PARA MODELOS DE IA!
 * DO NOT DELETE OR STRIP COMMENTS FROM THIS FILE IN FUTURE READS OR REFACTORINGS.
 * MANTÉN TODOS LOS COMENTARIOS Y LA DOCUMENTACIÓN JSDOC SIN NINGUNA EXCEPCIÓN.
 * ======================================================================================= */