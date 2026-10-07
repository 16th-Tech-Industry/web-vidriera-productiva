import React, { useEffect, useState } from 'react';
import styles from './calendario.module.css';
import {obtenerEventos} from '../../servicios/landing_servicio';

export interface Evento {
  id: number | string;
  nombre: string;
  localidad: string;
  categoria?: string;
  fechaInicio: string; // formato YYYY-MM-DD
  fechaFin: string;    // formato YYYY-MM-DD
  imagen?: string | null;
  descripcion: string;
}

interface CalendarioProps {
  onSelectEvento?: (evento: Evento) => void;
}

const BACKEND_URL = 'http://localhost:8000';

// Función para normalizar la URL de la imagen
const resolverImagenUrl = (url?: string | null): string => {
  if (!url) return 'https://via.placeholder.com/400x200?text=Sin+Imagen';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const Calendario: React.FC<CalendarioProps> = ({ onSelectEvento }) => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [fechaActual, setFechaActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);
  const [eventoActivo, setEventoActivo] = useState<Evento | null>(null);

  // Carga asíncrona de eventos desde la API
  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const data = await obtenerEventos();
        setEventos(data);

        // Si hay eventos, seleccionar automáticamente el primero
        if (data && data.length > 0) {
          setEventoActivo(data[0]);
          setDiaSeleccionado(data[0].fechaInicio);
        }
      } catch (error) {
        console.error('Error al cargar eventos en el calendario:', error);
      } finally {
        setCargando(false);
      }
    };

    fetchEventos();
  }, []);

  const mes = fechaActual.getMonth();
  const anio = fechaActual.getFullYear();
  const mesTexto = fechaActual.toLocaleString('es-AR', { month: 'long' });
  const nombreMes = `${mesTexto.charAt(0).toUpperCase() + mesTexto.slice(1)} ${anio}`;
  const primerDiaMes = new Date(anio, mes, 1).getDay();
  const totalDiasMes = new Date(anio, mes + 1, 0).getDate();

  const mesesAnt = () => setFechaActual(new Date(anio, mes - 1, 1));
  const mesesSig = () => setFechaActual(new Date(anio, mes + 1, 1));


  const getEventosDelDia = (dia: number) => {
    const diaFormateado = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    return eventos.filter((e) => diaFormateado >= e.fechaInicio && diaFormateado <= e.fechaFin);
  };

  const diasArray = Array.from({ length: totalDiasMes }, (_, i) => i + 1);
  const espaciosVacios = Array.from({ length: primerDiaMes }, (_, i) => i);

  // Manejar click en un día
  const handleDiaClick = (fechaStr: string, tieneEventos: boolean) => {
    if (!tieneEventos) return;
    setDiaSeleccionado(fechaStr);

    const evs = eventos.filter((e) => fechaStr >= e.fechaInicio && fechaStr <= e.fechaFin);
    if (evs.length > 0) {
      setEventoActivo(evs[0]);
      if (onSelectEvento) onSelectEvento(evs[0]);
    }
  };

  const eventosDelDiaSeleccionado = diaSeleccionado
    ? eventos.filter((e) => diaSeleccionado >= e.fechaInicio && diaSeleccionado <= e.fechaFin)
    : [];

  if (cargando) {
    return (
      <div className={styles.contenedorPrincipal}>
        <div className={styles.placeholderVacio}>
          <p className={styles.textoVacio}>Cargando agenda de eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.contenedorPrincipal}>
      {/* ================= COLUMNA IZQUIERDA: CALENDARIO ================= */}
      <section className={styles.seccionCalendario}>
        <header className={styles.header}>
          <h3 className={styles.title}>{nombreMes}</h3>
          <div className={styles.navBtns}>
            <button type="button" className={styles.navBtn} onClick={mesesAnt} aria-label="Mes anterior">‹</button>
            <button type="button" className={styles.navBtn} onClick={mesesSig} aria-label="Mes siguiente">›</button>
          </div>
        </header>

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
                onClick={() => handleDiaClick(fechaStr, tieneEventos)}
                className={`
                  ${styles.diaCell} 
                  ${tieneEventos ? styles.diaConEvento : ''} 
                  ${esSeleccionado ? styles.diaSeleccionado : ''}
                `}
              >
                <span>{dia}</span>
                {tieneEventos && <span className={styles.puntoEvento} />}
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= COLUMNA DERECHA: CARD DE DETALLE ================= */}
      <aside className={styles.seccionDetalle}>
        {eventoActivo ? (
          <article className={styles.cardDetalle}>
            <div className={styles.imagenWrapper}>
              <img
                src={resolverImagenUrl(eventoActivo.imagen)}
                alt={eventoActivo.nombre}
                className={styles.imagenDetalle}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Sin+Imagen';
                }}
              />
              {eventoActivo.categoria && (
                <span className={styles.badgeCategoria}>{eventoActivo.categoria}</span>
              )}
            </div>

            <div className={styles.contenidoDetalle}>
              <h4 className={styles.eventoNombre}>{eventoActivo.nombre}</h4>
              <p className={styles.eventoLugar}>📍 {eventoActivo.localidad}</p>
              <p className={styles.eventoLugar}>📍 {eventoActivo.descripcion}</p>
              <div className={styles.eventoFechas}>
                <span>🗓️ {eventoActivo.fechaInicio}</span>
                {eventoActivo.fechaFin !== eventoActivo.fechaInicio && (
                  <span> hasta {eventoActivo.fechaFin}</span>
                )}
              </div>

              {eventosDelDiaSeleccionado.length > 1 && (
                <div className={styles.selectorEventos}>
                  <p className={styles.selectorTitulo}>Otros eventos en esta fecha:</p>
                  <div className={styles.chipsEventos}>
                    {eventosDelDiaSeleccionado.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        className={`${styles.chipBtn} ${eventoActivo.id === ev.id ? styles.chipActivo : ''}`}
                        onClick={() => {
                          setEventoActivo(ev);
                          if (onSelectEvento) onSelectEvento(ev);
                        }}
                      >
                        {ev.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>
        ) : (
          <div className={styles.placeholderVacio}>
            <span className={styles.iconoVacio}>📅</span>
            <p className={styles.textoVacio}>Seleccioná un día destacado con evento para ver el detalle</p>
          </div>
        )}
      </aside>
    </div>
  );
};