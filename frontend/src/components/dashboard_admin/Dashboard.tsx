import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar, { type SidebarItemKey } from "./Sidebar";
import { InicioView } from "./Inicio/InicioView";
import { EmpresasView } from "./Empresas/EmpresasView";
import { MapaAdminView } from "./Mapa/MapaAdminView";
import { NoticiasAdminView } from "./Noticias/NoticiasAdminView";
import { EventosAdminView } from "./Eventos/EventosAdminView";
import { PermisosUsuariosView } from "./Permisos/PermisosUsuariosView";
import "./dashboard.css";

export interface DashboardProps {
  userName?: string;
  userInitials?: string;
  onLogout?: () => void;
  onGoToLanding?: () => void;
  onNavigate?: (key: SidebarItemKey) => void;
}

/**
 * Página del Dashboard. userName y userInitials quedan en las props porque
 * App.tsx los pasa, pero la barra superior ya no los muestra (solo logo y
 * cierre de sesión).
 */
export function Dashboard({
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
        <Navbar onLogout={onLogout} />

        <div className="dashboard-content">
          {activeItem === "inicio" && <InicioView />}
          {activeItem === "empresas" && <EmpresasView />}
          {activeItem === "mapa" && <MapaAdminView />}
          {activeItem === "noticias" && <NoticiasAdminView />}
          {activeItem === "eventos" && <EventosAdminView />}
          {activeItem === "permisos" && <PermisosUsuariosView />}
        </div>
      </div>
    </div>
  );
}