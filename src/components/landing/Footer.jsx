import React from 'react';
import '../../styles/sections/Footer.css'; 

export default function Footer() {
  return (
    <footer className="footer-wrapper">
      <div className="footer-speed-pattern"></div>
      
      <div className="footer-container">
        <div className="footer-grid-layout">
          
          <div className="footer-brand-column">
            <div className="footer-logo-block">
              <img
                src="/assets/logo.png"
                alt="Liceo Caracas Logo"
                className="topbar-logo-img"
                loading='lazy'
              />
              <div>
                <div className="footer-brand-title">Liceo Caracas</div>
                <div className="footer-brand-subtitle">Club de Atletismo U.E.T.D.</div>
              </div>
            </div>
            <p className="footer-brand-desc">
              Disciplina, esfuerzo y excelencia: formando a los campeones del mañana en las aulas y en las pistas de Venezuela.
            </p>
            
          </div>

         

          <div className="footer-links-column">
            <h4 className="footer-section-heading">Contacto</h4>
            <ul className="footer-contact-list">
              <li className="contact-item">
                <span className="material-symbols-outlined footer-icon-red">mail</span>
                <span>contacto@liceocaracas.ve</span>
              </li>
              <li className="contact-item">
                <span className="material-symbols-outlined footer-icon-red">call</span>
                <span>+58 212 555 1234</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p className="footer-copyright-text">
            © 2026 CLUB ATLETISMO LICEO CARACAS. ALL RIGHTS RESERVED.
          </p>
          <div className="footer-legal-links">
            <a href="#" className="footer-legal-link">Privacy Policy</a>
            <a href="#" className="footer-legal-link">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}