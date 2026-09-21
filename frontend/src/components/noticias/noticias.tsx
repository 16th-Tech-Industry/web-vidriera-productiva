import React, { useRef } from 'react';
import db from '../../assets/db.json';
import styles from './noticias.module.css';

export interface Noticias {
  id: number | string;
  imagen: string;
  epigrafe: string;
  link: string;
}

interface CarruselProps {
  noticias?: Noticias[];
}

export const CarruselNovedades: React.FC<CarruselProps> = ({ noticias }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  
  // Lee de props o directamente de la tabla novedades en db.json
  const listaNovedades: Noticias[] = noticias || (db as any).noticias || [];

  const scroll = (direction: 'left' | 'right') => {
    if (trackRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.carruselContainer}>
      <button 
        type="button" 
        className={`${styles.btnNav} ${styles.btnPrev}`} 
        onClick={() => scroll('left')}
        aria-label="Anterior"
      >
        ‹
      </button>

      <div className={styles.track} ref={trackRef}>
        {listaNovedades.map((item) => (
          <a
            key={item.id}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.card}
          >
            <div className={styles.imageWrapper}>
              <img
                src={item.imagen}
                alt={item.epigrafe}
                className={styles.image}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src = 'https://via.placeholder.com/300x165?text=Novedad';
                }}
              />
            </div>
            <div className={styles.body}>
              <p className={styles.texto}>
                {item.epigrafe}
              </p>
            </div>
          </a>
        ))}
      </div>

      <button 
        type="button" 
        className={`${styles.btnNav} ${styles.btnNext}`} 
        onClick={() => scroll('right')}
        aria-label="Siguiente"
      >
        ›
      </button>
    </div>
  );
};