export const mockAthletes = [
  { id: 7, name: "Carlos Pérez", disciplina: "100m Planos", categoria: "Sub-20" },
  { id: 8, name: "María Rodríguez", disciplina: "Salto Largo", categoria: "Sub-16" },
  { id: 9, name: "Juan Soto", disciplina: "Lanzamiento de Jabalina", categoria: "Sub-18" },
  { id: 10, name: "Ana López", disciplina: "400m con Vallas", categoria: "Sub-18" },
  { id: 11, name: "Luis García", disciplina: "Maratón", categoria: "Senior" }
];

// Diccionario de rutinas por ID de atleta
export const mockRoutines = {
  7: { Lunes: "Series 10x100m", Martes: "Pesas Superior", Miercoles: "Descanso Activo", Jueves: "Salidas de taco", Viernes: "Fuerza", Sabado: "Competición", Domingo: "Descanso" },
  8: { Lunes: "Técnica de carrera", Martes: "Saltos pliométricos", Miercoles: "Gimnasio", Jueves: "Técnica de foso", Viernes: "Velocidad", Sabado: "Fondo suave", Domingo: "Descanso" },
  9: { Lunes: "Lanzamientos técnicos", Martes: "Hombro y Espalda", Miercoles: "Flexibilidad", Jueves: "Potencia pierna", Viernes: "Lanzamiento distancia", Sabado: "Técnica", Domingo: "Descanso" },
  10: { Lunes: "Pasaje de vallas", Martes: "Resistencia lactácida", Miercoles: "Descanso", Jueves: "Vallas técnica", Viernes: "Velocidad 200m", Sabado: "Fondo 5km", Domingo: "Descanso" },
  11: { Lunes: "Trote 15km", Martes: "Intervalos largos", Miercoles: "Trote 10km", Jueves: "Fuerza resistencia", Viernes: "Trote 12km", Sabado: "Tirada larga 25km", Domingo: "Descanso" }
};

// Generador de datos de sueño dinámico
export const getSleepData = (athleteId) => {
  const id = parseInt(athleteId);
  
  // Datos base para simular diferentes comportamientos
  const series = {
    7: [ { h: 8, c: 7 }, { h: 7, c: 6 }, { h: 8, c: 8 }, { h: 9, c: 9 }, { h: 7, c: 7 }, { h: 6, c: 5 }, { h: 9, c: 8 } ], // Carlos
    8: [ { h: 9, c: 9 }, { h: 9, c: 8 }, { h: 10, c: 9 }, { h: 8, c: 8 }, { h: 9, c: 9 }, { h: 10, c: 10 }, { h: 9, c: 9 } ], // María (Duerme mucho)
    9: [ { h: 7, c: 5 }, { h: 6, c: 4 }, { h: 7, c: 6 }, { h: 5, c: 4 }, { h: 6, c: 5 }, { h: 8, c: 7 }, { h: 7, c: 6 } ], // Juan (Mal descanso)
    10: [ { h: 8, c: 8 }, { h: 7, c: 7 }, { h: 8, c: 8 }, { h: 7, c: 7 }, { h: 8, c: 8 }, { h: 7, c: 7 }, { h: 8, c: 8 } ], // Ana (Estable)
    11: [ { h: 6, c: 7 }, { h: 6, c: 6 }, { h: 7, c: 8 }, { h: 6, c: 7 }, { h: 6, c: 6 }, { h: 7, c: 9 }, { h: 8, c: 10 } ] // Luis (Poco pero calidad)
  };

  const selectedSeries = series[id] || series[7]; // Default a Carlos si el ID falla
  const dias = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  return selectedSeries.map((item, index) => ({
    fecha: dias[index],
    horas: item.h,
    calidad: item.c
  }));
};