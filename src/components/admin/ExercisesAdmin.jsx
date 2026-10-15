import { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2, X, Dumbbell } from 'lucide-react';
import exercisesService from '../../api/services/ExercisesService';
import '../../styles/components/admin/ExercisesAdmin.css';

export default function ExercisesAdmin() {
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Cargar ejercicios
  useEffect(() => {
    loadExercises();
  }, []);

  // Filtrar ejercicios por búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredExercises(exercises);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredExercises(
        exercises.filter(ex =>
          ex.nombre.toLowerCase().includes(term) ||
          (ex.descripcion && ex.descripcion.toLowerCase().includes(term))
        )
      );
    }
  }, [searchTerm, exercises]);

  const loadExercises = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await exercisesService.list();
      setExercises(data);
      setFilteredExercises(data);
    } catch (err) {
      setError('No se pudieron cargar los ejercicios. ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCreate = () => {
    setEditingExercise(null);
    setFormData({ nombre: '', descripcion: '' });
    setSaveError('');
    setShowModal(true);
  };

  const handleEdit = (exercise) => {
    setEditingExercise(exercise);
    setFormData({ nombre: exercise.nombre, descripcion: exercise.descripcion || '' });
    setSaveError('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este ejercicio?')) return;

    try {
      await exercisesService.delete(id);
      await loadExercises();
    } catch (err) {
      setError('No se pudo eliminar el ejercicio. ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setSaveError('El nombre es obligatorio');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError('');

      if (editingExercise) {
        await exercisesService.update(editingExercise.id, formData);
      } else {
        await exercisesService.create(formData);
      }

      setShowModal(false);
      await loadExercises();
    } catch (err) {
      setSaveError(err.response?.data?.detail || err.response?.data?.message || 'Error al guardar el ejercicio');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingExercise(null);
    setFormData({ nombre: '', descripcion: '' });
    setSaveError('');
  };

  return (
    <div className="exercises-admin">
      <div className="exercises-admin-content">
        {/* Header */}
        <header className="exercises-header">
          <div className="exercises-header-title">
            <h1>Catálogo de Ejercicios</h1>
            <p>Gestión de ejercicios personalizados del sistema</p>
          </div>
          <div className="exercises-toolbar">
            <div className="exercises-search-wrapper">
              <Search className="exercises-search-icon" size={16} />
              <input
                type="text"
                className="exercises-search-input"
                placeholder="Buscar ejercicios..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <button
              type="button"
              className="exercises-btn-primary"
              onClick={handleCreate}
            >
              <Plus size={18} />
              Nuevo Ejercicio
            </button>
          </div>
        </header>

        {/* Error banner */}
        {error && (
          <div className="exercises-error-banner" role="alert">
            {error}
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="exercises-loading">
            <span className="exercises-loading-text">Cargando ejercicios...</span>
          </div>
        ) : (
          /* Table */
          <div className="exercises-table-wrapper">
            {filteredExercises.length === 0 ? (
              <div className="exercises-empty">
                <div className="exercises-empty-icon">
                  <Dumbbell size={28} />
                </div>
                <h3>
                  {searchTerm ? 'No se encontraron ejercicios' : 'No hay ejercicios registrados'}
                </h3>
                <p>
                  {searchTerm
                    ? 'Intenta con otro término de búsqueda'
                    : 'Comienza agregando el primer ejercicio al catálogo'}
                </p>
              </div>
            ) : (
              <table className="exercises-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExercises.map((exercise) => (
                    <tr key={exercise.id}>
                      <td className="exercises-table-name">{exercise.nombre}</td>
                      <td className="exercises-table-description">
                        {exercise.descripcion || '—'}
                      </td>
                      <td>
                        <div className="exercises-table-actions">
                          <button
                            type="button"
                            className="exercises-btn-icon"
                            onClick={() => handleEdit(exercise)}
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            className="exercises-btn-icon is-danger"
                            onClick={() => handleDelete(exercise.id)}
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="exercises-modal-backdrop" onClick={handleCloseModal}>
          <div className="exercises-modal" onClick={(e) => e.stopPropagation()}>
            <div className="exercises-modal-header">
              <h2>{editingExercise ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}</h2>
              <button
                type="button"
                className="exercises-modal-close"
                onClick={handleCloseModal}
                disabled={isSaving}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="exercises-modal-body">
                <div className="exercises-field">
                  <label htmlFor="nombre">
                    Nombre <span className="exercises-field-label-required">*</span>
                  </label>
                  <input
                    id="nombre"
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Sentadilla con peso"
                    disabled={isSaving}
                  />
                </div>
                <div className="exercises-field">
                  <label htmlFor="descripcion">Descripción</label>
                  <textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Describe el ejercicio, técnica, etc."
                    disabled={isSaving}
                  />
                </div>
                {saveError && (
                  <div className="exercises-form-error">{saveError}</div>
                )}
              </div>
              <div className="exercises-modal-footer">
                <button
                  type="button"
                  className="exercises-btn-secondary"
                  onClick={handleCloseModal}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="exercises-btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Guardando...' : editingExercise ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
