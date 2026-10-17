import React from 'react';
import { BadgeCheck, CalendarDays, Gauge, IdCard, Mail, Phone, Users, UsersRound } from 'lucide-react';
import '../../../styles/components/atleta/PerfilAtleta.css';

/*
 * MI PERFIL DEL ATLETA (solo lectura)
 * Une en una pantalla lo que el atleta necesita saber de sí mismo y de quién lo rodea:
 *   1. Mis datos: ficha técnica, categoría y subáreas (con su turno).
 *   2. Mis entrenadores.
 *   3. Mi representante.
 * Solo muestra campos que el sistema guarda. Todavía NO está conectada al backend:
 * mientras tanto los datos llegan vacíos y la pantalla lo indica (no se inventan datos).
 */

// Forma de los datos que enviará el backend al conectarla.
const PERFIL_SIN_CONECTAR = {
  atleta: {
    cedula: null,
    nombres: null,
    apellidos: null,
    correo: null,
    fecha_nacimiento: null,
    edad: null,
    estado: null,
    categoria: null,
    subareas: [], // [{ id, nombre, area, turno }]
  },
  entrenadores: [], // [{ id, nombres, apellidos, telefono, correo, subareas: [nombre] }]
  representantes: [], // [{ id, nombres, apellidos, cedula, telefono, relacion }]
};

const ESTADOS = { activo: 'Activo', inactivo: 'Inactivo', justificado: 'Justificado' };
const TURNOS = { manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };

const valor = (dato) => (dato === null || dato === undefined || dato === '' ? '—' : dato);

const iniciales = (nombres, apellidos) => (
  `${(nombres || '').trim()[0] || ''}${(apellidos || '').trim()[0] || ''}`.toUpperCase() || '?'
);

const formatFecha = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

function Dato({ etiqueta, children, icono: Icono }) {
  return (
    <div className="perfil-atleta__dato">
      <span className="perfil-atleta__dato-etiqueta">{etiqueta}</span>
      <div className="perfil-atleta__dato-valor">
        {Icono && <Icono size={16} aria-hidden="true" />}
        <span>{children}</span>
      </div>
    </div>
  );
}

