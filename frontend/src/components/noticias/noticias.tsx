import React, { useEffect, useRef, useState } from 'react';
import styles from './noticias.module.css';
import obtenerNoticias from '../../servicios/noticias_servicio';

export interface Noticias {
  id: number | string;
  titulo: string;
  cuerpo?: string;
  imagen_url?: string | null;
}

interface CarruselProps {
  noticias?: Noticias[];
}

export const CarruselNovedades: React.FC<CarruselProps> = ({ noticias }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  
  const [listaNovedades, setListaNovedades] = useState<Noticias[]>(noticias || []);
  const [cargando, setCargando] = useState<boolean>(!noticias);

  useEffect(() => {
    if (noticias) {
      setListaNovedades(noticias);
      setCargando(false);
      return;
    }

    const cargarDesdeApi = async () => {
      try {
        const data = await obtenerNoticias(true);
        setListaNovedades(data);
      } catch (error) {
        console.error("Error al cargar novedades desde el servicio:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDesdeApi();
  }, [noticias]);

  const scroll = (direction: 'left' | 'right') => {
    if (trackRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (cargando) {
    return <div className={styles.carruselContainer}>Cargando...</div>;
  }

  if (listaNovedades.length === 0) {
    return null;
  }

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
            href={`/NoticiasAdminView/${item.id}`}
            className={styles.card}
          >
            <div className={styles.imageWrapper}>
              <img
                src={item.imagen_url || 'https://via.placeholder.com/300x165?text=Novedad'}
                alt={item.titulo}
                className={styles.image}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src = 'https://via.placeholder.com/300x165?text=Novedad';
                }}
              />
            </div>
            <div className={styles.body}>
              <p className={styles.texto}>
                {item.titulo}
              </p>
              <p className={styles.body}>
                {item.cuerpo}
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

export default CarruselNovedades;