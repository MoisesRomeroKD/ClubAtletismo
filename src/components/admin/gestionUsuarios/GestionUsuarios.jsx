import { useEffect, useRef, useState } from 'react';
import './GestionUsuarios.css';

const mockData = {
  atletas: [
    {
      id: '28111222',
      nombre: 'Carlos Mendoza',
      area: 'Combate',
      subarea: 'Judo',
      categoria: 'Sub-20',
      entrenador: 'Luis Pérez',
      estado: 'Activo',
    },
    {
      id: '29333444',
      nombre: 'Ana Silva',
      area: 'Atletismo',
      subarea: '100m Planos',
      categoria: 'Senior',
      entrenador: 'Carmen Rosa',
      estado: 'Activo',
    },
    {
      id: '30555666',
      nombre: 'Miguel Torres',
      area: 'Pesas',
      subarea: 'Halterofilia',
      categoria: 'Sub-17',
      entrenador: 'Jorge Díaz',
      estado: 'Inactivo',
    },
  ],

  entrenadores: [
    {
      id: '15444333',
      nombre: 'Luis Pérez',
      area: 'Combate',
      subarea: 'Judo',
      atletasAsignados: 12,
      estado: 'Activo',
    },
    {
      id: '12999888',
      nombre: 'Carmen Rosa',
      area: 'Atletismo',
      subarea: 'Pista',
      atletasAsignados: 25,
      estado: 'Activo',
    },
  ],

  admin: [
    {
      id: '10111000',
      nombre: 'Dirección General',
      rol: 'Súper Admin',
      ultimoAcceso: 'Hace 2 horas',
      estado: 'Activo',
    },
    {
      id: '16777222',
      nombre: 'María González',
      rol: 'Coordinador Deportivo',
      ultimoAcceso: 'Ayer',
      estado: 'Activo',
    },
  ],
};

const profileTabs = {
  atletas: [
    'Información',
    'Asistencias',
    'Sueño',
    'Entrenamientos',
    'Antropometría',
  ],
  entrenadores: [
    'Información',
    'Subáreas',
    'Atletas',
    'Planes',
    'Permisos',
  ],
  admin: ['Información', 'Permisos'],
};

const permissions = {
  admin: [
    'Crear atletas',
    'Editar atletas',
    'Eliminar atletas',
    'Registrar asistencia',
    'Importar Excel',
    'Gestionar entrenadores',
    'Gestionar administradores',
  ],
  default: [
    'Registrar asistencia',
    'Crear entrenamientos',
    'Editar entrenamientos',
    'Evaluaciones',
    'Exportar Excel',
  ],
};

function Icon({ name, size = 16 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  switch (name) {
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );

    case 'download':
      return (
        <svg {...common}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="M7 10l5 5 5-5M12 15V3" />
        </svg>
      );

    case 'close':
      return (
        <svg {...common}>
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      );

    case 'eye':
      return (
        <svg {...common}>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );

    case 'edit':
      return (
        <svg {...common}>
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      );

    case 'trash':
      return (
        <svg {...common}>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );

    default:
      return null;
  }
}