export default function PerfilAtleta({ perfil = PERFIL_SIN_CONECTAR }) {
  const { atleta, entrenadores, representantes } = perfil;
  const sinConectar = perfil === PERFIL_SIN_CONECTAR;

  return (
    <div className="perfil-atleta">
      {sinConectar && (
        <p className="perfil-atleta__aviso" role="status">
          Esta pantalla aún no está conectada al sistema: los datos aparecerán cuando se conecte.
        </p>
      )}

      {/* Encabezado */}
      <header className="perfil-atleta__encabezado">
        <span className="perfil-atleta__avatar" aria-hidden="true">{iniciales(atleta.nombres, atleta.apellidos)}</span>
        <div>
          <div className="perfil-atleta__titulo">
            <h2>{atleta.nombres || atleta.apellidos ? `${valor(atleta.nombres)} ${atleta.apellidos || ''}`.trim() : 'Mi perfil'}</h2>
            {atleta.estado && (
              <span className={`perfil-atleta__estado perfil-atleta__estado--${atleta.estado}`}>{ESTADOS[atleta.estado] || atleta.estado}</span>
            )}
          </div>
          <p>Atleta</p>
        </div>
      </header>

      {/* 1. Mis datos */}
      <div className="perfil-atleta__grid">
        <section className="perfil-atleta__tarjeta perfil-atleta__ficha">
          <h3><IdCard size={20} aria-hidden="true" />Ficha técnica</h3>
          <div className="perfil-atleta__datos">
            <Dato etiqueta="Cédula">{valor(atleta.cedula)}</Dato>
            <Dato etiqueta="Nombres">{valor(atleta.nombres)}</Dato>
            <Dato etiqueta="Apellidos">{valor(atleta.apellidos)}</Dato>
            <Dato etiqueta="Correo electrónico" icono={Mail}>{valor(atleta.correo)}</Dato>
            <Dato etiqueta="Fecha de nacimiento" icono={CalendarDays}>{formatFecha(atleta.fecha_nacimiento)}</Dato>
            <Dato etiqueta="Edad actual">{atleta.edad !== null && atleta.edad !== undefined ? `${atleta.edad} años` : '—'}</Dato>
            <Dato etiqueta="Categoría (por edad)">{valor(atleta.categoria)}</Dato>
          </div>
        </section>

        <div className="perfil-atleta__lateral">
          <section className="perfil-atleta__tarjeta">
            <h3><Gauge size={20} aria-hidden="true" />Mis subáreas</h3>
            {atleta.subareas.length ? (
              <ul className="perfil-atleta__chips">
                {atleta.subareas.map((subarea) => (
                  <li key={subarea.id}>
                    <strong>{subarea.nombre}</strong>
                    <span>{subarea.area ? `${subarea.area} · ` : ''}Turno {TURNOS[subarea.turno] || subarea.turno}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="perfil-atleta__vacio">Sin subáreas asignadas.</p>
            )}
          </section>
        </div>
      </div>

      {/* 2. Mis entrenadores */}
      <section className="perfil-atleta__seccion">
        <h3><UsersRound size={20} aria-hidden="true" />Mis entrenadores</h3>
        {entrenadores.length ? (
          <div className="perfil-atleta__personas">
            {entrenadores.map((entrenador) => (
              <article className="perfil-atleta__tarjeta perfil-atleta__persona" key={entrenador.id}>
                <div className="perfil-atleta__persona-cabecera">
                  <span className="perfil-atleta__avatar perfil-atleta__avatar--chico" aria-hidden="true">
                    {iniciales(entrenador.nombres, entrenador.apellidos)}
                  </span>
                  <div>
                    <h4>{entrenador.nombres} {entrenador.apellidos}</h4>
                    <div className="perfil-atleta__etiquetas">
                      {(entrenador.subareas || []).map((nombre) => <span key={nombre}>{nombre}</span>)}
                    </div>
                  </div>
                </div>
                <div className="perfil-atleta__datos">
                  <Dato etiqueta="Teléfono" icono={Phone}>{valor(entrenador.telefono)}</Dato>
                  <Dato etiqueta="Correo electrónico" icono={Mail}>{valor(entrenador.correo)}</Dato>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="perfil-atleta__tarjeta perfil-atleta__vacio">Sin entrenadores asignados.</p>
        )}
      </section>

      {/* 3. Mi representante */}
      <section className="perfil-atleta__seccion">
        <h3><Users size={20} aria-hidden="true" />Mi representante</h3>
        {representantes.length ? (
          <div className="perfil-atleta__personas">
            {representantes.map((representante) => (
              <article className="perfil-atleta__tarjeta perfil-atleta__persona perfil-atleta__persona--representante" key={representante.id}>
                <div className="perfil-atleta__persona-cabecera">
                  <span className="perfil-atleta__avatar perfil-atleta__avatar--chico" aria-hidden="true">
                    {iniciales(representante.nombres, representante.apellidos)}
                  </span>
                  <div>
                    <h4>{representante.nombres} {representante.apellidos}</h4>
                    {representante.relacion && (
                      <div className="perfil-atleta__etiquetas"><span><BadgeCheck size={13} aria-hidden="true" />{representante.relacion}</span></div>
                    )}
                  </div>
                </div>
                <div className="perfil-atleta__datos">
                  <Dato etiqueta="Nombres">{valor(representante.nombres)}</Dato>
                  <Dato etiqueta="Apellidos">{valor(representante.apellidos)}</Dato>
                  <Dato etiqueta="Cédula">{valor(representante.cedula)}</Dato>
                  <Dato etiqueta="Teléfono" icono={Phone}>{valor(representante.telefono)}</Dato>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="perfil-atleta__tarjeta perfil-atleta__vacio">Sin representante registrado.</p>
        )}
      </section>
    </div>
  );
}
