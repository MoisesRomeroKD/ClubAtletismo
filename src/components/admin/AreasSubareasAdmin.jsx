import { useEffect, useState } from 'react';
import {
  Ban,
  ChevronDown,
  Footprints,
  Grid2X2,
  Mountain,
  Pencil,
  Plus,
  Target,
  X,
  Zap,
} from 'lucide-react';
import UserService from '../../api/services/Userservice';
import { useApplicationPermissions } from '../../context/ApplicationPermissionsContext';
import '../../styles/components/admin/AreasSubareasAdmin.css';

const asList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  return [];
};

const getAreaIcon = (areaName = '') => {
  const name = areaName.toLowerCase();
  if (name.includes('veloc')) return Zap;
  if (name.includes('salto')) return Mountain;
  if (name.includes('lanz')) return Target;
  if (name.includes('fondo')) return Footprints;
  return Grid2X2;
};

const getRequestError = (requestError, fallback) => {
  const data = requestError.response?.data;
  if (typeof data === 'string') return data;
  if (data?.detail) return data.detail;
  if (data && typeof data === 'object') {
    return Object.entries(data)
      .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(' ') : messages}`)
      .join(' ');
  }
  return fallback;
};

export default function AreasSubareasAdmin() {
  const { hasPermission } = useApplicationPermissions();
  const [areas, setAreas] = useState([]);
  const [subareas, setSubareas] = useState([]);
  const [expandedAreaId, setExpandedAreaId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeForm, setActiveForm] = useState(null);
  const [formName, setFormName] = useState('');
  const [formAreaId, setFormAreaId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const canAddArea = hasPermission('add_area');
  const canAddSubarea = hasPermission('add_subarea');

  useEffect(() => {
    let isMounted = true;

    const loadCatalogs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [areasResponse, subareasResponse] = await Promise.all([
          UserService.getAreas(),
          UserService.getSubareas(),
        ]);

        if (isMounted) {
          setAreas(asList(areasResponse));
          setSubareas(asList(subareasResponse));
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError.response?.data?.detail ||
              'No se pudieron cargar las áreas y subáreas.'
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCatalogs();
    return () => {
      isMounted = false;
    };
  }, []);

  const openAreaForm = () => {
    setActiveForm('area');
    setFormName('');
    setFormAreaId('');
    setFormError(null);
    setSuccessMessage(null);
  };

  const openSubareaForm = (areaId) => {
    setActiveForm('subarea');
    setFormName('');
    setFormAreaId(String(areaId));
    setFormError(null);
    setSuccessMessage(null);
  };

  const closeForm = () => {
    if (isSaving) return;
    setActiveForm(null);
    setFormError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nombre = formName.trim();
    if (!nombre) {
      setFormError('Introduce el nombre para continuar.');
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      if (activeForm === 'area') {
        const createdArea = await UserService.createArea({ nombre });
        setAreas((currentAreas) =>
          [...currentAreas, createdArea].sort((left, right) =>
            left.nombre.localeCompare(right.nombre, 'es', { sensitivity: 'base' })
          )
        );
        setSuccessMessage('Área creada correctamente.');
      } else {
        const areaId = Number(formAreaId);
        const createdSubarea = await UserService.createSubarea({
          nombre,
          area_id: areaId,
        });
        setSubareas((currentSubareas) =>
          [...currentSubareas, createdSubarea].sort((left, right) =>
            left.nombre.localeCompare(right.nombre, 'es', { sensitivity: 'base' })
          )
        );
        setExpandedAreaId(areaId);
        setSuccessMessage('Subárea creada correctamente.');
      }
      setActiveForm(null);
      setFormName('');
      setFormAreaId('');
    } catch (requestError) {
      setFormError(
        getRequestError(requestError, 'No se pudo guardar. Inténtalo de nuevo.')
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="area-admin-state" role="status">
        Cargando áreas y subáreas...
      </div>
    );
  }

  if (error) {
    return (
      <div className="area-admin-state area-admin-error" role="alert">
        {error}
      </div>
    );
  }

  return (
    <>
      <main className="area-admin">
      <div className="area-admin-content">
        <header className="area-admin-header">
          <div>
            <h1>Gestión de Áreas y Subáreas</h1>
            <p>
              Organiza la estructura de disciplinas y especialidades atléticas.
            </p>
          </div>
          {canAddArea && (
            <button
              className="area-admin-primary-action"
              onClick={openAreaForm}
              type="button"
            >
              <Plus aria-hidden="true" size={18} />
              Agregar Área
            </button>
          )}
        </header>

        {successMessage && (
          <div className="area-admin-success" role="status">
            {successMessage}
          </div>
        )}

        <div className="area-admin-accordion">
          {areas.length === 0 ? (
            <div className="area-admin-state">No hay áreas registradas.</div>
          ) : areas.map((area) => {
            const relatedSubareas = subareas.filter(
              (subarea) => subarea.area?.id === area.id
            );
            const isExpanded = expandedAreaId === area.id;
            const AreaIcon = getAreaIcon(area.nombre);
            const panelId = `area-subareas-${area.id}`;

            return (
              <section className="area-admin-item" key={area.id}>
                <button
                  aria-controls={panelId}
                  aria-expanded={isExpanded}
                  className="area-admin-trigger"
                  onClick={() => setExpandedAreaId(isExpanded ? null : area.id)}
                  type="button"
                >
                  <span className="area-admin-title-group">
                    <span className="area-admin-area-icon">
                      <AreaIcon aria-hidden="true" size={21} />
                    </span>
                    <span className="area-admin-title-copy">
                      <span className="area-admin-name">{area.nombre}</span>
                      <span className="area-admin-count">
                        {relatedSubareas.length}{' '}
                        {relatedSubareas.length === 1
                          ? 'subárea configurada'
                          : 'subáreas configuradas'}
                      </span>
                    </span>
                  </span>
                  <span className="area-admin-trigger-end">
                    <span className="area-admin-count-badge">
                      {relatedSubareas.length}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={`area-admin-chevron${isExpanded ? ' is-expanded' : ''}`}
                      size={20}
                    />
                  </span>
                </button>

                <div
                  className={`area-admin-panel${isExpanded ? ' is-expanded' : ''}`}
                  id={panelId}
                  aria-hidden={!isExpanded}
                >
                  <div className="area-admin-panel-inner">
                    {relatedSubareas.length > 0 ? (
                      <ul className="area-admin-subarea-list">
                        {relatedSubareas.map((subarea) => (
                          <li className="area-admin-subarea" key={subarea.id}>
                            <span className="area-admin-subarea-name">
                              <span className="area-admin-subarea-dot" />
                              {subarea.nombre}
                            </span>
                            <span className="area-admin-subarea-actions">
                              <button
                                aria-label={`Editar ${subarea.nombre}`}
                                className="area-admin-icon-action"
                                disabled
                                title="Editar"
                                type="button"
                              >
                                <Pencil aria-hidden="true" size={17} />
                              </button>
                              <button
                                aria-label={`Inhabilitar ${subarea.nombre}`}
                                className="area-admin-icon-action is-danger"
                                disabled
                                title="Inhabilitar"
                                type="button"
                              >
                                <Ban aria-hidden="true" size={17} />
                              </button>
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="area-admin-empty-subareas">
                        No hay subáreas registradas para esta área.
                      </p>
                    )}

                    {canAddSubarea && (
                      <button
                        className="area-admin-add-subarea"
                        onClick={() => openSubareaForm(area.id)}
                        type="button"
                      >
                        <Plus aria-hidden="true" size={16} />
                        Agregar Subárea
                      </button>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
      </main>

      {activeForm && (
        <div className="area-admin-modal-backdrop">
          <section
            aria-labelledby="area-admin-modal-title"
            aria-modal="true"
            className="area-admin-modal"
            role="dialog"
          >
            <header className="area-admin-modal-header">
              <h2 id="area-admin-modal-title">
                {activeForm === 'area' ? 'Agregar Área' : 'Agregar Subárea'}
              </h2>
              <button
                aria-label="Cerrar formulario"
                className="area-admin-modal-close"
                disabled={isSaving}
                onClick={closeForm}
                type="button"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </header>

            <form onSubmit={handleSubmit}>
              <div className="area-admin-modal-body">
                {activeForm === 'subarea' && (
                  <label className="area-admin-field">
                    <span>Área</span>
                    <select
                      onChange={(event) => setFormAreaId(event.target.value)}
                      required
                      value={formAreaId}
                    >
                      <option value="">Selecciona un área</option>
                      {areas.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="area-admin-field">
                  <span>Nombre</span>
                  <input
                    autoFocus
                    maxLength={100}
                    onChange={(event) => setFormName(event.target.value)}
                    required
                    value={formName}
                  />
                </label>
                {formError && (
                  <div className="area-admin-form-error" role="alert">
                    {formError}
                  </div>
                )}
              </div>
              <footer className="area-admin-modal-footer">
                <button
                  className="area-admin-secondary-action"
                  disabled={isSaving}
                  onClick={closeForm}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="area-admin-primary-action"
                  disabled={isSaving}
                  type="submit"
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </>
  );
}