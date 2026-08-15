import React, { useRef } from 'react';
import db from '../../assets/db.json';
import styles from './noticias.module.css';

interface NoticiaItem {
  id: number | string;
  titulo?: string;
  descripcion: string;
  imagen?: string;
}

interface CarruselProps {
  items?: NoticiaItem[];
}

export const CarruselNovedades: React.FC<CarruselProps> = ({ items }) => {
  const trackRef = useRef<HTMLDivElement>(null);

  // Si no le pasás items por props, usa los eventos o productores de tu db.json por defecto
  const data: NoticiaItem[] = items || (db.eventos as any[]) || [];

  const scroll = (direction: 'left' | 'right') => {
    if (trackRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
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
        {data.map((item) => (
          <div key={item.id} className={styles.card}>
            <div className={styles.imageWrapper}>
              <img
                src={item.imagen || '/placeholder-news.jpg'}
                alt={item.titulo || 'Noticia'}
                className={styles.image}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src = 'https://via.placeholder.com/300x180?text=Vidriera+Productiva';
                }}
              />
            </div>
            <div className={styles.body}>
              <p className={styles.texto}>
                {item.descripcion || item.titulo}
              </p>
            </div>
          </div>
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