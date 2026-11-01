import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import UserService from '../../api/services/Userservice';
import '../../styles/components/admin/DiscapacidadesAdmin.css';

/*
 * Catálogo de discapacidades (permiso gestionar_discapacidades). Un atleta puede tener varias y una
 * discapacidad, varios atletas: se asignan en Atletas → Editar y en el preregistro.
 * Una discapacidad asignada a atletas no se elimina (el backend lo impide).
 */
const VACIO = { nombre: '', observacion: '' };

const mensajeError = (error, porDefecto) => {
  const data = error?.response?.data;
  if (typeof data?.detail === 'string') return data.detail;
  const primero = data && typeof data === 'object' ? Object.values(data).flat()[0] : '';
  return typeof primero === 'string' ? primero : porDefecto;
};

export default function DiscapacidadesAdmin() {
  const [lista, setLista] = useState({ cargando: true, filas: [], error: '' });
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let activo = true;
    UserService.getDiscapacidades()
      .then((filas) => { if (activo) setLista({ cargando: false, filas: Array.isArray(filas) ? filas : [], error: '' }); })
      .catch((error) => { if (activo) setLista({ cargando: false, filas: [], error: mensajeError(error, 'No se pudo cargar el catálogo.') }); });
    return () => { activo = false; };
  }, [recarga]);

  const palabras = form.observacion.trim() ? form.observacion.trim().split(/\s+/).length : 0;

  const cancelar = () => {
    setForm(VACIO);
    setEditandoId(null);
  };

  const guardar = async (event) => {
    event.preventDefault();
    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });
    try {
      if (editandoId) await UserService.updateDiscapacidad(editandoId, form);
      else await UserService.createDiscapacidad(form);
      setMensaje({ tipo: 'ok', texto: editandoId ? 'Discapacidad actualizada.' : 'Discapacidad agregada al catálogo.' });
      cancelar();
      setRecarga((n) => n + 1);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: mensajeError(error, 'No se pudo guardar.') });
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (fila) => {
    if (!window.confirm(`¿Eliminar "${fila.nombre}" del catálogo?`)) return;
    setMensaje({ tipo: '', texto: '' });
    try {
      await UserService.deleteDiscapacidad(fila.id);
      setMensaje({ tipo: 'ok', texto: `"${fila.nombre}" se eliminó del catálogo.` });
      setRecarga((n) => n + 1);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: mensajeError(error, 'No se pudo eliminar.') });
    }
  };

  const editar = (fila) => {
    setEditandoId(fila.id);
    setForm({ nombre: fila.nombre, observacion: fila.observacion || '' });
    setMensaje({ tipo: '', texto: '' });
  };

  return (
    <section className="discap">
      <header className="discap__header">
        <h2>Discapacidades</h2>
        <p>Catálogo de discapacidades y condiciones especiales. Se asignan a cada atleta en Atletas → Editar o al preregistrarlo; un atleta puede tener varias.</p>
      </header>

      <form className="discap__form" onSubmit={guardar}>
        <h3>{editandoId ? 'Editar discapacidad' : 'Agregar discapacidad'}</h3>
        <label>
          <span>Nombre</span>
          <input type="text" required maxLength={100} value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} placeholder="Ej. Discapacidad visual" />
        </label>
        <label>
          <span>Observaciones y cuidados (opcional, hasta 300 palabras)</span>
          <textarea rows={3} value={form.observacion} onChange={(event) => setForm({ ...form, observacion: event.target.value })} />
          <small className={palabras > 300 ? 'discap__error' : 'discap__muted'}>{palabras} / 300 palabras</small>
        </label>
        {mensaje.texto && <p className={mensaje.tipo === 'ok' ? 'discap__ok' : 'discap__error'} role={mensaje.tipo === 'ok' ? 'status' : 'alert'}>{mensaje.texto}</p>}
        <div className="discap__acciones">
          {editandoId && <button type="button" className="discap__btn discap__btn--ghost" onClick={cancelar} disabled={guardando}>Cancelar</button>}
          <button type="submit" className="discap__btn" disabled={guardando || palabras > 300}>
            <Plus size={16} aria-hidden="true" />{guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Agregar'}
          </button>
        </div>
      </form>

      {lista.cargando ? (
        <p className="discap__muted">Cargando catálogo...</p>
      ) : lista.error ? (
        <p className="discap__error" role="alert">{lista.error}</p>
      ) : !lista.filas.length ? (
        <p className="discap__muted">Todavía no hay discapacidades en el catálogo.</p>
      ) : (
        <ul className="discap__lista">
          {lista.filas.map((fila) => (
            <li key={fila.id} className="discap__fila">
              <div>
                <strong>{fila.nombre}</strong>
                {fila.observacion && <span>{fila.observacion}</span>}
                <small>{fila.atletas_total} atleta{fila.atletas_total === 1 ? '' : 's'} con esta discapacidad</small>
              </div>
              <div className="discap__fila-acciones">
                <button type="button" className="discap__icono" onClick={() => editar(fila)} aria-label={`Editar ${fila.nombre}`} title="Editar">
                  <Pencil size={16} aria-hidden="true" />
                </button>
                <button type="button" className="discap__icono discap__icono--peligro" onClick={() => eliminar(fila)} aria-label={`Eliminar ${fila.nombre}`} title="Eliminar">
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
