import { useEffect, useState } from 'react';
import CineantropometriaService from '../../../api/services/Cineantropometriaservice';
import { useApplicationPermissions } from '../../../context/ApplicationPermissionsContext';
import '../../../styles/components/admin/antropometria/ParametrosAntropometria.css';

const mensajeError = (error, fallback) => error?.response?.data?.detail || fallback;

function TarjetaEje({ eje, puedeEditar, onGuardado }) {
  const [form, setForm] = useState({ minimo: eje.minimo, maximo: eje.maximo, inverso: eje.inverso });
  const [estado, setEstado] = useState({ guardando: false, tipo: '', texto: '' });
  const cambiado = form.minimo !== eje.minimo || form.maximo !== eje.maximo || form.inverso !== eje.inverso;

  const guardar = async (event) => {
    event.preventDefault();
    setEstado({ guardando: true, tipo: '', texto: '' });
    try {
      const actualizado = await CineantropometriaService.updateConfiguracion(eje.axis, {
        minimo: form.minimo,
        maximo: form.maximo,
        inverso: form.inverso,
      });
      onGuardado(actualizado);
      setEstado({ guardando: false, tipo: 'ok', texto: 'Guardado. Se aplica a las próximas mediciones.' });
    } catch (error) {
      setEstado({ guardando: false, tipo: 'error', texto: mensajeError(error, 'No se pudo guardar.') });
    }
  };

  return (
    <form className="param-antro-card" onSubmit={guardar}>
      <header>
        <h3>{eje.label}</h3>
        <span className={`param-antro-direccion ${form.inverso ? 'param-antro-direccion--inversa' : ''}`}>
          {form.inverso ? 'Inverso: menor es mejor' : 'Directo: mayor es mejor'}
        </span>
      </header>

      <div className="param-antro-info">
        <p><span>Se mide</span>{eje.mediciones.map((m) => `${m.nombre} (${m.unidad})`).join(' · ')}</p>
        <p><span>Indicador</span>{eje.indicador}</p>
      </div>

      <div className="param-antro-campos">
        <label>
          <span>Vale 0 puntos</span>
          <input
            type="number" step="0.01" required disabled={!puedeEditar}
            value={form.minimo}
            onChange={(event) => setForm({ ...form, minimo: event.target.value === '' ? '' : Number(event.target.value) })}
          />
        </label>
        <label>
          <span>Vale 100 puntos</span>
          <input
            type="number" step="0.01" required disabled={!puedeEditar}
            value={form.maximo}
            onChange={(event) => setForm({ ...form, maximo: event.target.value === '' ? '' : Number(event.target.value) })}
          />
        </label>
        <label className="param-antro-check">
          <input
            type="checkbox" disabled={!puedeEditar}
            checked={form.inverso}
            onChange={(event) => setForm({ ...form, inverso: event.target.checked })}
          />
          Menor es mejor (ej. tiempos)
        </label>
      </div>

      {estado.texto && (
        <p className={estado.tipo === 'ok' ? 'param-antro-ok' : 'param-antro-error'} role={estado.tipo === 'ok' ? 'status' : 'alert'}>{estado.texto}</p>
      )}

      {puedeEditar && (
        <div className="param-antro-acciones">
          <button type="button" className="param-antro-btn param-antro-btn--ghost" disabled={!cambiado || estado.guardando}
            onClick={() => setForm({ minimo: eje.minimo, maximo: eje.maximo, inverso: eje.inverso })}>
            Deshacer
          </button>
          <button type="submit" className="param-antro-btn" disabled={!cambiado || estado.guardando}>Guardar</button>
        </div>
      )}
    </form>
  );
}

export default function ParametrosAntropometria() {
  const { hasPermission } = useApplicationPermissions();
  const [estado, setEstado] = useState({ cargando: true, ejes: [], error: '' });

  useEffect(() => {
    let activo = true;
    CineantropometriaService.getConfiguracion()
      .then((ejes) => { if (activo) setEstado({ cargando: false, ejes: Array.isArray(ejes) ? ejes : [], error: '' }); })
      .catch((error) => { if (activo) setEstado({ cargando: false, ejes: [], error: mensajeError(error, 'No se pudo cargar la configuración.') }); });
    return () => { activo = false; };
  }, []);

  const actualizar = (actualizado) => setEstado((prev) => ({
    ...prev,
    ejes: prev.ejes.map((eje) => (eje.axis === actualizado.axis ? actualizado : eje)),
  }));

  return (
    <div className="param-antro">
      <header className="param-antro-header">
        <h2>Parámetros de antropometría</h2>
        <p>
          Cada eje convierte su medición en un puntaje de 0 a 100. Aquí defines qué valor vale 0 y cuál vale 100.
          Los cambios aplican a las mediciones que se registren desde ahora; las ya guardadas no se recalculan.
        </p>
      </header>

      {estado.cargando && <p className="param-antro-vacio">Cargando configuración...</p>}
      {estado.error && <p className="param-antro-vacio param-antro-error" role="alert">{estado.error}</p>}

      <div className="param-antro-grid">
        {estado.ejes.map((eje) => (
          <TarjetaEje
            key={`${eje.axis}-${eje.fecha_actualizacion}`}
            eje={eje}
            puedeEditar={hasPermission('editar_evaluaciones')}
            onGuardado={actualizar}
          />
        ))}
      </div>
    </div>
  );
}
