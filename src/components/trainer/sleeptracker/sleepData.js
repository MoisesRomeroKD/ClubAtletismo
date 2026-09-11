export const SYSTEM_DATE = '2026-07-30';

export const athletesUniverse = [
  { id: 1, name: 'Juan Pérez', area: 'Velocidad', subarea: '100 m' },
  { id: 2, name: 'María García', area: 'Velocidad', subarea: '100 m' },
  { id: 3, name: 'Luis Fernández', area: 'Velocidad', subarea: '100 m' },
  { id: 4, name: 'Ana Martínez', area: 'Velocidad', subarea: '100 m' },
  { id: 5, name: 'Carlos López', area: 'Velocidad', subarea: '200 m' },
  { id: 6, name: 'Elena Rojas', area: 'Velocidad', subarea: '200 m' },
  { id: 7, name: 'David Silva', area: 'Velocidad', subarea: '200 m' },
  { id: 8, name: 'Pedro Rodríguez', area: 'Lanzamientos', subarea: 'Jabalina' },
  { id: 9, name: 'Sofía Castro', area: 'Lanzamientos', subarea: 'Jabalina' },
  { id: 10, name: 'Diego Torres', area: 'Lanzamientos', subarea: 'Jabalina' },
];

/**
 * 🛠️ Generador de Datos Anuales de Sueño
 * Crea un historial de 1 año (365 días) hacia atrás desde el SYSTEM_DATE.
 * Incluye lógica de consistencia (probabilidad de registrar) para KPIs realistas.
 */
const generateAnnualSleepData = () => {
  const records = [];
  const endDate = new Date(SYSTEM_DATE);
  const startDate = new Date(SYSTEM_DATE);
  startDate.setFullYear(startDate.getFullYear() - 1); // Exactamente 1 año atrás

  // Iteramos día por día desde hace un año hasta la fecha del sistema
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    // Formateamos la fecha a YYYY-MM-DD
    const dateStr = d.toISOString().split('T')[0];

    athletesUniverse.forEach((athlete) => {
      // 🎲 Lógica de realismo:
      // - 85% de probabilidad de que el atleta registre su sueño ese día.
      // - Si no entra en el 85%, el día queda en blanco (genera "pendientes").
      const didRegister = Math.random() < 0.85;

      if (didRegister) {
        // Calidad del sueño aleatoria entre 4 y 10 (con sesgo hacia 6-9)
        const baseQuality = Math.floor(Math.random() * (10 - 4 + 1)) + 4;
        
        // 90% de las veces lo registra el Atleta, 10% el Entrenador (auditoría realista)
        const isSelfRegistered = Math.random() < 0.90;

        records.push({
          athleteId: athlete.id,
          date: dateStr,
          quality: baseQuality,
          registrarName: isSelfRegistered ? athlete.name : 'Entrenador (Sistema)',
          registrarRole: isSelfRegistered ? 'Atleta' : 'Entrenador',
        });
      }
    });
  }

  // Ordenamos del más reciente al más antiguo para mayor consistencia
  return records.sort((a, b) => new Date(b.date) - new Date(a.date));
};

// 💤 Exportamos la data generada. 
// Esto alimentará perfectamente tus filtros de día, semana, mes, semestre y año.
export const initialSleepRecords = generateAnnualSleepData();