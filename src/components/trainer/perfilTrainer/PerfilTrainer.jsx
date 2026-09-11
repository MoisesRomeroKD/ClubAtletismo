import React, { useState, useEffect } from 'react';
import '../../../styles/components/trainer/PerfilTrainer.css';
import PasswordToggleButton from '../../auth/PasswordToggleButton';
import UserService from '../../../api/services/Userservice';
import podApi from '../../../api/podApi';

const PerfilTrainer = () => {
  const [perfil, setPerfil] = useState(null);
  const [subareas, setSubareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState('');

  // Estado para cambio de contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordStep, setPasswordStep] = useState(1); // 1: solicitar OTP, 2: validar OTP, 3: nueva contraseña
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    cargarPerfil();
    cargarSubareas();
  }, []);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      const data = await UserService.getTrainerProfile();
      setPerfil(data);
    } catch (err) {
      console.error('Error cargando perfil:', err);
      setNotification('⚠️ No se pudo cargar la información del perfil.');
      setTimeout(() => setNotification(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  const cargarSubareas = async () => {
    try {
      const data = await UserService.getMySubareas();
      setSubareas(data);
    } catch (err) {
      console.error('Error cargando subáreas:', err);
      setNotification('⚠️ No se pudieron cargar las subáreas asignadas.');
      setTimeout(() => setNotification(''), 4000);
    }
  };

  const areasOrdenadas = ['Velocidad', 'Resistencia', 'Salto', 'Lanzamiento'];
  const subareasPorArea = subareas.reduce((grupos, subarea) => {
    const area = subarea.subarea_detalle?.area?.nombre || 'Sin área';

    if (!grupos[area]) {
      grupos[area] = [];
    }

    grupos[area].push(subarea);
    return grupos;
  }, {});

  const gruposDeSubareas = [
    ...areasOrdenadas
      .filter((area) => subareasPorArea[area]?.length > 0)
      .map((area) => ({ area, subareas: subareasPorArea[area] })),
    ...(subareasPorArea['Sin área']?.length > 0
      ? [{ area: 'Sin área', subareas: subareasPorArea['Sin área'] }]
      : [])
  ];

  // Funciones para cambio de contraseña
  const handleSolicitarOTP = async () => {
    try {
      setPasswordLoading(true);
      setPasswordError('');

      const response = await podApi.post('/v1/auth/recuperar-password/', {
        email: perfil.email
      });

      if (response.data.status === 'success') {
        setPasswordStep(2);
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Error al solicitar código OTP');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleValidarOTP = async () => {
    try {
      setPasswordLoading(true);
      setPasswordError('');

      const response = await podApi.post('/v1/auth/confirmar-password/', {
        email: perfil.email,
        codigo: otpCode,
        password: newPassword,
        confirm_password: confirmPassword
      });

      if (response.data.status === 'success') {
        setPasswordSuccess(true);
        setPasswordStep(4); // Éxito
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordStep(1);
          setPasswordSuccess(false);
          setOtpCode('');
          setNewPassword('');
          setConfirmPassword('');
        }, 3000);
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Error al validar código o cambiar contraseña');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCerrarModal = () => {
    setShowPasswordModal(false);
    setPasswordStep(1);
    setPasswordError('');
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordSuccess(false);
  };

  const handleIniciarCambioPassword = () => {
    setShowPasswordModal(true);
    setPasswordStep(1);
    setPasswordError('');
  };

  if (loading) {
    return (
      <div className="mi-perfil-content">
        <div className="mi-perfil-container">
          <div className="mi-perfil-page-header">
            <h2>Cargando perfil...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mi-perfil-content">

      {notification && (
        <div className="mi-perfil-toast" role="alert">
          {notification}
        </div>
      )}

      <div className="mi-perfil-container">

        {/* Page Header */}
        <div className="mi-perfil-page-header">
          <h2>Detalles del Perfil</h2>

          <p>
            Información personal y de asignación en la academia.
          </p>
        </div>


        {/* =========================
            PROFILE GRID (SIN CARD LATERAL)
        ========================== */}
        <div className="mi-perfil-grid">

          {/* =========================
              DETAILS (OCUPA TODO EL ANCHO)
          ========================== */}
          <div className="mi-perfil-details-full">

            {/* Información General */}
            <section className="mi-perfil-card">

              <h4>
                Información del Entrenador
              </h4>

              <div className="mi-perfil-section-divider"></div>

              <div className="mi-perfil-info-grid">

                <div className="mi-perfil-field">
                  <label>Nombre Completo</label>

                  <div className="mi-perfil-readonly">
                    {perfil?.nombre_completo || 'No disponible'}
                  </div>
                </div>

                <div className="mi-perfil-field">
                  <label>Cédula de Identidad</label>

                  <div className="mi-perfil-readonly">
                    {perfil?.cedula || 'No disponible'}
                  </div>
                </div>

                <div className="mi-perfil-field">
                  <label>Correo Electrónico</label>

                  <div className="mi-perfil-readonly">
                    {perfil?.email || 'No disponible'}
                  </div>
                </div>

                <div className="mi-perfil-field">
                  <label>Rol de Sistema</label>

                  <div className="mi-perfil-readonly">
                    {perfil?.rol || 'No disponible'}
                  </div>
                </div>

              </div>

            </section>


            {/* Subáreas */}
            <section className="mi-perfil-card">

              <div className="mi-perfil-card-title-row">

                <h4>
                  Subáreas Asignadas
                </h4>

                <span className="material-symbols-outlined">
                  info
                </span>

              </div>

              <div className="mi-perfil-section-divider"></div>

              <p className="mi-perfil-description">
                Estas son las disciplinas en las que estás
                registrado como instructor principal para el
                período actual.
              </p>

              <div className="mi-perfil-subareas-groups">
                {gruposDeSubareas.length > 0 ? (
                  gruposDeSubareas.map(({ area, subareas: subareasDelArea }) => (
                    <div key={area} className="mi-perfil-subarea-group">
                      <h5 className="mi-perfil-subarea-group-title">{area}</h5>
                      <div className="mi-perfil-chips">
                        {subareasDelArea.map((subarea) => (
                          <div key={subarea.id} className="mi-perfil-chip">
                            <span className="mi-perfil-chip-dot primary"></span>
                            <span>{subarea.subarea_detalle?.nombre || 'Sin nombre'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="mi-perfil-readonly">
                    No hay subáreas asignadas
                  </div>
                )}
              </div>

            </section>


            {/* Seguridad - Cambio de Contraseña */}
            <section className="mi-perfil-card">

              <div className="mi-perfil-card-title-row">

                <h4>
                  Seguridad
                </h4>

                <span className="material-symbols-outlined">
                  security
                </span>

              </div>

              <div className="mi-perfil-section-divider"></div>

              <p className="mi-perfil-description">
                Gestiona la seguridad de tu cuenta.
              </p>

              <button
                type="button"
                className="mi-perfil-password-button"
                onClick={handleIniciarCambioPassword}
              >
                <span className="material-symbols-outlined">
                  lock
                </span>
                <span>Cambiar contraseña</span>
              </button>

            </section>


            {/* Read only message */}
            <div className="mi-perfil-readonly-message">

              <span className="material-symbols-outlined">
                lock
              </span>

              <span>
                Los datos del perfil son de solo lectura.
                Contacta a administración para modificaciones.
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* Modal de Cambio de Contraseña */}
      {showPasswordModal && (
        <div className="mi-perfil-modal-overlay" onClick={handleCerrarModal}>
          <div className="mi-perfil-modal" onClick={(e) => e.stopPropagation()}>

            <div className="mi-perfil-modal-header">
              <h3>
                {passwordStep === 4 ? '✓ Contraseña actualizada' : 'Cambiar Contraseña'}
              </h3>
              <button
                type="button"
                className="mi-perfil-modal-close"
                onClick={handleCerrarModal}
              >
                <span className="material-symbols-outlined">
                  close
                </span>
              </button>
            </div>

            <div className="mi-perfil-modal-body">

              {passwordStep === 1 && (
                <div className="mi-perfil-password-step">
                  <p className="mi-perfil-modal-description">
                    Se enviará un código de verificación a tu correo electrónico:
                    <strong>{perfil?.email}</strong>
                  </p>

                  {passwordError && (
                    <div className="mi-perfil-error-message">
                      {passwordError}
                    </div>
                  )}

                  <button
                    type="button"
                    className="mi-perfil-primary-button"
                    onClick={handleSolicitarOTP}
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? 'Enviando código...' : 'Solicitar código OTP'}
                  </button>
                </div>
              )}

              {passwordStep === 2 && (
                <div className="mi-perfil-password-step">
                  <p className="mi-perfil-modal-description">
                    Ingresa el código de 6 caracteres que recibiste en tu correo.
                  </p>

                  <div className="mi-perfil-form-group">
                    <label>Código OTP</label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      placeholder="Ej: ABC123"
                      className="mi-perfil-input"
                    />
                  </div>

                  <div className="mi-perfil-form-group">
                    <label>Nueva Contraseña</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 12 caracteres"
                        className="mi-perfil-input password-input-with-toggle"
                      />
                      <PasswordToggleButton
                        isVisible={showNewPassword}
                        onToggle={() => setShowNewPassword((visible) => !visible)}
                      />
                    </div>
                  </div>

                  <div className="mi-perfil-form-group">
                    <label>Confirmar Contraseña</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite tu contraseña"
                        className="mi-perfil-input password-input-with-toggle"
                      />
                      <PasswordToggleButton
                        isVisible={showConfirmPassword}
                        onToggle={() => setShowConfirmPassword((visible) => !visible)}
                      />
                    </div>
                  </div>

                  {passwordError && (
                    <div className="mi-perfil-error-message">
                      {passwordError}
                    </div>
                  )}

                  <button
                    type="button"
                    className="mi-perfil-primary-button"
                    onClick={handleValidarOTP}
                    disabled={passwordLoading || otpCode.length !== 6 || !newPassword || newPassword !== confirmPassword}
                  >
                    {passwordLoading ? 'Procesando...' : 'Validar y Cambiar Contraseña'}
                  </button>
                </div>
              )}

              {passwordStep === 4 && passwordSuccess && (
                <div className="mi-perfil-password-step mi-perfil-success-step">
                  <span className="material-symbols-outlined mi-perfil-success-icon">
                    check_circle
                  </span>
                  <p className="mi-perfil-modal-description">
                    Tu contraseña ha sido actualizada exitosamente.
                  </p>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PerfilTrainer;