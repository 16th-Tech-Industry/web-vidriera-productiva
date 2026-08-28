import type { JSX } from "react";
import "./sidebar.css";

export type SidebarItemKey =
  | "inicio"
  | "empresas"
  | "mapa"
  | "noticias"
  | "eventos";

export interface SidebarProps {
  activeItem?: SidebarItemKey;
  onNavigate?: (key: SidebarItemKey) => void;
}

interface NavItem {
  key: SidebarItemKey;
  label: string;
  icon: () => JSX.Element;
}

const NAV_ITEMS: NavItem[] = [
  { key: "inicio", label: "Inicio", icon: HomeIcon },
  { key: "empresas", label: "Empresas", icon: BuildingIcon },
  { key: "mapa", label: "Mapa", icon: MapIcon },
  { key: "noticias", label: "Noticias", icon: NewsIcon },
  { key: "eventos", label: "Próximos Eventos", icon: CalendarIcon },
];

/**
 * Sidebar del dashboard 
 */
export default function Sidebar({
  activeItem = "inicio",
  onNavigate,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">Vidriera Productiva</div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`sidebar-btn ${activeItem === key ? "is-active" : ""}`}
            onClick={() => onNavigate?.(key)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="3" width="10" height="18" rx="1" />
      <rect x="14" y="8" width="6" height="13" rx="1" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
      <line x1="7" y1="11" x2="7.01" y2="11" />
      <line x1="7" y1="15" x2="7.01" y2="15" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}

function NewsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="7" y1="8" x2="17" y2="8" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="7" y1="16" x2="13" y2="16" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="16" y1="3" x2="16" y2="7" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
