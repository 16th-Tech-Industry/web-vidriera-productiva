import React, { useEffect, useRef, useState } from 'react';
import { cuerpoATexto, listarNoticias, type Noticia } from '../../api/noticias';
import styles from './noticias.module.css';

const IMAGEN_SIN_FOTO = 'https://via.placeholder.com/300x165?text=Novedad';

export const CarruselNovedades: React.FC = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  // Las noticias salen del backend (GET /api/v1/noticias/), las que publica el admin
  const [listaNovedades, setListaNovedades] = useState<Noticia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<Noticia | null>(null);

  useEffect(() => {
    listarNoticias()
      .then(setListaNovedades)
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!abierta) return;
    const cerrarConEscape = (e: KeyboardEvent) => e.key === 'Escape' && setAbierta(null);
    window.addEventListener('keydown', cerrarConEscape);
    return () => window.removeEventListener('keydown', cerrarConEscape);
  }, [abierta]);

  const scroll = (direction: 'left' | 'right') => {
    if (trackRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (cargando) return <p className={styles.estado}>Cargando novedades...</p>;
  if (error) return <p className={styles.estado}>No se pudieron cargar las novedades.</p>;
  if (listaNovedades.length === 0) return <p className={styles.estado}>Todavía no hay novedades publicadas.</p>;

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
          <button
            key={item.id}
            type="button"
            onClick={() => setAbierta(item)}
            className={styles.card}
          >
            <div className={styles.imageWrapper}>
              <img
                src={item.imagen_url ?? IMAGEN_SIN_FOTO}
                alt={item.titulo}
                className={styles.image}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src = IMAGEN_SIN_FOTO;
                }}
              />
            </div>
            <div className={styles.body}>
              <p className={styles.texto}>
                {item.titulo}
              </p>
            </div>
          </button>
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

      {abierta && (
        <div className={styles.modalFondo} onClick={() => setAbierta(null)}>
          <article
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label={abierta.titulo}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className={styles.modalCerrar} onClick={() => setAbierta(null)} aria-label="Cerrar">
              ×
            </button>
            {abierta.imagen_url && <img src={abierta.imagen_url} alt="" className={styles.modalImagen} />}
            <div className={styles.modalCuerpo}>
              <time className={styles.modalFecha}>
                {new Date(abierta.fecha_creacion).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </time>
              <h3 className={styles.modalTitulo}>{abierta.titulo}</h3>
              <p className={styles.modalTexto}>{cuerpoATexto(abierta.cuerpo)}</p>
            </div>
          </article>
        </div>
      )}
    </div>
  );
};

export default CarruselNovedades;
