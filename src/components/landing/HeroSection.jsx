import React from "react";
import '../../styles/sections/HeroSections.css';

const HeroSection = () => {
  return (
    <section id="hero" className="hero-section">
      <div className="hero-bg-wrapper">
        <div className="hero-gradient-overlay"></div>
        <img 
          alt="Atletas de la U.E.T.D. Liceo Caracas" 
          className="hero-bg-image" 
          src="/assets/hero-athletes.jpg"
        />
      </div>

      <div className="hero-container">
        {/* Columna Izquierda: Título y Descripción */}
        <div className="hero-text-block">
          <h1 className="hero-title">
            Formando atletas de <span className="hero-title-italic">excelencia</span> y ciudadanos para el futuro
          </h1>
          <p className="hero-description">
            La U.E.T.D. Liceo Caracas es una institución dedicada al desarrollo integral de jóvenes atletas, combinando educación académica de alto nivel con formación deportiva de excelencia.
          </p>
        </div>

        {/* Columna Derecha: Botones de Acción */}
        <div className="hero-actions-block">
          <div className="hero-actions">
            <a className="btn-hero-primary" href="#disciplinas">
              <span className="btn-text-fix">Conoce nuestras disciplinas</span>
            </a>
            <a className="btn-hero-secondary" href="#ubicacion">
              <span className="btn-text-fix">Únete</span>
            </a>
          </div>
        </div>
      </div>

     
    </section>
  );
};

export default HeroSection;