function GestionUsuarios() {
  const [currentTab, setCurrentTab] = useState('atletas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const [profileUser, setProfileUser] = useState(null);
  const [activeProfileTab, setActiveProfileTab] = useState('Información');

  const [showExcelModal, setShowExcelModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    multiple: false,
    id: null,
  });

  const [panelTitle, setPanelTitle] = useState('');

  const data = mockData[currentTab];

  const filteredData = data.filter((user) =>
    user.id.includes(searchQuery)
  );

  const allSelected =
    filteredData.length > 0 &&
    filteredData.every((user) => selectedIds.includes(user.id));

  const singularEntity =
    currentTab === 'atletas'
      ? 'Atleta'
      : currentTab === 'entrenadores'
        ? 'Entrenador'
        : 'Usuario';

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    setSelectedIds([]);
    setSearchQuery('');
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(filteredData.map((user) => user.id));
    } else {
      setSelectedIds([]);
    }
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const openAddPanel = (title = null) => {
    setPanelTitle(title || `Agregar ${singularEntity}`);
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
  };

  const openProfile = (user) => {
    setProfileUser(user);
    setActiveProfileTab('Información');
  };

  const closeProfile = () => {
    setProfileUser(null);
  };

  const openDeleteModal = (id) => {
    setDeleteModal({
      open: true,
      multiple: false,
      id,
    });
  };

  const openMultipleDeleteModal = () => {
    setDeleteModal({
      open: true,
      multiple: true,
      id: null,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      open: false,
      multiple: false,
      id: null,
    });
  };

  const getSearchHint = () => {
    if (searchQuery.length === 0 || searchQuery.length <= 2) {
      return null;
    }

    if (searchQuery.length <= 4) {
      return {
        text: 'No se encontró en caché local. Escriba más dígitos para consultar el servidor.',
        className: 'warning',
      };
    }

    return {
      text: 'Buscando en servidor backend...',
      className: 'active',
    };
  };

  const searchHint = getSearchHint();

  return (
    <div className="gestionUsuarios">
      <header className="gu-moduleHeader">
        <div>
          <h1 className="gu-moduleTitle">Gestión de Usuarios</h1>

          <div className="gu-tabGroup">
            <button
              type="button"
              className={`gu-tab ${
                currentTab === 'atletas' ? 'active' : ''
              }`}
              onClick={() => handleTabChange('atletas')}
            >
              Atletas
            </button>

            <button
              type="button"
              className={`gu-tab ${
                currentTab === 'entrenadores' ? 'active' : ''
              }`}
              onClick={() => handleTabChange('entrenadores')}
            >
              Entrenadores
            </button>

            <button
              type="button"
              className={`gu-tab ${
                currentTab === 'admin' ? 'active' : ''
              }`}
              onClick={() => handleTabChange('admin')}
            >
              Administración
            </button>
          </div>
        </div>
      </header>

      <div className="gu-topBar">
        <div className="gu-topBarLeft">
          <div className="gu-inputGroup">
            <input
              type="text"
              className="gu-input gu-searchInput"
              placeholder="Buscar por cédula..."
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value.replace(/\D/g, ''))
              }
            />

            {searchHint && (
              <div className={`gu-searchHint ${searchHint.className}`}>
                {searchHint.text}
              </div>
            )}
          </div>

          <div className="gu-filtersGroup">
            {currentTab === 'atletas' && (
              <>
                <FilterSelect label="Área" />
                <FilterSelect label="Subárea" />
                <FilterSelect label="Categoría" />
                <FilterSelect label="Entrenador" />
              </>
            )}

            {currentTab === 'entrenadores' && (
              <>
                <FilterSelect label="Área" />
                <FilterSelect label="Subárea" />
              </>
            )}
          </div>
        </div>

        <div className="gu-topBarRight">
          <select className="gu-input gu-select gu-orderSelect">
            <option>Ordenar por</option>
            <option>Nombre</option>
            <option>Cédula</option>
            <option>Estado</option>
          </select>

          <button
            type="button"
            className="gu-btn gu-btnSecondary"
            onClick={() => setShowExcelModal(true)}
          >
            <Icon name="download" />
            Importar Excel
          </button>

          <button
            type="button"
            className="gu-btn gu-btnPrimary"
            onClick={() => openAddPanel()}
          >
            <Icon name="plus" />
            Agregar
          </button>
        </div>
      </div>

      <div
        className={`gu-workspace ${
          isPanelOpen ? 'panel-open' : ''
        }`}
      >
        <main className="gu-mainContent">
          <SelectionToolbar
            count={selectedIds.length}
            onClear={clearSelection}
            onDelete={openMultipleDeleteModal}
          />

          <div className="gu-tableContainer">
            <table className="gu-table">
              <thead>
                <tr>
                  <th className="gu-checkboxColumn">
                    <input
                      type="checkbox"
                      className="gu-checkbox"
                      checked={allSelected}
                      onChange={(e) =>
                        toggleSelectAll(e.target.checked)
                      }
                    />
                  </th>

                  <th>Cédula</th>
                  <th>Nombre</th>

                  {currentTab === 'atletas' && (
                    <>
                      <th>Área/Subárea</th>
                      <th>Categoría</th>
                      <th>Entrenador</th>
                    </>
                  )}

                  {currentTab === 'entrenadores' && (
                    <>
                      <th>Área/Subárea</th>
                      <th>Atletas Asign.</th>
                    </>
                  )}

                  {currentTab === 'admin' && (
                    <>
                      <th>Rol</th>
                      <th>Último Acceso</th>
                    </>
                  )}

                  <th>Estado</th>
                  <th className="gu-actionsHeader">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      currentTab={currentTab}
                      selected={selectedIds.includes(user.id)}
                      onSelect={() => toggleSelect(user.id)}
                      onProfile={() => openProfile(user)}
                      onEdit={() =>
                        openAddPanel(
                          `Editar ${
                            currentTab === 'atletas'
                              ? 'Atleta'
                              : 'Usuario'
                          }`
                        )
                      }
                      onDelete={() => openDeleteModal(user.id)}
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={10}
                      className="gu-emptyState"
                    >
                      No se encontraron usuarios.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination total={156} />
        </main>

        <aside className="gu-sidePanel">
          <div className="gu-sidePanelHeader">
            <div className="gu-sidePanelTitle">
              {panelTitle}
            </div>

            <button
              type="button"
              className="gu-actionBtn"
              onClick={closePanel}
              aria-label="Cerrar"
            >
              <Icon name="close" size={20} />
            </button>
          </div>

          <div className="gu-sidePanelBody">
            <div className="gu-formRow">
              <FormField
                label="Cédula"
                placeholder="Ej. 25000123"
              />
            </div>

            <FormField
              label="Nombres y Apellidos"
              placeholder="Nombre completo"
            />

            <div className="gu-formRow">
              <FormSelect
                label="Área"
                options={['Combate', 'Atletismo']}
              />

              <FormSelect
                label="Subárea"
                options={['Judo', 'Karate']}
              />
            </div>

            <FormField
              label="Correo Electrónico"
              type="email"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="gu-sidePanelFooter">
            <button
              type="button"
              className="gu-btn gu-btnGhost"
              onClick={closePanel}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="gu-btn gu-btnPrimary"
              onClick={closePanel}
            >
              Guardar
            </button>
          </div>
        </aside>
      </div>

      {profileUser && (
        <ProfileModal
          user={profileUser}
          currentTab={currentTab}
          activeTab={activeProfileTab}
          setActiveTab={setActiveProfileTab}
          onClose={closeProfile}
        />
      )}

      {showExcelModal && (
        <ExcelModal onClose={() => setShowExcelModal(false)} />
      )}

      {deleteModal.open && (
        <DeleteModal
          multiple={deleteModal.multiple}
          id={deleteModal.id}
          count={selectedIds.length}
          onClose={closeDeleteModal}
        />
      )}
    </div>
  );
}

