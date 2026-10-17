import React, { useState, useRef } from 'react';
import podApi from '../../api/podApi';
import '../../styles/components/admin/Preregistro.css';

// Reglas de formato (las mismas que valida el backend en apps/users/services.py).
// Cédula: solo números, 7 u 8 dígitos (igual que en el registro de usuarios).
const PATRON_CEDULA = '[0-9]{7,8}';
const AYUDA_CEDULA = 'Solo números, 7 u 8 dígitos (ej. 12345678).';
// Teléfono venezolano: 11 dígitos que empiezan por 0.
const PATRON_TELEFONO = '0[0-9]{10}';
const AYUDA_TELEFONO = '11 dígitos que empiezan por 0 (ej. 04141234567).';
// Nombres y apellidos: letras (con acentos y ñ), espacios, apóstrofo y guion; de 2 a 60 caracteres.
const PATRON_NOMBRE = "[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' \\-]{2,60}";
const AYUDA_NOMBRE = 'Solo letras y espacios (2 a 60 caracteres).';
// Correo: el sistema solo acepta Gmail (igual que el backend en apps/users/validators.py).
const PATRON_GMAIL = '[a-zA-Z0-9](\\.?[a-zA-Z0-9])*@gmail\\.com';
const AYUDA_GMAIL = 'Solo se aceptan correos de Gmail (ej. nombre@gmail.com).';

// Mientras se escribe, cada campo descarta lo que no le corresponde (limpiar) y avisa (rechazo).
// Al salir del campo, si el valor no está completo (completo), se marca en rojo con el aviso de formato.
const REGLAS = {
  cedula: {
    limpiar: (valor) => valor.replace(/\D/g, '').slice(0, 8),
    completo: /^\d{7,8}$/,
    rechazo: 'Aquí solo se escriben números.',
    formato: 'La cédula debe tener 7 u 8 números (ej. 12345678).',
  },
  telefono: {
    limpiar: (valor) => valor.replace(/\D/g, '').slice(0, 11),
    completo: /^0\d{10}$/,
    rechazo: 'Aquí solo se escriben números.',
    formato: 'El teléfono debe tener 11 números y empezar por 0 (ej. 04141234567).',
  },
  nombre: {
    limpiar: (valor) => valor.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]/g, '').replace(/ {2,}/g, ' ').slice(0, 60),
    completo: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{2,60}$/,
    rechazo: 'Aquí solo se escriben letras y espacios.',
    formato: 'Escribe al menos 2 letras.',
  },
  correo: {
    limpiar: (valor) => valor.replace(/\s/g, '').toLowerCase().slice(0, 254),
    completo: /^[a-z0-9](?:\.?[a-z0-9])*@gmail\.com$/,
    rechazo: 'Aquí no se escriben espacios.',
    formato: AYUDA_GMAIL,
  },
};

// Qué regla usa cada campo del formulario.
const TIPO_CAMPO = {
  cedula: 'cedula',
  representante_cedula: 'cedula',
  telefono: 'telefono',
  representante_telefono: 'telefono',
  nombres: 'nombre',
  apellidos: 'nombre',
  representante_nombres: 'nombre',
  representante_apellidos: 'nombre',
  correo: 'correo',
};

// Nombre del rol que se muestra → nombre del rol que guarda el sistema.
const ROL_SISTEMA = {
  Atleta: 'Atleta',
  Entrenador: 'Entrenador',
  Administrador: 'administrador',
};

