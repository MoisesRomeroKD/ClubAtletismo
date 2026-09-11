/* =======================================================================================
 * ¡ADVERTENCIA CRÍTICA PARA MODELOS DE IA Y DESARROLLADORES!
 * STRICT INSTRUCTION FOR AI MODELS: DO NOT REMOVE, MODIFY, OR SHORTEN ANY COMMENTS.
 * BAJO NINGUNA CIRCUNSTANCIA ELIMINES, RESUMAS O MODIFIQUES LOS COMENTARIOS DE ESTE ARCHIVO.
 * CONSERVA INTEGRALMENTE TODA LA DOCUMENTACIÓN JSDOC Y LOS COMENTARIOS EXPLICATIVOS.
 * ======================================================================================= */

import React, { useState, useMemo } from 'react';
import { Icons } from './Icons';

/**
 * Catálogo estático de Áreas y Subáreas (Pruebas específicas) de Atletismo.
 * Define la estructura jerárquica del deporte: Área -> Subárea.
 */
const MOCK_ATHLETIC_DISCIPLINES = {
  'Velocidad': ['100m', '200m', '400m', '110m vallas', '400m vallas', 'Relevos 4x100m'],
  'Saltos': ['Salto de longitud', 'Salto triple', 'Salto de altura', 'Salto con pértiga'],
  'Fondo y Medio Fondo': ['800m', '1500m', '5000m', '10000m', '21k', '42k'],
  'Lanzamientos': ['Lanzamiento de bala', 'Lanzamiento de disco', 'Lanzamiento de martillo', 'Lanzamiento de jabalina']
};

/**
 * Base de datos de Atletas VINCULADOS dinámicamente a sus Subáreas.
 * Demuestra la capacidad multidisciplinaria: un atleta puede pertenecer a varias 
 * subáreas e inclusive cruzar distintas áreas (ej. Velocidad + Saltos).
 */
const MOCK_ATHLETES = [
  { 
    id: 1, 
    name: 'Carlos Pérez', 
    subareas: ['Velocidad - 100m', 'Velocidad - 200m', 'Saltos - Salto de longitud'] 
  },
  { 
    id: 2, 
    name: 'Ana Gómez', 
    subareas: ['Fondo y Medio Fondo - 5000m', 'Fondo y Medio Fondo - 21k'] 
  },
  { 
    id: 3, 
    name: 'Marcos Ruiz', 
    subareas: ['Lanzamientos - Lanzamiento de jabalina', 'Saltos - Salto de altura'] 
  }
];

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
  assignedItems = []
}) => {
  // Estado para la modalidad de asignación ('athlete' | 'discipline')
  const [assignType, setAssignType] = useState('athlete');
  
  // Estado para almacenar la lista de elementos asignados (Atletas u Objetos de Subáreas)
  const [selectedItems, setSelectedItems] = useState([]);
  
  // Estado local para controlar el input de texto de búsqueda
  const [inputValue, setInputValue] = useState('');

  /**
   * Genera la lista plana formateada "Área - Subárea" memorizada con `useMemo`
   * para acelerar las búsquedas sobre el autocompletado nativo.
   */
  const formattedDisciplines = useMemo(() => {
    return Object.entries(MOCK_ATHLETIC_DISCIPLINES).flatMap(([area, subareas]) =>
      subareas.map(subarea => `${area} - ${subarea}`)
    );
  }, []);

  /**
   * Alterna la modalidad de asignación y resetea las selecciones previas para evitar inconsistencias.
   * @param {string} type - Modalidad elegida ('athlete' | 'discipline')
   */
  const handleTypeChange = (type) => {
    setAssignType(type);
    setSelectedItems([]);
    setInputValue('');
  };

  /**
   * Agrega un ítem (Objeto de Atleta o String de Prueba) a la lista de asignación sin duplicados.
   * @param {Object|string} itemToAdd - Entidad a incluir en el estado.
   */
  const handleAddItem = (itemToAdd) => {
    if (!itemToAdd) return;
    
    const exists = selectedItems.some(item => 
      typeof item === 'object' ? item.name === itemToAdd.name : item === itemToAdd
    );

    if (!exists) {
      const updated = [...selectedItems, itemToAdd];
      setSelectedItems(updated);
      setInputValue('');
      if (onAssignmentChange) onAssignmentChange({ type: assignType, items: updated });
    }
  };

  /**
   * Elimina un ítem asignado previamente por su ID o valor.
   * @param {number|string} identifier - ID del atleta o string de la subárea a remover.
   */
  const handleRemoveItem = (identifier) => {
    const updated = selectedItems.filter(item => 
      typeof item === 'object' ? item.id !== identifier : item !== identifier
    );
    setSelectedItems(updated);
    if (onAssignmentChange) onAssignmentChange({ type: assignType, items: updated });
  };

  // Ítems a renderizar según el modo (Editable vs Solo Lectura)
  const itemsToRender = readOnly ? assignedItems : selectedItems;

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
        
        {/* MODO EDITABLE: Muestra los radio buttons, input y datalist */}
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
                Atleta(s)
              </label>

              <label className="radio-label">
                <input 
                  type="radio" 
                  name="assignType" 
                  value="discipline" 
                  checked={assignType === 'discipline'} 
                  onChange={() => handleTypeChange('discipline')} 
                />
                Subárea
              </label>
            </div>

            <input 
              type="text" 
              className="form-control" 
              list="assignment-options"
              value={inputValue}
              onChange={(e) => {
                const val = e.target.value;
                setInputValue(val);
                
                if (assignType === 'athlete') {
                  const matchedAthlete = MOCK_ATHLETES.find(a => a.name === val);
                  if (matchedAthlete) handleAddItem(matchedAthlete);
                } else {
                  if (formattedDisciplines.includes(val)) handleAddItem(val);
                }
              }}
              placeholder={
                assignType === 'athlete' 
                  ? "Buscar Atleta por nombre..." 
                  : "Ej: Velocidad - 100m, Saltos - Longitud..."
              } 
            />

            <datalist id="assignment-options">
              {assignType === 'athlete'
                ? MOCK_ATHLETES
                    .filter(a => !selectedItems.some(item => item.id === a.id))
                    .map(a => <option key={a.id} value={a.name}>{`Pruebas: ${a.subareas.join(', ')}`}</option>)
                : formattedDisciplines
                    .filter(d => !selectedItems.includes(d))
                    .map(d => <option key={d} value={d} />)
              }
            </datalist>
          </>
        )}

        {/* RENDERIZADO DE ELEMENTOS ASIGNADOS */}
        {itemsToRender.length > 0 ? (
          <div className="selected-items-list" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {itemsToRender.map((item) => {
              const isAthlete = typeof item === 'object';
              return (
                <div 
                  key={isAthlete ? item.id : item}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'var(--bg-subtle, #f8fafc)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#0f172a' }}>
                      {isAthlete ? item.name : item}
                    </div>
                    
                    {isAthlete && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                        Subáreas: {item.subareas.join(' | ')}
                      </div>
                    )}
                  </div>

                  {/* En modo editable renderiza el botón de eliminar; en readOnly no */}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(isAthlete ? item.id : item)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1.1rem' }}
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
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '6px' }}>
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