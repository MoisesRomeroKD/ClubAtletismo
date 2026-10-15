import React from 'react';
import '../../styles/sections/MisionSection.css'; // Asegúrate de tener este archivo CSS para los estilos

export default function MisionSection() {
  return (
    <section id="mision" className="mision-section">
      <div className="mision-bg-overlay"></div>
      
      <div className="mision-container">
        <div className="mision-grid">
          
          {/* Bloque Visión */}
          <div className="mision-card group-vision">
            <div className="mision-header color-secondary">
              <h2 className="mision-heading">Nuestra Visión</h2>
            </div>
            <p className="mision-text">
              Garantizar el desarrollo académico de excelencia a los atletas con perspectiva al rendimiento deportivo y a los deportistas de alto rendimiento, consolidando un modelo educativo que sea referente nacional.
            </p>
            <div className="mision-animated-line bg-color-secondary"></div>
          </div>

          {/* Bloque Misión */}
          <div className="mision-card group-mision">
            <div className="mision-header color-primary">
              <h2 className="mision-heading">Nuestra Misión</h2>
            </div>
            <p className="mision-text">
              Iniciar, desarrollar y consolidar alumnos-atletas con condiciones especiales hacia el deporte... formando de manera simultánea un atleta de alta competencia con un alto nivel académico bajo principios de disciplina y esfuerzo.
            </p>
            <div className="mision-animated-line bg-color-primary"></div>
          </div>

        </div>
      </div>
    </section>
  );
}