// Carga masiva: cada rol tiene su plantilla. El rol no va en el Excel: lo pone el sistema según el rol elegido.
const MASIVO_POR_ROL = {
  Atleta: {
    plural: 'Atletas',
    descripcion: 'Cada fila representa un atleta y su representante:',
    columnas: [
      ['representante_nombres', 22], ['representante_apellidos', 24], ['representante_cedula', 20],
      ['representante_telefono', 22], ['representante_relacion', 22], ['cedula', 12], ['nombres', 18],
      ['apellidos', 20], ['fecha_nacimiento', 17], ['correo', 26], ['telefono', 14], ['categoria', 12],
    ],
    ejemplos: [
      {
        representante_nombres: 'Ana Maria', representante_apellidos: 'Perez Lopez', representante_cedula: '1234567',
        representante_telefono: '04141234567', representante_relacion: 'Madre',
        cedula: '12345678', nombres: 'Juan Jose', apellidos: 'Perez Rodriguez', fecha_nacimiento: '2005-05-15',
        correo: 'juan.perez@gmail.com', telefono: '', categoria: '',
      },
      {
        representante_nombres: 'Ana Maria', representante_apellidos: 'Perez Lopez', representante_cedula: '1234567',
        representante_telefono: '04141234567', representante_relacion: 'Madre',
        cedula: '87654321', nombres: 'Maria Fernanda', apellidos: 'Gomez Silva', fecha_nacimiento: '2008-08-20',
        correo: 'maria.gomez@gmail.com', telefono: '', categoria: '',
      },
    ],
  },
  Entrenador: {
    plural: 'Entrenadores',
    descripcion: 'Cada fila representa un entrenador (sin representante ni fecha de nacimiento):',
    columnas: [['cedula', 12], ['nombres', 18], ['apellidos', 20], ['correo', 26], ['telefono', 14]],
    ejemplos: [
      { cedula: '15678901', nombres: 'Carlos Luis', apellidos: 'Mendez Rojas', correo: 'carlos.mendez@gmail.com', telefono: '04121234567' },
      { cedula: '16789012', nombres: 'Rosa Elena', apellidos: 'Diaz Torres', correo: 'rosa.diaz@gmail.com', telefono: '' },
    ],
  },
  Administrador: {
    plural: 'Administradores',
    descripcion: 'Cada fila representa un administrador (sin representante, fecha de nacimiento ni teléfono):',
    columnas: [['cedula', 12], ['nombres', 18], ['apellidos', 20], ['correo', 26]],
    ejemplos: [
      { cedula: '14567890', nombres: 'Pedro Jose', apellidos: 'Blanco Rivas', correo: 'pedro.blanco@gmail.com' },
    ],
  },
};

const FORMULARIO_VACIO = {
  cedula: '',
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
};

// Último día permitido como fecha de nacimiento: ayer, en hora local (AAAA-MM-DD).
const ayerLocal = () => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - 1);
  return fecha.toLocaleDateString('en-CA');
};

// El backend puede devolver un texto o una lista de errores por campo/fila: se arma un solo mensaje legible.
const mensajeError = (error, porDefecto) => {
  const datos = error?.response?.data;
  if (!datos) return porDefecto;
  const lineas = [];
  if (typeof datos.message === 'string') lineas.push(datos.message);
  if (Array.isArray(datos.errores)) lineas.push(...datos.errores.map((texto) => `• ${texto}`));
  if (Array.isArray(datos.detalles_errores)) {
    datos.detalles_errores.forEach((fila) => {
      lineas.push(`• Fila ${fila.fila} (${fila.cedula || 'sin cédula'}): ${(fila.errores || []).join(' ')}`);
    });
  }
  return lineas.length ? lineas.join('\n') : porDefecto;
};

