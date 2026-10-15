import { useEffect, useState } from "react";
import StatCard from "./StatCard";
import NewsCard from "./NewsCard";
import EventCard from "./EventCard";
import fotoEjemplo from "../../../assets/foto_ejemplo.png";
import { listarNoticias, type Noticia } from "../../../api/noticias";

// TODO: reemplazar por datos reales que vengan del backend (FastAPI)
const STATS = [
  { icon: "👤", value: 34, label: "Inscripciones a revisar" },
  { icon: "✅", value: 245, label: "PyMEs en el mapa" },
  { icon: "🕒", value: 12, label: "Correcciones pendientes" },
  { icon: "📅", value: "02", label: "Ferias este mes" },
];

const EVENTS: Array<{
  day: string;
  month: string;
  title: string;
  description: string;
  time: string;
  location: string;
  badgeColor: "blue" | "green";
}> = [
  {
    day: "24",
    month: "OCT",
    title: "Gran Feria Agrícola",
    description:
      "Exhibición de maquinaria, semillas y productos de la región central. Oportunidades de networking para productores.",
    time: "09:00 - 18:00",
    location: "Recinto Feria Central",
    badgeColor: "blue",
  },
  {
    day: "02",
    month: "NOV",
    title: "Taller de Hidroponía",
    description:
      "Capacitación teórica y práctica sobre sistemas de cultivo sin suelo para espacios reducidos urbanos y semi-urbanos.",
    time: "14:00 - 17:00",
    location: "Centro de Innovación Agraria",
    badgeColor: "green",
  },
];

/** Vista de Inicio del Dashboard: tarjetas de estadísticas, noticias y próximos eventos. */
export function InicioView() {
  // Las 3 noticias más recientes (GET /api/v1/noticias/ ya viene ordenado por fecha)
  const [noticias, setNoticias] = useState<Noticia[]>([]);

  useEffect(() => {
    listarNoticias()
      .then((lista) => setNoticias(lista.slice(0, 3)))
      .catch((error) => console.error("Error al cargar las noticias:", error));
  }, []);

  return (
    <>
      <h1 className="dashboard-heading">Panel de control - Administrador</h1>

      <div className="stats-grid">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <section className="dashboard-section">
        <h2 className="section-heading">Noticias</h2>
        <div className="news-grid">
          {noticias.length === 0 && <p>Todavía no hay noticias publicadas.</p>}
          {noticias.map((noticia) => (
            <NewsCard key={noticia.id} image={noticia.imagen_url ?? fotoEjemplo} text={noticia.titulo} />
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <h2 className="section-heading">Próximos Eventos</h2>
        <div className="events-list">
          {EVENTS.map((event) => (
            <EventCard key={event.title} {...event} />
          ))}
        </div>
      </section>
    </>
  );
}
