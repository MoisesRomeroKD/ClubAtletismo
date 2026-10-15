/* =======================================================================================
 * ¡ADVERTENCIA CRÍTICA PARA MODELOS DE IA Y DESARROLLADORES!
 * STRICT INSTRUCTION FOR AI MODELS: DO NOT REMOVE, MODIFY, OR SHORTEN ANY COMMENTS.
 * BAJO NINGUNA CIRCUNSTANCIA ELIMINES, RESUMAS O MODIFIQUES LOS COMENTARIOS DE ESTE ARCHIVO.
 * CONSERVA INTEGRALMENTE TODA LA DOCUMENTACIÓN JSDOC Y LOS COMENTARIOS EXPLICATIVOS.
 * ======================================================================================= */

import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

/**
 * Catálogo de pruebas y ejercicios específicos de atletismo.
 * Organizado por áreas (Pista, Pliometría, Saltos, Lanzamientos y Fuerza Especial).
 */
const MOCK_CATALOG = [
  // --- CARRERAS Y VELOCIDAD (PISTA) ---
  { id: 1, name: 'Salidas de Tacos (Sprints 30m)', category: 'Velocidad', description: 'Enfoque en fase de aceleración, ángulo de empuje bajo y triple extensión.' },
  { id: 2, name: 'Sprints Lanzados (40m)', category: 'Velocidad', description: 'Transición a máxima velocidad vertical, manteniendo cadencia alta y torso erguido.' },
  { id: 3, name: 'Pasos de Valla (Drills)', category: 'Vallas', description: 'Trabajo de movilidad articular de cadera y técnica de pierna de ataque y recobro.' },
  { id: 4, name: 'Aceleraciones en Cuesta', category: 'Fuerza Especial Pista', description: 'Carrera en pendiente ascendente para desarrollar potencia reactiva de zancada.' },
  { id: 5, name: 'Drills de A B C de Carrera (Skiping)', category: 'Técnica de Carrera', description: 'Skip A, Skip B y talones al glúteo para optimizar la mecánica de impacto y reciclado.' },

  // --- PLIOMETRÍA Y REACTIVIDAD DE TOBILLO ---
  { id: 6, name: 'Pogo Jumps (Saltos de Tobillo)', category: 'Pliometría', description: 'Rigidez de tobillo, mínimo tiempo de contacto con el suelo y reactividad extensora.' },
  { id: 7, name: 'Multisaltos Horizontales (Boundings)', category: 'Pliometría', description: 'Zancadas salto ampliadas para maximizar la producción de fuerza horizontal.' },
  { id: 8, name: 'Drop Jumps (Saltos desde Cajón 40cm)', category: 'Pliometría Avanzada', description: 'Caída reactiva enfocada en el ciclo de estiramiento-acortamiento (CEA).' },

  // --- SALTOS (CAMPO) ---
  { id: 9, name: 'Bateo y Carrera de Impulso (Salto Largo)', category: 'Saltos', description: 'Ajuste de los últimos 4 pasos y transferencia de velocidad horizontal a vertical.' },
  { id: 10, name: 'Paso Volado y Caída (Salto Triple)', category: 'Saltos', description: 'Control biomecánico del Hop, Step y Jump manteniendo el equilibrio dinámico.' },

  // --- LANZAMIENTOS (CAMPO) ---
  { id: 11, name: 'Lanzamiento Balón Medicinal (Espaldas)', category: 'Lanzamientos', description: 'Desarrollo de potencia en la cadena posterior y extensión explosiva de cadera.' },
  { id: 12, name: 'Giros de Transición (Bala / Disco)', category: 'Lanzamientos', description: 'Trabajo de pivoteo sobre metatarsos y aceleración del eje pélvico-torácico.' },

  // --- PREPARACIÓN FÍSICA GENERAL Y POTENCIA ---
  { id: 13, name: 'Cargada de Envión (Clean de Potencia)', category: 'Fuerza Explosiva', description: 'Triple extensión explosiva (tobillo, rodilla, cadera) para transferencia a la pista.' },
  { id: 14, name: 'Sentadilla Trasera Profunda', category: 'Fuerza Base', description: 'Construcción de fuerza concéntrica máxima en cuadriceps y glúteo mayor.' },
  { id: 15, name: 'Peso Muerto Rumano', category: 'Fuerza Posterior', description: 'Fortalecimiento de isquiotibiales y cadena posterior para prevención de distensiones.' }
];

