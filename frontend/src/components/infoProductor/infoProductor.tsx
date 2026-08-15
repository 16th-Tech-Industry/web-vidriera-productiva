import React from 'react';
import db from '../../assets/db.json';
import styles from '../infoProductor/infoProductor.module.css';

// Infiere automáticamente la forma de los objetos dentro del array de tu db.json
type Productor = (typeof db.productores)[number];


export const InfoCard = ({ item }: { item: Productor }) => {
  return (
    <div className={styles.card}>
      {/* Cabecera Azul */}
      <header className={styles.header}>
        <h3 className={styles.title}>{item.nombre}</h3>
        <span className={styles.badge}>{item.rubro}</span>
      </header>

      {/* Cuerpo */}
      <div className={styles.body}>
        {/* Localidad */}
        <div className={styles.infoGroup}>
          <span className={styles.label}>Ubicación</span>
          <p className={styles.value}>📍 {item.localidad}</p>
        </div>

        {/* Descripción */}
        <div className={styles.infoGroup}>
          <span className={styles.label}>Descripción</span>
          <p className={styles.descripcion}>{item.descripcion}</p>
        </div>

        {/* Imagen */}
        <div className={styles.imageContainer}>
          <img
            src={item.imagen}
            alt={item.nombre}
            className={styles.image}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.src = 'https://via.placeholder.com/260x140?text=Sin+Imagen';
            }}
          />
        </div>
      </div>
    </div>
  );
};