import React from 'react';
import { Check } from 'lucide-react';
import '../../../styles/components/admin/dashboard/KpiSection.css';

export const KpiSection = ({ data = [] }) => {
  return (
    <section className="kpi-section-grid">
      {data.map((kpi) => {
        const Icono = kpi.icon;
        // Tarjetas para métricas de Atletas (Totales, Disponibles, Justificados)
        if (kpi.type === 'atletas') {
          return (
            <div key={kpi.id} className="kpi-card-base kpi-card-border-blue">
              <div className="kpi-card-header">
                <div>
                  <p className="kpi-title">{kpi.title}</p>
                  <h3 className="kpi-value">{kpi.value}</h3>
                </div>
                <div className="kpi-icon-box kpi-icon-blue">
                  <Icono size={22} aria-hidden="true" />
                </div>
              </div>
              <div className="kpi-footer-active">
                <Check size={14} aria-hidden="true" />
                <span>{kpi.activeText || kpi.caption}</span>
              </div>
            </div>
          );
        }

        // Tarjeta para Staff Registrado
        if (kpi.type === 'staff') {
          return (
            <div key={kpi.id} className="kpi-card-base kpi-card-border-slate">
              <div className="kpi-card-header">
                <div>
                  <p className="kpi-title">{kpi.title}</p>
                  <h3 className="kpi-value">{kpi.value}</h3>
                </div>
                <div className="kpi-icon-box kpi-icon-slate">
                  <Icono size={22} aria-hidden="true" />
                </div>
              </div>
              <div className="kpi-footer-caption">
                <span>{kpi.caption}</span>
              </div>
            </div>
          );
        }

        return null;
      })}
    </section>
  );
};

export default KpiSection;