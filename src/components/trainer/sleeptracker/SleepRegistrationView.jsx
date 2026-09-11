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
  systemDate
}) {
  return (
    <div className="sl-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="sl-card-header">
        <h2 className="sl-card-title">Registrar Sueño Manualmente</h2>
      </div>

      <div className="sl-form-group" style={{ padding: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Seleccionar Atleta</label>
        <select 
          className="sl-select" 
          style={{ width: '100%', marginBottom: '24px' }}
          value={selectedAthleteForReg?.id || ''}
          onChange={(e) => {
            const athlete = athletes.find(a => a.id === parseInt(e.target.value));
            setSelectedAthleteForReg(athlete || null);
          }}
        >
          <option value="">-- Seleccione un atleta --</option>
          {athletes.map(athlete => (
            <option key={athlete.id} value={athlete.id}>{athlete.name} - {athlete.area}</option>
          ))}
        </select>

        {selectedAthleteForReg && (
          <>
            <div style={{ marginBottom: 24, padding: 12, background: '#eff6ff', borderRadius: 'var(--sl-radius-md)' }}>
              <div style={{ fontSize: '.875rem', color: 'var(--sl-text-secondary)' }}>Atleta seleccionado:</div>
              <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{selectedAthleteForReg.name}</div>
              <div style={{ fontSize: '.875rem', color: 'var(--sl-text-muted)', marginTop: 4 }}>
                Fecha asignada: {systemDate}
              </div>
            </div>

            <div className="sl-form-group">
              <label>Calidad del Sueño (1 = Muy mal, 10 = Excelente)</label>
              <div className="sl-quality-selector" style={{ marginTop: '12px' }}>
                {Array.from({ length: 10 }, (_, index) => index + 1).map((quality) => (
                  <button
                    key={quality}
                    type="button"
                    className={`sl-q-btn ${selectedQuality === quality ? 'selected' : ''}`}
                    onClick={() => setSelectedQuality(quality)}
                    style={{
                      color: selectedQuality === quality ? 'white' : qualityColor(quality),
                      backgroundColor: selectedQuality === quality ? qualityColor(quality) : 'white',
                      borderColor: selectedQuality === quality ? qualityColor(quality) : 'var(--sl-border)',
                      padding: '10px 15px',
                      margin: '5px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {quality}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
              <button 
                className="sl-btn" 
                type="button" 
                style={{ background: 'white', border: '1px solid var(--sl-border)' }} 
                onClick={() => { setSelectedAthleteForReg(null); setSelectedQuality(null); }}
              >
                Limpiar Formulario
              </button>
              <button className="sl-btn sl-btn-primary" type="button" onClick={saveRegistration}>
                Guardar Registro
              </button>
            </div>
            <p style={{ fontSize: '.75rem', color: 'var(--sl-text-muted)', marginTop: 12, textAlign: 'right' }}>
              El registro quedará marcado como realizado por: <span style={{ fontWeight: 600 }}>Entrenador</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}