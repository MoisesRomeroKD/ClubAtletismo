import React, { useState, useRef } from 'react';
import podApi from '../../api/podApi';
import '../../styles/components/admin/Preregistro.css';

const Preregistro = () => {
  // Estado para el rol seleccionado (null = mostrar selector de rol)
  const [selectedRole, setSelectedRole] = useState(null);

  // Estado para el formulario individual
  const [formData, setFormData] = useState({
    cedula: '',
    rol: 'Atleta',
    nombres: '',
    apellidos: '',
    fechaNacimiento: '',
    correo: '',
    telefono: '',
    representante_nombres: '',
    representante_apellidos: '',
    representante_cedula: '',
    representante_telefono: '',
    representante_relacion: 'Madre'
  });

  const [individualStep, setIndividualStep] = useState(1);
  const [mode, setMode] = useState('individual');

  // Estados para la Carga Masiva
  const [file, setFile] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Descarga de la plantilla Excel (.xlsx) nativa
  const handleDownloadTemplate = () => {
    try {
      if (!window.XLSX) {
        alert("Cargando motor de Excel, por favor intenta de nuevo en un segundo...");
        return;
      }

      const data = [
        {
          representante_nombres: "Ana Maria",
          representante_apellidos: "Perez Lopez",
          representante_cedula: "V1234567",
          representante_telefono: "04141234567",
          representante_relacion: "Madre",
          cedula: "V12345678", rol: "Atleta", nombres: "Juan Jose", apellidos: "Perez Rodriguez", fecha_nacimiento: "2005-05-15", correo: "juan.perez@email.com", telefono: "", categoria: ""
        },
        {
          representante_nombres: "Ana Maria", representante_apellidos: "Perez Lopez", representante_cedula: "V1234567", representante_telefono: "04141234567", representante_relacion: "Madre",
          cedula: "V87654321", rol: "Atleta", nombres: "Maria Fernanda", apellidos: "Gomez Silva", fecha_nacimiento: "2008-08-20", correo: "maria.gomez@email.com", telefono: "", categoria: ""
        }
      ];

      const worksheet = window.XLSX.utils.json_to_sheet(data);
      worksheet['!cols'] = [
        { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 20 },
        { wch: 16 }, { wch: 25 }, { wch: 15 }, { wch: 14 }
      ];

      const workbook = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla_Preregistro");
      window.XLSX.writeFile(workbook, "Plantilla_Parametrizada_Preregistro.xlsx");
    } catch (error) {
      console.error("Error al generar Excel:", error);
      alert("Error al descargar la plantilla.");
    }
  };

  // Guardar registro individual
  const handleSubmitIndividual = async (e) => {
    e.preventDefault();
    try {
      const response = await podApi.post('/v1/users/preregistro/crear/', {
        ...formData,
        rol: selectedRole || 'Atleta',
        fecha_nacimiento: formData.fechaNacimiento,
      });
      if (response.data?.status === 'success') {
        alert("¡Preregistro individual creado exitosamente!");
        setFormData({ cedula: '', rol: 'Atleta', nombres: '', apellidos: '', fechaNacimiento: '', correo: '', telefono: '', representante_nombres: '', representante_apellidos: '', representante_cedula: '', representante_telefono: '', representante_relacion: 'Madre' });
        setIndividualStep(1);
        setSelectedRole(null);
      }
    } catch (error) {
      console.error("Error en preregistro:", error);
      alert(error.response?.data?.message || "Ocurrió un error al guardar el preregistro.");
    }
  };

  const handleContinueToAthlete = () => {
    const requiredRepresentativeFields = ['representante_nombres', 'representante_apellidos', 'representante_cedula', 'representante_telefono', 'representante_relacion'];
    if (requiredRepresentativeFields.some((field) => !formData[field].trim())) {
      alert('Completa todos los datos del representante para continuar.');
      return;
    }
    setIndividualStep(2);
  };

  // Manejo de selección de archivo
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setValidationResult(null); // Limpiar validaciones previas
    }
  };

  // PASO 1: Validar/Auditar el archivo Excel en el Backend sin guardar
  const handleValidateExcel = async () => {
    if (!file) {
      alert("Por favor selecciona un archivo Excel (.xlsx, .xls o .csv) primero.");
      return;
    }

    const uploadData = new FormData();
    uploadData.append('archivo_excel', file);

    try {
      setIsValidating(true);
      const response = await podApi.post('/v1/users/preregistro/validar-excel/', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data?.status === 'success') {
        setValidationResult(response.data);
      }
    } catch (error) {
      console.error("Error al validar el archivo:", error);
      alert(error.response?.data?.message || "Error al auditar el archivo Excel.");
    } finally {
      setIsValidating(false);
    }
  };

  // PASO 2: Confirmar y realizar la Carga Masiva en la BD
  const handleConfirmCargaMasiva = async () => {
    if (!validationResult || !validationResult.registros_validos || validationResult.registros_validos.length === 0) {
      alert("No hay registros válidos para importar.");
      return;
    }

    try {
      setIsUploading(true);
      const response = await podApi.post('/v1/users/preregistro/carga-masiva/', {
        registros: validationResult.registros_validos
      });

      if (response.data?.status === 'success') {
        alert(`¡Carga masiva completada exitosamente! Se procesaron ${response.data.procesados} usuarios.`);
        setFile(null);
        setValidationResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Error al ejecutar carga masiva:", error);
      alert(error.response?.data?.message || "Error al realizar la carga masiva en el servidor.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    // Resetear modo a individual cuando se selecciona Atleta
    if (role === 'Atleta') {
      setMode('individual');
      setIndividualStep(1);
    }
  };

  const handleBackToRoles = () => {
    setSelectedRole(null);
    setMode('individual');
    setIndividualStep(1);
  };

  return (
    <div className="preregistro-page">

      {/* SELECTOR DE ROL - Solo muestra si no hay rol seleccionado */}
      {!selectedRole && (
        <div className="preregistro-role-selector">
          <h2 className="preregistro-role-selector-title">Selecciona el tipo de usuario</h2>
          <div className="preregistro-role-cards">
            <button
              type="button"
              className="preregistro-role-card"
              onClick={() => handleRoleSelect('Atleta')}
            >
              <div className="preregistro-role-icon">🏃</div>
              <div className="preregistro-role-info">
                <h3>Atleta</h3>
                <p>Registro individual o carga masiva</p>
              </div>
            </button>

            <button
              type="button"
              className="preregistro-role-card"
              onClick={() => handleRoleSelect('Entrenador')}
            >
              <div className="preregistro-role-icon">🏋️</div>
              <div className="preregistro-role-info">
                <h3>Entrenador</h3>
                <p>Cuerpo técnico</p>
              </div>
            </button>

            <button
              type="button"
              className="preregistro-role-card"
              onClick={() => handleRoleSelect('Administrador')}
            >
              <div className="preregistro-role-icon">🔑</div>
              <div className="preregistro-role-info">
                <h3>Administrador</h3>
                <p>Personal administrativo</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* HEADER CON BOTÓN VOLVER - Solo muestra si hay rol seleccionado */}
      {selectedRole && (
        <div className="preregistro-selected-role-header">
          <button
            type="button"
            className="preregistro-back-button"
            onClick={handleBackToRoles}
          >
            ← Volver a selección de rol
          </button>
          <h2>Preregistro de {selectedRole}</h2>
        </div>
      )}

      {/* TOGGLE INDIVIDUAL/MASIVO - Solo para Atleta */}
      {selectedRole === 'Atleta' && (
        <div className="preregistro-mode-toggle" role="tablist" aria-label="Modalidad de preregistro">
          <button type="button" className={mode === 'individual' ? 'active' : ''} onClick={() => setMode('individual')}>
            Individual
          </button>
          <button type="button" className={mode === 'masivo' ? 'active' : ''} onClick={() => setMode('masivo')}>
            Masivo
          </button>
        </div>
      )}

      {/* BLOQUE 1: REGISTRO INDIVIDUAL - Solo para Atleta */}
      {selectedRole === 'Atleta' && mode === 'individual' && <div className="preregistro-card">
        <h3 className="preregistro-card-titulo">
          📝 Preregistro individual <span className="preregistro-step-label">{individualStep}/2</span>
        </h3>

        <div className="preregistro-progress" aria-label={`Paso ${individualStep} de 2`}>
          <span className={individualStep === 1 ? 'active' : ''}>1/2 Representante</span>
          <span className={individualStep === 2 ? 'active' : ''}>2/2 Atleta</span>
        </div>

        <form onSubmit={handleSubmitIndividual} className="preregistro-form">
          {individualStep === 1 && <>
          <div className="preregistro-field">
            <label htmlFor="representante_nombres">Nombres del representante</label>
            <input id="representante_nombres" type="text" name="representante_nombres" value={formData.representante_nombres} onChange={handleInputChange} required />
          </div>
          <div className="preregistro-field">
            <label htmlFor="representante_apellidos">Apellidos del representante</label>
            <input id="representante_apellidos" type="text" name="representante_apellidos" value={formData.representante_apellidos} onChange={handleInputChange} required />
          </div>
          <div className="preregistro-field">
            <label htmlFor="representante_cedula">Cédula del representante</label>
            <input id="representante_cedula" type="text" name="representante_cedula" value={formData.representante_cedula} onChange={handleInputChange} required />
          </div>
          <div className="preregistro-field">
            <label htmlFor="representante_telefono">Teléfono del representante</label>
            <input id="representante_telefono" type="tel" name="representante_telefono" value={formData.representante_telefono} onChange={handleInputChange} required />
          </div>
          <div className="preregistro-field">
            <label htmlFor="representante_relacion">Relación con el atleta</label>
            <select id="representante_relacion" name="representante_relacion" value={formData.representante_relacion} onChange={handleInputChange} required>
              <option value="Madre">Madre</option>
              <option value="Padre">Padre</option>
              <option value="Tutor Legal">Tutor Legal</option>
              <option value="Abuelo/a">Abuelo/a</option>
              <option value="Hermano/a">Hermano/a</option>
              <option value="Otro">Otro / Responsable</option>
            </select>
          </div>
          <div className="preregistro-form-actions">
            <button type="button" className="preregistro-submit-button" onClick={handleContinueToAthlete}>Continuar al atleta</button>
          </div>
          </>}

          {individualStep === 2 && <>
          <div className="preregistro-campo">
            <label>Cédula</label>
            <input
              type="text"
              name="cedula"
              value={formData.cedula}
              onChange={handleInputChange}
              required
              placeholder="Ej. V12345678"
            />
          </div>

          <div className="preregistro-campo">
            <label>Rol / Función Inicial</label>
            <select
              name="rol"
              value={formData.rol}
              onChange={handleInputChange}
            >
              <option value="Atleta">Atleta</option>
              <option value="Entrenador">Entrenador</option>
            </select>
          </div>

          <div className="preregistro-campo">
            <label>Nombres</label>
            <input
              type="text"
              name="nombres"
              value={formData.nombres}
              onChange={handleInputChange}
              required
              placeholder="Nombres completos"
            />
          </div>

          <div className="preregistro-campo">
            <label>Apellidos</label>
            <input
              type="text"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleInputChange}
              required
              placeholder="Apellidos completos"
            />
          </div>

          <div className="preregistro-campo">
            <label>Fecha de Nacimiento</label>
            <input
              type="date"
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="preregistro-campo">
            <label>Correo Electrónico</label>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleInputChange}
              required
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="preregistro-campo-acciones">
            <button type="button" className="preregistro-back-button" onClick={() => setIndividualStep(1)}>Atrás</button>
            <button
              type="submit"
              className="preregistro-btn-primario"
            >
              Guardar Preregistro
            </button>
          </div>
          </>}
        </form>
      </div>}

      {/* BLOQUE 2: CARGA MASIVA PARÁMETRIZADA CON AUDITORÍA PREVIA - Solo para Atleta */}
      {selectedRole === 'Atleta' && mode === 'masivo' && <div className="preregistro-card preregistro-masivo">
        <div className="preregistro-masivo-contenido">

          <div className="preregistro-masivo-header">
            <div>
              <h3 className="preregistro-masivo-titulo">
                📊 Carga Masiva de Atletas por Excel
              </h3>
              <p className="preregistro-masivo-descripcion">
                Cada fila representa un atleta y su representante: <code>representante_nombres, representante_apellidos, representante_cedula, representante_telefono, representante_relacion, cedula, rol, nombres, apellidos, fecha_nacimiento, correo, telefono, categoria</code>
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="preregistro-plantilla-btn"
            >
              📥 Descargar Plantilla Excel (.xlsx)
            </button>
          </div>

          {/* INPUT SUBIR ARCHIVO + BOTÓN DE VALIDACIÓN */}
          <div className="preregistro-archivo">
            <div className="preregistro-archivo-selector">
              <span>Seleccionar Archivo Excel:</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>

            <button
              type="button"
              disabled={!file || isValidating || isUploading}
              onClick={handleValidateExcel}
              className="preregistro-validar-btn"
            >
              {isValidating ? 'Auditando Excel...' : '🔍 1. Auditar y Validar Archivo'}
            </button>
          </div>

          {/* RESUMEN Y TABLA DE AUDITORÍA (SEMÁFORO) */}
          {validationResult && (
            <div className="preregistro-auditoria">
              
              {/* TARJETAS DE MÉTRICAS */}
              <div className="preregistro-metricas">
                <div className="preregistro-metrica">
                  <div className="preregistro-metrica-label">TOTAL FILAS</div>
                  <div className="preregistro-metrica-valor">{validationResult.resumen.total}</div>
                </div>

                <div className="preregistro-metrica preregistro-metrica--valida">
                  <div className="preregistro-metrica-label">VÁLIDOS PARA IMPORTAR</div>
                  <div className="preregistro-metrica-valor">{validationResult.resumen.validas}</div>
                </div>

                <div className="preregistro-metrica preregistro-metrica--error">
                  <div className="preregistro-metrica-label">CON INCONSISTENCIAS</div>
                  <div className="preregistro-metrica-valor">{validationResult.resumen.con_error}</div>
                </div>
              </div>

              {/* DETALLE DE ERRORES SI EXISTEN */}
              {validationResult.detalles_errores && validationResult.detalles_errores.length > 0 && (
                <div className="preregistro-errores">
                  <h4>
                    ⚠️ Filas Descartadas por Inconsistencias:
                  </h4>
                  <ul>
                    {validationResult.detalles_errores.map((err, i) => (
                      <li key={i}>
                        <strong>Fila {err.fila} ({err.cedula || 'Sin cédula'}):</strong> {err.errores.join(' ')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* BOTÓN CONFIRMAR IMPORTACIÓN REAL */}
              {validationResult.resumen.validas > 0 && (
                <div className="preregistro-confirmar">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={handleConfirmCargaMasiva}
                    className="preregistro-btn-primario preregistro-btn-primario--destacado"
                  >
                    {isUploading ? 'Guardando en BD...' : `🚀 2. Confirmar Carga Masiva (${validationResult.resumen.validas} Atletas)`}
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      </div>}

      {/* BLOQUE 3: FORMULARIO ENTRENADOR */}
      {selectedRole === 'Entrenador' && (
        <div className="preregistro-card">
          <h3 className="preregistro-card-titulo">
            📋 Registro de Entrenador
          </h3>

          <form onSubmit={handleSubmitIndividual} className="preregistro-form">
            <div className="preregistro-field">
              <label htmlFor="cedula">Cédula</label>
              <input id="cedula" type="text" name="cedula" value={formData.cedula} onChange={handleInputChange} required placeholder="Ej. V12345678" />
            </div>
            <div className="preregistro-field">
              <label htmlFor="nombres">Nombres</label>
              <input id="nombres" type="text" name="nombres" value={formData.nombres} onChange={handleInputChange} required placeholder="Nombres completos" />
            </div>
            <div className="preregistro-field">
              <label htmlFor="apellidos">Apellidos</label>
              <input id="apellidos" type="text" name="apellidos" value={formData.apellidos} onChange={handleInputChange} required placeholder="Apellidos completos" />
            </div>
            <div className="preregistro-field">
              <label htmlFor="correo">Correo Electrónico</label>
              <input id="correo" type="email" name="correo" value={formData.correo} onChange={handleInputChange} required placeholder="correo@ejemplo.com" />
            </div>
            <div className="preregistro-field">
              <label htmlFor="telefono">Teléfono</label>
              <input id="telefono" type="tel" name="telefono" value={formData.telefono || ''} onChange={handleInputChange} placeholder="0414-1234567" />
            </div>
            <div className="preregistro-form-actions">
              <button
                type="submit"
                className="preregistro-submit-button"
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmitIndividual(e);
                }}
              >
                Guardar Preregistro
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BLOQUE 4: FORMULARIO ADMINISTRADOR */}
      {selectedRole === 'Administrador' && (
        <div className="preregistro-card">
          <h3 className="preregistro-card-titulo">
            🔑 Registro de Administrador
          </h3>

          <form onSubmit={handleSubmitIndividual} className="preregistro-form">
            <div className="preregistro-field">
              <label htmlFor="cedula">Cédula</label>
              <input id="cedula" type="text" name="cedula" value={formData.cedula} onChange={handleInputChange} required placeholder="Ej. V12345678" />
            </div>
            <div className="preregistro-field">
              <label htmlFor="nombres">Nombres</label>
              <input id="nombres" type="text" name="nombres" value={formData.nombres} onChange={handleInputChange} required placeholder="Nombres completos" />
            </div>
            <div className="preregistro-field">
              <label htmlFor="apellidos">Apellidos</label>
              <input id="apellidos" type="text" name="apellidos" value={formData.apellidos} onChange={handleInputChange} required placeholder="Apellidos completos" />
            </div>
            <div className="preregistro-field">
              <label htmlFor="correo">Correo Electrónico</label>
              <input id="correo" type="email" name="correo" value={formData.correo} onChange={handleInputChange} required placeholder="correo@ejemplo.com" />
            </div>
            <div className="preregistro-form-actions">
              <button
                type="submit"
                className="preregistro-submit-button"
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmitIndividual(e);
                }}
              >
                Guardar Preregistro
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default Preregistro;