function FilterSelect({ label }) {
  return (
    <select className="gu-input gu-select gu-filterSelect">
      <option>{label}</option>
    </select>
  );
}

function FormField({
  label,
  placeholder,
  type = 'text',
}) {
  return (
    <div className="gu-inputGroup">
      <label className="gu-formLabel">{label}</label>

      <input
        type={type}
        className="gu-input"
        placeholder={placeholder}
      />
    </div>
  );
}

function FormSelect({ label, options }) {
  return (
    <div className="gu-inputGroup">
      <label className="gu-formLabel">{label}</label>

      <select className="gu-input gu-select">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function SelectionToolbar({
  count,
  onClear,
  onDelete,
}) {
  return (
    <div
      className={`gu-selectionToolbar ${
        count > 0 ? 'active' : ''
      }`}
    >
      <span>
        {count} usuario{count !== 1 ? 's' : ''}{' '}
        seleccionado{count !== 1 ? 's' : ''}
      </span>

      <div className="gu-selectionActions">
        <button
          type="button"
          className="gu-btn gu-btnGhost gu-accentButton"
          onClick={onClear}
        >
          Cancelar
        </button>

        <button
          type="button"
          className="gu-btn gu-btnSecondary"
        >
          Activar
        </button>

        <button
          type="button"
          className="gu-btn gu-btnSecondary"
        >
          Desactivar
        </button>

        <button
          type="button"
          className="gu-btn gu-btnDanger"
          onClick={onDelete}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

function UserRow({
  user,
  currentTab,
  selected,
  onSelect,
  onProfile,
  onEdit,
  onDelete,
}) {
  return (
    <tr className={selected ? 'selected' : ''}>
      <td>
        <input
          type="checkbox"
          className="gu-checkbox"
          checked={selected}
          onChange={onSelect}
        />
      </td>

      <td className="gu-mutedText">{user.id}</td>

      <td>
        <div className="gu-avatarCell">
          <div className="gu-avatar">
            {user.nombre.charAt(0)}
          </div>

          {user.nombre}
        </div>
      </td>

      {currentTab === 'atletas' && (
        <>
          <td>
            <div className="gu-primaryData">
              {user.area}
            </div>

            <div className="gu-secondaryData">
              {user.subarea}
            </div>
          </td>

          <td>{user.categoria}</td>
          <td>{user.entrenador}</td>
        </>
      )}

      {currentTab === 'entrenadores' && (
        <>
          <td>
            <div className="gu-primaryData">
              {user.area}
            </div>

            <div className="gu-secondaryData">
              {user.subarea}
            </div>
          </td>

          <td>{user.atletasAsignados}</td>
        </>
      )}

      {currentTab === 'admin' && (
        <>
          <td>{user.rol}</td>

          <td>
            <span className="gu-mutedText">
              {user.ultimoAcceso}
            </span>
          </td>
        </>
      )}

      <td>
        <span
          className={`gu-badge ${
            user.estado === 'Activo'
              ? 'gu-badgeActive'
              : 'gu-badgeInactive'
          }`}
        >
          {user.estado}
        </span>
      </td>

      <td>
        <div className="gu-tableActions">
          <button
            type="button"
            className="gu-actionBtn"
            title="Ver Perfil"
            onClick={onProfile}
          >
            <Icon name="eye" />
          </button>

          <button
            type="button"
            className="gu-actionBtn"
            title="Editar"
            onClick={onEdit}
          >
            <Icon name="edit" />
          </button>

          <button
            type="button"
            className="gu-actionBtn delete"
            title="Eliminar"
            onClick={onDelete}
          >
            <Icon name="trash" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function Pagination({ total }) {
  return (
    <div className="gu-pagination">
      <div className="gu-paginationInfo">
        Mostrando 1-10 de {total} usuarios.
      </div>

      <div className="gu-paginationLinks">
        <button
          type="button"
          className="gu-pageBtn"
          disabled
        >
          Anterior
        </button>

        <button
          type="button"
          className="gu-pageBtn active"
        >
          1
        </button>

        <button type="button" className="gu-pageBtn">
          2
        </button>

        <button type="button" className="gu-pageBtn">
          3
        </button>

        <span className="gu-paginationDots">...</span>

        <button type="button" className="gu-pageBtn">
          Siguiente
        </button>
      </div>
    </div>
  );
}

function ProfileModal({
  user,
  currentTab,
  activeTab,
  setActiveTab,
  onClose,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (
      currentTab === 'atletas' &&
      activeTab === 'Antropometría'
    ) {
      drawRadarChart(canvasRef.current);
    }
  }, [currentTab, activeTab]);

  return (
    <div className="gu-overlay active">
      <div className="gu-modal">
        <div className="gu-modalTopbar">
          <div className="gu-modalLabel">
            Perfil de Usuario
          </div>

          <button
            type="button"
            className="gu-actionBtn"
            onClick={onClose}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="gu-profileLayout">
          <div className="gu-profileSidebar">
            {profileTabs[currentTab].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`gu-profileTab ${
                  activeTab === tab ? 'active' : ''
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="gu-profileContent">
            <div className="gu-profileHeader">
              <div className="gu-avatar gu-profileAvatar">
                {user.nombre.charAt(0)}
              </div>

              <div>
                <h2>{user.nombre}</h2>

                <p>
                  C.I: {user.id} • Estado:{' '}
                  <span className="gu-successText">
                    {user.estado}
                  </span>
                </p>
              </div>
            </div>

            {activeTab === 'Información' && (
              <ProfileInformation
                user={user}
                currentTab={currentTab}
              />
            )}

            {activeTab === 'Antropometría' &&
              currentTab === 'atletas' && (
                <Anthropometry canvasRef={canvasRef} />
              )}

            {activeTab === 'Permisos' && (
              <Permissions currentTab={currentTab} />
            )}

            {![
              'Información',
              'Antropometría',
              'Permisos',
            ].includes(activeTab) && (
              <div className="gu-unavailable">
                <p>
                  Datos de {activeTab} no disponibles en
                  mock.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileInformation({ user, currentTab }) {
  if (currentTab !== 'atletas') {
    return (
      <p className="gu-mutedParagraph">
        Vista de información general configurada.
      </p>
    );
  }

  return (
    <div className="gu-profileGrid">
      <DataPoint label="Área" value={user.area} />
      <DataPoint
        label="Subárea"
        value={user.subarea}
      />
      <DataPoint
        label="Categoría"
        value={user.categoria}
      />
      <DataPoint
        label="Entrenador"
        value={user.entrenador}
      />
      <DataPoint label="Sexo" value="Masculino" />
      <DataPoint
        label="Edad"
        value="18 años (12/05/2008)"
      />
    </div>
  );
}

function DataPoint({ label, value }) {
  return (
    <div className="gu-dataPoint">
      <label>{label}</label>
      <span>{value}</span>
    </div>
  );
}

function Anthropometry({ canvasRef }) {
  return (
    <>
      <h3 className="gu-sectionTitle">
        Evaluación Morfofuncional
      </h3>

      <div className="gu-radarContainer">
        <canvas
          ref={canvasRef}
          width="250"
          height="250"
        />

        <div className="gu-radarIndicators">
          <DataPoint label="Peso" value="72.5 kg" />
          <DataPoint label="Estatura" value="1.78 m" />
          <DataPoint
            label="Envergadura"
            value="1.82 m"
          />
          <DataPoint
            label="Grasa Corporal"
            value="12%"
          />
          <DataPoint
            label="Masa Muscular"
            value="45%"
          />
        </div>
      </div>
    </>
  );
}

function Permissions({ currentTab }) {
  const list =
    currentTab === 'admin'
      ? permissions.admin
      : permissions.default;

  return (
    <div className="gu-permissionList">
      {list.map((permission) => (
        <div
          className="gu-permissionItem"
          key={permission}
        >
          <div className="gu-permissionInfo">
            <h4>{permission}</h4>

            <p>
              Permite al usuario realizar esta acción
              en el sistema.
            </p>
          </div>

          <label className="gu-switch">
            <input
              type="checkbox"
              defaultChecked
            />

            <span className="gu-slider" />
          </label>
        </div>
      ))}
    </div>
  );
}

function ExcelModal({ onClose }) {
  return (
    <div className="gu-overlay active">
      <div className="gu-modal gu-modalSmall">
        <div className="gu-sidePanelHeader">
          <div className="gu-sidePanelTitle">
            Importar Excel
          </div>

          <button
            type="button"
            className="gu-actionBtn"
            onClick={onClose}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="gu-sidePanelBody">
          <p className="gu-modalDescription">
            Se encontraron errores de validación en el
            archivo subido. Corríjalos para continuar.
          </p>

          <div className="gu-validationList">
            <ValidationItem
              row="Fila 3"
              children={
                <>
                  La cédula <strong>25999888</strong> ya
                  existe en el sistema.
                </>
              }
            />

            <ValidationItem
              row="Fila 7"
              children={
                <>
                  La subárea <strong>"Piscina"</strong> no
                  es válida para "Combate".
                </>
              }
            />

            <ValidationItem
              row="Fila 10"
              children={
                <>Categoría inexistente.</>
              }
            />
          </div>
        </div>

        <div className="gu-sidePanelFooter">
          <button
            type="button"
            className="gu-btn gu-btnSecondary"
            onClick={onClose}
          >
            Reemplazar Archivo
          </button>

          <button
            type="button"
            className="gu-btn gu-btnPrimary"
            disabled
          >
            Guardar Válidos
          </button>
        </div>
      </div>
    </div>
  );
}

function ValidationItem({ row, children }) {
  return (
    <div className="gu-validationItem">
      <span className="gu-rowTag">{row}</span>
      <span>{children}</span>
    </div>
  );
}

function DeleteModal({
  multiple,
  id,
  count,
  onClose,
}) {
  return (
    <div className="gu-overlay active">
      <div className="gu-modal gu-modalSmall gu-deleteModal">
        <h3>Confirmar eliminación</h3>

        <p>
          {multiple ? (
            <>
              ¿Estás seguro de que deseas eliminar a{' '}
              <strong>
                los {count} usuarios seleccionados
              </strong>
              ? Esta acción no se puede deshacer.
            </>
          ) : (
            <>
              ¿Estás seguro de que deseas eliminar al
              usuario con Cédula{' '}
              <strong>{id}</strong>? Esta acción no se
              puede deshacer.
            </>
          )}
        </p>

        <div className="gu-deleteActions">
          <button
            type="button"
            className="gu-btn gu-btnSecondary"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="gu-btn gu-btnDanger"
            onClick={onClose}
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

function drawRadarChart(canvas) {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  const cw = canvas.width;
  const ch = canvas.height;

  const cx = cw / 2;
  const cy = ch / 2;

  const radius = 90;
  const sides = 6;

  ctx.clearRect(0, 0, cw, ch);

  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;

  for (let step = 1; step <= 4; step += 1) {
    ctx.beginPath();

    for (let i = 0; i <= sides; i += 1) {
      const angle =
        (Math.PI * 2 * i) / sides - Math.PI / 2;

      const r = radius * (step / 4);

      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }

  const labels = [
    'Fuerza',
    'Velocidad',
    'Resist.',
    'Flexib.',
    'Potencia',
    'Agilidad',
  ];

  ctx.fillStyle = '#6b7280';
  ctx.font = '10px Inter';
  ctx.textAlign = 'center';

  for (let i = 0; i < sides; i += 1) {
    const angle =
      (Math.PI * 2 * i) / sides - Math.PI / 2;

    ctx.beginPath();
    ctx.moveTo(cx, cy);

    ctx.lineTo(
      cx + radius * Math.cos(angle),
      cy + radius * Math.sin(angle)
    );

    ctx.stroke();

    const labelX =
      cx + (radius + 15) * Math.cos(angle);

    const labelY =
      cy + (radius + 15) * Math.sin(angle);

    ctx.fillText(labels[i], labelX, labelY + 3);
  }

  const dataValues = [
    0.8,
    0.9,
    0.6,
    0.5,
    0.85,
    0.7,
  ];

  ctx.beginPath();

  for (let i = 0; i <= sides; i += 1) {
    const index = i === sides ? 0 : i;

    const angle =
      (Math.PI * 2 * index) / sides - Math.PI / 2;

    const r = radius * dataValues[index];

    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.fillStyle = 'rgba(37, 99, 235, 0.2)';
  ctx.fill();

  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2;
  ctx.stroke();

  for (let i = 0; i < sides; i += 1) {
    const angle =
      (Math.PI * 2 * i) / sides - Math.PI / 2;

    const r = radius * dataValues[i];

    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);

    ctx.fillStyle = '#2563eb';
    ctx.fill();

    ctx.strokeStyle = '#fff';
    ctx.stroke();
  }
}

export default GestionUsuarios;