const Preregistro = () => {
  // Estado para el rol seleccionado (null = mostrar selector de rol)
  const [selectedRole, setSelectedRole] = useState(null);

  // Estado para el formulario individual
  const [formData, setFormData] = useState(FORMULARIO_VACIO);

  const [individualStep, setIndividualStep] = useState(1);
  const [mode, setMode] = useState('individual');

  // Estados para la Carga Masiva
  const [file, setFile] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const fileInputRef = useRef(null);

  // rechazados: campos donde se acaba de escribir algo no permitido. tocados: campos que ya se dejaron.
  const [rechazados, setRechazados] = useState({});
  const [tocados, setTocados] = useState({});

  const reiniciarFormulario = () => {
    setFormData(FORMULARIO_VACIO);
    setRechazados({});
    setTocados({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const regla = REGLAS[TIPO_CAMPO[name]];
    const limpio = regla ? regla.limpiar(value) : value;
    if (regla) setRechazados((previos) => ({ ...previos, [name]: limpio !== value }));
    setFormData({
      ...formData,
      [name]: limpio
    });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTocados((previos) => ({ ...previos, [name]: true }));
    setRechazados((previos) => ({ ...previos, [name]: false }));
  };

  // Texto del aviso de un campo ('' si está bien).
  const avisoCampo = (name) => {
    const regla = REGLAS[TIPO_CAMPO[name]];
    if (!regla) return '';
    if (rechazados[name]) return regla.rechazo;
    const valor = formData[name];
    if (tocados[name] && valor && !regla.completo.test(valor)) return regla.formato;
    return '';
  };

  // Props de validación para un campo: borde rojo y aviso enlazado cuando está mal.
  const validacion = (name) => {
    const aviso = avisoCampo(name);
    return {
      onBlur: handleBlur,
      className: aviso ? 'preregistro-input--error' : undefined,
      'aria-invalid': aviso ? true : undefined,
      'aria-describedby': aviso ? `aviso-${name}` : undefined,
    };
  };

  const renderAviso = (name) => {
    const aviso = avisoCampo(name);
    return aviso ? <small id={`aviso-${name}`} className="preregistro-aviso" role="alert">{aviso}</small> : null;
  };

  // Descarga de la plantilla Excel (.xlsx). La librería se carga solo al pulsar el botón.
  const handleDownloadTemplate = async () => {
    try {
      const XLSX = await import('xlsx');
      const plantilla = MASIVO_POR_ROL[selectedRole];

      const worksheet = XLSX.utils.json_to_sheet(plantilla.ejemplos, {
        header: plantilla.columnas.map(([columna]) => columna),
      });
      // Un ancho por cada columna, en el mismo orden que los datos.
      worksheet['!cols'] = plantilla.columnas.map(([, ancho]) => ({ wch: ancho }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla_Preregistro");
      XLSX.writeFile(workbook, `Plantilla_Preregistro_${plantilla.plural}.xlsx`);
    } catch (error) {
      console.error("Error al generar Excel:", error);
      alert("Error al descargar la plantilla.");
    }
  };

  // Guardar registro individual
  const handleSubmitIndividual = async (e) => {
    e.preventDefault();
    try {
      const rol = ROL_SISTEMA[selectedRole] || 'Atleta';
      // Solo el atleta tiene representante (y fecha de nacimiento); a los demás roles no se les envía.
      const datos = rol === 'Atleta'
        ? formData
        : Object.fromEntries(Object.entries(formData).filter(([campo]) => (
          !campo.startsWith('representante_') && campo !== 'fechaNacimiento'
        )));
      const response = await podApi.post('/v1/users/preregistro/crear/', {
        ...datos,
        rol,
        ...(rol === 'Atleta' && { fecha_nacimiento: formData.fechaNacimiento }),
      });
      if (response.data?.status === 'success') {
        alert("¡Preregistro individual creado exitosamente!");
        reiniciarFormulario();
        setIndividualStep(1);
        setSelectedRole(null);
      }
    } catch (error) {
      console.error("Error en preregistro:", error);
      alert(mensajeError(error, "Ocurrió un error al guardar el preregistro."));
    }
  };

  // Antes de pasar al atleta, el navegador revisa los campos del representante (obligatorios y formato).
  const handleContinueToAthlete = (e) => {
    const campos = e.currentTarget.form.querySelectorAll('input, select');
    for (const campo of campos) {
      if (!campo.checkValidity()) {
        setTocados((previos) => ({ ...previos, [campo.name]: true }));
        campo.reportValidity();
        return;
      }
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
    uploadData.append('rol', ROL_SISTEMA[selectedRole]);

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
      alert(mensajeError(error, "Error al auditar el archivo Excel."));
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
      alert(mensajeError(error, "Error al realizar la carga masiva en el servidor."));
    } finally {
      setIsUploading(false);
    }
  };

  // Cada rol empieza con el formulario vacío, para no arrastrar datos de otro rol.
  const reiniciarCargaMasiva = () => {
    setFile(null);
    setValidationResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    reiniciarFormulario();
    reiniciarCargaMasiva();
    setMode('individual');
    setIndividualStep(1);
  };

  const handleBackToRoles = () => {
    setSelectedRole(null);
    reiniciarFormulario();
    reiniciarCargaMasiva();
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

      {/* TOGGLE INDIVIDUAL/MASIVO - Para los tres roles */}
      {selectedRole && (
        <div className="preregistro-mode-toggle" role="tablist" aria-label="Modalidad de preregistro">
          <button type="button" className={mode === 'individual' ? 'active' : ''} onClick={() => setMode('individual')}>
            Individual
          </button>
          <button type="button" className={mode === 'masivo' ? 'active' : ''} onClick={() => { setMode('masivo'); reiniciarCargaMasiva(); }}>
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
            <input id="representante_nombres" type="text" name="representante_nombres" value={formData.representante_nombres} onChange={handleInputChange} required pattern={PATRON_NOMBRE} maxLength={60} title={AYUDA_NOMBRE} {...validacion('representante_nombres')} />
            {renderAviso('representante_nombres')}
          </div>
          <div className="preregistro-field">
            <label htmlFor="representante_apellidos">Apellidos del representante</label>
            <input id="representante_apellidos" type="text" name="representante_apellidos" value={formData.representante_apellidos} onChange={handleInputChange} required pattern={PATRON_NOMBRE} maxLength={60} title={AYUDA_NOMBRE} {...validacion('representante_apellidos')} />
            {renderAviso('representante_apellidos')}
          </div>
          <div className="preregistro-field">
            <label htmlFor="representante_cedula">Cédula del representante</label>
            <input id="representante_cedula" type="text" inputMode="numeric" name="representante_cedula" value={formData.representante_cedula} onChange={handleInputChange} required pattern={PATRON_CEDULA} maxLength={8} title={AYUDA_CEDULA} placeholder="Ej. 12345678" {...validacion('representante_cedula')} />
            {renderAviso('representante_cedula')}
          </div>
          <div className="preregistro-field">
            <label htmlFor="representante_telefono">Teléfono del representante</label>
            <input id="representante_telefono" type="tel" inputMode="numeric" name="representante_telefono" value={formData.representante_telefono} onChange={handleInputChange} required pattern={PATRON_TELEFONO} maxLength={11} title={AYUDA_TELEFONO} placeholder="Ej. 04141234567" {...validacion('representante_telefono')} />
            {renderAviso('representante_telefono')}
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
            <label htmlFor="atleta_cedula">Cédula</label>
            <input
              id="atleta_cedula"
              type="text"
              inputMode="numeric"
              name="cedula"
              value={formData.cedula}
              onChange={handleInputChange}
              required
              pattern={PATRON_CEDULA}
              maxLength={8}
              title={AYUDA_CEDULA}
              placeholder="Ej. 12345678"
              {...validacion('cedula')}
            />
            {renderAviso('cedula')}
          </div>

          <div className="preregistro-campo">
            <label htmlFor="atleta_nombres">Nombres</label>
            <input
              id="atleta_nombres"
              type="text"
              name="nombres"
              value={formData.nombres}
              onChange={handleInputChange}
              required
              pattern={PATRON_NOMBRE}
              maxLength={60}
              title={AYUDA_NOMBRE}
              placeholder="Nombres completos"
              {...validacion('nombres')}
            />
            {renderAviso('nombres')}
          </div>

          <div className="preregistro-campo">
            <label htmlFor="atleta_apellidos">Apellidos</label>
            <input
              id="atleta_apellidos"
              type="text"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleInputChange}
              required
              pattern={PATRON_NOMBRE}
              maxLength={60}
              title={AYUDA_NOMBRE}
              placeholder="Apellidos completos"
              {...validacion('apellidos')}
            />
            {renderAviso('apellidos')}
          </div>

          <div className="preregistro-campo">
            <label htmlFor="atleta_fecha_nacimiento">Fecha de Nacimiento</label>
            <input
              id="atleta_fecha_nacimiento"
              type="date"
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={handleInputChange}
              required
              max={ayerLocal()}
            />
          </div>

          <div className="preregistro-campo">
            <label htmlFor="atleta_correo">Correo Electrónico</label>
            <input
              id="atleta_correo"
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleInputChange}
              required
              pattern={PATRON_GMAIL}
              title={AYUDA_GMAIL}
              placeholder="nombre@gmail.com"
              {...validacion('correo')}
            />
            {renderAviso('correo')}
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

      {/* BLOQUE 2: CARGA MASIVA CON AUDITORÍA PREVIA - Plantilla según el rol elegido */}
      {selectedRole && mode === 'masivo' && <div className="preregistro-card preregistro-masivo">
        <div className="preregistro-masivo-contenido">

          <div className="preregistro-masivo-header">
            <div>
              <h3 className="preregistro-masivo-titulo">
                📊 Carga Masiva de {MASIVO_POR_ROL[selectedRole].plural} por Excel
              </h3>
              <p className="preregistro-masivo-descripcion">
                {MASIVO_POR_ROL[selectedRole].descripcion} <code>{MASIVO_POR_ROL[selectedRole].columnas.map(([columna]) => columna).join(', ')}</code>
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
                    {isUploading ? 'Guardando en BD...' : `🚀 2. Confirmar Carga Masiva (${validationResult.resumen.validas} ${MASIVO_POR_ROL[selectedRole].plural})`}
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      </div>}

      {/* BLOQUE 3: FORMULARIO ENTRENADOR */}
      {selectedRole === 'Entrenador' && mode === 'individual' && (
        <div className="preregistro-card">
          <h3 className="preregistro-card-titulo">
            📋 Registro de Entrenador
          </h3>

          <form onSubmit={handleSubmitIndividual} className="preregistro-form">
            <div className="preregistro-field">
              <label htmlFor="cedula">Cédula</label>
              <input id="cedula" type="text" inputMode="numeric" name="cedula" value={formData.cedula} onChange={handleInputChange} required pattern={PATRON_CEDULA} maxLength={8} title={AYUDA_CEDULA} placeholder="Ej. 12345678" {...validacion('cedula')} />
            {renderAviso('cedula')}
            </div>
            <div className="preregistro-field">
              <label htmlFor="nombres">Nombres</label>
              <input id="nombres" type="text" name="nombres" value={formData.nombres} onChange={handleInputChange} required pattern={PATRON_NOMBRE} maxLength={60} title={AYUDA_NOMBRE} placeholder="Nombres completos" {...validacion('nombres')} />
            {renderAviso('nombres')}
            </div>
            <div className="preregistro-field">
              <label htmlFor="apellidos">Apellidos</label>
              <input id="apellidos" type="text" name="apellidos" value={formData.apellidos} onChange={handleInputChange} required pattern={PATRON_NOMBRE} maxLength={60} title={AYUDA_NOMBRE} placeholder="Apellidos completos" {...validacion('apellidos')} />
            {renderAviso('apellidos')}
            </div>
            <div className="preregistro-field">
              <label htmlFor="correo">Correo Electrónico</label>
              <input id="correo" type="email" name="correo" value={formData.correo} onChange={handleInputChange} required pattern={PATRON_GMAIL} title={AYUDA_GMAIL} placeholder="nombre@gmail.com" {...validacion('correo')} />
              {renderAviso('correo')}
            </div>
            <div className="preregistro-field">
              <label htmlFor="telefono">Teléfono</label>
              <input id="telefono" type="tel" inputMode="numeric" name="telefono" value={formData.telefono} onChange={handleInputChange} pattern={PATRON_TELEFONO} maxLength={11} title={AYUDA_TELEFONO} placeholder="Ej. 04141234567" {...validacion('telefono')} />
            {renderAviso('telefono')}
            </div>
            <div className="preregistro-form-actions">
              <button type="submit" className="preregistro-submit-button">
                Guardar Preregistro
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BLOQUE 4: FORMULARIO ADMINISTRADOR */}
      {selectedRole === 'Administrador' && mode === 'individual' && (
        <div className="preregistro-card">
          <h3 className="preregistro-card-titulo">
            🔑 Registro de Administrador
          </h3>

          <form onSubmit={handleSubmitIndividual} className="preregistro-form">
            <div className="preregistro-field">
              <label htmlFor="cedula">Cédula</label>
              <input id="cedula" type="text" inputMode="numeric" name="cedula" value={formData.cedula} onChange={handleInputChange} required pattern={PATRON_CEDULA} maxLength={8} title={AYUDA_CEDULA} placeholder="Ej. 12345678" {...validacion('cedula')} />
            {renderAviso('cedula')}
            </div>
            <div className="preregistro-field">
              <label htmlFor="nombres">Nombres</label>
              <input id="nombres" type="text" name="nombres" value={formData.nombres} onChange={handleInputChange} required pattern={PATRON_NOMBRE} maxLength={60} title={AYUDA_NOMBRE} placeholder="Nombres completos" {...validacion('nombres')} />
            {renderAviso('nombres')}
            </div>
            <div className="preregistro-field">
              <label htmlFor="apellidos">Apellidos</label>
              <input id="apellidos" type="text" name="apellidos" value={formData.apellidos} onChange={handleInputChange} required pattern={PATRON_NOMBRE} maxLength={60} title={AYUDA_NOMBRE} placeholder="Apellidos completos" {...validacion('apellidos')} />
            {renderAviso('apellidos')}
            </div>
            <div className="preregistro-field">
              <label htmlFor="correo">Correo Electrónico</label>
              <input id="correo" type="email" name="correo" value={formData.correo} onChange={handleInputChange} required pattern={PATRON_GMAIL} title={AYUDA_GMAIL} placeholder="nombre@gmail.com" {...validacion('correo')} />
              {renderAviso('correo')}
            </div>
            <div className="preregistro-form-actions">
              <button type="submit" className="preregistro-submit-button">
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