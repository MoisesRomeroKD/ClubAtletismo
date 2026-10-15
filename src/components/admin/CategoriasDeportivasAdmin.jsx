import { useEffect, useState } from 'react';
import { CalendarRange, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import UserService from '../../api/services/Userservice';
import { useApplicationPermissions } from '../../context/ApplicationPermissionsContext';
import '../../styles/components/admin/CategoriasDeportivasAdmin.css';

const createEmptyDraft = () => ({
  name: '',
  min_age: '',
  max_age: '',
  birth_year_start: '',
  birth_year_end: '',
});

const getErrorMessage = (error) => {
  const responseData = error.response?.data;
  if (typeof responseData?.detail === 'string') return responseData.detail;
  if (responseData && typeof responseData === 'object') {
    return Object.values(responseData)
      .flat()
      .filter((message) => typeof message === 'string')
      .join(' ');
  }
  return 'No se pudo completar la operación. Inténtalo nuevamente.';
};

const fetchCategories = async () => {
  const categories = await UserService.getAthleteCategories();
  return Array.isArray(categories) ? categories : [];
};

export default function CategoriasDeportivasAdmin() {
  const { hasPermission } = useApplicationPermissions();
  const canManage = hasPermission('gestionar_categorias_deportivas');
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(createEmptyDraft);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let active = true;

    fetchCategories()
      .then((loadedCategories) => {
        if (active) {
          setCategories(loadedCategories);
          setErrorMessage('');
        }
      })
      .catch((error) => {
        if (active) setErrorMessage(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, []);

  const openCreateForm = () => {
    setEditingId(null);
    setDraft(createEmptyDraft());
    setErrorMessage('');
    setSuccessMessage('');
    setIsEditorOpen(true);
  };

  const openEditForm = (category) => {
    setEditingId(category.id);
    setDraft({
      name: category.name,
      min_age: String(category.min_age),
      max_age: String(category.max_age),
      birth_year_start: String(category.birth_year_start),
      birth_year_end: String(category.birth_year_end),
    });
    setErrorMessage('');
    setSuccessMessage('');
    setIsEditorOpen(true);
  };

  const closeForm = () => {
    setIsEditorOpen(false);
    setEditingId(null);
    setDraft(createEmptyDraft());
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const payload = {
      name: draft.name.trim(),
      min_age: Number(draft.min_age),
      max_age: Number(draft.max_age),
      birth_year_start: Number(draft.birth_year_start),
      birth_year_end: Number(draft.birth_year_end),
    };

    if (!payload.name || Object.values(payload).some((value) => value === '' || Number.isNaN(value))) {
      setErrorMessage('Completa todos los campos con valores válidos.');
      return;
    }
    if (payload.min_age > payload.max_age || payload.birth_year_start > payload.birth_year_end) {
      setErrorMessage('Revisa los límites: el mínimo no puede superar al máximo.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage('');
      setSuccessMessage('');
      if (editingId) {
        await UserService.updateAthleteCategory(editingId, payload);
      } else {
        await UserService.createAthleteCategory(payload);
      }
      setCategories(await fetchCategories());
      setSuccessMessage(editingId ? 'Categoría actualizada.' : 'Categoría creada.');
      closeForm();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`¿Eliminar la categoría «${category.name}»?`)) return;

    try {
      setDeletingId(category.id);
      setErrorMessage('');
      setSuccessMessage('');
      await UserService.deleteAthleteCategory(category.id);
      setCategories((current) => current.filter(({ id }) => id !== category.id));
      setSuccessMessage('Categoría eliminada.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="sport-category-admin">
      <header className="sport-category-header">
        <div className="sport-category-heading">
          <span className="sport-category-eyebrow">CONFIGURACIÓN DEPORTIVA</span>
          <h1>Categorías de atletas</h1>
          <p>La clasificación se determina por el año de nacimiento dentro del rango configurado.</p>
        </div>
        {canManage && (
          <button className="sport-category-primary" type="button" onClick={openCreateForm}>
            <Plus size={17} />
            Nueva categoría
          </button>
        )}
      </header>

      {successMessage && <div className="sport-category-notice" role="status">{successMessage}</div>}
      {errorMessage && <div className="sport-category-error" role="alert">{errorMessage}</div>}

      {isEditorOpen && canManage && (
        <form className="sport-category-editor" onSubmit={handleSave}>
          <div className="sport-category-editor-heading">
            <div>
              <h2>{editingId ? 'Editar categoría' : 'Nueva categoría'}</h2>
              <p>Configura el rango de edad y los años de nacimiento incluidos.</p>
            </div>
            <button className="sport-category-icon-button" type="button" onClick={closeForm} aria-label="Cerrar formulario">
              <X size={18} />
            </button>
          </div>

          <div className="sport-category-form-grid">
            <label className="sport-category-field sport-category-field-name">
              <span>Nombre</span>
              <input name="name" value={draft.name} onChange={handleChange} maxLength={80} required />
            </label>
            <label className="sport-category-field">
              <span>Edad mínima</span>
              <input name="min_age" type="number" min="0" value={draft.min_age} onChange={handleChange} required />
            </label>
            <label className="sport-category-field">
              <span>Edad máxima</span>
              <input name="max_age" type="number" min="0" value={draft.max_age} onChange={handleChange} required />
            </label>
            <label className="sport-category-field">
              <span>Año de nacimiento inicial</span>
              <input name="birth_year_start" type="number" min="1" value={draft.birth_year_start} onChange={handleChange} required />
            </label>
            <label className="sport-category-field">
              <span>Año de nacimiento final</span>
              <input name="birth_year_end" type="number" min="1" value={draft.birth_year_end} onChange={handleChange} required />
            </label>
          </div>

          <div className="sport-category-form-actions">
            <button className="sport-category-secondary" type="button" onClick={closeForm} disabled={isSaving}>
              Cancelar
            </button>
            <button className="sport-category-primary" type="submit" disabled={isSaving}>
              <Save size={16} />
              {isSaving ? 'Guardando…' : 'Guardar categoría'}
            </button>
          </div>
        </form>
      )}

      <section className="sport-category-table-section" aria-labelledby="sport-category-list-title">
        <div className="sport-category-section-heading">
          <div className="sport-category-section-icon"><CalendarRange size={19} /></div>
          <div>
            <h2 id="sport-category-list-title">Rangos configurados</h2>
            <span>{categories.length} {categories.length === 1 ? 'categoría' : 'categorías'}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="sport-category-state" role="status">Cargando categorías…</div>
        ) : categories.length === 0 ? (
          <div className="sport-category-state">
            {canManage ? 'Aún no hay categorías configuradas.' : 'No hay categorías disponibles.'}
          </div>
        ) : (
          <div className="sport-category-table-wrap">
            <table className="sport-category-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Rango de edad</th>
                  <th>Años de nacimiento</th>
                  {canManage && <th aria-label="Acciones" />}
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <th scope="row">{category.name}</th>
                    <td>{category.min_age}–{category.max_age} años</td>
                    <td>{category.birth_year_start}–{category.birth_year_end}</td>
                    {canManage && (
                      <td className="sport-category-row-actions">
                        <button
                          className="sport-category-icon-button"
                          type="button"
                          onClick={() => openEditForm(category)}
                          aria-label={`Editar ${category.name}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="sport-category-icon-button sport-category-delete"
                          type="button"
                          onClick={() => handleDelete(category)}
                          disabled={deletingId === category.id}
                          aria-label={`Eliminar ${category.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}