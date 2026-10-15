import { useEffect, useState } from 'react';
import { ShieldCheck, Lock, X, CheckCircle2 } from 'lucide-react';
import { getAdminSidebarModules } from '../layout/user/SidebarAdmin';
import { useApplicationPermissions } from '../../context/ApplicationPermissionsContext';
import UserService from '../../api/services/Userservice';
import PasswordToggleButton from '../auth/PasswordToggleButton';
import '../../styles/components/admin/MiPerfilViewAdmin.css';

const unavailable = 'No disponible';

function ProfileField({ label, value }) {
  return (
    <div className="admin-profile-field">
      <span className="admin-profile-field-label">{label}</span>
      <span className="admin-profile-field-value">
        {value === null || value === undefined || (typeof value === 'string' && value.trim() === '') ? unavailable : value}
      </span>
    </div>
  );
}

function getProfileError(requestError) {
  if (requestError.response?.status === 401) {
    return 'Tu sesión expiró. Inicia sesión nuevamente para consultar el perfil.';
  }
  if (requestError.response?.status === 403) {
    return 'No tienes permiso para consultar el perfil de administrador.';
  }
  return requestError.response?.data?.detail || 'No se pudo cargar el perfil del administrador.';
}

export default function MiPerfilViewAdmin() {
  const { hasPermission } = useApplicationPermissions();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const modules = getAdminSidebarModules(hasPermission).filter(({ id }) => id !== 'mi-perfil');

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
    let isMounted = true;

    const loadProfile = async () => {
      let fallbackName = '';
      try {
        fallbackName = localStorage.getItem('user_name') || '';
      } catch {
        fallbackName = '';
      }

      try {
        const data = await UserService.getAdminProfile();
        if (!isMounted) return;

        const fullName = data.nombre_completo ||
          [data.nombre, data.apellido].filter(Boolean).join(' ').trim();
        setProfile({
          name: fullName || fallbackName,
          username: data.username,
          id: data.id,
          email: data.email,
          role: data.rol,
          cedula: data.cedula,
        });
      } catch (requestError) {
        if (isMounted) {
          setError(getProfileError(requestError));
          setProfile({
            name: fallbackName,
            username: undefined,
            id: undefined,
            email: undefined,
            role: undefined,
            cedula: undefined,
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  // Funciones para cambio de contraseña
  const handleSolicitarOTP = async () => {
    try {
      setPasswordLoading(true);
      setPasswordError('');

      const response = await UserService.requestPasswordOTP(profile.email);

      if (response.status === 'success') {
        setPasswordStep(2);
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || err.response?.data?.error || 'Error al solicitar código OTP');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleValidarOTP = async () => {
    try {
      setPasswordLoading(true);
      setPasswordError('');

      const response = await UserService.confirmPasswordOTP(
        profile.email,
        otpCode,
        newPassword,
        confirmPassword
      );

      if (response.status === 'success') {
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
      setPasswordError(err.response?.data?.message || err.response?.data?.error || 'Error al validar código o cambiar contraseña');
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

  if (isLoading) {
    return (
      <div className="admin-profile-estado" role="status">
        Cargando perfil...
      </div>
    );
  }

  const initials = profile.name
    ? profile.name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
    : '—';
  const roleName = profile.role === null || profile.role === ''
    ? unavailable
    : profile.role
      ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
      : '';

  return (
    <main className="admin-profile-view">
      <header className="admin-profile-header">
        <h1>Mi perfil</h1>
      </header>

      {error && (
        <div className="admin-profile-error" role="alert">
          {error}
        </div>
      )}

      <div className="admin-profile-grid">
        <section className="admin-profile-card">
          <div className="admin-profile-identidad">
            <div aria-hidden="true" className="admin-profile-avatar">
              {initials}
            </div>
            <h2 className="admin-profile-nombre">{profile.name}</h2>
            <span className="admin-profile-rol">{roleName}</span>
          </div>
          <ProfileField label="Usuario" value={profile.username} />
          <ProfileField label="Cédula" value={profile.cedula} />
          <ProfileField label="ID de usuario" value={profile.id} />
          <ProfileField label="Email" value={profile.email} />
        </section>

        <section className="admin-profile-card">
          <div className="admin-profile-card-header">
            <h2>Seguridad</h2>
            <ShieldCheck size={20} className="admin-profile-icono" />
          </div>
          <p className="admin-profile-descripcion">Gestiona la seguridad de tu cuenta.</p>
          <button type="button" className="admin-profile-btn-secundario" onClick={handleIniciarCambioPassword}>
            <Lock size={20} />
            <span>Cambiar contraseña</span>
          </button>
        </section>

        <section className="admin-profile-card">
          <h2 className="admin-profile-permisos-titulo">Permisos activos</h2>
          <div className="admin-profile-permisos">
            {modules.map((module) => {
              const ModuleIcon = module.icon;
              return (
                <span key={module.id} className="admin-profile-permiso">
                  <ModuleIcon aria-hidden="true" size={15} />
                  {module.label}
                </span>
              );
            })}
          </div>
          <p className="admin-profile-nota">Los permisos de acceso los gestiona el administrador del sistema.</p>
        </section>
      </div>

      {/* Modal de Cambio de Contraseña */}
      {showPasswordModal && (
        <div className="admin-profile-modal-overlay" onClick={handleCerrarModal}>
          <div className="admin-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-profile-modal-header">
              <h3>{passwordStep === 4 ? '✓ Contraseña actualizada' : 'Cambiar Contraseña'}</h3>
              <button type="button" className="admin-profile-modal-cerrar" onClick={handleCerrarModal}>
                <X size={20} />
              </button>
            </div>

            <div>
              {passwordStep === 1 && (
                <div>
                  <p className="admin-profile-modal-texto">
                    Se enviará un código de verificación a tu correo electrónico:
                    <strong>{profile?.email}</strong>
                  </p>

                  {passwordError && <div className="admin-profile-modal-alerta">{passwordError}</div>}

                  <button
                    type="button"
                    className="admin-profile-btn-primario"
                    onClick={handleSolicitarOTP}
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? 'Enviando código...' : 'Solicitar código OTP'}
                  </button>
                </div>
              )}

              {passwordStep === 2 && (
                <div>
                  <p className="admin-profile-modal-texto">
                    Ingresa el código de 6 caracteres que recibiste en tu correo.
                  </p>

                  <div className="admin-profile-campo">
                    <label>Código OTP</label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      placeholder="Ej: ABC123"
                    />
                  </div>

                  <div className="admin-profile-campo">
                    <label>Nueva Contraseña</label>
                    <div className="admin-profile-password">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 12 caracteres"
                      />
                      <div className="admin-profile-password-toggle">
                        <PasswordToggleButton
                          isVisible={showNewPassword}
                          onToggle={() => setShowNewPassword((visible) => !visible)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="admin-profile-campo">
                    <label>Confirmar Contraseña</label>
                    <div className="admin-profile-password">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite tu contraseña"
                      />
                      <div className="admin-profile-password-toggle">
                        <PasswordToggleButton
                          isVisible={showConfirmPassword}
                          onToggle={() => setShowConfirmPassword((visible) => !visible)}
                        />
                      </div>
                    </div>
                  </div>

                  {passwordError && <div className="admin-profile-modal-alerta">{passwordError}</div>}

                  <button
                    type="button"
                    className="admin-profile-btn-primario"
                    onClick={handleValidarOTP}
                    disabled={passwordLoading || otpCode.length !== 6 || !newPassword || newPassword !== confirmPassword}
                  >
                    {passwordLoading ? 'Procesando...' : 'Validar y Cambiar Contraseña'}
                  </button>
                </div>
              )}

              {passwordStep === 4 && passwordSuccess && (
                <div className="admin-profile-exito">
                  <CheckCircle2 size={48} />
                  <p>Tu contraseña ha sido actualizada exitosamente.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
