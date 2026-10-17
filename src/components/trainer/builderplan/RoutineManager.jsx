import { useEffect, useState } from 'react';
import RoutineService from '../../../api/services/RoutineService';
import BuilderPlanForm from './BuilderPlanForm';
import '../../../styles/components/trainer/BuilderPlanForm.css';

const formatError = (value) => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(formatError).filter(Boolean).join(' ');
  if (value && typeof value === 'object') {
    return Object.entries(value).map(([field, detail]) => `${field}: ${formatError(detail)}`).join(' ');
  }
  return '';
};

const errorText = (error) => formatError(error.response?.data?.detail ?? error.response?.data)
  || error.message
  || 'No se pudieron cargar las rutinas.';

export default function RoutineManager() {
  const [plans, setPlans] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await RoutineService.list();
      setPlans(Array.isArray(response) ? response : response?.results || []);
      setError('');
    } catch (requestError) {
      setError(errorText(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPlans(); }, []);

  const publishPlan = async (plan) => {
    setBusyId(plan.id);
    setError('');
    try {
      await RoutineService.publish(plan.id);
      await loadPlans();
    } catch (requestError) {
      setError(errorText(requestError));
    } finally {
      setBusyId(null);
    }
  };

  if (editingPlan) {
    return (
      <BuilderPlanForm
        plan={editingPlan}
        onCancel={() => setEditingPlan(null)}
        onSaved={async () => {
          setEditingPlan(null);
          await loadPlans();
        }}
      />
    );
  }

  return (
    <section className="routine-manager">
      <header className="routine-manager-header">
        <div>
          <h2>Rutinas asignadas</h2>
          <p>Planes creados por ti, con sus destinatarios y cronograma.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={loadPlans} disabled={loading}>
          Actualizar
        </button>
      </header>

      {error && <p className="builder-feedback-error" role="alert">{error}</p>}
      {loading ? (
        <p role="status">Cargando tus planes...</p>
      ) : plans.length === 0 ? (
        <p>No tienes rutinas creadas.</p>
      ) : (
        <div className="routine-manager-list">
          {plans.map((plan) => {
            const expanded = selectedId === plan.id;
            return (
              <article className="card routine-manager-plan" key={plan.id}>
                <header>
                  <div>
                    <h3>{plan.nombre}</h3>
                    <p>{plan.descripcion || 'Sin descripción'}</p>
                  </div>
                  <span className={`routine-manager-status routine-manager-status--${plan.estado}`}>
                    {plan.estado === 'publicado' ? 'Publicado' : 'Borrador'}
                  </span>
                </header>
                <p>{plan.weeks.length} semanas · {plan.assignments.map((item) => item.athlete_name || item.subarea_name).filter(Boolean).join(', ') || 'Sin asignaciones'}</p>
                <div className="routine-manager-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setSelectedId(expanded ? null : plan.id)}>
                    {expanded ? 'Ocultar detalle' : 'Ver detalle'}
                  </button>
                  {plan.estado === 'borrador' && (
                    <>
                      <button type="button" className="btn btn-outline" onClick={() => setEditingPlan(plan)}>Editar</button>
                      <button type="button" className="btn btn-primary" disabled={busyId === plan.id} onClick={() => publishPlan(plan)}>
                        {busyId === plan.id ? 'Publicando...' : 'Publicar'}
                      </button>
                    </>
                  )}
                </div>
                {expanded && (
                  <div className="routine-manager-detail">
                    {plan.weeks.map((week) => (
                      <section key={week.id}>
                        <h4>Semana {week.numero_semana} · {week.fecha_inicio} – {week.fecha_fin}</h4>
                        <p>{week.objetivo}</p>
                        {week.sessions.map((session) => (
                          <div key={session.id}>
                            <strong>{session.dia_semana}</strong>
                            {session.session_exercises.length ? (
                              <ul>
                                {session.session_exercises.map((item) => (
                                  <li key={item.id}>
                                    {item.exercise_name} · {item.series} series × {item.repeticiones} reps · micro {item.micro_pausa || 'Consultar'} · macro {item.macro_pausa || 'Consultar'} · {item.intensidad || 'Intensidad por consultar'}
                                  </li>
                                ))}
                              </ul>
                            ) : <p>Sin ejercicios asignados.</p>}
                          </div>
                        ))}
                      </section>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}