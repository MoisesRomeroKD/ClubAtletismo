import React, { useEffect, useMemo, useState } from 'react';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';

import {
  Save,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';

import '../../../styles/components/trainer/CineantropometriaTrainer.css';

import UserService from '../../../api/services/Userservice';
import CineantropometriaService from '../../../api/services/Cineantropometriaservice';


/*
|--------------------------------------------------------------------------
| EJES DEL RADAR
|--------------------------------------------------------------------------
|
| Estos NO representan una clasificación deportiva.
| Son únicamente los seis ejes que devuelve el backend.
|
*/

const AXES = [
  { key: 'Potencia', label: 'Potencia' },
  { key: 'Velocidad', label: 'Velocidad' },
  { key: 'Resistencia', label: 'Resistencia' },
  { key: 'Envergadura', label: 'Envergadura' },
  { key: 'Fuerza', label: 'Fuerza' },
  { key: 'Flexibilidad', label: 'Flexibilidad' }
];


/*
|--------------------------------------------------------------------------
| FORMULARIO
|--------------------------------------------------------------------------
*/

const RAW_FIELDS_INITIAL = {
  potencia: '',
  velocidad: '',
  resistencia: '',
  env_height: '',
  env_reach: '',
  fz_weight: '',
  fz_load: '',
  flexibilidad: ''
};

const REQUIRED_RAW_FIELDS = [
  'potencia',
  'velocidad',
  'resistencia',
  'env_height',
  'env_reach',
  'fz_weight',
  'fz_load',
  'flexibilidad'
];


/*
|--------------------------------------------------------------------------
| UTILIDADES DE PRESENTACIÓN
|--------------------------------------------------------------------------
*/

const resultsToRadarData = (results = []) => {
  return AXES.map((axis) => {
    const result = results.find(
      (item) => item.axis === axis.key
    );

    return {
      subject: axis.label,
      score: Number(result?.score ?? 0)
    };
  });
};


/**
 * Convierte la respuesta del endpoint /radar/
 * directamente al formato de Recharts.
 */
const endpointRadarToChart = (radar = []) => {
  return radar.map((item) => ({
    subject: item.axis,
    score: Number(item.score ?? 0)
  }));
};


/**
 * Busca un resultado concreto dentro de results[].
 */
const getAxisScore = (results = [], axisName) => {
  const result = results.find(
    (item) => item.axis === axisName
  );

  return Number(result?.score ?? 0);
};


/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
*/

const CineantropometriaTrainer = () => {

  /*
  |--------------------------------------------------------------------------
  | DATOS DIRECTOS DEL BACKEND
  |--------------------------------------------------------------------------
  */

  const [athletes, setAthletes] = useState([]);
  const [trainerSubareas, setTrainerSubareas] = useState([]);

  const [loadingAthletes, setLoadingAthletes] = useState(true);
  const [loadingSubareas, setLoadingSubareas] = useState(true);

  const [loadError, setLoadError] = useState(null);


  /*
  |--------------------------------------------------------------------------
  | FILTROS
  |--------------------------------------------------------------------------
  */

  const [filterArea, setFilterArea] = useState('ALL');
  const [filterSubarea, setFilterSubarea] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');


  /*
  |--------------------------------------------------------------------------
  | ATLETA SELECCIONADO
  |--------------------------------------------------------------------------
  */

  const [selectedAthlete, setSelectedAthlete] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | EVALUACIONES DEL ATLETA SELECCIONADO
  |--------------------------------------------------------------------------
  */

  const [evaluations, setEvaluations] = useState([]);
  const [evaluationDetails, setEvaluationDetails] = useState([]);

  const [loadingEvaluations, setLoadingEvaluations] = useState(false);
  const [evaluationError, setEvaluationError] = useState(null);


  /*
  |--------------------------------------------------------------------------
  | RADAR
  |--------------------------------------------------------------------------
  */

  const [selectedRadar, setSelectedRadar] = useState(null);
  const [loadingRadar, setLoadingRadar] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | COMPARACIÓN
  |--------------------------------------------------------------------------
  */

  const [compareActualId, setCompareActualId] = useState('');
  const [comparePreviousId, setComparePreviousId] = useState('');

  const [comparison, setComparison] = useState(null);
  const [loadingComparison, setLoadingComparison] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | FORMULARIO
  |--------------------------------------------------------------------------
  */

  const [formData, setFormData] = useState(RAW_FIELDS_INITIAL);

  const [saveState, setSaveState] = useState('idle');
  const [missingFields, setMissingFields] = useState([]);

  const [evaluationDate, setEvaluationDate] = useState(
    new Date().toISOString().slice(0, 10)
  );


  /*
  |--------------------------------------------------------------------------
  | CONTEXTO DE LA EVALUACIÓN
  |--------------------------------------------------------------------------
  */

  const [selectedSubareaId, setSelectedSubareaId] = useState('');



  /*
  |--------------------------------------------------------------------------
  | CARGAR ATLETAS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true;

    const loadAthletes = async () => {
      try {
        setLoadingAthletes(true);
        setLoadError(null);

        const data = await UserService.getMyAthletes();

        if (!mounted) return;

        setAthletes(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!mounted) return;

        console.error(
          'Error cargando atletas:',
          error
        );

        setLoadError(
          error?.response?.data?.detail ||
          'No se pudieron cargar los atletas asignados.'
        );
      } finally {
        if (mounted) {
          setLoadingAthletes(false);
        }
      }
    };

    loadAthletes();

    return () => {
      mounted = false;
    };
  }, []);



  /*
  |--------------------------------------------------------------------------
  | CARGAR SUBÁREAS DEL ENTRENADOR
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true;

    const loadSubareas = async () => {
      try {
        setLoadingSubareas(true);

        const data = await UserService.getMySubareas();

        if (!mounted) return;

        setTrainerSubareas(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        if (!mounted) return;

        console.error(
          'Error cargando subáreas del entrenador:',
          error
        );

        setLoadError(
          error?.response?.data?.detail ||
          'No se pudieron cargar las áreas asignadas.'
        );
      } finally {
        if (mounted) {
          setLoadingSubareas(false);
        }
      }
    };

    loadSubareas();

    return () => {
      mounted = false;
    };
  }, []);



  /*
  |--------------------------------------------------------------------------
  | ÁREAS DISPONIBLES
  |--------------------------------------------------------------------------
  |
  | Se obtienen directamente de subarea_detalle.area.
  |
  */

  const availableAreas = useMemo(() => {
    const map = new Map();

    trainerSubareas.forEach((item) => {
      const area = item?.subarea_detalle?.area;

      if (!area) return;

      map.set(area.id, area);
    });

    return Array.from(map.values());
  }, [trainerSubareas]);



  /*
  |--------------------------------------------------------------------------
  | SUBÁREAS DISPONIBLES
  |--------------------------------------------------------------------------
  */

  const availableSubareas = useMemo(() => {
    return trainerSubareas
      .map((item) => item?.subarea_detalle)
      .filter(Boolean);
  }, [trainerSubareas]);



  /*
  |--------------------------------------------------------------------------
  | SUBÁREAS FILTRADAS POR ÁREA
  |--------------------------------------------------------------------------
  */

  const filteredSubareas = useMemo(() => {
    if (filterArea === 'ALL') {
      return availableSubareas;
    }

    return availableSubareas.filter(
      (subarea) =>
        String(subarea?.area?.id) === String(filterArea)
    );
  }, [
    availableSubareas,
    filterArea
  ]);




  /*
  |--------------------------------------------------------------------------
  | ATLETAS FILTRADOS
  |--------------------------------------------------------------------------
  |
  | Esto es solamente filtrado de presentación.
  | No determina ninguna característica deportiva.
  |
  */

  const filteredAthletes = useMemo(() => {

    const search = searchQuery
      .trim()
      .toLowerCase();

    return athletes.filter((athlete) => {

      const athleteSubareas =
        athlete?.subareas_nombres || [];

      const matchesSubarea =
        filterSubarea === 'ALL' ||
        athleteSubareas.includes(
          filteredSubareas.find(
            (subarea) =>
              String(subarea.id) === String(filterSubarea)
          )?.nombre
        );

      const matchesSearch =
        !search ||
        String(athlete?.name || '')
          .toLowerCase()
          .includes(search) ||
        String(athlete?.cedula || '')
          .toLowerCase()
          .includes(search);

      /*
       * Cuando se filtra por área, comprobamos
       * si alguna de las subáreas del atleta pertenece
       * al área seleccionada.
       */
      let matchesArea = true;

      if (filterArea !== 'ALL') {
        const areaSubareas = availableSubareas
          .filter(
            (subarea) =>
              String(subarea?.area?.id) === String(filterArea)
          )
          .map((subarea) => subarea.nombre);

        matchesArea = athleteSubareas.some(
          (name) => areaSubareas.includes(name)
        );
      }

      return (
        matchesArea &&
        matchesSubarea &&
        matchesSearch
      );
    });

  }, [
    athletes,
    filterArea,
    filterSubarea,
    filteredSubareas,
    availableSubareas,
    searchQuery
  ]);




  /*
  |--------------------------------------------------------------------------
  | CARGAR EVALUACIONES DE UN ATLETA
  |--------------------------------------------------------------------------
  */

  const loadAthleteEvaluations = async (athleteId) => {

    if (!athleteId) {
      setEvaluations([]);
      setEvaluationDetails([]);
      setSelectedRadar(null);
      return;
    }

    try {

      setLoadingEvaluations(true);
      setEvaluationError(null);

      const data =
        await CineantropometriaService
          .getEvaluationsByAthlete(athleteId);

      const evaluationList =
        Array.isArray(data) ? data : [];

      setEvaluations(evaluationList);


      /*
       * Para evolución histórica necesitamos
       * los resultados reales de cada evaluación.
       *
       * El backend sigue siendo quien calcula los scores.
       */
      const details = await Promise.all(
        evaluationList.map(async (evaluation) => {
          try {
            return await CineantropometriaService
              .getEvaluationDetail(evaluation.id);
          } catch (error) {
            console.error(
              `Error cargando evaluación ${evaluation.id}:`,
              error
            );

            return null;
          }
        })
      );

      const validDetails =
        details.filter(Boolean);

      setEvaluationDetails(validDetails);


      /*
       * Ordenamos únicamente para presentación.
       * No estamos tomando ninguna decisión deportiva.
       */
      const ordered = [...evaluationList].sort(
        (a, b) =>
          new Date(b.date) - new Date(a.date)
      );


      if (ordered.length > 0) {

        const latest = ordered[0];

        setCompareActualId(
          String(latest.id)
        );

        if (ordered.length > 1) {
          setComparePreviousId(
            String(ordered[1].id)
          );
        } else {
          setComparePreviousId('');
        }


        /*
         * Radar del backend.
         */
        try {

          setLoadingRadar(true);

          const radar =
            await CineantropometriaService
              .getEvaluationRadar(latest.id);

          setSelectedRadar(radar);

        } catch (error) {

          console.error(
            'Error cargando radar:',
            error
          );

          setSelectedRadar(null);

        } finally {

          setLoadingRadar(false);
        }

      } else {

        setCompareActualId('');
        setComparePreviousId('');
        setSelectedRadar(null);
      }

    } catch (error) {

      console.error(
        'Error cargando evaluaciones:',
        error
      );

      setEvaluationError(
        error?.response?.data?.detail ||
        'No se pudieron cargar las evaluaciones del atleta.'
      );

      setEvaluations([]);
      setEvaluationDetails([]);
      setSelectedRadar(null);

    } finally {

      setLoadingEvaluations(false);
    }
  };



  /*
  |--------------------------------------------------------------------------
  | SELECCIONAR ATLETA PARA EVALUAR
  |--------------------------------------------------------------------------
  */

  const handleSelectForEvaluation = async (athlete) => {

    setSelectedAthlete(athlete);

    setFormData({
      ...RAW_FIELDS_INITIAL
    });

    setSaveState('idle');
    setMissingFields([]);

    setEvaluationDate(
      new Date().toISOString().slice(0, 10)
    );


    /*
     * Seleccionamos la primera subárea asignada
     * al atleta que también esté habilitada para
     * el entrenador.
     *
     * Esto no interpreta al atleta.
     * Solamente identifica una relación ya existente.
     */

    const athleteSubareaNames =
      athlete?.subareas_nombres || [];

    const matchingSubarea =
      availableSubareas.find(
        (subarea) =>
          athleteSubareaNames.includes(
            subarea.nombre
          )
      );

    setSelectedSubareaId(
      matchingSubarea
        ? String(matchingSubarea.id)
        : ''
    );


    await loadAthleteEvaluations(
      athlete.user_id
    );

    setTimeout(() => {
      const element =
        document.getElementById(
          'nueva-evaluacion'
        );

      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 50);
  };



  /*
  |--------------------------------------------------------------------------
  | SELECCIONAR ATLETA PARA PERFIL
  |--------------------------------------------------------------------------
  */

  const handleSelectForProfile = async (athlete) => {

    setSelectedAthlete(athlete);

    await loadAthleteEvaluations(
      athlete.user_id
    );

    setTimeout(() => {
      const element =
        document.getElementById(
          'vista-global'
        );

      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 50);
  };



  /*
  |--------------------------------------------------------------------------
  | INPUTS
  |--------------------------------------------------------------------------
  */

  const handleInputChange = (event) => {

    const {
      name,
      value
    } = event.target;

    if (
      value === '' ||
      /^-?\d*\.?\d*$/.test(value)
    ) {
      setFormData((previous) => ({
        ...previous,
        [name]: value
      }));
    }
  };



  /*
  |--------------------------------------------------------------------------
  | VALIDACIÓN DE CAMPOS
  |--------------------------------------------------------------------------
  */

  const validate = () => {

    const missing =
      REQUIRED_RAW_FIELDS.filter(
        (field) =>
          !String(formData[field]).trim()
      );

    setMissingFields(missing);

    return missing.length === 0;
  };



  /*
  |--------------------------------------------------------------------------
  | CONTEXTO DE EVALUACIÓN
  |--------------------------------------------------------------------------
  */

  const selectedSubarea = useMemo(() => {

    if (!selectedSubareaId) {
      return null;
    }

    return availableSubareas.find(
      (subarea) =>
        String(subarea.id) ===
        String(selectedSubareaId)
    ) || null;

  }, [
    availableSubareas,
    selectedSubareaId
  ]);


  const trainerId = useMemo(() => {

    const assignment =
      trainerSubareas.find(
        (item) =>
          String(item?.subarea) ===
          String(selectedSubareaId)
      );

    return assignment?.trainer || null;

  }, [
    trainerSubareas,
    selectedSubareaId
  ]);




  /*
  |--------------------------------------------------------------------------
  | SUBÁREAS DEL ATLETA QUE TAMBIÉN ESTÁN HABILITADAS
  |--------------------------------------------------------------------------
  */

  const selectedAthleteSubareas = useMemo(() => {

    if (!selectedAthlete) {
      return [];
    }

    const athleteSubareaNames =
      selectedAthlete?.subareas_nombres || [];

    return availableSubareas.filter(
      (subarea) =>
        athleteSubareaNames.includes(
          subarea.nombre
        )
    );

  }, [
    selectedAthlete,
    availableSubareas
  ]);




  /*
  |--------------------------------------------------------------------------
  | GUARDAR EVALUACIÓN
  |--------------------------------------------------------------------------
  */

  const handleSave = async () => {

    if (!selectedAthlete) {
      return;
    }

    if (!validate()) {
      setSaveState('error');
      return;
    }

    if (!selectedSubarea) {

      setSaveState('error');

      setMissingFields([
        'subarea'
      ]);

      return;
    }

    if (!trainerId) {

      setSaveState('error');

      setMissingFields([
        'trainer'
      ]);

      return;
    }


    try {

      setSaveState('saving');


      /*
       * El frontend NO calcula nada.
       *
       * Simplemente empaqueta los valores introducidos
       * por el entrenador y los envía a Django.
       */

      await CineantropometriaService.createEvaluation({

        athleteId:
          selectedAthlete.user_id,

        trainerId:
          trainerId,

        areaId:
          selectedSubarea.area.id,

        subareaId:
          selectedSubarea.id,

        date:
          evaluationDate,

        measurements: {
          potencia:
            formData.potencia,

          velocidad:
            formData.velocidad,

          resistencia:
            formData.resistencia,

          env_height:
            formData.env_height,

          env_reach:
            formData.env_reach,

          fz_weight:
            formData.fz_weight,

          fz_load:
            formData.fz_load,

          flexibilidad:
            formData.flexibilidad
        }
      });


      setSaveState('success');

      setFormData({
        ...RAW_FIELDS_INITIAL
      });


      /*
       * Recargamos desde Django.
       *
       * No construimos manualmente el nuevo score.
       */
      await loadAthleteEvaluations(
        selectedAthlete.user_id
      );


    } catch (error) {

      console.error(
        'Error guardando evaluación:',
        error
      );

      setSaveState('error');

      setMissingFields([]);

    }
  };



  /*
  |--------------------------------------------------------------------------
  | CAMBIO DE EVALUACIÓN PARA RADAR
  |--------------------------------------------------------------------------
  */

  const handleRadarEvaluationChange = async (evaluationId) => {

    if (!evaluationId) {
      setSelectedRadar(null);
      return;
    }

    try {

      setLoadingRadar(true);

      const radar =
        await CineantropometriaService
          .getEvaluationRadar(evaluationId);

      setSelectedRadar(radar);

    } catch (error) {

      console.error(
        'Error cargando radar:',
        error
      );

      setSelectedRadar(null);

    } finally {

      setLoadingRadar(false);
    }
  };



  /*
  |--------------------------------------------------------------------------
  | COMPARACIÓN
  |--------------------------------------------------------------------------
  */

  const handleCompare = async () => {

    if (
      !compareActualId ||
      !comparePreviousId ||
      compareActualId === comparePreviousId
    ) {
      return;
    }

    try {

      setLoadingComparison(true);

      const data =
        await CineantropometriaService
          .compareEvaluations(
            compareActualId,
            comparePreviousId
          );

      setComparison(data);

    } catch (error) {

      console.error(
        'Error comparando evaluaciones:',
        error
      );

      setComparison(null);

    } finally {

      setLoadingComparison(false);
    }
  };


  /*
   * Cuando cambian las evaluaciones seleccionadas,
   * pedimos la comparación al backend.
   */
  useEffect(() => {

    if (
      compareActualId &&
      comparePreviousId &&
      compareActualId !== comparePreviousId
    ) {
      handleCompare();
    } else {
      setComparison(null);
    }

  }, [
    compareActualId,
    comparePreviousId
  ]);




  /*
  |--------------------------------------------------------------------------
  | DATOS PARA EVOLUCIÓN
  |--------------------------------------------------------------------------
  |
  | Aquí tampoco calculamos scores.
  | Solo reorganizamos results[] para Recharts.
  |
  */

  const evolutionData = useMemo(() => {

    return [...evaluationDetails]
      .sort(
        (a, b) =>
          new Date(a.date) - new Date(b.date)
      )
      .map((evaluation) => {

        const row = {
          fecha: evaluation.date
        };

        AXES.forEach((axis) => {

          row[axis.label] =
            getAxisScore(
              evaluation.results,
              axis.key
            );

        });

        return row;
      });

  }, [
    evaluationDetails
  ]);




  /*
  |--------------------------------------------------------------------------
  | ESTADÍSTICAS DE PRESENTACIÓN
  |--------------------------------------------------------------------------
  */

  const evaluatedCount = useMemo(() => {

    const athleteIds =
      new Set(
        evaluations.map(
          (evaluation) =>
            evaluation.athlete
        )
      );

    return athleteIds.size;

  }, [
    evaluations
  ]);




  /*
  |--------------------------------------------------------------------------
  | RADAR ACTUAL
  |--------------------------------------------------------------------------
  */

  const radarData = useMemo(() => {

    if (!selectedRadar?.radar) {
      return [];
    }

    return endpointRadarToChart(
      selectedRadar.radar
    );

  }, [
    selectedRadar
  ]);




  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="pod-container">

      {/* ================================================================
          HEADER
      ================================================================= */}

      <header className="pod-header">

        <div className="pod-context-bar">

          <div className="pod-context-content">

            <div className="pod-filters-wrapper">

              {/* ÁREA */}

              <div className="pod-select-box">

                <label>
                  Área:
                </label>

                <select
                  value={filterArea}
                  onChange={(event) => {

                    setFilterArea(
                      event.target.value
                    );

                    setFilterSubarea('ALL');

                  }}
                  className="pod-select"
                >

                  <option value="ALL">
                    Todas las asignadas
                  </option>

                  {availableAreas.map(
                    (area) => (
                      <option
                        key={area.id}
                        value={area.id}
                      >
                        {area.nombre}
                      </option>
                    )
                  )}

                </select>

              </div>


              {/* SUBÁREA */}

              <div className="pod-select-box">

                <label>
                  Subárea:
                </label>

                <select
                  value={filterSubarea}
                  onChange={(event) =>
                    setFilterSubarea(
                      event.target.value
                    )
                  }
                  className="pod-select"
                >

                  <option value="ALL">
                    Todas las asignadas
                  </option>

                  {filteredSubareas.map(
                    (subarea) => (
                      <option
                        key={subarea.id}
                        value={subarea.id}
                      >
                        {subarea.nombre}
                      </option>
                    )
                  )}

                </select>

              </div>


              <div className="pod-lock-badge">

                <i className="fa-solid fa-lock"></i>

                Exclusivo atletas asignados

              </div>

            </div>

          </div>

        </div>

      </header>


      {/* ================================================================
          MAIN
      ================================================================= */}

      <main className="pod-main">


        {/* ==============================================================
            ERROR GLOBAL
        ============================================================== */}

        {loadError && (

          <div className="pod-alert pod-alert-error">

            <AlertCircle size={18} />

            <div>
              <strong>
                Error cargando información
              </strong>

              <p>
                {loadError}
              </p>
            </div>

          </div>

        )}



        {/* ==============================================================
            DASHBOARD
        ============================================================== */}

        <section className="pod-section">

          <div className="pod-banner">

            <div>

              <h2>
                DASHBOARD CINEANTROPOMÉTRICO
              </h2>

              <p>
                Evaluación morfofuncional y perfilado
                físico mediante seis ejes de análisis.
              </p>

            </div>

          </div>


          <div className="pod-kpi-grid">

            <div className="pod-kpi-card">

              <div>

                <div className="pod-kpi-title">
                  Atletas Asignados
                </div>

                <div className="pod-kpi-value">
                  {loadingAthletes
                    ? '...'
                    : filteredAthletes.length}
                </div>

                <div className="pod-kpi-sub">

                  <i className="fa-solid fa-circle-check"></i>

                  En tus áreas

                </div>

              </div>

              <div className="pod-kpi-icon">

                <i className="fa-solid fa-user-ninja"></i>

              </div>

            </div>


            <div className="pod-kpi-card">

              <div>

                <div className="pod-kpi-title">
                  Evaluaciones
                </div>

                <div className="pod-kpi-value">

                  {selectedAthlete
                    ? evaluations.length
                    : 0}

                </div>

                <div className="pod-kpi-sub">

                  <i className="fa-solid fa-chart-line"></i>

                  Del atleta seleccionado

                </div>

              </div>

              <div className="pod-kpi-icon">

                <i className="fa-solid fa-clipboard-check"></i>

              </div>

            </div>


            <div className="pod-kpi-card">

              <div>

                <div className="pod-kpi-title">
                  Subáreas Asignadas
                </div>

                <div className="pod-kpi-value">

                  {loadingSubareas
                    ? '...'
                    : availableSubareas.length}

                </div>

                <div className="pod-kpi-sub">

                  <i className="fa-solid fa-layer-group"></i>

                  Según tu habilitación

                </div>

              </div>

              <div className="pod-kpi-icon">

                <i className="fa-solid fa-list"></i>

              </div>

            </div>

          </div>

        </section>


        <hr className="pod-divider" />


        {/* ==============================================================
            MIS ATLETAS
        ============================================================== */}

        <section className="pod-section">

          <div className="pod-banner">

            <div>

              <h2>
                MIS ATLETAS
              </h2>

              <p>
                Atletas asignados según las relaciones
                registradas en el sistema.
              </p>

            </div>

          </div>


          <div className="pod-table-card">

            <div className="pod-table-search-bar">

              <div className="pod-search-input-wrapper">

                <i className="fa-solid fa-magnifying-glass"></i>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value
                    )
                  }
                  placeholder="Buscar por nombre o cédula..."
                  className="pod-search-input"
                />

              </div>

            </div>


            <div className="pod-table-responsive">

              <table className="pod-table">

                <thead>

                  <tr>

                    <th>
                      Atleta
                    </th>

                    <th>
                      Cédula
                    </th>

                    <th>
                      Categoría
                    </th>

                    <th>
                      Subáreas
                    </th>

                    <th>
                      Evaluaciones
                    </th>

                    <th
                      style={{
                        textAlign: 'right'
                      }}
                    >
                      Acciones
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {loadingAthletes ? (

                    <tr>

                      <td
                        colSpan="6"
                        style={{
                          textAlign: 'center',
                          padding: '3rem'
                        }}
                      >
                        Cargando atletas...
                      </td>

                    </tr>

                  ) : filteredAthletes.length === 0 ? (

                    <tr>

                      <td
                        colSpan="6"
                        style={{
                          textAlign: 'center',
                          padding: '3rem'
                        }}
                      >
                        Sin atletas en esta categoría.
                      </td>

                    </tr>

                  ) : (

                    filteredAthletes.map(
                      (athlete) => (

                        <tr
                          key={athlete.user_id}
                          className={
                            selectedAthlete?.user_id ===
                            athlete.user_id
                              ? 'pod-row-selected'
                              : ''
                          }
                        >

                          <td>

                            <div className="pod-athlete-cell">

                              <div className="pod-athlete-avatar">

                                {String(
                                  athlete.name || ''
                                )
                                  .split(' ')
                                  .map(
                                    (name) =>
                                      name[0]
                                  )
                                  .join('')
                                  .slice(0, 3)
                                  .toUpperCase()}

                              </div>

                              <span>
                                {athlete.name}
                              </span>

                            </div>

                          </td>


                          <td>
                            {athlete.cedula || '--'}
                          </td>


                          <td>
                            {athlete.categoria || '--'}
                          </td>


                          <td>

                            {athlete.subareas_lista_texto ||
                              '--'}

                          </td>


                          <td>

                            {selectedAthlete?.user_id ===
                            athlete.user_id
                              ? evaluations.length
                              : '—'}

                          </td>


                          <td
                            style={{
                              textAlign: 'right'
                            }}
                          >

                            <button
                              className="pod-btn-eval"
                              onClick={() =>
                                handleSelectForEvaluation(
                                  athlete
                                )
                              }
                            >

                              <i className="fa-solid fa-plus"></i>

                              Evaluar

                            </button>


                            <button
                              className="pod-btn-secondary"
                              onClick={() =>
                                handleSelectForProfile(
                                  athlete
                                )
                              }
                            >

                              <i className="fa-solid fa-chart-simple"></i>

                              Ver perfil

                            </button>

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </section>


        <hr className="pod-divider" />


        {/* ==============================================================
            NUEVA EVALUACIÓN
        ============================================================== */}

        <section
          className="pod-section"
          id="nueva-evaluacion"
        >

          <div className="pod-banner">

            <div>

              <h2>
                NUEVA EVALUACIÓN
              </h2>

              <p>
                Registro de las mediciones realizadas
                por el entrenador. Los resultados son
                procesados por el servidor.
              </p>

            </div>

          </div>


          {!selectedAthlete ? (

            <div className="pod-empty-state">

              Selecciona un atleta en la tabla
              para iniciar una evaluación.

            </div>

          ) : (

            <div className="pod-form-card">


              <div className="pod-form-header">

                <span className="pod-form-athlete">

                  {selectedAthlete.name}

                </span>

                <span className="pod-form-context">

                  Cédula:
                  {' '}
                  {selectedAthlete.cedula || '--'}

                </span>

              </div>


              {saveState === 'error' &&
                missingFields.length > 0 && (

                  <div className="pod-alert pod-alert-error">

                    <AlertCircle size={18} />

                    <div>

                      <strong>
                        Faltan datos obligatorios
                      </strong>

                      <p>
                        Completa los campos requeridos
                        antes de guardar.
                      </p>

                    </div>

                  </div>

                )}


              {saveState === 'error' &&
                missingFields.length === 0 && (

                  <div className="pod-alert pod-alert-error">

                    <AlertCircle size={18} />

                    <div>

                      <strong>
                        No se pudo guardar
                      </strong>

                      <p>
                        El servidor rechazó la evaluación
                        o ocurrió un error de comunicación.
                      </p>

                    </div>

                  </div>

                )}


              {saveState === 'success' && (

                <div className="pod-alert pod-alert-success">

                  <CheckCircle2 size={18} />

                  <div>

                    <strong>
                      Evaluación guardada
                    </strong>

                    <p>
                      La evaluación fue registrada
                      correctamente en el servidor.
                    </p>

                  </div>

                </div>

              )}


              {/* ========================================================
                  CONTEXTO
              ======================================================== */}

              <div className="pod-form-grid">


                <div className="pod-form-field">

                  <label>
                    Área
                  </label>

                  <select
                    value={
                      selectedSubarea?.area?.id || ''
                    }
                    disabled
                    className="pod-select"
                  >

                    <option value="">
                      Selecciona una subárea
                    </option>

                    {selectedSubarea?.area && (

                      <option
                        value={
                          selectedSubarea.area.id
                        }
                      >
                        {selectedSubarea.area.nombre}
                      </option>

                    )}

                  </select>

                </div>


                <div className="pod-form-field">

                  <label>
                    Subárea
                  </label>

                  <select
                    value={selectedSubareaId}
                    onChange={(event) =>
                      setSelectedSubareaId(
                        event.target.value
                      )
                    }
                    className="pod-select"
                  >

                    <option value="">
                      Seleccionar subárea
                    </option>

                    {selectedAthleteSubareas.map(
                      (subarea) => (

                        <option
                          key={subarea.id}
                          value={subarea.id}
                        >
                          {subarea.nombre}
                        </option>

                      )
                    )}

                  </select>

                </div>


                <div className="pod-form-field">

                  <label>
                    Fecha
                  </label>

                  <input
                    type="date"
                    value={evaluationDate}
                    onChange={(event) =>
                      setEvaluationDate(
                        event.target.value
                      )
                    }
                  />

                </div>


                {/* ======================================================
                    POTENCIA
                ====================================================== */}

                <div className="pod-form-field">

                  <label>
                    Potencia — Salto Vertical (cm)
                  </label>

                  <input
                    type="text"
                    name="potencia"
                    value={formData.potencia}
                    onChange={handleInputChange}
                    className={
                      missingFields.includes(
                        'potencia'
                      )
                        ? 'pod-input-error'
                        : ''
                    }
                    placeholder="0.0"
                  />

                </div>


                {/* ======================================================
                    VELOCIDAD
                ====================================================== */}

                <div className="pod-form-field">

                  <label>
                    Velocidad — Sprint 30 m (s)
                  </label>

                  <input
                    type="text"
                    name="velocidad"
                    value={formData.velocidad}
                    onChange={handleInputChange}
                    className={
                      missingFields.includes(
                        'velocidad'
                      )
                        ? 'pod-input-error'
                        : ''
                    }
                    placeholder="0.00"
                  />

                </div>


                {/* ======================================================
                    RESISTENCIA
                ====================================================== */}

                <div className="pod-form-field">

                  <label>
                    Resistencia — Navette (niveles)
                  </label>

                  <input
                    type="text"
                    name="resistencia"
                    value={formData.resistencia}
                    onChange={handleInputChange}
                    className={
                      missingFields.includes(
                        'resistencia'
                      )
                        ? 'pod-input-error'
                        : ''
                    }
                    placeholder="0.0"
                  />

                </div>


                {/* ======================================================
                    FLEXIBILIDAD
                ====================================================== */}

                <div className="pod-form-field">

                  <label>
                    Flexibilidad — Test de Wells (cm)
                  </label>

                  <input
                    type="text"
                    name="flexibilidad"
                    value={formData.flexibilidad}
                    onChange={handleInputChange}
                    className={
                      missingFields.includes(
                        'flexibilidad'
                      )
                        ? 'pod-input-error'
                        : ''
                    }
                    placeholder="0.0"
                  />

                </div>


                {/* ======================================================
                    ENVERGADURA
                ====================================================== */}

                <div className="pod-form-field pod-form-field-double">

                  <label>
                    Envergadura — Altura / Envergadura (cm)
                  </label>

                  <div className="pod-form-double-inputs">

                    <input
                      type="text"
                      name="env_height"
                      value={formData.env_height}
                      onChange={handleInputChange}
                      className={
                        missingFields.includes(
                          'env_height'
                        )
                          ? 'pod-input-error'
                          : ''
                      }
                      placeholder="Altura"
                    />

                    <input
                      type="text"
                      name="env_reach"
                      value={formData.env_reach}
                      onChange={handleInputChange}
                      className={
                        missingFields.includes(
                          'env_reach'
                        )
                          ? 'pod-input-error'
                          : ''
                      }
                      placeholder="Envergadura"
                    />

                  </div>

                </div>


                {/* ======================================================
                    FUERZA
                ====================================================== */}

                <div className="pod-form-field pod-form-field-double">

                  <label>
                    Fuerza — Peso corp. / Carga sentadilla (kg)
                  </label>

                  <div className="pod-form-double-inputs">

                    <input
                      type="text"
                      name="fz_weight"
                      value={formData.fz_weight}
                      onChange={handleInputChange}
                      className={
                        missingFields.includes(
                          'fz_weight'
                        )
                          ? 'pod-input-error'
                          : ''
                      }
                      placeholder="Peso"
                    />

                    <input
                      type="text"
                      name="fz_load"
                      value={formData.fz_load}
                      onChange={handleInputChange}
                      className={
                        missingFields.includes(
                          'fz_load'
                        )
                          ? 'pod-input-error'
                          : ''
                      }
                      placeholder="Carga"
                    />

                  </div>

                </div>

              </div>


              <div className="pod-form-actions">

                <button
                  className="pod-btn-save"
                  onClick={handleSave}
                  disabled={
                    saveState === 'saving'
                  }
                >

                  {saveState === 'saving' ? (

                    'Guardando...'

                  ) : (

                    <>
                      <Save size={16} />
                      Guardar Evaluación
                    </>

                  )}

                </button>

              </div>

            </div>

          )}

        </section>


        <hr className="pod-divider" />


        {/* ==============================================================
            VISTA GLOBAL
        ============================================================== */}

        <section
          className="pod-section"
          id="vista-global"
        >

          <div className="pod-banner">

            <div>

              <h2>
                VISTA GLOBAL DE ASIGNACIONES
              </h2>

              <p>
                Datos cineantropométricos y evolución
                histórica del atleta seleccionado.
              </p>

            </div>

          </div>


          {!selectedAthlete ? (

            <div className="pod-empty-state">

              Selecciona un atleta para visualizar
              sus evaluaciones.

            </div>

          ) : loadingEvaluations ? (

            <div className="pod-empty-state">

              Cargando evaluaciones...

            </div>

          ) : evaluationError ? (

            <div className="pod-alert pod-alert-error">

              <AlertCircle size={18} />

              <div>

                <strong>
                  No se pudieron cargar las evaluaciones
                </strong>

                <p>
                  {evaluationError}
                </p>

              </div>

            </div>

          ) : evaluations.length === 0 ? (

            <div className="pod-empty-state">

              <strong>
                {selectedAthlete.name}
              </strong>

              {' '}todavía no tiene evaluaciones registradas.

            </div>

          ) : (

            <>

              {/* ========================================================
                  CABECERA ATLETA
              ======================================================== */}

              <div className="pod-profile-header">

                <span className="pod-form-athlete">

                  {selectedAthlete.name}

                </span>

                <span className="pod-form-context">

                  Cédula:
                  {' '}
                  {selectedAthlete.cedula || '--'}

                  {' · '}

                  {selectedAthlete.subareas_lista_texto || '--'}

                </span>

              </div>


              {/* ========================================================
                  SELECTOR DE EVALUACIÓN PARA RADAR
              ======================================================== */}

              <div className="pod-chart-card">

                <div className="pod-compare-selectors">

                  <div>

                    <label>
                      Evaluación mostrada en radar
                    </label>

                    <select
                      value={
                        selectedRadar?.evaluation?.id ||
                        ''
                      }
                      onChange={(event) =>
                        handleRadarEvaluationChange(
                          event.target.value
                        )
                      }
                    >

                      {evaluations.map(
                        (evaluation) => (

                          <option
                            key={evaluation.id}
                            value={evaluation.id}
                          >
                            {evaluation.date}
                            {' — '}
                            {evaluation.area}
                            {' / '}
                            {evaluation.subarea}
                          </option>

                        )
                      )}

                    </select>

                  </div>

                </div>

              </div>


              {/* ========================================================
                  RADAR + EVOLUCIÓN
              ======================================================== */}

              <div className="pod-chart-grid">


                {/* RADAR */}

                <div className="pod-chart-card">

                  <h3>
                    Radar Hexagonal
                  </h3>

                  <div
                    style={{
                      width: '100%',
                      height: 380
                    }}
                  >

                    {loadingRadar ? (

                      <div className="pod-empty-state">
                        Cargando radar...
                      </div>

                    ) : (

                      <ResponsiveContainer>

                        <RadarChart
                          data={radarData}
                        >

                          <PolarGrid
                            gridType="polygon"
                          />

                          <PolarAngleAxis
                            dataKey="subject"
                          />

                          <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={false}
                            axisLine={false}
                          />

                          <RechartsTooltip />

                          <Radar
                            name="Puntuación"
                            dataKey="score"
                            stroke="#2563eb"
                            fill="#3b82f6"
                            fillOpacity={0.4}
                          />

                        </RadarChart>

                      </ResponsiveContainer>

                    )}

                  </div>

                </div>


                {/* EVOLUCIÓN */}

                {evaluationDetails.length > 1 && (

                  <div className="pod-chart-card">

                    <h3>
                      Evolución en el Tiempo
                    </h3>

                    <div
                      style={{
                        width: '100%',
                        height: 380
                      }}
                    >

                      <ResponsiveContainer>

                        <LineChart
                          data={evolutionData}
                        >

                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                          />

                          <XAxis
                            dataKey="fecha"
                          />

                          <YAxis
                            domain={[0, 100]}
                          />

                          <RechartsTooltip />

                          <Legend />

                          {AXES.map(
                            (axis, index) => (

                              <Line
                                key={axis.key}
                                type="monotone"
                                dataKey={axis.label}
                                stroke={
                                  [
                                    '#ef4444',
                                    '#f59e0b',
                                    '#10b981',
                                    '#3b82f6',
                                    '#8b5cf6',
                                    '#ec4899'
                                  ][index]
                                }
                                strokeWidth={2}
                                dot={{
                                  r: 3
                                }}
                              />

                            )
                          )}

                        </LineChart>

                      </ResponsiveContainer>

                    </div>

                  </div>

                )}

              </div>


              {/* ========================================================
                  COMPARATIVA
              ======================================================== */}

              {evaluations.length > 1 && (

                <div className="pod-chart-card">

                  <h3>
                    Comparativa Histórica
                  </h3>


                  <div className="pod-compare-selectors">


                    <div>

                      <label>
                        Evaluación actual
                      </label>

                      <select
                        value={compareActualId}
                        onChange={(event) =>
                          setCompareActualId(
                            event.target.value
                          )
                        }
                      >

                        {evaluations.map(
                          (evaluation) => (

                            <option
                              key={evaluation.id}
                              value={evaluation.id}
                            >
                              {evaluation.date}
                            </option>

                          )
                        )}

                      </select>

                    </div>


                    <span className="pod-compare-vs">
                      VS
                    </span>


                    <div>

                      <label>
                        Evaluación anterior
                      </label>

                      <select
                        value={comparePreviousId}
                        onChange={(event) =>
                          setComparePreviousId(
                            event.target.value
                          )
                        }
                      >

                        {evaluations.map(
                          (evaluation) => (

                            <option
                              key={evaluation.id}
                              value={evaluation.id}
                            >
                              {evaluation.date}
                            </option>

                          )
                        )}

                      </select>

                    </div>

                  </div>


                  {loadingComparison ? (

                    <div className="pod-empty-state">
                      Calculando comparación...
                    </div>

                  ) : comparison?.comparison ? (

                    <table className="pod-table">

                      <thead>

                        <tr>

                          <th>
                            Eje
                          </th>

                          <th
                            style={{
                              textAlign: 'center'
                            }}
                          >
                            Anterior
                          </th>

                          <th
                            style={{
                              textAlign: 'center'
                            }}
                          >
                            Actual
                          </th>

                          <th
                            style={{
                              textAlign: 'right'
                            }}
                          >
                            Cambio
                          </th>

                        </tr>

                      </thead>


                      <tbody>

                        {comparison.comparison.map(
                          (item) => {

                            const difference =
                              Number(
                                item.difference || 0
                              );

                            const Icon =
                              difference > 0
                                ? ArrowUpRight
                                : difference < 0
                                  ? ArrowDownRight
                                  : Minus;

                            const colorClass =
                              difference > 0
                                ? 'pod-diff-up'
                                : difference < 0
                                  ? 'pod-diff-down'
                                  : 'pod-diff-neutral';

                            return (

                              <tr
                                key={item.axis}
                              >

                                <td>
                                  {item.axis}
                                </td>

                                <td
                                  style={{
                                    textAlign: 'center',
                                    fontFamily: 'monospace'
                                  }}
                                >
                                  {item.previous_score}
                                </td>

                                <td
                                  style={{
                                    textAlign: 'center',
                                    fontFamily: 'monospace'
                                  }}
                                >
                                  {item.current_score}
                                </td>

                                <td
                                  className={colorClass}
                                  style={{
                                    textAlign: 'right'
                                  }}
                                >

                                  <Icon size={14} />

                                  {' '}

                                  {difference > 0
                                    ? '+'
                                    : ''}

                                  {difference}

                                </td>

                              </tr>

                            );
                          }
                        )}

                      </tbody>

                    </table>

                  ) : (

                    <div className="pod-empty-state">

                      Selecciona dos evaluaciones
                      diferentes para comparar.

                    </div>

                  )}

                </div>

              )}

            </>

          )}

        </section>

      </main>

    </div>
  );
};


export default CineantropometriaTrainer;