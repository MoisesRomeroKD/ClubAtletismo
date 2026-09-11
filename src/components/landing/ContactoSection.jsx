import React from 'react';
import '../../styles/sections/ContactoSection.css';

export default function ContactoSection() {
  return (
    <section id="ubicacion" className="contacto-section">
      <div className="track-texture-overlay"></div>
      
      <div className="contacto-container">
        <div className="contacto-grid-layout">
          
          {/* COLUMNA IZQUIERDA: Mensaje de Impacto y Ubicación Física */}
          <div className="contacto-info-block">
            <div className="contacto-tagline">
              ÚNETE AL EQUIPO DE ÉLITE
            </div>
            <h2 className="contacto-title">
              Comienza tu formación de <span className="contacto-title-italic">excelencia</span>
            </h2>
            <p className="contacto-description">
              Ya sea para ingresar a la U.E.T.D. Liceo Caracas o formar parte de nuestros clubes de atletismo, puedes visitarnos en nuestro centro de entrenamiento de alto rendimiento. Nuestro equipo técnico evaluará tus capacidades físicas y académicas.
            </p>

            <div className="contacto-location-card">
              <div className="location-details">
                <div className="location-title">Dirección Exacta</div>
                <div className="location-text">Av. Páez, sector El Paraíso, Caracas, Distrito Capital.</div>
              </div>
            </div>
            
            <div className="contacto-badge">
              <span className="badge-text">Evaluación física y académica integrada</span>
            </div>
          </div>

          {/* COLUMNA DERECHA: Contenedor del Mapa Enlazado e Incrustado */}
          <div className="contacto-map-block">
            <div className="contacto-map-wrapper">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3923.108499408076!2d-66.92784019999999!3d10.492112500000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8c2a5f18a47a17ad%3A0x9c42e7476c8638d6!2sLiceo%20Caracas!5e0!3m2!1ses!2sve!4v1782252739631!5m2!1ses!2sve" 
                className="contacto-iframe-map"
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="strict-origin-when-cross-origin"
                title="Ubicación Elite Track Club"
              ></iframe>
              
              <a 
                className="btn-maps-link" 
                href="https://maps.app.goo.gl/2mYRfE3Mu5SndvFYA" 
                target="_blank" 
                rel="noreferrer"
              >
                <span className="btn-maps-text">
                  Cómo llegar <span className="material-symbols-outlined icon-inline">directions</span>
                </span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}