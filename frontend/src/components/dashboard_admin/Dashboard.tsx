import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar, { type SidebarItemKey } from "./Sidebar";
import StatCard from "./StatCard";
import NewsCard from "./NewsCard";
import EventCard from "./EventCard";
import "./dashboard.css";

// TODO: reemplazar por datos reales que vengan del backend (FastAPI)
const STATS = [
  { icon: "👤", value: 34, label: "Inscripciones a revisar" },
  { icon: "✅", value: 245, label: "PyMEs en el mapa" },
  { icon: "🕒", value: 12, label: "Correcciones pendientes" },
  { icon: "📅", value: "02", label: "Ferias este mes" },
];

const NEWS = [
  {
    image: "/images/news-1.jpg",
    text: "Lorem Ipsum is simply dummy text of the printing and typesetting industry",
  },
  {
    image: "/images/news-2.jpg",
    text: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.",
  },
  {
    image: "/images/news-3.jpg",
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

export interface DashboardProps {
  userName?: string;
  userInitials?: string;
  onLogout?: () => void;
  onNavigate?: (key: SidebarItemKey) => void;
}

/**
 * Página del Dashboard. Pensada para conectarse con el login
 * más adelante vía las props userName / userInitials / onLogout.
 */
export function Dashboard({
  userName = "María",
  userInitials = "MA",
  onLogout,
  onNavigate,
}: DashboardProps) {
  const [activeItem, setActiveItem] = useState<SidebarItemKey>("inicio");

  const handleNavigate = (key: SidebarItemKey) => {
    setActiveItem(key);
    onNavigate?.(key);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar activeItem={activeItem} onNavigate={handleNavigate} />

      <div className="dashboard-main">
        <Navbar
          title="Dashboard Administrador"
          subtitle={`Bienvenido: ${userName}`}
          userName={userName}
          userInitials={userInitials}
          onLogout={onLogout}
        />

        <div className="dashboard-content">
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
        </div>
      </div>
    </div>
  );
}
