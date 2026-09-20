import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar, { type SidebarItemKey } from "./Sidebar";
import { InicioView } from "./Inicio/InicioView";
import { EmpresasView } from "./Empresas/EmpresasView";
import { MapaAdminView } from "./Mapa/MapaAdminView";
import { NoticiasAdminView } from "./Noticias/NoticiasAdminView";
import { EventosAdminView } from "./Eventos/EventosAdminView";
import "./dashboard.css";

export interface DashboardProps {
  userName?: string;
  userInitials?: string;
  onLogout?: () => void;
  onGoToLanding?: () => void;
  onNavigate?: (key: SidebarItemKey) => void;
}

const TITULOS: Record<SidebarItemKey, string> = {
  inicio: "Dashboard Administrador",
  empresas: "Empresas",
  mapa: "Mapa",
  noticias: "Noticias",
  eventos: "Próximos Eventos",
};

/**
 * Página del Dashboard. Pensada para conectarse con el login
 * más adelante vía las props userName / userInitials / onLogout.
 */
export function Dashboard({
  userName = "María",
  userInitials = "MA",
  onLogout,
  onGoToLanding,
  onNavigate,
}: DashboardProps) {
  const [activeItem, setActiveItem] = useState<SidebarItemKey>("inicio");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleNavigate = (key: SidebarItemKey) => {
    setActiveItem(key);
    onNavigate?.(key);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        activeItem={activeItem}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        onGoToLanding={onGoToLanding}
      />

      <div className="dashboard-main">
        <Navbar
          title={TITULOS[activeItem]}
          subtitle={`Bienvenido: ${userName}`}
          userName={userName}
          userInitials={userInitials}
          onLogout={onLogout}
        />

        <div className="dashboard-content">
          {activeItem === "inicio" && <InicioView />}
          {activeItem === "empresas" && <EmpresasView />}
          {activeItem === "mapa" && <MapaAdminView />}
          {activeItem === "noticias" && <NoticiasAdminView />}
          {activeItem === "eventos" && <EventosAdminView />}
        </div>
      </div>
    </div>
  );
}