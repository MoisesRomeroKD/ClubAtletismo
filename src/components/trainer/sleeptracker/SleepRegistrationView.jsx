import React from 'react';
import '../../../styles/components/trainer/SleepRegistrationView.css';

export default function SleepRegistrationView({
  selectedAthleteForReg,
  setSelectedAthleteForReg,
  selectedQuality,
  setSelectedQuality,
  saveRegistration,
  qualityColor,
  athletes = [],
  systemDate,
}) {
  const currentQuality = selectedQuality ?? 5;

  return (
    <div className="sleep-registration-view">
      <div className="sl-card sl-card--centered">
        <div className="sl-card-header">
          <h2 className="sl-card-title">Registrar Sueño Manualmente</h2>
        </div>

        <div className="sl-form-group sl-form-group--padded">
          <label className="sl-form-group__label">Seleccionar Atleta</label>

          <select
            className="sl-select sl-select--block"
            value={selectedAthleteForReg?.id || ''}
            onChange={(e) => {
              const athlete = athletes.find(
                (a) => a.id === parseInt(e.target.value, 10)
              );
              setSelectedAthleteForReg(athlete || null);
            }}
          >
            <option value="">-- Seleccione un atleta --</option>
            {athletes.map((athlete) => (
              <option key={athlete.id} value={athlete.id}>
                {athlete.name} - {athlete.area}
              </option>
            ))}
          </select>

          {selectedAthleteForReg && (
            <>
              <div className="sl-athlete-summary">
                <div className="sl-athlete-summary__hint">Atleta seleccionado:</div>
                <div className="sl-athlete-summary__name">
                  {selectedAthleteForReg.name}
                </div>
                <div className="sl-athlete-summary__meta">
                  Fecha asignada: {systemDate}
                </div>
              </div>

              <div className="sl-form-group">
                <label className="sl-form-group__label">
                  Calidad del Sueño (1 = Muy mal, 10 = Excelente)
                </label>

                <div className="sl-quality-slider">
                  <div className="sl-quality-slider__track-wrap">
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={currentQuality}
                      onChange={(e) => setSelectedQuality(Number(e.target.value))}
                      className="sl-quality-slider__input"
                      style={{ accentColor: qualityColor(currentQuality) }}
                      aria-label="Calidad del sueño (1 a 10)"
                    />
                    <div className="sl-quality-slider__value" style={{ color: qualityColor(currentQuality) }}>
                      {currentQuality}
                    </div>
                  </div>
                  <div className="sl-quality-slider__labels">
                    <span>1 · Muy mal</span>
                    <span>Excelente · 10</span>
                  </div>
                </div>
              </div>

              <div className="sl-actions">
                <button
                  type="button"
                  className="sl-btn"
                  onClick={() => {
                    setSelectedAthleteForReg(null);
                    setSelectedQuality(null);
                  }}
                >
                  Limpiar Formulario
                </button>
                <button
                  type="button"
                  className="sl-btn sl-btn-primary"
                  onClick={saveRegistration}
                >
                  Guardar Registro
                </button>
              </div>

              <p className="sl-attribution">
                El registro quedará marcado como realizado por:{' '}
                <strong>Entrenador</strong>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}