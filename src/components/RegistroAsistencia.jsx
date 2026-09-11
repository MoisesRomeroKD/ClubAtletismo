import React, { useState, useEffect } from 'react';

// ==========================================
// ESTILOS PUROS (CSS)
// Se inyectan aquí para mantener el formato de un solo archivo
// sin usar librerías externas ni Tailwind.
// ==========================================
const pureCSS = `
  .attendance-app {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    color: #333;
    background-color: #f9fafb;
    min-height: 100vh;
  }
  .header {
    margin-bottom: 24px;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 16px;
  }
  .header h1 {
    margin: 0 0 16px 0;
    font-size: 24px;
    color: #111827;
  }
  .controls {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }
  .control-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .control-group label {
    font-size: 14px;
    font-weight: 600;
    color: #4b5563;
  }
  .control-group input, .control-group select {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 15px;
    outline: none;
    background: #fff;
  }
  .control-group input:focus, .control-group select:focus {
    border-color: #3b82f6;
  }
  
  .message {
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 20px;
    font-weight: 500;
  }
  .message.error { background-color: #fee2e2; color: #991b1b; border: 1px solid #f87171; }
  .message.success { background-color: #dcfce3; color: #166534; border: 1px solid #86efac; }

  .athlete-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
  }
  
  .athlete-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: box-shadow 0.2s, border-color 0.2s;
  }
  .athlete-card:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    border-color: #d1d5db;
  }
  
  .athlete-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: #6b7280;
    flex-shrink: 0;
  }
  .athlete-details {
    display: flex;
    flex-direction: column;
  }
  .athlete-name {
    font-weight: 600;
    font-size: 16px;
  }
  .athlete-time {
    font-size: 12px;
    color: #9ca3af;
  }

  .actions-container {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }

  .status-group {
    display: flex;
    gap: 8px;
  }
  .btn-status {
    padding: 8px 16px;
    border: 1px solid #d1d5db;
    border-radius: 20px;
    background: #f9fafb;
    cursor: pointer;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.2s;
    color: #4b5563;
  }
  .btn-status:hover {
    background: #f3f4f6;
  }
  
  /* Estados Visuales */
  .btn-status.present.active { background-color: #10b981; border-color: #10b981; color: white; }
  .btn-status.absent.active { background-color: #ef4444; border-color: #ef4444; color: white; }
  .btn-status.justified.active { background-color: #f59e0b; border-color: #f59e0b; color: white; }

  .observation-input {
    width: 100%;
    max-width: 300px;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    resize: vertical;
    min-height: 40px;
    outline: none;
  }
  .observation-input:focus { border-color: #f59e0b; }

  .btn-save {
    width: 100%;
    padding: 16px;
    background-color: #2563eb;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .btn-save:hover { background-color: #1d4ed8; }
  .btn-save:disabled { background-color: #93c5fd; cursor: not-allowed; }

  /* MOBILE RESPONSIVE */
  @media (max-width: 600px) {
    .athlete-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
    .actions-container {
      width: 100%;
      align-items: flex-start;
    }
    .status-group {
      width: 100%;
      justify-content: space-between;
    }
    .btn-status {
      flex: 1;
      padding: 8px 0;
      text-align: center;
    }
    .observation-input {
      max-width: 100%;
    }
  }
`;

