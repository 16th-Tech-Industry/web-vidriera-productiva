import { useState, useEffect } from "react";
import "./SidebarUsuario.css";
import logo from "/CbaProdLOGO.ico";

export type SidebarUsuarioItemKey = "mi-empresa" | "productos" | "eventos" | "mis-postulaciones";
export interface SidebarUsuarioProps {
  activeItem?: SidebarUsuarioItemKey;
  onNavigate?: (key: SidebarUsuarioItemKey) => void;
  collapsed?: boolean;
}

function BuildingIcon(){ return <span aria-hidden="true">🏢</span> }
function ProductIcon(){ return <span aria-hidden="true">📦</span> }
function TicketIcon(){ return <span aria-hidden="true">🎟️</span> }
function CalendarIcon(){ return <span aria-hidden="true">📅</span> }

const NAV_ITEMS = [
  { key: "mi-empresa", label: "Mi Empresa", icon: BuildingIcon },
  { key: "productos", label: "Productos", icon: ProductIcon },
  { key: "eventos", label: "Eventos", icon: CalendarIcon },
  { key: "mis-postulaciones", label: "Mis Postulaciones", icon: TicketIcon },
] as const;

export default function SidebarUsuario({ activeItem="mi-empresa", onNavigate, collapsed=false }: SidebarUsuarioProps){
  const [nombreUsuario, setNombreUsuario] = useState("Usuario");
  useEffect(()=>{ setNombreUsuario(localStorage.getItem("nombre_empresa") || "Mi Empresa") },[]);

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`} style={{ background: '#123a6d', borderRight: '1px solid rgba(255,255,255,0.15)' }}>
      <div className="sidebar-brand">
        <img src={logo} alt="Vidriera Productiva" className="sidebar-logo-img" />
        {!collapsed && <div className="sidebar-brand-text"><span>{nombreUsuario}</span></div>}
      </div>
      <nav className="sidebar-nav" aria-label="Navegación principal">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeItem === item.key;
          return (
            <button 
              key={item.key} 
              className={`sidebar-btn ${isActive ? "is-active" : ""}`} 
              onClick={()=>onNavigate?.(item.key as any)}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              title={collapsed ? item.label : undefined}
            >
              <Icon /> {!collapsed && item.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}