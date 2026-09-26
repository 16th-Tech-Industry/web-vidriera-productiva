import React, { useEffect, useRef, useState } from 'react';
import styles from './noticias.module.css';
//import { NoticiasAdminView } from '../dashboard_admin/Noticias/NoticiasAdminView';

export interface Noticias {
  id: number | string;
  titulo : string;
  cuerpo?: string;
  imagen_url?: string;
}

interface CarruselProps {
  noticias?: Noticias[];
}

export const CarruselNovedades: React.FC<CarruselProps> = ({ noticias }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  
  // Lee de props o directamente de la tabla novedades en db.json
  const [ listaNovedades, setListaNovedades]= useState <Noticias[]>(noticias || [] );
  const [cargando, setCargando]= useState <boolean>(!noticias);

  useEffect(() => {
    if (noticias){
      setListaNovedades(noticias);
      setCargando(false);
      return
    }

    const obtenerNoticias= async() =>{
      try{
        const response= await fetch('http://localhost:8000/api/v1/noticias/');

        if (response.ok){
          const data: Noticias[]= await response.json();
          setListaNovedades(data); 
        }else{
          console.error("error al cargar noticia", response.statusText);
        }
      }catch(error){
        console.error("error de red", error);
      }finally{
        setCargando(false);
      }
    }
    obtenerNoticias();
  },[noticias]);

  const scroll = (direction: 'left' | 'right') => {
    if (trackRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if(cargando){
    return <div className={styles.carruselcontainer}>Cargando...</div>
  }

  if(listaNovedades.length===0){
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
            /*target="_blank"
            rel="noopener noreferrer"*/
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