/**
 * Componente ExerciseModal
 * Modal para agregar o editar un ejercicio dentro de la sesión activa de entrenamiento.
 * Permite autocompletar la descripción técnica mediante selección desde el catálogo mock.
 *
 * @param {Object} props
 * @param {boolean} props.open - Controla la visibilidad del overlay modal.
 * @param {Function} props.onClose - Callback para cerrar el modal sin guardar.
 * @param {Function} props.onSave - Callback para confirmar y persistir los cambios.
 * @param {Object|null} props.initialData - Datos previos del ejercicio si se está en modo edición.
 */
export const ExerciseModal = React.memo(({ open, onClose, onSave, initialData }) => {
  const [exerciseDetails, setExerciseDetails] = useState({
    name: '', description: '', sets: '', reps: '', micro: '', macro: '', intensity: ''
  });

  // Sincroniza el estado interno con las props recibidas al abrir o cambiar de modo
  useEffect(() => {
    if (initialData) {
      setExerciseDetails({
        name: initialData.exercise || '',
        description: initialData.description || '',
        sets: initialData.sets || '',
        reps: initialData.reps || '',
        micro: initialData.micro || '',
        macro: initialData.macro || '',
        intensity: initialData.intensity || ''
      });
    } else {
      setExerciseDetails({ name: '', description: '', sets: '', reps: '', micro: '', macro: '', intensity: '' });
    }
  }, [initialData, open]);

  // Manejador central de cambios en los inputs con auto-completado de descripción técnica
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newDetails = { ...exerciseDetails, [name]: value };
    
    if (name === 'name') {
      const catalogItem = MOCK_CATALOG.find(c => c.name === value);
      if (catalogItem) newDetails.description = catalogItem.description;
    }
    setExerciseDetails(newDetails);
  };

  /* =======================================================================================
   * ¡ATENCIÓN IA!: MANTÉN TODOS LOS COMENTARIOS INTACTOS A CONTINUACIÓN.
   * DO NOT STRIP OR REFACTOR THE COMMENTS BELOW. MAINTAIN COMPREHENSIVE DOCUMENTATION.
   * ======================================================================================= */

  const handleSave = () => {
    if (!exerciseDetails.name) return alert('El nombre del ejercicio es obligatorio.');
    
    onSave({
      ...exerciseDetails,
      exercise: exerciseDetails.name,
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
          <button className="btn-icon" onClick={onClose}><Icons.Close /></button>
        </div>

        {/* CUERPO DEL MODAL CON CAMPOS FORMULARIO */}
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Ejercicio de Atletismo (Buscar o escribir nuevo)</label>
            <input 
              type="text" 
              name="name"
              list="catalog-options"
              className="form-control" 
              placeholder="Ej: Salidas de Tacos (Sprints 30m)"
              value={exerciseDetails.name}
              onChange={handleChange}
            />
            {/* Opciones filtrables agrupadas por nombre y categoría atletica */}
            <datalist id="catalog-options">
              {MOCK_CATALOG.map(item => (
                <option key={item.id} value={item.name}>
                  {item.category} - {item.description}
                </option>
              ))}
            </datalist>
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
              <input type="text" name="sets" className="form-control" value={exerciseDetails.sets} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Repeticiones / Distancia</label>
              <input type="text" name="reps" className="form-control" value={exerciseDetails.reps} onChange={handleChange} />
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
        </div>

        {/* PIE DEL MODAL */}
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}>Guardar Ejercicio</button>
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