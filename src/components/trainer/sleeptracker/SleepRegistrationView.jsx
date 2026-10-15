import React, { useState } from 'react';
import { User, Shield, CheckCircle, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import '../../../styles/components/trainer/SleepModuleTheme.css';
import '../../../styles/components/trainer/SleepRegistrationView.css';

const QUALITY_LABELS = {
  1: '1 · Pésimo descanso (Fatiga severa / Sin recuperación)',
  2: '2 · Muy deficiente (Sueño muy interrumpido / Gran cansancio)',
  3: '3 · Deficiente (Descanso insuficiente / Molestias)',
  4: '4 · Regular bajo (Recuperación incompleta)',
  5: '5 · Aceptable (Descanso regular)',
  6: '6 · Moderado (Sensación aceptable de energía)',
  7: '7 · Buen descanso (Recuperación adecuada)',
  8: '8 · Muy bueno (Sensación de frescura y energía)',
  9: '9 · Excelente descanso (Recuperación muscular óptima)',
  10: '10 · Perfecto / Excepcional (Máxima plenitud física)',
};

function defaultQualityColor(quality) {
  if (quality >= 8) return 'var(--sl-success, #16a34a)';
  if (quality >= 5) return 'var(--sl-warning, #d97706)';
  return 'var(--sl-danger, #dc2626)';
}

export default function SleepRegistrationView({
  athlete,
  onSave,
  onCancel,
  isSaving = false,
  systemDate = new Date().toISOString().split('T')[0],
  registrarRole = 'Administrador',
  qualityColor = defaultQualityColor,
}) {
  const [selectedQuality, setSelectedQuality] = useState(7);
  const [localSaving, setLocalSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!athlete) {
    return (
      <div className="sleep-registration-view">
        <div className="sl-card sl-card--centered" style={{ textAlign: 'center', padding: '2rem' }}>
          <p className="sl-empty-message">No se ha seleccionado ningún atleta para el registro.</p>
          <button
            type="button"
            className="sl-btn sl-btn-primary"
            onClick={onCancel}
            style={{ marginTop: '1rem' }}
          >
            <ArrowLeft size={16} /> Volver a Pendientes
          </button>
        </div>
      </div>
    );
  }

  // Extraer datos del atleta de manera normalizada
  const firstName = athlete.first_name || athlete.nombres || (athlete.name ? athlete.name.split(' ')[0] : '') || '-';
  const lastName = athlete.last_name || athlete.apellidos || athlete.lastname || (athlete.name ? athlete.name.split(' ').slice(1).join(' ') : '') || '-';
  const cedula = athlete.cedula || '-';
  const area = athlete.area || athlete.assignments?.[0]?.area || 'General';
  const subarea = athlete.subarea || (Array.isArray(athlete.subareas) ? athlete.subareas.join(', ') : athlete.subarea) || '-';

  const busy = isSaving || localSaving;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!athlete.id) {
      setErrorMessage('No se encontró el ID único del atleta seleccionado.');
      return;
    }
    setErrorMessage('');
    setLocalSaving(true);
    try {
      if (onSave) {
        // IMPORTANTE: Se guarda utilizando el ID único del atleta
        await onSave(athlete.id, selectedQuality);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        'Error al guardar el registro de sueño.'
      );
      setLocalSaving(false);
    }
  };

  const currentColor = qualityColor(selectedQuality);

  return (
    <div className="sleep-registration-view">
      <div className="sl-card sl-card--centered">
        {/* Cabecera del Formulario */}
        <div className="sl-card-header sl-reg-header">
          <div>
            <span className="sl-module-heading__eyebrow">MÓDULO DE SUEÑO Y DESCANSO</span>
            <h2 className="sl-card-title">Registrar Sueño</h2>
            <p className="sl-reg-subtitle">
              Complete la métrica diaria de fatiga percibida para el atleta seleccionado.
            </p>
          </div>
          {onCancel && (
            <button
              type="button"
              className="sl-btn sl-btn-sm sl-btn-back"
              onClick={onCancel}
              disabled={busy}
              title="Volver a Pendientes"
            >
              <ArrowLeft size={16} />
              <span>Volver a Pendientes</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="sl-reg-form">
          {/* Alerta de error si ocurre */}
          {errorMessage && (
            <div className="sl-reg-alert sl-reg-alert--error" role="alert">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Sección de Datos del Atleta (SOLO LECTURA) */}
          <div className="sl-readonly-section">
            <div className="sl-readonly-section__header">
              <span className="sl-readonly-section__title">
                <User size={16} /> Datos del Atleta (Solo Lectura)
              </span>
              <span className="sl-readonly-badge">
                ID Único: #{athlete.id}
              </span>
            </div>

            <div className="sl-readonly-grid">
              <div className="sl-form-col">
                <label className="sl-form-label" htmlFor="reg-athlete-name">Nombre</label>
                <input
                  id="reg-athlete-name"
                  type="text"
                  className="sl-input sl-input--readonly"
                  value={firstName}
                  readOnly
                  disabled
                />
              </div>

              <div className="sl-form-col">
                <label className="sl-form-label" htmlFor="reg-athlete-lastname">Apellido</label>
                <input
                  id="reg-athlete-lastname"
                  type="text"
                  className="sl-input sl-input--readonly"
                  value={lastName}
                  readOnly
                  disabled
                />
              </div>

              <div className="sl-form-col">
                <label className="sl-form-label" htmlFor="reg-athlete-cedula">Cédula</label>
                <input
                  id="reg-athlete-cedula"
                  type="text"
                  className="sl-input sl-input--readonly"
                  value={cedula}
                  readOnly
                  disabled
                />
              </div>

              <div className="sl-form-col">
                <label className="sl-form-label" htmlFor="reg-athlete-area">Área</label>
                <input
                  id="reg-athlete-area"
                  type="text"
                  className="sl-input sl-input--readonly"
                  value={area}
                  readOnly
                  disabled
                />
              </div>

              <div className="sl-form-col sl-form-col--full">
                <label className="sl-form-label" htmlFor="reg-athlete-subarea">Sub área</label>
                <input
                  id="reg-athlete-subarea"
                  type="text"
                  className="sl-input sl-input--readonly"
                  value={subarea}
                  readOnly
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Sección de Entrada de Datos de Sueño */}
          <div className="sl-sleep-input-section">
            <div className="sl-sleep-input-header">
              <label className="sl-form-label sl-form-label--prominent" htmlFor="sleep-quality-range">
                Calidad del Sueño (Escala 1 al 10)
              </label>
              <div
                className="sl-quality-display-badge"
                style={{
                  backgroundColor: `color-mix(in srgb, ${currentColor} 15%, transparent)`,
                  borderColor: currentColor,
                  color: currentColor,
                }}
              >
                <span className="sl-quality-display-badge__num">{selectedQuality}</span>
                <span className="sl-quality-display-badge__max">/ 10</span>
              </div>
            </div>

            <p className="sl-quality-description-text" style={{ color: currentColor }}>
              {QUALITY_LABELS[selectedQuality]}
            </p>

            {/* Slider de Calidad */}
            <div className="sl-quality-slider-container">
              <input
                id="sleep-quality-range"
                type="range"
                min={1}
                max={10}
                step={1}
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(Number(e.target.value))}
                className="sl-quality-slider__input"
                style={{ accentColor: currentColor }}
                aria-label="Calidad del sueño del 1 al 10"
                disabled={busy}
              />
              <div className="sl-quality-slider__labels">
                <span>1 · Pésimo</span>
                <span>5 · Regular</span>
                <span>10 · Óptimo</span>
              </div>
            </div>

            {/* Botones de Selección Rápida 1 a 10 */}
            <div className="sl-quick-quality-buttons" role="group" aria-label="Selección rápida de nivel de sueño">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const isSelected = selectedQuality === num;
                const numColor = qualityColor(num);
                return (
                  <button
                    key={num}
                    type="button"
                    className={`sl-quick-btn ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setSelectedQuality(num)}
                    disabled={busy}
                    style={
                      isSelected
                        ? {
                            backgroundColor: numColor,
                            borderColor: numColor,
                            color: '#ffffff',
                          }
                        : {}
                    }
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Metadata y Nota de Auditoría */}
          <div className="sl-reg-meta-bar">
            <span className="sl-reg-meta-item">
              Fecha asignada: <strong>{systemDate}</strong>
            </span>
            <span className="sl-reg-meta-item">
              Registrado por: <strong>{registrarRole}</strong>
            </span>
          </div>

          {/* Botones de Acción */}
          <div className="sl-actions sl-reg-actions">
            {onCancel && (
              <button
                type="button"
                className="sl-btn sl-btn-secondary"
                onClick={onCancel}
                disabled={busy}
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              className="sl-btn sl-btn-primary"
              disabled={busy}
            >
              {busy ? (
                <>
                  <span className="sl-spinner" aria-hidden="true" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Guardar Registro</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}