import { useEffect, useState } from 'react';
import './nuevas_empresas.css';
// Imágenes provisorias: reemplazar por las del diseño (o por las de empresas reales).
import imgSabores from '../../assets/SaboresSerranos.png';
import imgRural from '../../assets/RuralRIO4.png';
import imgOktober from '../../assets/OktoberFest.png';
import imgAgtech from '../../assets/AgtechCBA.png';

interface Slide {
  imagen: string;
  nombre: string;
}

const SLIDES: Slide[] = [
  { imagen: imgSabores, nombre: 'Sabores Serranos' },
  { imagen: imgRural, nombre: 'Rural Río Cuarto' },
  { imagen: imgOktober, nombre: 'Oktoberfest' },
  { imagen: imgAgtech, nombre: 'Agtech Córdoba' },
];

const INTERVALO_MS = 5000;

export function NuevasEmpresas() {
  const [actual, setActual] = useState(0);
  const total = SLIDES.length;

  // Avanza solo; al tocar un punto o un costado se reinicia el contador
  useEffect(() => {
    const id = setInterval(() => setActual((i) => (i + 1) % total), INTERVALO_MS);
    return () => clearInterval(id);
  }, [actual, total]);

  const anterior = (actual - 1 + total) % total;
  const siguiente = (actual + 1) % total;

  const posicion = (i: number) => {
    if (i === actual) return 'centro';
    if (i === anterior) return 'izquierda';
    if (i === siguiente) return 'derecha';
    return 'oculta';
  };

  return (
    <section className="nuevas-empresas">
      <h2 className="nuevas-empresas__titulo">Nuevas Empresas</h2>

      <div className="nuevas-empresas__pista">
        {SLIDES.map((slide, i) => {
          const pos = posicion(i);
          return (
            <button
              key={slide.nombre}
              type="button"
              className={`nuevas-empresas__slide nuevas-empresas__slide--${pos}`}
              onClick={() => pos !== 'centro' && setActual(i)}
              aria-label={slide.nombre}
              aria-hidden={pos === 'oculta'}
              tabIndex={pos === 'izquierda' || pos === 'derecha' ? 0 : -1}
            >
              <img src={slide.imagen} alt={pos === 'centro' ? slide.nombre : ''} />
            </button>
          );
        })}
      </div>

      <div className="nuevas-empresas__puntos">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.nombre}
            type="button"
            className={`nuevas-empresas__punto${i === actual ? ' nuevas-empresas__punto--activo' : ''}`}
            onClick={() => setActual(i)}
            aria-label={`Ver ${slide.nombre}`}
          />
        ))}
      </div>
    </section>
  );
}
