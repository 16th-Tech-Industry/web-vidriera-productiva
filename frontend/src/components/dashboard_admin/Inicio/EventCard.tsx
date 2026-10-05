export interface EventCardProps {
  day: string;
  month: string;
  title: string;
  description: string;
  time?: string;
  location?: string;
  badgeColor?: "blue" | "green";
  onAgendar?: () => void;
}

/** Tarjeta alargada de "Próximo evento": fecha + nombre + detalle. */
export default function EventCard({
  day,
  month,
  title,
  description,
  time,
  location,
  badgeColor = "blue",
  onAgendar,
}: EventCardProps) {
  return (
    <div className="event-card">
      <div className={`event-date event-date--${badgeColor}`}>
        <span className="event-day">{day}</span>
        <span className="event-month">{month}</span>
      </div>

      <div className="event-info">
        <h4 className="event-title">{title}</h4>
        <p className="event-description">{description}</p>
        <div className="event-meta">
          {time && <span>🕒 {time}</span>}
          {location && <span>📍 {location}</span>}
        </div>
      </div>

      <button type="button" className="event-cta" onClick={onAgendar}>
        Agendar
      </button>
    </div>
  );
}
