import StatCard from "./StatCard";
import NewsCard from "./NewsCard";
import EventCard from "./EventCard";
import fotoEjemplo from "../../../assets/foto_ejemplo.png";

// TODO: reemplazar por datos reales que vengan del backend (FastAPI)
const STATS = [
  { icon: "👤", value: 34, label: "Inscripciones a revisar" },
  { icon: "✅", value: 245, label: "PyMEs en el mapa" },
  { icon: "🕒", value: 12, label: "Correcciones pendientes" },
  { icon: "📅", value: "02", label: "Ferias este mes" },
];

const NEWS = [
  {
    image: fotoEjemplo,
    text: "Lorem Ipsum is simply dummy text of the printing and typesetting industry",
  },
  {
    image: fotoEjemplo,
    text: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.",
  },
  {
    image: fotoEjemplo,
    text: "There is no one who loves pain itself, who seeks after it and wants to have it, simply because it is pain...",
  },
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
          {NEWS.map((item) => (
            <NewsCard key={item.text} {...item} />
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
