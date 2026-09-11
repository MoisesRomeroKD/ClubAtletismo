import React from 'react';
import '../../styles/sections/DisciplinasGrid.css';

// Las imágenes locales ahora se sirven desde la carpeta /public de manera estática
const disciplinesData = [
  {
    id: "velocidad",
    title: "Velocidad",
    img: "/assets/Velocidad.webp",
    items: ["100 m", "200 m", "400 m", "100 m vallas", "400 m vallas"],
    esAncho: true,
  },
  {
    id: "saltos",
    title: "Saltos",
    img: "/assets/Saltos.webp",
    items: ["Salto largo", "Salto triple", "Salto alto", "Salto con garrocha"],
    esAncho: false,
  },
  {
    id: "resistencia",
    title: "Resistencia",
    img: "/assets/Resistencia.webp",
    items: ["800 m", "1500 m", "3000 m", "5000 m", "10 000 m", "Maratón", "Cross Country", "5 km marcha", "10 km marcha", "20 km marcha", "35 km marcha"],
    esAncho: false,
  },
  {
    id: "lanzamientos",
    title: "Lanzamientos",
    img: "/assets/Lanzamiento.webp",
    items: ["Jabalina", "Impulso de bala", "Disco", "Martillo"],
    esAncho: false,
  },
];

export default function DisciplinasGrid() {
  const totalCards = String(disciplinesData.length).padStart(2, "0");

  return (
    <section id="disciplinas" className="disciplinas-section">
      <div className="disciplinas-skew-bg"></div>

      <div className="disciplinas-container">
        <header className="disciplinas-header">
          <span className="disciplinas-tagline">CATEGORÍAS DE ALTO RENDIMIENTO</span>
          <h2 className="disciplinas-title">Disciplinas Deportivas</h2>
          <div className="disciplinas-divider"></div>
        </header>

        <div className="bento-grid">
          {disciplinesData.map((disc, index) => {
            const currentNum = String(index + 1).padStart(2, "0");
            
            return (
              <article 
                key={disc.id} 
                className={`bento-card ${disc.esAncho ? 'card-wide' : 'card-standard'}`}
              >
                <div 
                  className="card-image" 
                  style={{ backgroundImage: `url(${disc.img})` }}
                />
                <div className="card-overlay"></div>
                
                <span className="card-hint">Ver subáreas</span>
                
                <div className="card-content">
                  <div className="card-num">
                    {currentNum} / {totalCards}
                  </div>
                  <h3 className="card-title">{disc.title}</h3>
                  <ul className="card-list">
                    {disc.items.map((item) => (
                      <li key={`${disc.id}-${item}`} className="glass-tag">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}