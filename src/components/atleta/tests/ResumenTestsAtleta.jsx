import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

/*
 * Resumen de "Mis tests" del atleta: por cada prueba, su última marca, su mejor marca,
 * si mejoró respecto a la anterior y cómo ha evolucionado. Solo usa las marcas registradas.
 */

const formatFecha = (iso) => {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};
const fechaCorta = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' });

// Mejor = la más baja si "menor es mejor" (tiempos), la más alta si "mayor es mejor" (distancias).
const esMejor = (a, b, criterio) => (criterio === 'menor' ? a < b : a > b);

function porPrueba(filas) {
  const pruebas = new Map();
  filas
    .filter((fila) => !fila.ausente && fila.valor !== null && fila.valor !== undefined)
    .forEach((fila) => {
      const clave = fila.prueba_id ?? fila.prueba;
      if (!pruebas.has(clave)) {
        pruebas.set(clave, { clave, prueba: fila.prueba, unidad: fila.unidad, criterio: fila.criterio, marcas: [] });
      }
      pruebas.get(clave).marcas.push({ fecha: fila.fecha, valor: fila.valor });
    });
  return [...pruebas.values()].map((prueba) => {
    const marcas = [...prueba.marcas].sort((a, b) => a.fecha.localeCompare(b.fecha));
    const ultima = marcas[marcas.length - 1];
    const anterior = marcas.length > 1 ? marcas[marcas.length - 2] : null;
    const mejor = marcas.reduce((best, marca) => (esMejor(marca.valor, best.valor, prueba.criterio) ? marca : best), marcas[0]);
    let tendencia = 'igual';
    if (anterior && ultima.valor !== anterior.valor) {
      tendencia = esMejor(ultima.valor, anterior.valor, prueba.criterio) ? 'mejoro' : 'empeoro';
    }
    return { ...prueba, marcas, ultima, anterior, mejor, tendencia };
  }).sort((a, b) => b.ultima.fecha.localeCompare(a.ultima.fecha));
}

function TooltipMarca({ active, payload, unidad }) {
  if (!active || !payload?.length) return null;
  const punto = payload[0].payload;
  return (
    <div className="tests-atl-tooltip">
      <strong>{formatFecha(punto.fecha)}</strong>
      <span>{punto.valor} {unidad}</span>
    </div>
  );
}

const TENDENCIA = {
  mejoro: { icono: TrendingUp, texto: 'Mejoraste', clase: 'mejoro' },
  empeoro: { icono: TrendingDown, texto: 'Bajaste', clase: 'empeoro' },
  igual: { icono: Minus, texto: 'Igual', clase: 'igual' },
};

export default function ResumenTestsAtleta({ filas }) {
  const realizados = filas.filter((fila) => !fila.ausente && fila.valor !== null && fila.valor !== undefined).length;
  const pendientes = filas.filter((fila) => !fila.ausente && (fila.valor === null || fila.valor === undefined)).length;
  const ausencias = filas.filter((fila) => fila.ausente).length;
  const pruebas = porPrueba(filas);

  return (
    <section className="tests-atl-resumen" aria-label="Resumen de mis tests">
      <div className="tests-atl-kpis">
        <div className="tests-atl-kpi"><span>Tests realizados</span><strong>{realizados}</strong></div>
        <div className="tests-atl-kpi"><span>Pendientes</span><strong>{pendientes}</strong></div>
        <div className="tests-atl-kpi"><span>Ausencias</span><strong>{ausencias}</strong></div>
        <div className="tests-atl-kpi"><span>Pruebas distintas</span><strong>{pruebas.length}</strong></div>
      </div>

      {pruebas.length === 0 ? (
        <p className="tests-atl-vacio">Cuando tengas marcas registradas, aquí verás tu evolución en cada prueba.</p>
      ) : (
        <div className="tests-atl-pruebas">
          {pruebas.map((prueba) => {
            const tendencia = TENDENCIA[prueba.tendencia];
            const IconoTendencia = tendencia.icono;
            const datos = prueba.marcas.map((marca) => ({ ...marca, etiqueta: fechaCorta(marca.fecha) }));
            return (
              <article className="tests-atl-prueba" key={prueba.clave}>
                <header>
                  <h3>{prueba.prueba}</h3>
                  <small>{prueba.criterio === 'menor' ? 'Menor es mejor' : 'Mayor es mejor'}</small>
                </header>
                <dl className="tests-atl-prueba-datos">
                  <div><dt>Última marca</dt><dd>{prueba.ultima.valor} {prueba.unidad}</dd></div>
                  <div><dt>Mejor marca</dt><dd>{prueba.mejor.valor} {prueba.unidad}</dd></div>
                </dl>
                {prueba.anterior ? (
                  <p className={`tests-atl-tendencia tests-atl-tendencia--${tendencia.clase}`}>
                    <IconoTendencia size={16} aria-hidden="true" />
                    {tendencia.texto} respecto al {formatFecha(prueba.anterior.fecha)} ({prueba.anterior.valor} {prueba.unidad})
                  </p>
                ) : (
                  <p className="tests-atl-tendencia tests-atl-tendencia--igual">Primera marca registrada en esta prueba.</p>
                )}
                {datos.length > 1 && (
                  <div className="tests-atl-grafico" role="img" aria-label={`Evolución de ${prueba.prueba}`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={datos} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
                        <XAxis dataKey="etiqueta" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis
                          domain={['auto', 'auto']}
                          reversed={prueba.criterio === 'menor'}
                          tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<TooltipMarca unidad={prueba.unidad} />} />
                        <Line type="monotone" dataKey="valor" stroke="var(--func-primary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {datos.length > 1 && (
                  <small className="tests-atl-nota">
                    {prueba.criterio === 'menor' ? 'El eje está invertido: más arriba es mejor (menos tiempo).' : 'Más arriba es mejor.'}
                  </small>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
