import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

const DAYS_OF_WEEK = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
];

/**
 * Calcula las fechas de inicio y fin para cada semana basándose en la fecha global
 */
const computeWeekDates = (startDateStr, weekIndex) => {
  if (!startDateStr) return { startDate: '', endDate: '' };

  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return { startDate: '', endDate: '' };

  // Avanzar N semanas
  start.setDate(start.getDate() + weekIndex * 7);
  
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  };
};

/**
 * Genera o sincroniza la estructura de semanas
 */
const createWeeksStructure = (count, globalStartDate, existingWeeks = []) => {
  const newWeeks = [];

  for (let i = 0; i < count; i++) {
    const weekNumber = i + 1;
    const existing = existingWeeks.find(w => w.weekNumber === weekNumber);
    const computedDates = computeWeekDates(globalStartDate, i);

    if (existing) {
      newWeeks.push({
        ...existing,
        startDate: computedDates.startDate || existing.startDate,
        endDate: computedDates.endDate || existing.endDate,
      });
    } else {
      newWeeks.push({
        id: `week-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
        weekNumber,
        objective: '',
        startDate: computedDates.startDate,
        endDate: computedDates.endDate,
        sessions: DAYS_OF_WEEK.map((day, dayIndex) => ({
          id: `session-${weekNumber}-${dayIndex}`,
          day,
          exercises: []
        }))
      });
    }
  }

  return newWeeks;
};

export const usePlanBuilder = (initialWeeksCount = 8, initialPlan = null) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [planDetails, setPlanDetails] = useState(() => ({
    name: initialPlan?.nombre || '',
    description: initialPlan?.descripcion || '',
  }));
  const [numWeeks, setNumWeeks] = useState(() => initialPlan?.weeks?.length || initialWeeksCount);
  const [startDate, setStartDate] = useState(() => initialPlan?.weeks?.[0]?.fecha_inicio || '');
  const [weeks, setWeeks] = useState(() => {
    if (!initialPlan?.weeks?.length) return createWeeksStructure(initialWeeksCount, '');
    return initialPlan.weeks.map((week) => ({
      id: `week-${week.id}`,
      weekNumber: week.numero_semana,
      objective: week.objetivo || '',
      startDate: week.fecha_inicio || '',
      endDate: week.fecha_fin || '',
      sessions: (week.sessions || []).map((session) => ({
        id: `session-${session.id}`,
        day: session.dia_semana,
        exercises: (session.session_exercises || []).map((exercise) => ({
          id: exercise.id,
          exerciseId: exercise.exercise,
          exercise: exercise.exercise_name || `Ejercicio ${exercise.exercise}`,
          sets: String(exercise.series),
          reps: String(exercise.repeticiones),
          micro: exercise.micro_pausa || '',
          macro: exercise.macro_pausa || '',
          intensity: exercise.intensidad || '',
        })),
      })),
    }));
  });
  const previousConfiguration = useRef({
    numWeeks: initialPlan?.weeks?.length || initialWeeksCount,
    startDate: initialPlan?.weeks?.[0]?.fecha_inicio || '',
  });

  // Sincronización al cambiar numWeeks o startDate
  useEffect(() => {
    if (previousConfiguration.current.numWeeks === numWeeks
      && previousConfiguration.current.startDate === startDate) return;
    previousConfiguration.current = { numWeeks, startDate };
    setWeeks(prevWeeks => createWeeksStructure(numWeeks, startDate, prevWeeks));
  }, [numWeeks, startDate]);

  const totalExercises = useMemo(() => {
    return weeks.reduce((accW, week) => {
      return accW + week.sessions.reduce((accS, session) => accS + session.exercises.length, 0);
    }, 0);
  }, [weeks]);

  const handleWeekUpdate = useCallback((updatedWeek) => {
    setWeeks(prevWeeks => prevWeeks.map(w => w.id === updatedWeek.id ? updatedWeek : w));
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep === 1 && !planDetails.name.trim()) {
      alert('Por favor, ingresa el nombre del plan antes de continuar.');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  }, [currentStep, planDetails.name]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const resetBuilder = useCallback(() => {
    setCurrentStep(1);
    setPlanDetails({ name: '', description: '' });
    setNumWeeks(initialWeeksCount);
    setStartDate('');
    setWeeks(createWeeksStructure(initialWeeksCount, ''));
  }, [initialWeeksCount]);

  const goToStep = useCallback((step) => {
    if (step > 1 && !planDetails.name.trim()) return;
    setCurrentStep(step);
  }, [planDetails.name]);

  return {
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    planDetails,
    setPlanDetails,
    numWeeks,
    setNumWeeks,
    startDate,
    setStartDate,
    weeks,
    setWeeks,
    totalExercises,
    handleWeekUpdate,
    resetBuilder,
  };
};