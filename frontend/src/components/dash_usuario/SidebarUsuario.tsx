import { useState, useEffect, type JSX } from "react";
import "../dashboard_admin/sidebar.css";
import logo from "../../assets/logo_cba_vp.png";

export type SidebarUsuarioItemKey = "mi-empresa" | "productos";

export interface SidebarUsuarioProps {
  activeItem?: SidebarUsuarioItemKey;
  onNavigate?: (key: SidebarUsuarioItemKey) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  key: SidebarUsuarioItemKey;
  label: string;
  icon: () => JSX.Element;
}

const NAV_ITEMS: NavItem[] = [
  { key: "mi-empresa", label: "Mi Empresa", icon: BuildingIcon },
  { key: "productos", label: "Productos", icon: ProductIcon },
];

export default function SidebarUsuario({
  activeItem = "mi-empresa",
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: SidebarUsuarioProps) {
  const [nombreUsuario, setNombreUsuario] = useState("Usuario");

useEffect(() => {
    const storedData = localStorage.getItem("userData");
    
    if (storedData) {
      try {
        const user = JSON.parse(storedData);
        console.log("🔍 Objeto usuario en Sidebar:", user); // Para que lo veas en la consola

        // Buscamos name, nombre, username o email
        let nombreMostrado = user?.name || user?.nombre || user?.username || user?.email;

        if (nombreMostrado) {
          // Si lo que encontró es un correo (ej: doncampo@gmail.com), 
          // cortamos lo de antes del @ para usarlo como nombre ("doncampo")
          if (typeof nombreMostrado === 'string' && nombreMostrado.includes('@')) {
            nombreMostrado = nombreMostrado.split('@')[0];
          }
          
          // Opcional: poner la primera letra en mayúscula
          nombreMostrado = nombreMostrado.charAt(0).toUpperCase() + nombreMostrado.slice(1);

          setNombreUsuario(nombreMostrado);
        }
      } catch (error) {
        console.error("Error al leer los datos del usuario", error);
      }
    }
  }, []);

  return (
    <aside className={`sidebar ${collapsed ? "is-collapsed" : ""}`}>
      <div className="sidebar-brand">
        <img src={logo} alt="Vidriera Productiva" className="sidebar-logo" />
      </div>

      {/* Saludo dinámico de bienvenida */}
      {!collapsed && (
        <div style={{ padding: "0 20px", margin: "10px 0 20px 0" }}>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>Hola,</span>
          <h3 style={{ color: "white", fontSize: "15px", margin: "2px 0 0 0", wordBreak: "break-word" }}>
            {nombreUsuario}
          </h3>
        </div>
      )}

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`sidebar-btn ${activeItem === key ? "is-active" : ""}`}
            onClick={() => onNavigate?.(key)}
            title={collapsed ? label : undefined}
          >
            <Icon />
            <span className="sidebar-btn-label">{label}</span>
          </button>
        ))}
      </nav>

      <button
        type="button"
        className="sidebar-collapse-btn"
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        title={collapsed ? "Expandir menú" : "Colapsar menú"}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ transform: collapsed ? "rotate(180deg)" : "none" }}
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </aside>
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

function ProductIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <path d="M16 10a4 4 0 0 1-8 0"></path>
    </svg>
  );
}