// ==========================================
// COMPONENTE: AthleteRow
// ==========================================
const AthleteRow = ({ athlete, updateAthlete }) => {
  const { id, name, status, observation, time } = athlete;

  // Obtener iniciales para el avatar
  const getInitials = (fullName) => {
    return fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleStatusChange = (newStatus) => {
    updateAthlete(id, { 
      status: newStatus, 
      // Si cambia a algo distinto de "Justificado", limpiamos la observación
      observation: newStatus === 'Justificado' ? observation : '' 
    });
  };

  return (
    <div className="athlete-card">
      <div className="athlete-info">
        <div className="avatar">{getInitials(name)}</div>
        <div className="athlete-details">
          <span className="athlete-name">{name}</span>
          {time && <span className="athlete-time">Marcado: {time}</span>}
        </div>
      </div>
      
      <div className="actions-container">
        <div className="status-group">
          <button 
            className={`btn-status present ${status === 'Presente' ? 'active' : ''}`}
            onClick={() => handleStatusChange('Presente')}
          >
            Presente
          </button>
          <button 
            className={`btn-status absent ${status === 'Inasistente' ? 'active' : ''}`}
            onClick={() => handleStatusChange('Inasistente')}
          >
            Inasistente
          </button>
          <button 
            className={`btn-status justified ${status === 'Justificado' ? 'active' : ''}`}
            onClick={() => handleStatusChange('Justificado')}
          >
            Justificado
          </button>
        </div>

        {status === 'Justificado' && (
          <textarea
            className="observation-input"
            placeholder="Motivo de la justificación..."
            value={observation}
            onChange={(e) => updateAthlete(id, { observation: e.target.value })}
            rows={1}
          />
        )}
      </div>
    </div>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL: AttendancePage (App)
// ==========================================
export default function App() {
  // Estado general de la aplicación
  const [date, setDate] = useState('');
  const [shift, setShift] = useState('Mañana');
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Base de datos simulada de registros ya guardados (Frontend DB)
  const [savedRecords, setSavedRecords] = useState([]);

  // Estado de atletas (Inicializado sin estado para forzar el registro)
  const [attendance, setAttendance] = useState([
    { id: 1, name: "Juan Pérez", status: "", observation: "", time: null },
    { id: 2, name: "María Gómez", status: "", observation: "", time: null },
    { id: 3, name: "Carlos López", status: "", observation: "", time: null },
    { id: 4, name: "Ana Martínez", status: "", observation: "", time: null }
  ]);

  // Setear la fecha actual al cargar
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
  }, []);

  // Función para actualizar un atleta específico
  const updateAthlete = (id, updates) => {
    setAttendance(prev => prev.map(athlete => 
      athlete.id === id ? { ...athlete, ...updates } : athlete
    ));
    // Limpiar mensajes si el usuario vuelve a interactuar
    setMessage({ text: '', type: '' });
  };

  const handleSave = () => {
    // 1. Validación: Todos deben tener un estado
    const incomplete = attendance.filter(a => a.status === "");
    if (incomplete.length > 0) {
      setMessage({ 
        text: `Faltan ${incomplete.length} atletas por registrar estado.`, 
        type: 'error' 
      });
      return;
    }

    // 2. Validación MVP: Duplicados por fecha + turno
    const recordKey = `${date}-${shift}`;
    if (savedRecords.includes(recordKey)) {
      setMessage({ 
        text: `Ya existe un registro para la fecha ${date} en el turno ${shift}.`, 
        type: 'error' 
      });
      return;
    }

    // 3. Generar Timestamp para cada atleta
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const finalData = attendance.map(a => ({
      ...a,
      time: timeString
    }));

    setAttendance(finalData);

    // 4. Guardar en registro simulado y mostrar éxito
    setSavedRecords([...savedRecords, recordKey]);
    setMessage({ 
      text: '¡Asistencia guardada exitosamente!', 
      type: 'success' 
    });
    
    // Aquí iría el fetch/POST a una API real.
    console.log("Payload a enviar:", {
      fecha: date,
      turno: shift,
      registros: finalData
    });
  };

  return (
    <div className="attendance-app">
      <style>{pureCSS}</style>
      
      <div className="header">
        <h1>Registro de Asistencia</h1>
        <div className="controls">
          <div className="control-group">
            <label>Fecha</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => {
                setDate(e.target.value);
                setMessage({ text: '', type: '' });
              }} 
            />
          </div>
          <div className="control-group">
            <label>Turno</label>
            <select 
              value={shift} 
              onChange={(e) => {
                setShift(e.target.value);
                setMessage({ text: '', type: '' });
              }}
            >
              <option value="Mañana">Mañana</option>
              <option value="Tarde">Tarde</option>
              <option value="Noche">Noche</option>
            </select>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="athlete-list">
        {attendance.map(athlete => (
          <AthleteRow 
            key={athlete.id} 
            athlete={athlete} 
            updateAthlete={updateAthlete} 
          />
        ))}
      </div>

      <button className="btn-save" onClick={handleSave}>
        Guardar Asistencia
      </button>
    </div>
  );
}