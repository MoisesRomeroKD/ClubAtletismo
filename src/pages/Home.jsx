import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
// ⚡ IMPORTACIÓN ESTÁTICA: El Hero es crítico para el FCP (First Contentful Paint)
import HeroSection from '../components/landing/HeroSection';
import TopbarPublic from "../components/layout/public/TopbarPublic";

import '../styles/pages/Home.css';

// ⏱️ Helper técnico para inyectar un retraso artificial de 500ms y estabilizar el Skeleton
const lazyWithDelay = (importFunction, delay = 500) => {
  return lazy(() => 
    Promise.all([
      importFunction(),
      new Promise(resolve => setTimeout(resolve, delay))
    ]).then(([moduleExports]) => moduleExports)
  );
};

// 🚀 LAZY LOADING BAJO DEMANDA: Los archivos JS solo se pedirán al hacer scroll
const MisionSection   = lazyWithDelay(() => import('../components/landing/MisionSection'), 500);
const DisciplinasGrid = lazyWithDelay(() => import('../components/landing/DisciplinasGrid'), 500);
const ContactoSection = lazyWithDelay(() => import('../components/landing/ContactoSection'), 500);
const Footer          = lazyWithDelay(() => import('../components/landing/Footer'), 500);

/**
 * 👁️ CONTENEDOR DE CARGA DIFERIDA Y ANIMACIÓN (Deferred Lazy Loader)
 * Garentiza que React NO descargue ni intente procesar el componente hasta que esté cerca del viewport.
 */
function LazyScrollSection({ children, fallback, rootMargin = "200px" }) {
  const elementRef = useRef(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          if (elementRef.current) observer.unobserve(elementRef.current); // Mantiene el componente vivo una vez cargado
        }
      },
      {
        threshold: 0.01,
        rootMargin: rootMargin // "200px" actúa como margen de anticipación para que cargue un poco antes de aparecer en pantalla
      }
    );

    if (elementRef.current) observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div 
      ref={elementRef} 
      className={`scroll-reveal ${shouldRender ? 'is-visible' : ''}`}
      style={{ minHeight: '150px', width: '100%' }} // Evita colapsos de altura antes de la carga
    >
      {shouldRender ? (
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      ) : (
        // Se muestra el esqueleto específico mientras no se ha alcanzado la sección con el scroll
        fallback
      )}
    </div>
  );
}

/**
 * HOME PAGE - OPTIMIZADO POR AMORTIZACIÓN DE SCROLL REAL (U.E.T.D. Liceo Caracas)
 */
export default function Home() {
  
  // Skeletons individuales optimizados por sección para evitar saltos bruscos de Layout
  const misionSkeleton = (
    <div className="skeleton-block" style={{ height: '280px', background: 'var(--bg-glass, rgba(255,255,255,0.05))', borderRadius: '16px', marginBottom: '32px' }}></div>
  );

  const disciplinasSkeleton = (
    <div className="skeleton-block" style={{ height: '400px', background: 'var(--bg-glass, rgba(255,255,255,0.05))', borderRadius: '16px', marginBottom: '32px' }}></div>
  );

  const contactoSkeleton = (
    <div className="skeleton-block" style={{ height: '350px', background: 'var(--bg-glass, rgba(255,255,255,0.05))', borderRadius: '16px', marginBottom: '32px' }}></div>
  );

  const footerSkeleton = (
    <div className="skeleton-block" style={{ height: '150px', background: 'var(--bg-glass, rgba(255,255,255,0.05))', borderRadius: '8px' }}></div>
  );

  return (
    <div className="home-container">
      <main className="home-main">
        
        {/* 1. Sección Hero: Carga instantánea e ininterrumpida */}
        <HeroSection />

        {/* 2. Misión y Visión Institucional: Carga diferida */}
        <LazyScrollSection fallback={misionSkeleton}>
          <MisionSection />
        </LazyScrollSection>

        {/* 3. El bento grid de disciplinas */}
        <LazyScrollSection fallback={disciplinasSkeleton}>
          <DisciplinasGrid />
        </LazyScrollSection>

        {/* 4. Sección de Contacto e Inscripción */}
        <LazyScrollSection fallback={contactoSkeleton}>
          <ContactoSection />
        </LazyScrollSection>

        {/* 5. Footer */}
        <LazyScrollSection fallback={footerSkeleton} rootMargin="50px">
          <Footer />
        </LazyScrollSection>

      </main>
    </div>
  );
}