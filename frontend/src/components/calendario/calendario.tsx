import React, { useState } from 'react';
import db from '../../assets/db.json';
import styles from './Calendario.module.css';

export type Evento = (typeof db.eventos)[number];

interface CalendarioProps {
  onSelectEvento?: (evento: Evento) => void;
}

export const Calendario: React.FC<CalendarioProps> = ({ onSelectEvento }) => {
  const eventos: Evento[] = db.eventos;
  const [fechaActual, setFechaActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  const mes = fechaActual.getMonth();
  const anio = fechaActual.getFullYear();
  const mesTexto = fechaActual.toLocaleString('es-AR', { month: 'long' });
  const nombreMes = `${mesTexto} ${anio}`;
  const primerDiaMes = new Date(anio, mes, 1).getDay();
  const totalDiasMes = new Date(anio, mes + 1, 0).getDate();

  const mesesAnt = () => setFechaActual(new Date(anio, mes - 1, 1));
  const mesesSig = () => setFechaActual(new Date(anio, mes + 1, 1));

  // Verificar si un día tiene eventos asignados
  const getEventosDelDia = (dia: number) => {
    const diaFormateado = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    return eventos.filter((e) => diaFormateado >= e.fechaInicio && diaFormateado <= e.fechaFin);
  };

  const diasArray = Array.from({ length: totalDiasMes }, (_, i) => i + 1);
  const espaciosVacios = Array.from({ length: primerDiaMes }, (_, i) => i);

  const eventosSeleccionados = diaSeleccionado
    ? eventos.filter((e) => diaSeleccionado >= e.fechaInicio && diaSeleccionado <= e.fechaFin)
    : [];

  return (
    <div className={styles.card}>
      <header className={styles.header}>
        <h3 className={styles.title}>{nombreMes}</h3>
        <div className={styles.navBtns}>
          <button className={styles.navBtn} onClick={mesesAnt}>‹</button>
          <button className={styles.navBtn} onClick={mesesSig}>›</button>
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.diasSemana}>
          {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className={styles.gridDias}>
          {espaciosVacios.map((_, i) => (
            <div key={`vacio-${i}`} className={`${styles.diaCell} ${styles.diaVacio}`} />
          ))}

          {diasArray.map((dia) => {
            const fechaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const tieneEventos = getEventosDelDia(dia).length > 0;
            const esSeleccionado = diaSeleccionado === fechaStr;

            return (
              <div
                key={dia}
                onClick={() => tieneEventos && setDiaSeleccionado(fechaStr)}
                className={`
                  ${styles.diaCell} 
                  ${tieneEventos ? styles.diaConEvento : ''} 
                  ${esSeleccionado ? styles.diaSeleccionado : ''}
                `}
              >
                {dia}
                {tieneEventos && <span className={styles.puntoEvento} />}
              </div>
            );
          })}
        </div>

        {eventosSeleccionados.length > 0 && (
          <div className={styles.detalleEvento}>
            <p className={styles.detalleTitulo}>Eventos en esta fecha</p>
            {eventosSeleccionados.map((ev) => (
              <div 
                key={ev.id} 
                className={styles.eventoItem}
                onClick={() => onSelectEvento && onSelectEvento(ev)}
              >
                <p className={styles.eventoNombre}>{ev.nombre}</p>
                <p className={styles.eventoLugar}>📍 {ev.localidad} ({ev.categoria})</p>
                <img 
                    src={ev.imagen}
                    alt={ev.nombre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.src = 'https://via.placeholder.com/260x120?text=Sin+Imagen';
                    }}/>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};