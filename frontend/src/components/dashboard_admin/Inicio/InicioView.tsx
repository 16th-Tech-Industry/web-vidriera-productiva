import StatCard from "./StatCard";
import NewsCard from "./NewsCard";
import EventCard from "./EventCard";
import { useEffect, useState } from "react";

interface Noticias {
  id: number | string;
  titulo: string;
  cuerpo?: string;
  imagen_url?: string;
}

interface Eventos {
  id: string;
  fecha: string;
  titulo: string;
  descripcion: string;
  hora: string;
  lugar: string;
  color: string;
}

const STATS = [
  { icon: "👤", value: 34, label: "Inscripciones a revisar" },
  { icon: "✅", value: 245, label: "PyMEs en el mapa" },
  { icon: "🕒", value: 12, label: "Correcciones pendientes" },
  { icon: "📅", value: "02", label: "Ferias este mes" },
];

const meses_format = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];

function parseFecha(fechaISO: string) {
  const partes = fechaISO.split("-");
  if (partes.length!== 3) return { day: "01", month: "ENE" };
  const [_, mes, dia] = partes;
  const mesId = parseInt(mes, 10) - 1;
  return {
    day: dia,
    month: meses_format[mesId]?? "ENE",
  };
}

/** Vista de Inicio del Dashboard: tarjetas de estadísticas, noticias y próximos eventos. */
export function InicioView() {
  const [noticias, setNoticias] = useState<Noticias[]>([]);
  const [eventos, setEventos] = useState<Eventos[]>([]);
  const [cargandoNoticias, setCargandoNoticias] = useState<boolean>(true);
  const [cargandoEventos, setCargandoEventos] = useState<boolean>(true);

  useEffect(() => {
    const obtenerNoticias = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/noticias/");
        if (response.ok) {
          const data: Noticias[] = await response.json();
          setNoticias(data);
        } else {
          console.error("error al cargar", response.statusText);
        }
      } catch (error) {
        console.error("error red", error);
      } finally {
        setCargandoNoticias(false);
      }
    };
    obtenerNoticias();
  }, []);

  useEffect(() => {
    const obtenerEventos = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/eventos/");
        if (response.ok) {
          const data: Eventos[] = await response.json();
          setEventos(data);
        } else {
          console.error("Error al cargar eventos", response.statusText);
        }
      } catch (error) {
        console.error("error en eventos", error);
      } finally {
        setCargandoEventos(false);
      }
    };
    obtenerEventos();
  }, []);

  return (
    <>
      <h1 className="dashboard-heading">Panel de control - Administrador</h1>

      <div className="stats-grid">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Sección de NOTICIAS */}
      <section className="dashboard-section">
        <h2 className="section-heading">Noticias</h2>

        {cargandoNoticias? (
          <p style={{ color: "#334155" }}>Cargando Noticias...</p>
        ) : noticias.length === 0? (
          <p style={{ color: "#334155" }}>No hay noticias registradas.</p>
        ) : (
          <div className="news-grid">
            {noticias.map((item) => (
              <NewsCard
                key={item.id}
                image={item.imagen_url || 'https://via.placeholder.com/300x165?text=Novedad'}
                text={item.titulo}
              />
            ))}
          </div>
        )}
      </section>

      {/* Sección de Próximos Eventos */}
      <section className="dashboard-section">
        <h2 className="section-heading">Próximos Eventos</h2>

        {cargandoEventos? (
          <p style={{ color: "#334155" }}>Cargando Eventos...</p>
        ) : eventos.length === 0? (
          <p style={{ color: "#334155" }}>No hay eventos para mostrar.</p>
        ) : (
          <div className="events-grid">
            {eventos.map((ev) => {
              const { day, month } = parseFecha(ev.fecha);
              return (
                <EventCard
                  key={ev.id}
                  day={day}
                  month={month}
                  title={ev.titulo}
                  description={ev.descripcion}
                  time={ev.hora}
                  location={ev.lugar}
                  badgeColor={ev.color === "green"? "green" : "blue"}
                />
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}