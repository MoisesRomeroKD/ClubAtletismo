import { useState, useEffect, useMemo, useCallback } from 'react';

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
        sessions: DAYS_OF_WEEK.map(day => ({
          day,
          exercises: []
        }))
      });
    }
  }

  return newWeeks;
};

export const usePlanBuilder = (initialWeeksCount = 8) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [planDetails, setPlanDetails] = useState({ name: '', description: '' });
  const [numWeeks, setNumWeeks] = useState(initialWeeksCount);
  const [startDate, setStartDate] = useState('');
  
  // Inicialización segura
  const [weeks, setWeeks] = useState(() => 
    createWeeksStructure(initialWeeksCount, '')
  );

  // Sincronización al cambiar numWeeks o startDate
  useEffect(() => {
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
    totalExercises,
    handleWeekUpdate
  };
};